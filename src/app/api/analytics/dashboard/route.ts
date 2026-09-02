import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all jobs for this user
    const jobs = await prisma.job.findMany({
      where: { userId },
      include: {
        applications: {
          include: {
            candidate: true,
            score: true,
          },
        },
      },
    });

    const allApplications = jobs.flatMap(j => j.applications);

    // Stats
    const stats = {
      totalJobs: jobs.length,
      totalCandidates: allApplications.length,
      candidatesScreened: allApplications.filter(a => a.status !== "APPLIED").length,
      shortlisted: allApplications.filter(a => a.status === "SHORTLISTED").length,
      interviews: allApplications.filter(a => a.status === "INTERVIEW").length,
      selected: allApplications.filter(a => a.status === "SELECTED").length,
    };

    // Funnel data
    const funnelData = [
      { stage: "Applied", count: allApplications.length },
      { stage: "AI Screened", count: allApplications.filter(a => a.status !== "APPLIED").length },
      { stage: "Shortlisted", count: allApplications.filter(a => ["SHORTLISTED", "INTERVIEW", "SELECTED"].includes(a.status)).length },
      { stage: "Interview", count: allApplications.filter(a => ["INTERVIEW", "SELECTED"].includes(a.status)).length },
      { stage: "Selected", count: allApplications.filter(a => a.status === "SELECTED").length },
    ];

    // Score distribution
    const scores = allApplications
      .filter(a => a.score)
      .map(a => a.score!.overallScore);

    const scoreDistribution = [
      { range: "0-20", count: scores.filter(s => s >= 0 && s < 20).length },
      { range: "20-40", count: scores.filter(s => s >= 20 && s < 40).length },
      { range: "40-60", count: scores.filter(s => s >= 40 && s < 60).length },
      { range: "60-80", count: scores.filter(s => s >= 60 && s < 80).length },
      { range: "80-100", count: scores.filter(s => s >= 80 && s <= 100).length },
    ];

    // Recent candidates
    const recentCandidates = allApplications
      .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
      .slice(0, 5)
      .map(app => ({
        id: app.candidateId,
        name: app.candidate.fullName,
        jobTitle: jobs.find(j => j.id === app.jobId)?.title || "",
        score: app.score?.overallScore || 0,
        matchPercentage: app.score?.jdMatchScore || 0,
        status: app.status,
        appliedAt: app.appliedAt,
      }));

    // Active jobs
    const activeJobs = jobs
      .filter(j => j.status === "ACTIVE")
      .map(j => ({
        id: j.id,
        title: j.title,
        candidates: j.applications.length,
        shortlisted: j.applications.filter(a => a.status === "SHORTLISTED").length,
        status: j.status,
        createdAt: j.createdAt.toISOString(),
      }));

    // AI Insights
    const aiInsights = [];
    
    const reactCandidates = allApplications.filter(a => {
      const skills = JSON.parse(a.candidate.skills || "[]");
      return skills.some((s: string) => s.toLowerCase().includes("react"));
    });
    if (reactCandidates.length > 0) {
      aiInsights.push({
        id: "1",
        message: `${reactCandidates.length} candidate${reactCandidates.length > 1 ? "s" : ""} have strong React experience.`,
        type: "info" as const,
        icon: "brain",
      });
    }

    const highScoreCandidates = scores.filter(s => s >= 80);
    if (highScoreCandidates.length > 0) {
      aiInsights.push({
        id: "2",
        message: `${highScoreCandidates.length} candidate${highScoreCandidates.length > 1 ? "s" : ""} scored 80% or higher — consider prioritizing their review.`,
        type: "success" as const,
        icon: "trending-up",
      });
    }

    const rejected = allApplications.filter(a => a.status === "REJECTED");
    if (rejected.length > 0) {
      aiInsights.push({
        id: "3",
        message: `${rejected.length} candidate${rejected.length > 1 ? "s" : ""} have been rejected. Review rejection patterns for insights.`,
        type: "warning" as const,
        icon: "alert",
      });
    }

    if (aiInsights.length === 0) {
      aiInsights.push({
        id: "0",
        message: "Upload resumes and run AI screening to get intelligent insights about your candidates.",
        type: "info" as const,
        icon: "brain",
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        stats,
        funnelData,
        scoreDistribution,
        recentCandidates,
        activeJobs,
        aiInsights,
      },
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
