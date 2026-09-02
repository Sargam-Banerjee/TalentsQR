// AI Provider Abstraction Layer
// Allows swapping between Claude, OpenAI, Gemini, etc.

export interface AIAnalysisResult {
  summary: string;
  matchingSkills: string[];
  missingSkills: string[];
  additionalSkills: string[];
  experienceAnalysis: {
    totalYears: string;
    relevantExperience: string;
    roleRelevance: string;
    industryRelevance: string;
  };
  educationAnalysis: {
    degree: string;
    institution: string;
    relevance: string;
  };
  projectAnalysis: {
    relevantProjects: string[];
    projectQuality: string;
  };
  strengths: string[];
  weaknesses: string[];
  missingRequirements: string[];
  recommendation: "STRONG_MATCH" | "GOOD_MATCH" | "MODERATE_MATCH" | "WEAK_MATCH";
  candidateInfo: {
    fullName: string;
    email: string | null;
    phone: string | null;
    location: string | null;
    linkedIn: string | null;
    github: string | null;
    portfolio: string | null;
    summary: string | null;
    skills: string[];
    experience: {
      title: string;
      company: string;
      duration: string;
      description?: string;
    }[];
    education: {
      degree: string;
      institution: string;
      year?: string;
      field?: string;
    }[];
    projects: {
      name: string;
      description?: string;
      technologies?: string[];
    }[];
    certifications: string[];
    achievements: string[];
  };
  scores: {
    technical: { score: number; explanation: string };
    experience: { score: number; explanation: string };
    jdMatch: { score: number; explanation: string };
    projects: { score: number; explanation: string };
    education: { score: number; explanation: string };
    certifications: { score: number; explanation: string };
  };
}

export interface AIComparisonResult {
  bestTechnicalFit: { candidateId: string; reason: string };
  bestExperience: { candidateId: string; reason: string };
  bestOverallMatch: { candidateId: string; reason: string };
  skillGaps: { candidateId: string; gaps: string[] }[];
  recommendedCandidate: { candidateId: string; reason: string };
  comparisonTable: {
    category: string;
    scores: { candidateId: string; score: number; note: string }[];
  }[];
}

export interface AIProvider {
  analyzeResume(resumeText: string, jobDescription: string, jobTitle: string): Promise<AIAnalysisResult>;
  compareCandidate(candidates: { id: string; name: string; analysis: string }[], jobDescription: string): Promise<AIComparisonResult>;
  chat(messages: { role: string; content: string }[], context: string): Promise<string>;
  generateJobDescription(details: any): Promise<string>;
}

// Factory to get the configured AI provider
export async function getAIProvider(): Promise<AIProvider> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const claudeKey = process.env.CLAUDE_API_KEY;
  const claudeWorkspaceId = process.env.CLAUDE_WORKSPACE_ID;
  
  if (geminiKey) {
    // Use Gemini provider
    const { GeminiProvider } = await import("./gemini.provider");
    return new GeminiProvider(geminiKey);
  } else if (claudeKey) {
    // Use Claude provider
    const { ClaudeProvider } = await import("./claude.provider");
    return new ClaudeProvider(claudeKey, claudeWorkspaceId);
  }
  
  // Return a mock provider for demo/development if no keys are found
  return new MockAIProvider();
}

