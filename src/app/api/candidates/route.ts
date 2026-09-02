import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/candidates - List candidates for current user's jobs
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const jobId = searchParams.get("jobId") || "";
    const status = searchParams.get("status") || "";
    const minScore = parseFloat(searchParams.get("minScore") || "0");
    const maxScore = parseFloat(searchParams.get("maxScore") || "100");
    const sortBy = searchParams.get("sortBy") || "newest";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    // Get user's job IDs
    const userJobs = await prisma.job.findMany({
      where: { userId: session.user.id },
      select: { id: true },
    });
    const jobIds = userJobs.map(j => j.id);

    if (jobIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      });
    }

    // Build application filter
    const appWhere: Record<string, unknown> = {
      jobId: jobId ? { equals: jobId } : { in: jobIds },
    };

    if (status) {
      appWhere.status = status;
    }

    // Sort
    let orderBy: Record<string, unknown> = { appliedAt: "desc" };
    if (sortBy === "oldest") orderBy = { appliedAt: "asc" };
    if (sortBy === "score_desc") orderBy = { score: { overallScore: "desc" } };
    if (sortBy === "score_asc") orderBy = { score: { overallScore: "asc" } };

    const applications = await prisma.application.findMany({
      where: appWhere,
      include: {
        candidate: {
          include: {
            resumes: { select: { id: true, fileName: true } },
          },
        },
        job: { select: { id: true, title: true } },
        score: true,
        analysis: {
          select: {
            recommendation: true,
            matchingSkills: true,
            strengths: true,
          },
        },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const total = await prisma.application.count({ where: appWhere });

    // Apply search filter (post-query for SQLite compatibility)
    let filteredApps = applications;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredApps = applications.filter(app => {
        const candidate = app.candidate;
        return (
          candidate.fullName.toLowerCase().includes(searchLower) ||
          (candidate.email && candidate.email.toLowerCase().includes(searchLower)) ||
          candidate.skills.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply score filter
    if (minScore > 0 || maxScore < 100) {
      filteredApps = filteredApps.filter(app => {
        const score = app.score?.overallScore || 0;
        return score >= minScore && score <= maxScore;
      });
    }

    const data = filteredApps.map(app => ({
      applicationId: app.id,
      id: app.candidate.id,
      fullName: app.candidate.fullName,
      email: app.candidate.email,
      phone: app.candidate.phone,
      location: app.candidate.location,
      skills: JSON.parse(app.candidate.skills || "[]"),
      experience: JSON.parse(app.candidate.experience || "[]"),
      jobId: app.job.id,
      jobTitle: app.job.title,
      status: app.status,
      score: app.score?.overallScore || 0,
      matchPercentage: app.score?.jdMatchScore || 0,
      recommendation: app.analysis?.recommendation || null,
      matchingSkills: app.analysis ? JSON.parse(app.analysis.matchingSkills || "[]") : [],
      appliedAt: app.appliedAt,
      hasResume: app.candidate.resumes.length > 0,
    }));

    return NextResponse.json({
      success: true,
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Candidates list error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load candidates" },
      { status: 500 }
    );
  }
}
