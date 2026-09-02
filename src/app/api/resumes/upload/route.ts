import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { getValidUserId } from "@/lib/user-helper";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// POST /api/resumes/upload
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const jobId = formData.get("jobId") as string;
    const files = formData.getAll("files") as File[];

    if (!jobId) {
      return NextResponse.json({ success: false, error: "Job ID is required" }, { status: 400 });
    }

    // Verify job exists
    const job = await prisma.job.findFirst({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    if (files.length === 0) {
      return NextResponse.json({ success: false, error: "No files uploaded" }, { status: 400 });
    }

    const results = [];

    for (const file of files) {
      try {
        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
          results.push({
            fileName: file.name,
            success: false,
            error: "Invalid file type. Only PDF and DOCX are supported.",
          });
          continue;
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          results.push({
            fileName: file.name,
            success: false,
            error: "File too large. Maximum size is 10MB.",
          });
          continue;
        }

        // Save file
        const uploadDir = join(process.cwd(), "uploads");
        await mkdir(uploadDir, { recursive: true });

        const fileExt = file.name.split(".").pop() || "pdf";
        const uniqueName = `${uuidv4()}.${fileExt}`;
        const filePath = join(uploadDir, uniqueName);

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await writeFile(filePath, buffer);

        // Extract text from the file using universal parser
        const { extractResumeText } = await import("@/lib/resume-parser");
        const rawText = await extractResumeText(buffer, file.type, file.name);

        // Auto-extract candidate contact info from resume text
        let candidateEmail: string | null = null;
        let candidatePhone: string | null = null;
        if (rawText) {
          const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
          if (emailMatch && emailMatch[0]) candidateEmail = emailMatch[0].trim();
          const phoneMatch = rawText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
          if (phoneMatch && phoneMatch[0]) candidatePhone = phoneMatch[0].trim();
        }

        // Create candidate (or find existing by email if extractable)
        const candidate = await prisma.candidate.create({
          data: {
            fullName: file.name.replace(/\.(pdf|docx)$/i, "").replace(/[_-]/g, " "),
            email: candidateEmail,
            phone: candidatePhone,
            skills: "[]",
            experience: "[]",
            education: "[]",
            projects: "[]",
            certifications: "[]",
            achievements: "[]",
            languages: "[]",
          },
        });

        // Create resume record
        const resume = await prisma.resume.create({
          data: {
            fileName: file.name,
            fileType: file.type,
            filePath: uniqueName,
            fileSize: file.size,
            rawText,
            candidateId: candidate.id,
            parseStatus: rawText ? "PARSED" : "FAILED",
          },
        });

        // Create application
        const application = await prisma.application.create({
          data: {
            candidateId: candidate.id,
            jobId,
            status: "APPLIED",
          },
        });

        // Trigger automated AI screening
        try {
          const { getAIProvider } = await import("@/services/ai/provider");
          const ai = await getAIProvider();
          const analysis = await ai.analyzeResume(
            rawText || `${candidate.fullName}'s resume`,
            job.description,
            job.title
          );

          if (analysis.candidateInfo) {
            const info = analysis.candidateInfo;
            await prisma.candidate.update({
              where: { id: candidate.id },
              data: {
                fullName: info.fullName || candidate.fullName,
                email: candidate.email || info.email || null,
                phone: candidate.phone || info.phone || null,
                location: info.location || null,
                skills: JSON.stringify(info.skills || []),
                experience: JSON.stringify(info.experience || []),
                education: JSON.stringify(info.education || []),
                projects: JSON.stringify(info.projects || []),
              },
            });
          }

          const s = analysis.scores;
          const overallScore = Math.round(
            (s.technical.score * 0.30) +
            (s.experience.score * 0.20) +
            (s.jdMatch.score * 0.20) +
            (s.projects.score * 0.15) +
            (s.education.score * 0.10) +
            (s.certifications.score * 0.05)
          );

          await prisma.candidateAnalysis.create({
            data: {
              applicationId: application.id,
              summary: analysis.summary,
              matchingSkills: JSON.stringify(analysis.matchingSkills || []),
              missingSkills: JSON.stringify(analysis.missingSkills || []),
              additionalSkills: JSON.stringify(analysis.additionalSkills || []),
              strengths: JSON.stringify(analysis.strengths || []),
              weaknesses: JSON.stringify(analysis.weaknesses || []),
              missingReqs: JSON.stringify(analysis.missingRequirements || []),
              recommendation: analysis.recommendation,
              rawResponse: JSON.stringify(analysis),
            },
          });

          await prisma.candidateScore.create({
            data: {
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
          });

          await prisma.application.update({
            where: { id: application.id },
            data: { status: "AI_SCREENED" },
          });
        } catch (screenErr) {
          console.warn("Initial AI screening note:", screenErr);
        }

        results.push({
          fileName: file.name,
          success: true,
          candidateId: candidate.id,
          resumeId: resume.id,
          applicationId: application.id,
          hasText: !!rawText,
        });
      } catch (fileError) {
        console.error("Error processing file:", file.name, fileError);
        results.push({
          fileName: file.name,
          success: false,
          error: "Failed to process this file.",
        });
      }
    }

    // Create notification safely
    const successCount = results.filter(r => r.success).length;
    if (successCount > 0) {
      try {
        const validUserId = await getValidUserId(session.user);
        await prisma.notification.create({
          data: {
            title: "Resumes Uploaded",
            message: `${successCount} resume${successCount > 1 ? "s" : ""} uploaded successfully for "${job.title}".`,
            type: "SUCCESS",
            userId: validUserId,
            link: `/jobs/${jobId}`,
          },
        });
      } catch (notifErr) {
        console.warn("Notification creation note:", notifErr);
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      message: `${successCount} of ${files.length} files processed successfully`,
    });
  } catch (error) {
    console.error("Resume upload error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload resumes" },
      { status: 500 }
    );
  }
}