// Mock provider for when no API key is configured
class MockAIProvider implements AIProvider {
  async generateJobDescription(details: any): Promise<string> {
    return `This is an AI-generated mock job description for the ${details.title || "position"} role in the ${details.department || "department"} department. Please configure a valid CLAUDE_API_KEY to generate real job descriptions.`;
  }
  async analyzeResume(resumeText: string, _jobDescription: string, _jobTitle: string): Promise<AIAnalysisResult> {
    // Extract basic info from resume text
    const emailMatch = resumeText.match(/[\w.-]+@[\w.-]+\.\w+/);
    const phoneMatch = resumeText.match(/[\+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}/);
    const linkedInMatch = resumeText.match(/linkedin\.com\/in\/[\w-]+/i);
    const githubMatch = resumeText.match(/github\.com\/[\w-]+/i);
    
    // Try to extract name from first line
    const lines = resumeText.split("\n").filter(l => l.trim());
    const possibleName = lines[0]?.trim() || "Unknown Candidate";

    // Extract skills by looking for common tech terms
    const commonSkills = [
      "JavaScript", "TypeScript", "Python", "Java", "C++", "React", "Angular", "Vue",
      "Node.js", "Express", "Next.js", "Django", "Flask", "Spring", "Docker", "Kubernetes",
      "AWS", "Azure", "GCP", "PostgreSQL", "MongoDB", "MySQL", "Redis", "GraphQL",
      "REST", "Git", "CI/CD", "Linux", "HTML", "CSS", "Tailwind", "Sass",
      "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "NLP",
      "SQL", "NoSQL", "Microservices", "Agile", "Scrum",
    ];
    
    const foundSkills = commonSkills.filter(skill => 
      resumeText.toLowerCase().includes(skill.toLowerCase())
    );

    return {
      summary: `Candidate profile extracted from resume. ${foundSkills.length} relevant skills identified. Full AI analysis requires an API key configuration.`,
      matchingSkills: foundSkills.slice(0, 8),
      missingSkills: ["Full AI analysis requires API key"],
      additionalSkills: foundSkills.slice(8),
      experienceAnalysis: {
        totalYears: "Extracted from resume text",
        relevantExperience: "Requires AI analysis",
        roleRelevance: "Requires AI analysis",
        industryRelevance: "Requires AI analysis",
      },
      educationAnalysis: {
        degree: "Extracted from resume",
        institution: "Extracted from resume",
        relevance: "Requires AI analysis",
      },
      projectAnalysis: {
        relevantProjects: ["See resume for project details"],
        projectQuality: "Requires AI analysis",
      },
      strengths: foundSkills.length > 5 ? ["Strong technical skill set", "Diverse technology experience"] : ["Resume uploaded successfully"],
      weaknesses: ["Full AI analysis requires API key configuration"],
      missingRequirements: [],
      recommendation: foundSkills.length > 8 ? "GOOD_MATCH" : foundSkills.length > 4 ? "MODERATE_MATCH" : "WEAK_MATCH",
      candidateInfo: {
        fullName: possibleName.length < 50 ? possibleName : "Unknown Candidate",
        email: emailMatch?.[0] || null,
        phone: phoneMatch?.[0] || null,
        location: null,
        linkedIn: linkedInMatch?.[0] ? `https://${linkedInMatch[0]}` : null,
        github: githubMatch?.[0] ? `https://${githubMatch[0]}` : null,
        portfolio: null,
        summary: resumeText.substring(0, 300),
        skills: foundSkills,
        experience: [],
        education: [],
        projects: [],
        certifications: [],
        achievements: [],
      },
      scores: {
        technical: { score: Math.min(foundSkills.length * 10, 90), explanation: `Found ${foundSkills.length} technical skills in resume` },
        experience: { score: 60, explanation: "Experience scoring requires full AI analysis" },
        jdMatch: { score: Math.min(foundSkills.length * 8, 85), explanation: `${foundSkills.length} skills found matching common requirements` },
        projects: { score: 55, explanation: "Project analysis requires full AI analysis" },
        education: { score: 65, explanation: "Education analysis requires full AI analysis" },
        certifications: { score: 40, explanation: "Certification analysis requires full AI analysis" },
      },
    };
  }

  async compareCandidate(candidates: { id: string; name: string }[]): Promise<AIComparisonResult> {
    return {
      bestTechnicalFit: { candidateId: candidates[0]?.id || "", reason: "Full comparison requires AI API key" },
      bestExperience: { candidateId: candidates[0]?.id || "", reason: "Full comparison requires AI API key" },
      bestOverallMatch: { candidateId: candidates[0]?.id || "", reason: "Full comparison requires AI API key" },
      skillGaps: candidates.map(c => ({ candidateId: c.id, gaps: ["Full analysis requires API key"] })),
      recommendedCandidate: { candidateId: candidates[0]?.id || "", reason: "Full recommendation requires AI API key" },
      comparisonTable: [],
    };
  }

  async chat(_messages: { role: string; content: string }[], _context: string): Promise<string> {
    return "The AI Assistant requires a Claude API key to be configured. Please add your CLAUDE_API_KEY to the .env file to enable AI-powered conversations about your candidates and jobs.";
  }
}
