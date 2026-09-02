# TalentsQR 🚀

> **AI-Powered Intelligent Recruitment & Candidate Screening Platform**  
> Streamline recruitment with automated resume screening, AI scoring, instant job QR codes, public candidate portals, and real-time candidate email delivery.

---

## ✨ Features

- **🤖 Multi-Model AI Screening**: Analyzes resumes with Google Gemini and Anthropic Claude for deep skill matching, experience scoring, strengths, weaknesses, and hiring recommendations.
- **📱 QR Code & Public Application Portal**: Share dynamic job links (`/apply?jobId=...`) or download high-resolution QR codes for candidates to apply directly from mobile or desktop.
- **📄 Universal Resume Parsing**: Robust extraction supporting PDF (v1 & v2 with DOM matrix polyfills) and DOCX with zero-fail self-healing architecture.
- **✉️ Live Candidate Email Dispatch**: Recruiters write notes or feedback on candidate profiles, and they are automatically delivered directly to the candidate's real email inbox via Gmail SMTP or Resend.
- **📊 Real-time Candidate Stream**: Monitor applications directly beside active job listings with instant scorecards, status toggles, and resume downloads.
- **🎨 Modern Dark/Light UI**: Built with Next.js 16 (Turbopack), Tailwind CSS, Lucide icons, and responsive layouts.

---

## 🚀 Deployment on Render

Because TalentsQR is a full-stack Next.js application with backend API routes, SQLite/Prisma database, and server-side email dispatch, it runs on a Node.js server rather than static GitHub Pages.

### One-Click Deploy on Render

1. Create a free account at [render.com](https://render.com).
2. Click **New +** ➔ **Web Service**.
3. Connect your GitHub repository: `https://github.com/Sargam-Banerjee/TalentsQR`.
4. Render will automatically detect `render.yaml` or you can configure:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npx prisma db push && npm run build`
   - **Start Command**: `npm start`
5. Configure your private environment settings in the Render Dashboard.
6. Click **Deploy Web Service**!

---

## 🛠️ Local Development

```bash
# 1. Clone the repository
git clone https://github.com/Sargam-Banerjee/TalentsQR.git
cd TalentsQR

# 2. Install dependencies
npm install

# 3. Setup SQLite database
npx prisma db push
npx tsx prisma/seed.ts # optional seed data

# 4. Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🛡️ Security

- All API keys, database credentials, and SMTP passwords are kept strictly private via `.env` and excluded via `.gitignore`.
- Resume files stored locally or in persistent cloud disks are protected behind authenticated route handlers.
