const { execSync } = require("child_process");
const { PrismaClient } = require("@prisma/client");

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
}

if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = "talentsqr-production-resilient-fallback-secret-2026";
}

process.env.AUTH_TRUST_HOST = "true";

console.log("🔄 Ensuring database schema is ready...");
try {
  execSync("npx prisma db push --skip-generate", { stdio: "inherit", env: process.env });
} catch (err) {
  console.warn("Prisma db push note:", err.message);
}

async function init() {
  const prisma = new PrismaClient();
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log("🌱 Database is empty. Seeding initial demo data...");
      require("../prisma/seed.js");
    } else {
      console.log(`✅ Database ready with ${userCount} user(s).`);
    }
  } catch (err) {
    console.warn("Database initialization note:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

init().catch(() => {});
