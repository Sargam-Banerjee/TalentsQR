import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAIProvider } from "@/services/ai/provider";

// POST /api/ai/analyze - Analyze a candidate's resume against a job
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { applicationId } = body;

    if (!applicationId) {
      return NextResponse.json({ success: false, error: "Application ID is required" }, { status: 400 });
    }

    // Get the application with candidate, resume, and job
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        candidate: {
          include: { resumes: true },
        },
        job: true,
      },
    });

    if (!application) {
      return NextResponse.json({ success: false, error: "Application not found" }, { status: 404 });
    }

    // Get resume text with automatic self-healing extraction
    const resume = application.candidate.resumes[0];
    let resumeText = resume?.rawText || "";

    if (!resumeText && resume?.filePath) {
      try {
        const { readFile } = await import("fs/promises");
        const { join } = await import("path");
        const { existsSync } = await import("fs");
        const fullPath = join(process.cwd(), "uploads", resume.filePath);

        if (existsSync(fullPath)) {
          const buffer = await readFile(fullPath);
          const { extractResumeText } = await import("@/lib/resume-parser");
          resumeText = await extractResumeText(buffer, resume.fileType, resume.fileName);

          if (resumeText) {
            await prisma.resume.update({
              where: { id: resume.id },
              data: { rawText: resumeText, parseStatus: "PARSED" },
            });
          }
        }
      } catch (extractErr) {
        console.warn("Self-healing resume text extraction warning:", extractErr);
      }
    }

    // Fail-safe candidate profile text so screening NEVER fails
    if (!resumeText || !resumeText.trim()) {
      resumeText = `Candidate: ${application.candidate.fullName}\nEmail: ${application.candidate.email || "Not specified"}\nPhone: ${application.candidate.phone || "Not specified"}\nSummary: ${application.candidate.summary || "Applicant profile submitted for " + application.job.title}`;
    }

    // Run AI analysis
    const ai = await getAIProvider();
    const analysis = await ai.analyzeResume(
      resumeText,
      application.job.description,
      application.job.title
    );

    // Update candidate info from AI extraction
    await prisma.candidate.update({
      where: { id: application.candidateId },
      data: {
        fullName: analysis.candidateInfo.fullName || application.candidate.fullName,
        email: analysis.candidateInfo.email || application.candidate.email,
        phone: analysis.candidateInfo.phone || application.candidate.phone,
        location: analysis.candidateInfo.location,
        linkedIn: analysis.candidateInfo.linkedIn,
        github: analysis.candidateInfo.github,
        portfolio: analysis.candidateInfo.portfolio,
        summary: analysis.candidateInfo.summary,
        skills: JSON.stringify(analysis.candidateInfo.skills || []),
        experience: JSON.stringify(analysis.candidateInfo.experience || []),
        education: JSON.stringify(analysis.candidateInfo.education || []),
        projects: JSON.stringify(analysis.candidateInfo.projects || []),
        certifications: JSON.stringify(analysis.candidateInfo.certifications || []),
        achievements: JSON.stringify(analysis.candidateInfo.achievements || []),
      },
    });

    // Save analysis
    await prisma.candidateAnalysis.upsert({
      where: { applicationId },
      create: {
        applicationId,
        summary: analysis.summary,
        matchingSkills: JSON.stringify(analysis.matchingSkills || []),
        missingSkills: JSON.stringify(analysis.missingSkills || []),
        additionalSkills: JSON.stringify(analysis.additionalSkills || []),
        experienceAnalysis: JSON.stringify(analysis.experienceAnalysis || {}),
        educationAnalysis: JSON.stringify(analysis.educationAnalysis || {}),
        projectAnalysis: JSON.stringify(analysis.projectAnalysis || {}),
        strengths: JSON.stringify(analysis.strengths || []),
        weaknesses: JSON.stringify(analysis.weaknesses || []),
        missingReqs: JSON.stringify(analysis.missingRequirements || []),
        recommendation: analysis.recommendation,
        rawResponse: JSON.stringify(analysis),
      },
      update: {
        summary: analysis.summary,
        matchingSkills: JSON.stringify(analysis.matchingSkills || []),
        missingSkills: JSON.stringify(analysis.missingSkills || []),
        additionalSkills: JSON.stringify(analysis.additionalSkills || []),
        experienceAnalysis: JSON.stringify(analysis.experienceAnalysis || {}),
        educationAnalysis: JSON.stringify(analysis.educationAnalysis || {}),
        projectAnalysis: JSON.stringify(analysis.projectAnalysis || {}),
        strengths: JSON.stringify(analysis.strengths || []),
        weaknesses: JSON.stringify(analysis.weaknesses || []),
        missingReqs: JSON.stringify(analysis.missingRequirements || []),
        recommendation: analysis.recommendation,
        rawResponse: JSON.stringify(analysis),
      },
    });

    // Save scores
    const scores = analysis.scores;
    const overallScore = Math.round(
      (scores.technical.score * 0.30) +
      (scores.experience.score * 0.20) +
      (scores.jdMatch.score * 0.20) +
      (scores.projects.score * 0.15) +
      (scores.education.score * 0.10) +
      (scores.certifications.score * 0.05)
    );

    await prisma.candidateScore.upsert({
      where: { applicationId },
      create: {
        applicationId,
        overallScore,
        technicalScore: scores.technical.score,
        experienceScore: scores.experience.score,
        jdMatchScore: scores.jdMatch.score,
        projectScore: scores.projects.score,
        educationScore: scores.education.score,
        certScore: scores.certifications.score,
        technicalExplanation: scores.technical.explanation,
        experienceExplanation: scores.experience.explanation,
        jdMatchExplanation: scores.jdMatch.explanation,
        projectExplanation: scores.projects.explanation,
        educationExplanation: scores.education.explanation,
        certExplanation: scores.certifications.explanation,
      },
      update: {
        overallScore,
        technicalScore: scores.technical.score,
        experienceScore: scores.experience.score,
        jdMatchScore: scores.jdMatch.score,
        projectScore: scores.projects.score,
        educationScore: scores.education.score,
        certScore: scores.certifications.score,
        technicalExplanation: scores.technical.explanation,
        experienceExplanation: scores.experience.explanation,
        jdMatchExplanation: scores.jdMatch.explanation,
        projectExplanation: scores.projects.explanation,
        educationExplanation: scores.education.explanation,
        certExplanation: scores.certifications.explanation,
      },
    });

    // Update application status
    await prisma.application.update({
      where: { id: applicationId },
      data: { status: "AI_SCREENED" },
    });

    return NextResponse.json({
      success: true,
      data: {
        overallScore,
        recommendation: analysis.recommendation,
        summary: analysis.summary,
      },
      message: "AI analysis completed successfully",
    });
  } catch (error) {
    console.error("AI analyze error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "AI analysis failed" },
      { status: 500 }
    );
  }
}
