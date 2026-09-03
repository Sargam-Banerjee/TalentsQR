import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAIProvider } from "@/services/ai/provider";

// POST /api/ai/assistant - Chat with AI recruitment assistant
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ success: false, error: "Messages are required" }, { status: 400 });
    }

    // Fetch all real-time jobs, applications, and candidate data across the recruitment pipeline
    const [jobs, allCandidates] = await Promise.all([
      prisma.job.findMany({
        include: {
          applications: {
            include: {
              candidate: {
                include: {
                  resumes: { select: { fileName: true } },
                },
              },
              score: true,
              analysis: {
                select: {
                  summary: true,
                  recommendation: true,
                  matchingSkills: true,
                  missingSkills: true,
                  strengths: true,
                  weaknesses: true,
                },
              },
            },
            orderBy: { appliedAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.candidate.findMany({
        include: {
          applications: {
            include: {
              job: { select: { id: true, title: true } },
              score: true,
            },
          },
        },
        take: 100,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const activeJobs = jobs.filter((j) => j.status === "ACTIVE");

    let context = `LIVE TALENTSQR ATS & RECRUITMENT DATABASE:\n`;
    context += `Active Recruiter: ${session.user.name || session.user.email || "Recruiter"} (${session.user.email})\n`;
    context += `Pipeline Summary: ${activeJobs.length} Active Job(s), ${jobs.length} Total Job(s), ${allCandidates.length} Total Candidate(s) in system\n\n`;

    context += `=== ACTIVE & ALL JOBS (${jobs.length}) ===\n`;
    for (const job of jobs) {
      context += `\n• Job: "${job.title}" [Status: ${job.status}] (ID: ${job.id})\n`;
      context += `  Department: ${job.department || "General"} | Location: ${job.location || "Remote"} | Type: ${job.type || "Full-time"} | Level: ${job.experienceLevel || "Not specified"}\n`;
      if (job.salaryMin || job.salaryMax) {
        context += `  Salary Range: $${job.salaryMin?.toLocaleString() || "N/A"} - $${job.salaryMax?.toLocaleString() || "N/A"}\n`;
      }
      if (job.requiredSkills) {
        context += `  Required Skills: ${typeof job.requiredSkills === "string" ? job.requiredSkills : JSON.stringify(job.requiredSkills)}\n`;
      }
      context += `  Total Applicants: ${job.applications.length}\n`;

      if (job.applications.length > 0) {
        context += `  Applicants for "${job.title}":\n`;
        for (const app of job.applications) {
          const scoreStr = app.score ? `${app.score.overallScore}/100` : "Unscored";
          const recStr = app.analysis?.recommendation || "Pending";
          context += `    - ${app.candidate.fullName} (${app.candidate.email || "No email"}${app.candidate.phone ? `, Phone: ${app.candidate.phone}` : ""})\n`;
          context += `      Status: ${app.status} | Match Score: ${scoreStr} | Recommendation: ${recStr}\n`;
          if (app.analysis?.summary) {
            context += `      Summary: ${app.analysis.summary.substring(0, 200)}\n`;
          }
          if (app.analysis?.matchingSkills) {
            const mSkills = typeof app.analysis.matchingSkills === "string" ? app.analysis.matchingSkills : JSON.stringify(app.analysis.matchingSkills);
            context += `      Matching Skills: ${mSkills}\n`;
          }
          if (app.analysis?.missingSkills) {
            const misSkills = typeof app.analysis.missingSkills === "string" ? app.analysis.missingSkills : JSON.stringify(app.analysis.missingSkills);
            context += `      Missing Skills: ${misSkills}\n`;
          }
        }
      }
    }

    context += `\n=== CANDIDATE DATABASE POOL (${allCandidates.length}) ===\n`;
    for (const cand of allCandidates) {
      let skillsList = cand.skills;
      try {
        const parsed = JSON.parse(cand.skills || "[]");
        if (Array.isArray(parsed)) skillsList = parsed.join(", ");
      } catch {}
      context += `• ${cand.fullName} (${cand.email || "No email"}${cand.phone ? `, Phone: ${cand.phone}` : ""})\n`;
      if (skillsList) context += `  Skills: ${skillsList}\n`;
      if (cand.applications.length > 0) {
        const appSummaries = cand.applications
          .map((a) => `Applied for "${a.job.title}" (Status: ${a.status}, Score: ${a.score?.overallScore ?? "N/A"})`)
          .join("; ");
        context += `  Applications: ${appSummaries}\n`;
      }
    }

    const ai = await getAIProvider();
    const response = await ai.chat(messages, context);

    return NextResponse.json({
      success: true,
      data: { response },
    });
  } catch (error) {
    console.error("AI assistant error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "AI assistant failed" },
      { status: 500 }
    );
  }
}
