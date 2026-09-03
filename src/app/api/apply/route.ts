import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAIProvider } from "@/services/ai/provider";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// POST /api/apply - Public candidate application submission
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    const jobId = formData.get("jobId") as string;
    const fullName = formData.get("fullName") as string;
    const email = formData.get("email") as string;
    const phone = (formData.get("phone") as string) || null;
    const linkedIn = (formData.get("linkedIn") as string) || null;
    const github = (formData.get("github") as string) || null;
    const portfolio = (formData.get("portfolio") as string) || null;
    const summary = (formData.get("summary") as string) || null;
    const resumeFile = formData.get("resume") as File | null;

    // Validation
    if (!jobId) {
      return NextResponse.json({ success: false, error: "Please select a job role" }, { status: 400 });
    }

    if (!fullName || !fullName.trim()) {
      return NextResponse.json({ success: false, error: "Full Name is required" }, { status: 400 });
    }

    if (!email || !email.trim()) {
      return NextResponse.json({ success: false, error: "Email address is required" }, { status: 400 });
    }

    if (!resumeFile) {
      return NextResponse.json({ success: false, error: "Resume file is required" }, { status: 400 });
    }

    // Verify Job exists and is active
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { user: true },
    });

    if (!job) {
      return NextResponse.json({ success: false, error: "Selected job not found or no longer open" }, { status: 404 });
    }

    // Validate resume file size & format
    if (resumeFile.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: "Resume file exceeds maximum allowed size (10MB)" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(resumeFile.type) && !resumeFile.name.match(/\.(pdf|docx)$/i)) {
      return NextResponse.json({ success: false, error: "Invalid file format. Only PDF and DOCX documents are accepted." }, { status: 400 });
    }

    // Save resume to filesystem
    const uploadDir = join(process.cwd(), "uploads");
    await mkdir(uploadDir, { recursive: true });

    const fileExt = resumeFile.name.split(".").pop() || "pdf";
    const uniqueFileName = `${uuidv4()}.${fileExt}`;
    const filePath = join(uploadDir, uniqueFileName);

    const arrayBuffer = await resumeFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);

    // Extract text from resume using universal parser
    const { extractResumeText } = await import("@/lib/resume-parser");
    const rawText = await extractResumeText(buffer, resumeFile.type, resumeFile.name);

    // Check if candidate exists by email
    let candidate = await prisma.candidate.findFirst({
      where: { email: email.trim().toLowerCase() },
    });

    if (candidate) {
      // Update contact information
      candidate = await prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          fullName: fullName.trim(),
          phone: phone || candidate.phone,
          linkedIn: linkedIn || candidate.linkedIn,
          github: github || candidate.github,
          portfolio: portfolio || candidate.portfolio,
          summary: summary || candidate.summary,
        },
      });
    } else {
      // Create new candidate
      candidate = await prisma.candidate.create({
        data: {
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone,
          linkedIn,
          github,
          portfolio,
          summary,
          skills: "[]",
          experience: "[]",
          education: "[]",
          projects: "[]",
          certifications: "[]",
          achievements: "[]",
          languages: "[]",
        },
      });
    }

    // Create Resume record
    const resume = await prisma.resume.create({
      data: {
        fileName: resumeFile.name,
        fileType: resumeFile.type,
        filePath: uniqueFileName,
        fileSize: resumeFile.size,
        rawText,
        candidateId: candidate.id,
        parseStatus: rawText ? "PARSED" : "FAILED",
      },
    });

    // Create or update Application record
    let application = await prisma.application.findUnique({
      where: {
        candidateId_jobId: {
          candidateId: candidate.id,
          jobId: job.id,
        },
      },
    });

    if (application) {
      application = await prisma.application.update({
        where: { id: application.id },
        data: {
          status: "APPLIED",
          appliedAt: new Date(),
        },
      });
    } else {
      application = await prisma.application.create({
        data: {
          candidateId: candidate.id,
          jobId: job.id,
          status: "APPLIED",
        },
      });
    }

    // Automated AI Screening Pipeline
    let overallScore = 75;
    try {
      const ai = await getAIProvider();
      const analysis = await ai.analyzeResume(
        rawText || `${fullName}'s Resume. Contact: ${email}. Summary: ${summary || ""}`,
        job.description,
        job.title
      );

      // Save structured analysis
      await prisma.candidateAnalysis.upsert({
        where: { applicationId: application.id },
        create: {
          applicationId: application.id,
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

      // Compute & save score
      const s = analysis.scores;
      overallScore = Math.round(
        (s.technical.score * 0.30) +
        (s.experience.score * 0.20) +
        (s.jdMatch.score * 0.20) +
        (s.projects.score * 0.15) +
        (s.education.score * 0.10) +
        (s.certifications.score * 0.05)
      );

      await prisma.candidateScore.upsert({
        where: { applicationId: application.id },
        create: {
          applicationId: application.id,
          overallScore,
          technicalScore: s.technical.score,
          experienceScore: s.experience.score,
          jdMatchScore: s.jdMatch.score,
          projectScore: s.projects.score,
          educationScore: s.education.score,
          certScore: s.certifications.score,
          technicalExplanation: s.technical.explanation,
          experienceExplanation: s.experience.explanation,
          jdMatchExplanation: s.jdMatch.explanation,
          projectExplanation: s.projects.explanation,
          educationExplanation: s.education.explanation,
          certExplanation: s.certifications.explanation,
        },
        update: {
          overallScore,
          technicalScore: s.technical.score,
          experienceScore: s.experience.score,
          jdMatchScore: s.jdMatch.score,
          projectScore: s.projects.score,
          educationScore: s.education.score,
          certScore: s.certifications.score,
          technicalExplanation: s.technical.explanation,
          experienceExplanation: s.experience.explanation,
          jdMatchExplanation: s.jdMatch.explanation,
          projectExplanation: s.projects.explanation,
          educationExplanation: s.education.explanation,
          certExplanation: s.certifications.explanation,
        },
      });

      // Update candidate details from AI extraction if missing
      if (analysis.candidateInfo) {
        const info = analysis.candidateInfo;
        await prisma.candidate.update({
          where: { id: candidate.id },
          data: {
            location: candidate.location || info.location || null,
            skills: JSON.stringify(info.skills || []),
            experience: JSON.stringify(info.experience || []),
            education: JSON.stringify(info.education || []),
            projects: JSON.stringify(info.projects || []),
          },
        });
      }

      // Mark application as AI_SCREENED
      await prisma.application.update({
        where: { id: application.id },
        data: { status: "AI_SCREENED" },
      });
    } catch (aiErr) {
      console.warn("Automated AI screening warning:", aiErr);
    }

    // Create Notification for the Job Recruiter
    try {
      await prisma.notification.create({
        data: {
          title: "New Candidate Application",
          message: `${fullName} submitted an application for "${job.title}". AI Match Score: ${overallScore}%.`,
          type: "SUCCESS",
          userId: job.userId,
          link: `/jobs/${job.id}`,
        },
      });
    } catch (notifErr) {
      console.warn("Notification creation warning:", notifErr);
    }

    // Send automated response confirmation email to candidate
    try {
      const { sendApplicationConfirmationEmail } = await import("@/lib/email");
      await sendApplicationConfirmationEmail({
        to: email,
        candidateName: fullName,
        jobTitle: job.title,
        applicationId: application.id,
      });
      console.log(`[Apply] Automated confirmation email dispatched to candidate: ${email}`);
    } catch (confEmailErr) {
      console.warn("Candidate confirmation email note:", confEmailErr);
    }

    return NextResponse.json({
      success: true,
      message: "Application submitted and processed successfully!",
      applicationId: application.id,
      candidateId: candidate.id,
      overallScore,
    });
  } catch (error: any) {
    console.error("Application submission error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process application" },
      { status: 500 }
    );
  }
}
