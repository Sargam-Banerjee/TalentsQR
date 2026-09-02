const { execSync } = require("child_process");

// Fallback to local SQLite file database if not provided by cloud environment
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
  console.log("ℹ️  DATABASE_URL not set in environment. Defaulting to file:./dev.db");
}

if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = "talentsqr-production-resilient-fallback-secret-2026";
}

console.log("📦 Generating Prisma client...");
execSync("npx prisma generate", { stdio: "inherit", env: process.env });

console.log("🗄️  Syncing database schema...");
execSync("npx prisma db push --skip-generate", { stdio: "inherit", env: process.env });

console.log("⚡ Building Next.js application...");
execSync("npx next build", { stdio: "inherit", env: process.env });
console.log("✅ Build finished successfully!");
