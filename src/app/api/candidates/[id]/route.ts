import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    // Verify the candidate belongs to one of the user's jobs
    const userJobs = await prisma.job.findMany({
      where: { userId: session.user.id },
      select: { id: true },
    });
    const jobIds = new Set(userJobs.map(j => j.id));
    const hasAccess = candidate.applications.some(app => jobIds.has(app.jobId));

    if (!hasAccess) {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
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

// PUT /api/candidates/:id - Update candidate status or add note
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

    // Update application status
    if (body.applicationId && body.status) {
      const app = await prisma.application.findUnique({
        where: { id: body.applicationId },
        include: { job: true },
      });

      if (!app || app.job.userId !== session.user.id) {
        return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
      }

      await prisma.application.update({
        where: { id: body.applicationId },
        data: { status: body.status },
      });

      // Create notification
      await prisma.notification.create({
        data: {
          title: "Candidate Status Updated",
          message: `Candidate moved to ${body.status} stage`,
          type: "INFO",
          userId: session.user.id,
          link: `/candidates/${id}`,
        },
      });

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

      await prisma.recruiterNote.create({
        data: {
          content: body.note,
          candidateId: id,
          userId: session.user.id,
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
