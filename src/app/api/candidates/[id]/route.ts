import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getValidUserId } from "@/lib/user-helper";

// GET /api/candidates/:id
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

    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: {
        resumes: true,
        applications: {
          include: {
            job: true,
            analysis: true,
            score: true,
          },
        },
        notes: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!candidate) {
      return NextResponse.json({ success: false, error: "Candidate not found" }, { status: 404 });
    }

    // Auto-heal missing contact info from raw resume text
    const resumeText = candidate.resumes[0]?.rawText || "";
    let shouldUpdateCandidate = false;
    const candidatePatch: Record<string, string> = {};

    if (!candidate.email && resumeText) {
      const emailMatch = resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch && emailMatch[0]) {
        candidatePatch.email = emailMatch[0].trim();
        candidate.email = emailMatch[0].trim();
        shouldUpdateCandidate = true;
      }
    }

    if (!candidate.phone && resumeText) {
      const phoneMatch = resumeText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      if (phoneMatch && phoneMatch[0]) {
        candidatePatch.phone = phoneMatch[0].trim();
        candidate.phone = phoneMatch[0].trim();
        shouldUpdateCandidate = true;
      }
    }

    if (shouldUpdateCandidate) {
      try {
        await prisma.candidate.update({
          where: { id: candidate.id },
          data: candidatePatch,
        });
      } catch (patchErr) {
        console.warn("Candidate contact auto-heal note:", patchErr);
      }
    }

    // Auto-screen candidate on the fly if application has no score or analysis
    const primaryApp = candidate.applications[0];
    if (primaryApp && (!primaryApp.score || !primaryApp.analysis)) {
      try {
        const { getAIProvider } = await import("@/services/ai/provider");
        const ai = await getAIProvider();
        let resumeContent = candidate.resumes[0]?.rawText || "";
        if (!resumeContent && candidate.resumes[0]?.filePath) {
          try {
            const { readFile } = await import("fs/promises");
            const { join } = await import("path");
            const { existsSync } = await import("fs");
            const p = join(process.cwd(), "uploads", candidate.resumes[0].filePath);
            if (existsSync(p)) {
              const buf = await readFile(p);
              const { extractResumeText } = await import("@/lib/resume-parser");
              resumeContent = await extractResumeText(buf, candidate.resumes[0].fileType, candidate.resumes[0].fileName);
              if (resumeContent) {
                await prisma.resume.update({ where: { id: candidate.resumes[0].id }, data: { rawText: resumeContent } });
              }
            }
          } catch {}
        }

        const analysis = await ai.analyzeResume(
          resumeContent || `${candidate.fullName}'s resume`,
          primaryApp.job.description,
          primaryApp.job.title
        );

        if (analysis.candidateInfo) {
          const info = analysis.candidateInfo;
          const patchInfo: Record<string, unknown> = {};
          if (!candidate.fullName || candidate.fullName.includes(".pdf") || candidate.fullName.includes("Resume")) {
            if (info.fullName) { patchInfo.fullName = info.fullName; candidate.fullName = info.fullName; }
          }
          if (!candidate.email && info.email) { patchInfo.email = info.email; candidate.email = info.email; }
          if (!candidate.phone && info.phone) { patchInfo.phone = info.phone; candidate.phone = info.phone; }
          if (info.location) { patchInfo.location = info.location; candidate.location = info.location; }
          if (info.skills?.length) { patchInfo.skills = JSON.stringify(info.skills); candidate.skills = JSON.stringify(info.skills); }
          if (info.experience?.length) { patchInfo.experience = JSON.stringify(info.experience); candidate.experience = JSON.stringify(info.experience); }
          if (info.education?.length) { patchInfo.education = JSON.stringify(info.education); candidate.education = JSON.stringify(info.education); }
          if (info.projects?.length) { patchInfo.projects = JSON.stringify(info.projects); candidate.projects = JSON.stringify(info.projects); }
          if (info.summary) { patchInfo.summary = info.summary; candidate.summary = info.summary; }

          await prisma.candidate.update({
            where: { id: candidate.id },
            data: patchInfo,
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

        const createdAnalysis = await prisma.candidateAnalysis.upsert({
          where: { applicationId: primaryApp.id },
          create: {
            applicationId: primaryApp.id,
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
          update: {
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

        const createdScore = await prisma.candidateScore.upsert({
          where: { applicationId: primaryApp.id },
          create: {
            applicationId: primaryApp.id,
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

        primaryApp.analysis = createdAnalysis;
        primaryApp.score = createdScore;
        primaryApp.status = "AI_SCREENED";

        await prisma.application.update({
          where: { id: primaryApp.id },
          data: { status: "AI_SCREENED" },
        });
      } catch (autoErr) {
        console.warn("Auto-screening on candidate detail GET note:", autoErr);
      }
    }

    const data = {
      ...candidate,
      skills: JSON.parse(candidate.skills || "[]"),
      experience: JSON.parse(candidate.experience || "[]"),
      education: JSON.parse(candidate.education || "[]"),
      projects: JSON.parse(candidate.projects || "[]"),
      certifications: JSON.parse(candidate.certifications || "[]"),
      achievements: JSON.parse(candidate.achievements || "[]"),
      languages: JSON.parse(candidate.languages || "[]"),
      applications: candidate.applications.map(app => ({
        ...app,
        analysis: app.analysis ? {
          ...app.analysis,
          matchingSkills: JSON.parse(app.analysis.matchingSkills || "[]"),
          missingSkills: JSON.parse(app.analysis.missingSkills || "[]"),
          additionalSkills: JSON.parse(app.analysis.additionalSkills || "[]"),
          strengths: JSON.parse(app.analysis.strengths || "[]"),
          weaknesses: JSON.parse(app.analysis.weaknesses || "[]"),
          missingReqs: JSON.parse(app.analysis.missingReqs || "[]"),
          experienceAnalysis: app.analysis.experienceAnalysis ? JSON.parse(app.analysis.experienceAnalysis) : null,
          educationAnalysis: app.analysis.educationAnalysis ? JSON.parse(app.analysis.educationAnalysis) : null,
          projectAnalysis: app.analysis.projectAnalysis ? JSON.parse(app.analysis.projectAnalysis) : null,
        } : null,
      })),
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Get candidate error:", error);
    return NextResponse.json({ success: false, error: "Failed to load candidate" }, { status: 500 });
  }
}

// PUT /api/candidates/:id - Update candidate status, contact, or add note
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

    // Update candidate contact details
    if (body.updateCandidate) {
      const candidateUpdate: Record<string, unknown> = {};
      if (body.fullName) candidateUpdate.fullName = body.fullName;
      if (body.email !== undefined) candidateUpdate.email = body.email;
      if (body.phone !== undefined) candidateUpdate.phone = body.phone;
      if (body.location !== undefined) candidateUpdate.location = body.location;
      if (body.linkedIn !== undefined) candidateUpdate.linkedIn = body.linkedIn;
      if (body.github !== undefined) candidateUpdate.github = body.github;

      const updated = await prisma.candidate.update({
        where: { id },
        data: candidateUpdate,
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: "Candidate updated successfully",
      });
    }

    // Update application status
    if (body.applicationId && body.status) {
      const app = await prisma.application.findUnique({
        where: { id: body.applicationId },
        include: { job: true },
      });

      if (!app) {
        return NextResponse.json({ success: false, error: "Application not found" }, { status: 404 });
      }

      await prisma.application.update({
        where: { id: body.applicationId },
        data: { status: body.status },
      });

      const validUserId = await getValidUserId(session.user);

      // Create notification safely
      try {
        await prisma.notification.create({
          data: {
            title: "Candidate Status Updated",
            message: `Candidate moved to ${body.status} stage`,
            type: "INFO",
            userId: validUserId,
            link: `/candidates/${id}`,
          },
        });
      } catch (notifErr) {
        console.warn("Status notification note:", notifErr);
      }

      return NextResponse.json({
        success: true,
        message: "Status updated successfully",
      });
    }

    // Add note and dispatch email to candidate
    if (body.note) {
      const candidate = await prisma.candidate.findUnique({
        where: { id },
        include: {
          applications: {
            include: { job: true },
            orderBy: { appliedAt: "desc" },
          },
        },
      });

      if (!candidate) {
        return NextResponse.json({ success: false, error: "Candidate not found" }, { status: 404 });
      }

      const validUserId = await getValidUserId(session.user);

      await prisma.recruiterNote.create({
        data: {
          content: body.note,
          candidateId: id,
          userId: validUserId,
        },
      });

      let emailSent = false;
      if (candidate.email) {
        try {
          const { sendCandidateNoteEmail } = await import("@/lib/email");
          const jobTitle = candidate.applications[0]?.job?.title;

          const emailResult = await sendCandidateNoteEmail({
            to: candidate.email,
            candidateName: candidate.fullName,
            recruiterName: session.user.name || "Recruiter",
            recruiterEmail: session.user.email || undefined,
            noteContent: body.note,
            jobTitle,
          });
          emailSent = emailResult.success && !emailResult.simulated;
        } catch (emailErr) {
          console.warn("Could not email note to candidate:", emailErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: emailSent
          ? `Note saved and emailed to ${candidate.email}!`
          : "Note saved successfully",
        emailed: emailSent,
        emailTo: candidate.email,
      });
    }

    return NextResponse.json({ success: false, error: "No action specified" }, { status: 400 });
  } catch (error) {
    console.error("Update candidate error:", error);
    return NextResponse.json({ success: false, error: "Failed to update candidate" }, { status: 500 });
  }
}
