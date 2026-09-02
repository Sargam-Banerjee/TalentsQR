import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/jobs/public - Public endpoint for candidate application portal
export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      where: {
        status: "ACTIVE",
      },
      select: {
        id: true,
        title: true,
        department: true,
        location: true,
        employmentType: true,
        experienceLevel: true,
        description: true,
        requiredSkills: true,
        preferredSkills: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedJobs = jobs.map((job) => {
      let requiredSkills: string[] = [];
      let preferredSkills: string[] = [];

      try {
        requiredSkills = JSON.parse(job.requiredSkills || "[]");
      } catch {
        requiredSkills = [];
      }

      try {
        preferredSkills = JSON.parse(job.preferredSkills || "[]");
      } catch {
        preferredSkills = [];
      }

      return {
        ...job,
        requiredSkills,
        preferredSkills,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedJobs,
    });
  } catch (error: any) {
    console.error("Public jobs fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch open jobs" },
      { status: 500 }
    );
  }
}
