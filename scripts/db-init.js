// Fallback to local SQLite file database if not provided by cloud environment
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
}

if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = "talentsqr-production-resilient-fallback-secret-2026";
}

console.log("🔄 Ensuring database schema is ready...");
try {
  execSync("npx prisma db push --skip-generate", { stdio: "inherit" });
} catch (err) {
  console.warn("Prisma db push note:", err.message);
}

const prisma = new PrismaClient();

async function init() {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log("🌱 Database is empty. Seeding initial demo data...");
      require("../prisma/seed.js");
    } else {
      console.log(`✅ Database ready with ${userCount} user(s).`);
    }
  } catch (err) {
    console.warn("Database initialization warning:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

init();
