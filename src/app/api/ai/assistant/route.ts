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

    // Build context from user's data
    const jobs = await prisma.job.findMany({
      where: { userId: session.user.id },
      include: {
        applications: {
          include: {
            candidate: true,
            score: true,
            analysis: { select: { summary: true, recommendation: true, matchingSkills: true, missingSkills: true } },
          },
        },
      },
    });

    let context = `RECRUITER: ${session.user.name || "Unknown"}\n\n`;
    context += `JOBS (${jobs.length}):\n`;

    for (const job of jobs) {
      context += `\n--- Job: "${job.title}" (ID: ${job.id}, Status: ${job.status}) ---\n`;
      context += `Department: ${job.department || "N/A"} | Location: ${job.location || "N/A"}\n`;
      context += `Candidates: ${job.applications.length}\n`;

      for (const app of job.applications) {
        context += `  • ${app.candidate.fullName}`;
        if (app.candidate.email) context += ` (${app.candidate.email})`;
        context += ` | Status: ${app.status}`;
        if (app.score) context += ` | Score: ${app.score.overallScore}/100`;
        if (app.analysis?.recommendation) context += ` | Rec: ${app.analysis.recommendation}`;
        if (app.analysis?.summary) context += `\n    Summary: ${app.analysis.summary.substring(0, 200)}`;
        const skills = JSON.parse(app.candidate.skills || "[]");
        if (skills.length > 0) context += `\n    Skills: ${skills.join(", ")}`;
        context += "\n";
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
