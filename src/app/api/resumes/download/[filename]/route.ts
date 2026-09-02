import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// GET /api/resumes/download/:filename
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { filename } = await params;
    // Security check: ensure no directory traversal
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "");
    const filePath = join(process.cwd(), "uploads", safeName);

    if (!existsSync(filePath)) {
      return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });
    }

    const fileBuffer = await readFile(filePath);
    const isPdf = safeName.endsWith(".pdf");
    const contentType = isPdf
      ? "application/pdf"
      : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${safeName}"`,
      },
    });
  } catch (error) {
    console.error("Resume download error:", error);
    return NextResponse.json({ success: false, error: "Failed to download file" }, { status: 500 });
  }
}
