const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  // Create demo user
  const hashedPassword = await bcrypt.hash("demo1234", 12);
  const user = await prisma.user.upsert({
    where: { email: "demo@talentsqr.com" },
    update: {},
    create: {
      name: "Demo Recruiter",
      email: "demo@talentsqr.com",
      password: hashedPassword,
      role: "RECRUITER",
    },
  });
  console.log(`✅ User: ${user.email}`);

  // Create jobs
  const job1 = await prisma.job.create({
    data: {
      title: "Senior Frontend Developer",
      department: "Engineering",
      location: "Remote",
      employmentType: "FULL_TIME",
      experienceLevel: "SENIOR",
      salaryMin: 120000,
      salaryMax: 180000,
      description: `We are looking for a Senior Frontend Developer to join our team and help build the next generation of our web platform.

Responsibilities:
- Design and implement responsive and accessible web interfaces using React and TypeScript
- Collaborate with designers and backend engineers to deliver high-quality features
- Mentor junior developers and conduct code reviews
- Optimize application performance and improve Core Web Vitals
- Participate in architectural decisions and technical planning

Requirements:
- 5+ years of experience in frontend development
- Strong proficiency in React, TypeScript, and modern CSS
- Experience with state management (Redux, Zustand, or similar)
- Understanding of web performance optimization
- Familiarity with testing frameworks (Jest, Cypress, or Playwright)
- Experience with CI/CD pipelines and version control (Git)`,
      responsibilities: "Design and build web interfaces, mentor team members, conduct code reviews, optimize performance",
      qualifications: "5+ years frontend experience, React, TypeScript, modern CSS",
      requiredSkills: JSON.stringify(["React", "TypeScript", "JavaScript", "HTML", "CSS", "Git"]),
      preferredSkills: JSON.stringify(["Next.js", "Tailwind CSS", "Redux", "GraphQL", "Testing"]),
      educationReq: "Bachelor's in Computer Science or equivalent",
      experienceReq: "5+ years of frontend development",
      status: "ACTIVE",
      userId: user.id,
    },
  });
  console.log(`✅ Job: ${job1.title}`);

  const job2 = await prisma.job.create({
    data: {
      title: "Full Stack Engineer",
      department: "Engineering",
      location: "New York, NY (Hybrid)",
      employmentType: "FULL_TIME",
      experienceLevel: "MID",
      salaryMin: 100000,
      salaryMax: 150000,
      description: `We're seeking a Full Stack Engineer to help build and scale our platform. You'll work across the stack, from database design to frontend implementation.

Requirements:
- 3+ years of full-stack development experience
- Strong skills in Node.js, Python, or similar backend technologies
- Experience with React or Angular for frontend development
- Database design experience with PostgreSQL and/or MongoDB
- Understanding of RESTful APIs and microservices architecture
- Familiarity with cloud platforms (AWS, GCP, or Azure)`,
      requiredSkills: JSON.stringify(["Node.js", "React", "PostgreSQL", "JavaScript", "REST APIs"]),
      preferredSkills: JSON.stringify(["Python", "Docker", "AWS", "MongoDB", "TypeScript"]),
      status: "ACTIVE",
      userId: user.id,
    },
  });
  console.log(`✅ Job: ${job2.title}`);

  const job3 = await prisma.job.create({
    data: {
      title: "Data Scientist",
      department: "Data & AI",
      location: "San Francisco, CA",
      employmentType: "FULL_TIME",
      experienceLevel: "MID",
      salaryMin: 130000,
      salaryMax: 170000,
      description: `Join our Data & AI team to build ML models and derive insights from large datasets.

Requirements:
- 3+ years in data science or machine learning
- Strong Python skills with pandas, scikit-learn, and TensorFlow/PyTorch
- Experience with SQL and data visualization
- Knowledge of statistical modeling and experimentation
- MS or PhD in a quantitative field preferred`,
      requiredSkills: JSON.stringify(["Python", "Machine Learning", "SQL", "Statistics", "pandas"]),
      preferredSkills: JSON.stringify(["TensorFlow", "PyTorch", "Deep Learning", "NLP", "Spark"]),
      status: "ACTIVE",
      userId: user.id,
    },
  });
  console.log(`✅ Job: ${job3.title}`);

  // Create candidates for Job 1
  const candidates = [
    {
      fullName: "Sarah Chen",
      email: "sarah.chen@email.com",
      phone: "+1-555-0101",
      location: "San Francisco, CA",
      linkedIn: "https://linkedin.com/in/sarahchen",
      github: "https://github.com/sarahchen",
      summary: "Senior Frontend Developer with 7 years of experience building high-performance web applications using React and TypeScript.",
      skills: ["React", "TypeScript", "JavaScript", "Next.js", "Tailwind CSS", "Redux", "GraphQL", "Jest", "Cypress", "Node.js", "HTML", "CSS", "Git"],
      experience: [
        { title: "Senior Frontend Developer", company: "TechCorp", duration: "2021-Present", description: "Led frontend team of 5 developers, built design system" },
        { title: "Frontend Developer", company: "StartupXYZ", duration: "2018-2021", description: "Built React SPA serving 100K+ users" },
      ],
      education: [{ degree: "B.S.", institution: "UC Berkeley", year: "2017", field: "Computer Science" }],
      projects: [{ name: "Design System Library", description: "Open-source component library", technologies: ["React", "TypeScript", "Storybook"] }],
      certifications: ["AWS Cloud Practitioner"],
      score: { overall: 92, technical: 95, experience: 90, jdMatch: 94, projects: 88, education: 85, cert: 75 },
      recommendation: "STRONG_MATCH",
    },
    {
      fullName: "Marcus Johnson",
      email: "marcus.j@email.com",
      phone: "+1-555-0102",
      location: "Austin, TX",
      github: "https://github.com/marcusj",
      summary: "Creative frontend developer with 5 years of experience and a passion for user experience and accessibility.",
      skills: ["React", "JavaScript", "CSS", "HTML", "Vue.js", "Sass", "Figma", "Git", "Webpack", "Jest"],
      experience: [
        { title: "Frontend Developer", company: "DesignStudio", duration: "2020-Present", description: "Building accessible web applications" },
        { title: "Junior Developer", company: "WebAgency", duration: "2018-2020", description: "Client websites and web apps" },
      ],
      education: [{ degree: "B.A.", institution: "University of Texas", year: "2018", field: "Digital Media" }],
      projects: [{ name: "A11y Toolkit", description: "Accessibility testing tools", technologies: ["React", "TypeScript"] }],
      certifications: [],
      score: { overall: 78, technical: 80, experience: 72, jdMatch: 82, projects: 75, education: 70, cert: 40 },
      recommendation: "GOOD_MATCH",
    },
    {
      fullName: "Priya Sharma",
      email: "priya.sharma@email.com",
      phone: "+1-555-0103",
      location: "Seattle, WA",
      linkedIn: "https://linkedin.com/in/priyasharma",
      summary: "Full-stack developer transitioning to frontend specialization. 4 years experience with React and Node.js.",
      skills: ["React", "Node.js", "TypeScript", "MongoDB", "Express", "HTML", "CSS", "Git", "Docker"],
      experience: [
        { title: "Full Stack Developer", company: "CloudSoft", duration: "2020-Present", description: "Building cloud-native applications" },
        { title: "Software Engineer", company: "InfoTech", duration: "2019-2020", description: "Backend services and API development" },
      ],
      education: [{ degree: "M.S.", institution: "University of Washington", year: "2019", field: "Computer Science" }],
      projects: [],
      certifications: ["AWS Solutions Architect"],
      score: { overall: 71, technical: 70, experience: 65, jdMatch: 74, projects: 55, education: 90, cert: 80 },
      recommendation: "GOOD_MATCH",
    },
    {
      fullName: "David Kim",
      email: "david.kim@email.com",
      location: "Remote",
      summary: "Junior developer with strong React skills and 2 years of experience. Eager to grow in a senior team.",
      skills: ["React", "JavaScript", "HTML", "CSS", "Git", "Tailwind CSS"],
      experience: [
        { title: "Junior Frontend Developer", company: "SmallStartup", duration: "2022-Present", description: "Building UI components" },
      ],
      education: [{ degree: "B.S.", institution: "Georgia Tech", year: "2022", field: "Computer Science" }],
      projects: [{ name: "Portfolio Site", description: "Personal portfolio", technologies: ["React", "Next.js"] }],
      certifications: [],
      score: { overall: 52, technical: 55, experience: 35, jdMatch: 58, projects: 50, education: 75, cert: 20 },
      recommendation: "MODERATE_MATCH",
    },
    {
      fullName: "Elena Rodriguez",
      email: "elena.r@email.com",
      phone: "+1-555-0105",
      location: "Miami, FL",
      summary: "Backend developer with minimal frontend experience. Strong in Java and Spring Boot.",
      skills: ["Java", "Spring Boot", "PostgreSQL", "Docker", "Kubernetes", "AWS"],
      experience: [
        { title: "Backend Engineer", company: "FinTech Corp", duration: "2019-Present", description: "Microservices architecture" },
      ],
      education: [{ degree: "M.S.", institution: "FIU", year: "2019", field: "Software Engineering" }],
      projects: [],
      certifications: ["AWS Developer Associate", "Oracle Java SE 11"],
      score: { overall: 35, technical: 30, experience: 40, jdMatch: 25, projects: 20, education: 80, cert: 90 },
      recommendation: "WEAK_MATCH",
    },
  ];

  for (const c of candidates) {
    const candidate = await prisma.candidate.create({
      data: {
        fullName: c.fullName,
        email: c.email,
        phone: c.phone || null,
        location: c.location || null,
        linkedIn: c.linkedIn || null,
        github: c.github || null,
        summary: c.summary,
        skills: JSON.stringify(c.skills),
        experience: JSON.stringify(c.experience),
        education: JSON.stringify(c.education),
        projects: JSON.stringify(c.projects),
        certifications: JSON.stringify(c.certifications),
        achievements: "[]",
        languages: "[]",
      },
    });

    const application = await prisma.application.create({
      data: {
        candidateId: candidate.id,
        jobId: job1.id,
        status: c.score.overall >= 75 ? "SHORTLISTED" : c.score.overall >= 50 ? "AI_SCREENED" : "REJECTED",
      },
    });

    await prisma.candidateScore.create({
      data: {
        applicationId: application.id,
        overallScore: c.score.overall,
        technicalScore: c.score.technical,
        experienceScore: c.score.experience,
        jdMatchScore: c.score.jdMatch,
        projectScore: c.score.projects,
        educationScore: c.score.education,
        certScore: c.score.cert,
        technicalExplanation: `Technical skills assessment: ${c.score.technical}/100`,
        experienceExplanation: `Experience relevance: ${c.score.experience}/100`,
        jdMatchExplanation: `Job description match: ${c.score.jdMatch}/100`,
        projectExplanation: `Project quality and relevance: ${c.score.projects}/100`,
        educationExplanation: `Education alignment: ${c.score.education}/100`,
        certExplanation: `Certifications value: ${c.score.cert}/100`,
      },
    });

    await prisma.candidateAnalysis.create({
      data: {
        applicationId: application.id,
        summary: c.summary,
        matchingSkills: JSON.stringify(c.skills.filter(s => ["React", "TypeScript", "JavaScript", "HTML", "CSS", "Git"].includes(s))),
        missingSkills: JSON.stringify(["React", "TypeScript", "JavaScript", "HTML", "CSS", "Git"].filter(s => !c.skills.includes(s))),
        additionalSkills: JSON.stringify(c.skills.filter(s => !["React", "TypeScript", "JavaScript", "HTML", "CSS", "Git"].includes(s))),
        strengths: JSON.stringify([`${c.experience.length > 1 ? "Multiple years" : "Some"} relevant experience`, `${c.skills.length} skills identified`]),
        weaknesses: JSON.stringify(c.score.overall < 60 ? ["Limited frontend experience for senior role"] : ["N/A"]),
        missingReqs: JSON.stringify([]),
        recommendation: c.recommendation,
        experienceAnalysis: JSON.stringify({ totalYears: `${c.experience.length * 2}+ years`, relevantExperience: "See resume", roleRelevance: c.score.experience > 70 ? "High" : "Medium", industryRelevance: "Medium" }),
        educationAnalysis: JSON.stringify({ degree: c.education[0]?.degree || "N/A", institution: c.education[0]?.institution || "N/A", relevance: "Relevant" }),
        projectAnalysis: JSON.stringify({ relevantProjects: c.projects.map(p => p.name), projectQuality: c.projects.length > 0 ? "Good" : "No projects listed" }),
        rawResponse: "{}",
      },
    });

    console.log(`  ✅ Candidate: ${c.fullName} (Score: ${c.score.overall})`);
  }

  // Create notifications
  await prisma.notification.createMany({
    data: [
      { title: "Welcome to TalentsQR!", message: "Start by creating a job and uploading resumes.", type: "INFO", userId: user.id },
      { title: "5 Resumes Uploaded", message: "5 resumes uploaded for Senior Frontend Developer.", type: "SUCCESS", userId: user.id, link: `/jobs/${job1.id}` },
      { title: "AI Screening Complete", message: "All 5 candidates have been analyzed.", type: "SUCCESS", userId: user.id },
      { title: "Top Candidate Found", message: "Sarah Chen scored 92/100 — consider scheduling an interview.", type: "INFO", userId: user.id },
    ],
  });

  console.log("\n✅ Notifications created");
  console.log("\n🎉 Seed complete!\n");
  console.log("Login with:");
  console.log("  Email: demo@talentsqr.com");
  console.log("  Password: demo1234\n");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
