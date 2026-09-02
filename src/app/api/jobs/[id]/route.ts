import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/jobs/:id
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const job = await prisma.job.findFirst({
      where: { id, userId: session.user.id },
      include: {
        applications: {
          include: {
            candidate: {
              include: { resumes: true },
            },
            score: true,
            analysis: true,
          },
          orderBy: { appliedAt: "desc" },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    const formattedJob = {
      ...job,
      requiredSkills: JSON.parse(job.requiredSkills || "[]"),
      preferredSkills: JSON.parse(job.preferredSkills || "[]"),
      candidateCount: job.applications.length,
      shortlistedCount: job.applications.filter(a => a.status === "SHORTLISTED").length,
      avgScore: job.applications.length > 0
        ? Math.round(
            job.applications
              .filter(a => a.score)
              .reduce((sum, a) => sum + (a.score?.overallScore || 0), 0) /
            Math.max(job.applications.filter(a => a.score).length, 1)
          )
        : 0,
    };

    return NextResponse.json({ success: true, data: formattedJob });
  } catch (error) {
    console.error("Get job error:", error);
    return NextResponse.json({ success: false, error: "Failed to load job" }, { status: 500 });
  }
}

// PUT /api/jobs/:id
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    // Verify ownership
    const existing = await prisma.job.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    const fields = [
      "title", "department", "location", "employmentType", "experienceLevel",
      "salaryCurrency", "description", "responsibilities", "qualifications",
      "educationReq", "experienceReq", "status",
    ];

    for (const field of fields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (body.salaryMin !== undefined) updateData.salaryMin = body.salaryMin ? parseInt(body.salaryMin) : null;
    if (body.salaryMax !== undefined) updateData.salaryMax = body.salaryMax ? parseInt(body.salaryMax) : null;
    if (body.requiredSkills !== undefined) updateData.requiredSkills = JSON.stringify(body.requiredSkills);
    if (body.preferredSkills !== undefined) updateData.preferredSkills = JSON.stringify(body.preferredSkills);

    const job = await prisma.job.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...job,
        requiredSkills: JSON.parse(job.requiredSkills),
        preferredSkills: JSON.parse(job.preferredSkills),
      },
      message: "Job updated successfully",
    });
  } catch (error) {
    console.error("Update job error:", error);
    return NextResponse.json({ success: false, error: "Failed to update job" }, { status: 500 });
  }
}

// DELETE /api/jobs/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.job.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    await prisma.job.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.error("Delete job error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete job" }, { status: 500 });
  }
}
