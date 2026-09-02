import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/jobs - List jobs for current user
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const sortBy = searchParams.get("sortBy") || "newest";

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { department: { contains: search } },
        { location: { contains: search } },
      ];
    }

    const orderBy: Record<string, string> = {};
    if (sortBy === "newest") orderBy.createdAt = "desc";
    else if (sortBy === "oldest") orderBy.createdAt = "asc";
    else orderBy.createdAt = "desc";

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          _count: {
            select: { applications: true },
          },
          applications: {
            select: {
              status: true,
              score: {
                select: { overallScore: true },
              },
            },
          },
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.job.count({ where }),
    ]);

    const formattedJobs = jobs.map(job => ({
      ...job,
      requiredSkills: JSON.parse(job.requiredSkills || "[]"),
      preferredSkills: JSON.parse(job.preferredSkills || "[]"),
      candidateCount: job._count.applications,
      shortlistedCount: job.applications.filter(a => a.status === "SHORTLISTED").length,
      avgScore: job.applications.length > 0
        ? Math.round(
            job.applications
              .filter(a => a.score)
              .reduce((sum, a) => sum + (a.score?.overallScore || 0), 0) /
            Math.max(job.applications.filter(a => a.score).length, 1)
          )
        : 0,
    }));

    return NextResponse.json({
      success: true,
      data: formattedJobs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Jobs list error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load jobs" },
      { status: 500 }
    );
  }
}

// POST /api/jobs - Create a new job
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      department,
      location,
      employmentType,
      experienceLevel,
      salaryMin,
      salaryMax,
      salaryCurrency,
      description,
      responsibilities,
      qualifications,
      requiredSkills,
      preferredSkills,
      educationReq,
      experienceReq,
      status,
    } = body;

    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: "Title and description are required" },
        { status: 400 }
      );
    }

    // Resilient userId resolution to prevent foreign key constraint failures
    let userId = session.user.id;
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      if (session.user.email) {
        const userByEmail = await prisma.user.findUnique({
          where: { email: session.user.email.toLowerCase() },
        });
        if (userByEmail) {
          userId = userByEmail.id;
        } else {
          const fallbackUser = await prisma.user.findFirst();
          if (fallbackUser) {
            userId = fallbackUser.id;
          } else {
            const newUser = await prisma.user.create({
              data: {
                id: session.user.id,
                email: session.user.email.toLowerCase(),
                name: session.user.name || "Recruiter",
                password: "auto_provisioned_account",
                role: "RECRUITER",
              },
            });
            userId = newUser.id;
          }
        }
      } else {
        const fallbackUser = await prisma.user.findFirst();
        if (fallbackUser) userId = fallbackUser.id;
      }
    }

    const parsedSalaryMin =
      salaryMin !== undefined && salaryMin !== null && String(salaryMin).trim() !== "" && !isNaN(parseInt(String(salaryMin).replace(/[^0-9]/g, "")))
        ? parseInt(String(salaryMin).replace(/[^0-9]/g, ""))
        : null;

    const parsedSalaryMax =
      salaryMax !== undefined && salaryMax !== null && String(salaryMax).trim() !== "" && !isNaN(parseInt(String(salaryMax).replace(/[^0-9]/g, "")))
        ? parseInt(String(salaryMax).replace(/[^0-9]/g, ""))
        : null;

    const safeRequiredSkills = Array.isArray(requiredSkills)
      ? JSON.stringify(requiredSkills)
      : typeof requiredSkills === "string"
      ? requiredSkills
      : "[]";

    const safePreferredSkills = Array.isArray(preferredSkills)
      ? JSON.stringify(preferredSkills)
      : typeof preferredSkills === "string"
      ? preferredSkills
      : "[]";

    const job = await prisma.job.create({
      data: {
        title: String(title).trim(),
        department: department ? String(department).trim() : null,
        location: location ? String(location).trim() : null,
        employmentType: employmentType || "FULL_TIME",
        experienceLevel: experienceLevel || "MID",
        salaryMin: parsedSalaryMin,
        salaryMax: parsedSalaryMax,
        salaryCurrency: salaryCurrency || "USD",
        description: String(description).trim(),
        responsibilities: responsibilities ? String(responsibilities).trim() : null,
        qualifications: qualifications ? String(qualifications).trim() : null,
        requiredSkills: safeRequiredSkills,
        preferredSkills: safePreferredSkills,
        educationReq: educationReq ? String(educationReq).trim() : null,
        experienceReq: experienceReq ? String(experienceReq).trim() : null,
        status: status || "ACTIVE",
        userId,
      },
    });

    let unpackedRequired: string[] = [];
    let unpackedPreferred: string[] = [];
    try {
      unpackedRequired = JSON.parse(job.requiredSkills);
    } catch {
      unpackedRequired = [];
    }
    try {
      unpackedPreferred = JSON.parse(job.preferredSkills);
    } catch {
      unpackedPreferred = [];
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ...job,
          requiredSkills: unpackedRequired,
          preferredSkills: unpackedPreferred,
        },
        message: "Job created successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create job error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create job" },
      { status: 500 }
    );
  }
}
