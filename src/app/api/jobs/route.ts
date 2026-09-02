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

    const where: Record<string, unknown> = { userId: session.user.id };

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

    const job = await prisma.job.create({
      data: {
        title,
        department: department || null,
        location: location || null,
        employmentType: employmentType || "FULL_TIME",
        experienceLevel: experienceLevel || "MID",
        salaryMin: salaryMin ? parseInt(salaryMin) : null,
        salaryMax: salaryMax ? parseInt(salaryMax) : null,
        salaryCurrency: salaryCurrency || "USD",
        description,
        responsibilities: responsibilities || null,
        qualifications: qualifications || null,
        requiredSkills: JSON.stringify(requiredSkills || []),
        preferredSkills: JSON.stringify(preferredSkills || []),
        educationReq: educationReq || null,
        experienceReq: experienceReq || null,
        status: status || "ACTIVE",
        userId: session.user.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...job,
          requiredSkills: JSON.parse(job.requiredSkills),
          preferredSkills: JSON.parse(job.preferredSkills),
        },
        message: "Job created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create job error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create job" },
      { status: 500 }
    );
  }
}
