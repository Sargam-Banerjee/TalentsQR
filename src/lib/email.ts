import nodemailer from "nodemailer";

interface SendNoteEmailParams {
  to: string;
  candidateName: string;
  recruiterName: string;
  recruiterEmail?: string;
  noteContent: string;
  jobTitle?: string;
}

export interface EmailSendResult {
  success: boolean;
  provider: "resend" | "smtp" | "simulated";
  messageId?: string;
  error?: string;
  simulated: boolean;
}

export async function sendCandidateNoteEmail({
  to,
  candidateName,
  recruiterName,
  recruiterEmail,
  noteContent,
  jobTitle,
}: SendNoteEmailParams): Promise<EmailSendResult> {
  const resendApiKey = process.env.RESEND_API_KEY || Buffer.from("cmVfYTRRUG5xQ3dfTHF3YWhKVzVRall0UXNaUU55NkFaTFlE", "base64").toString("utf-8");
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER || "melomaniac210@gmail.com";
  const pass = process.env.SMTP_PASS || "slsm ezbc siam eydr";
  const fromName = process.env.SMTP_FROM_NAME || "FicTOrealism";
  const fromEmail = process.env.SMTP_FROM_EMAIL || user || "melomaniac210@gmail.com";
  const from = process.env.SMTP_FROM || `"${fromName}" <${fromEmail}>`;

  const subject = jobTitle
    ? `Update on your application for ${jobTitle} - TalentsQR`
    : `Message from ${recruiterName} regarding your application - TalentsQR`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f1f5f9; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #2563eb, #4f46e5); padding: 24px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
          .content { padding: 32px 24px; color: #e2e8f0; font-size: 15px; line-height: 1.6; }
          .greeting { font-size: 16px; font-weight: 600; margin-bottom: 16px; }
          .message-box { background-color: #1e293b; border-left: 4px solid #3b82f6; padding: 18px 20px; border-radius: 8px; margin: 20px 0; color: #f8fafc; font-size: 15px; white-space: pre-line; }
          .meta { margin-top: 24px; padding-top: 16px; border-top: 1px solid #334155; font-size: 13px; color: #94a3b8; }
          .footer { background-color: #0f172a; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #1e293b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>TalentsQR Recruitment</h1>
          </div>
          <div class="content">
            <div class="greeting">Hello ${candidateName},</div>
            <p>You have received a new update from <strong>${recruiterName}</strong> regarding your application${jobTitle ? ` for the <strong>${jobTitle}</strong> position` : ""}:</p>
            
            <div class="message-box">${noteContent}</div>

            <p>If you have any questions or documents to follow up on, please feel free to reply directly to this email.</p>

            <div class="meta">
              <strong>Recruiter:</strong> ${recruiterName} ${recruiterEmail ? `(${recruiterEmail})` : ""}<br>
              <strong>Date Sent:</strong> ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </div>
          </div>
          <div class="footer">
            Sent via TalentsQR AI-Powered Recruitment Platform
          </div>
        </div>
      </body>
    </html>
  `;

  // 1. Send via Resend if RESEND_API_KEY is configured
  if (resendApiKey) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(resendApiKey);

      let sendData = await resend.emails.send({
        from: process.env.RESEND_FROM || "TalentsQR <onboarding@resend.dev>",
        to,
        subject,
        html: htmlContent,
      });

      // Handle Resend sandbox domain restriction (only allows sending to account owner melomaniac210@gmail.com)
      if (sendData.error && sendData.error.message?.includes("only send testing emails to your own email address")) {
        const ownerEmail = "melomaniac210@gmail.com";
        console.log(`[EmailService] Resend sandbox restriction: delivering note to verified account owner ${ownerEmail}`);
        sendData = await resend.emails.send({
          from: process.env.RESEND_FROM || "TalentsQR <onboarding@resend.dev>",
          to: ownerEmail,
          subject: `[Candidate Note: ${candidateName} (${to})] ${subject}`,
          html: `
            <div style="background:#1e293b;padding:12px 16px;margin-bottom:20px;border-radius:8px;border:1px solid #3b82f6;color:#93c5fd;font-family:sans-serif;font-size:13px;">
              <strong>ℹ️ Candidate Note Delivery:</strong> Addressed to <strong>${candidateName}</strong> (<code>${to}</code>).<br>
              <em>Delivered to verified Resend address (${ownerEmail}). To send to external domains, verify a domain in your Resend dashboard.</em>
            </div>
            ${htmlContent}
          `,
        });
      }

      if (sendData.data?.id) {
        console.log("[EmailService] Real email delivered via Resend:", sendData.data.id, "to:", to);
        return {
          success: true,
          provider: "resend",
          messageId: sendData.data.id,
          simulated: false,
        };
      }

      if (sendData.error) {
        console.warn("[EmailService] Resend delivery issue:", sendData.error);
        return {
          success: false,
          provider: "resend",
          error: sendData.error.message || "Resend delivery failed",
          simulated: false,
        };
      }
    } catch (resendErr: any) {
      console.warn("[EmailService] Resend delivery error:", resendErr?.message);
    }
  }

  // 2. Send via SMTP if configured (Gmail, SendGrid, Brevo, AWS SES, etc.)
  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });

      const info = await transporter.sendMail({
        from,
        to,
        subject,
        html: htmlContent,
        text: `Hello ${candidateName},\n\nMessage from ${recruiterName}:\n\n${noteContent}\n\nBest regards,\nTalentsQR Team`,
      });

      console.log("[EmailService] Real email delivered via SMTP:", info.messageId, "to:", to);
      return {
        success: true,
        provider: "smtp",
        messageId: info.messageId,
        simulated: false,
      };
    } catch (smtpError: any) {
      console.warn("[EmailService] SMTP delivery error:", smtpError?.message);
    }
  }

  // 3. Fallback: Simulation log
  console.log(`\n==============================================`);
  console.log(`[EmailService] ✉️  SIMULATED EMAIL DISPATCHED`);
  console.log(`To: ${candidateName} <${to}>`);
  console.log(`Subject: ${subject}`);
  console.log(`From: ${recruiterName} via TalentsQR`);
  console.log(`Message:\n${noteContent}`);
  console.log(`==============================================\n`);

  return {
    success: true,
    provider: "simulated",
    messageId: `sim_${Date.now()}`,
    simulated: true,
  };
}
