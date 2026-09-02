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

          await sendCandidateNoteEmail({
            to: candidate.email,
            candidateName: candidate.fullName,
            recruiterName: session.user.name || "Recruiter",
            recruiterEmail: session.user.email || undefined,
            noteContent: body.note,
            jobTitle,
          });
          emailSent = true;
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
