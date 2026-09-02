import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";

// GET /api/settings/email - Check current email configuration status
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const hasResend = !!process.env.RESEND_API_KEY;
    const hasSmtp = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

    return NextResponse.json({
      success: true,
      configured: hasResend || hasSmtp,
      provider: hasResend ? "resend" : hasSmtp ? "smtp" : "none",
      smtpHost: process.env.SMTP_HOST || "",
      smtpPort: process.env.SMTP_PORT || "587",
      smtpUser: process.env.SMTP_USER || "",
      smtpFrom: process.env.SMTP_FROM || "",
      resendFrom: process.env.RESEND_FROM || "",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/settings/email - Save email credentials and/or send test email
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, provider, resendApiKey, smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom, testEmail } = body;

    // Action: Test email delivery
    if (action === "test") {
      const targetEmail = testEmail || session.user.email;
      if (!targetEmail) {
        return NextResponse.json({ success: false, error: "Target email address required" }, { status: 400 });
      }

      const { sendCandidateNoteEmail } = await import("@/lib/email");
      const result = await sendCandidateNoteEmail({
        to: targetEmail,
        candidateName: session.user.name || "Recruiter",
        recruiterName: session.user.name || "TalentsQR Admin",
        noteContent: "This is a live test email from TalentsQR confirming your outgoing email service is fully functional and ready to dispatch real candidate updates.",
        jobTitle: "System Verification",
      });

      return NextResponse.json({
        success: true,
        message: result.simulated
          ? "Test email dispatched in simulation mode (configure SMTP or Resend for real inbox delivery)."
          : `Real email successfully delivered to ${targetEmail} via ${result.provider.toUpperCase()}!`,
        result,
      });
    }

    // Action: Save configuration to in-memory process.env and .env if writable
    const envPath = join(process.cwd(), ".env");
    let envContent = "";
    try {
      envContent = await readFile(envPath, "utf-8");
    } catch {
      envContent = "";
    }

    if (provider === "resend" && resendApiKey) {
      process.env.RESEND_API_KEY = resendApiKey;
      if (envContent.includes("RESEND_API_KEY=")) {
        envContent = envContent.replace(/RESEND_API_KEY=.*/g, `RESEND_API_KEY="${resendApiKey}"`);
      } else {
        envContent += `\nRESEND_API_KEY="${resendApiKey}"`;
      }
    } else if (provider === "smtp") {
      if (smtpHost) {
        process.env.SMTP_HOST = smtpHost;
        envContent = envContent.includes("SMTP_HOST=")
          ? envContent.replace(/SMTP_HOST=.*/g, `SMTP_HOST="${smtpHost}"`)
          : envContent + `\nSMTP_HOST="${smtpHost}"`;
      }
      if (smtpPort) {
        process.env.SMTP_PORT = smtpPort;
        envContent = envContent.includes("SMTP_PORT=")
          ? envContent.replace(/SMTP_PORT=.*/g, `SMTP_PORT="${smtpPort}"`)
          : envContent + `\nSMTP_PORT="${smtpPort}"`;
      }
      if (smtpUser) {
        process.env.SMTP_USER = smtpUser;
        envContent = envContent.includes("SMTP_USER=")
          ? envContent.replace(/SMTP_USER=.*/g, `SMTP_USER="${smtpUser}"`)
          : envContent + `\nSMTP_USER="${smtpUser}"`;
      }
      if (smtpPass) {
        process.env.SMTP_PASS = smtpPass;
        envContent = envContent.includes("SMTP_PASS=")
          ? envContent.replace(/SMTP_PASS=.*/g, `SMTP_PASS="${smtpPass}"`)
          : envContent + `\nSMTP_PASS="${smtpPass}"`;
      }
      if (smtpFrom) {
        process.env.SMTP_FROM = smtpFrom;
        envContent = envContent.includes("SMTP_FROM=")
          ? envContent.replace(/SMTP_FROM=.*/g, `SMTP_FROM="${smtpFrom}"`)
          : envContent + `\nSMTP_FROM="${smtpFrom}"`;
      }
      process.env.SMTP_FROM_NAME = "FicTOrealism";
      process.env.SMTP_FROM_EMAIL = smtpUser || "melomaniac210@gmail.com";
    }

    try {
      await writeFile(envPath, envContent);
    } catch (writeErr) {
      console.warn("Could not write to .env file on disk (read-only environment):", writeErr);
    }

    return NextResponse.json({
      success: true,
      message: "Email settings saved successfully!",
    });
  } catch (error: any) {
    console.error("Save email settings error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
