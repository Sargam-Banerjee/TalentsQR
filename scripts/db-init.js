const { execSync } = require("child_process");
const { PrismaClient } = require("@prisma/client");

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
