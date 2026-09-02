import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider, AIAnalysisResult, AIComparisonResult } from "./provider";

export class ClaudeProvider implements AIProvider {
  private client: Anthropic;

  constructor(apiKey: string, workspaceId?: string) {
    const defaultHeaders = workspaceId ? { "anthropic-workspace-id": workspaceId } : undefined;
    this.client = new Anthropic({ apiKey, defaultHeaders });
  }

  async generateJobDescription(details: any): Promise<string> {
    const prompt = `You are an expert technical recruiter and copywriter. Generate a professional, engaging, and clear job description based on the following details:
    
    Job Title: ${details.title || "Not specified"}
    Department: ${details.department || "Not specified"}
    Location: ${details.location || "Not specified"}
    Employment Type: ${details.employmentType || "Not specified"}
    Experience Level: ${details.experienceLevel || "Not specified"}
    Required Skills: ${(details.requiredSkills || []).join(", ")}
    Preferred Skills: ${(details.preferredSkills || []).join(", ")}
    
    Structure the job description with these sections (use simple text/markdown):
    1. A brief, engaging company/role intro (2-3 sentences)
    2. Key Responsibilities (bullet points)
    3. Requirements (bullet points)
    
    Do NOT include placeholder text for salary unless provided. Be concise, professional, and welcoming. Return only the job description text.`;

    try {
      const response = await this.client.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1000,
        temperature: 0.7,
        messages: [{ role: "user", content: prompt }],
      });
      return (response.content[0] as any).text;
    } catch (error: any) {
      console.warn("Claude Job Generation Error, falling back to smart generator:", error?.message);
      const title = details.title || "Software Engineer";
      const department = details.department || "Engineering";
      const location = details.location || "Remote";
      const level = details.experienceLevel || "Mid Level";
      const reqSkills = (details.requiredSkills || []).join(", ") || "Problem Solving, Technical Aptitude";

      return `## Role Overview\nWe are looking for an exceptional and driven **${title}** to join our growing **${department}** team (${location}, ${level}). You will play a pivotal role in designing, developing, and deploying high-impact features.\n\n## Key Responsibilities\n- Architect, build, and maintain robust, scalable systems.\n- Collaborate cross-functionally to deliver high-quality user experiences.\n- Write clean, testable code adhering to modern best practices.\n\n## Requirements\n- Demonstrated proficiency with: ${reqSkills}.\n- Strong problem-solving capabilities and engineering foundations.\n- Excellent communication and team collaboration skills.`;
    }
  }

  async analyzeResume(resumeText: string, jobDescription: string, jobTitle: string): Promise<AIAnalysisResult> {
    const prompt = `You are an expert recruitment analyst. Analyze the following resume against the job description.

CRITICAL RULES:
1. NEVER invent information not present in the resume.
2. If information is not found, explicitly state "Not found in resume."
3. Only report skills, experience, and qualifications that are EXPLICITLY mentioned.
4. Be honest and constructive in your assessment.

JOB TITLE: ${jobTitle}

JOB DESCRIPTION:
${jobDescription}

RESUME TEXT:
${resumeText}

Respond ONLY with valid JSON matching this exact structure (no markdown, no code fences):
{
  "summary": "A concise 2-3 sentence recruiter-friendly summary of the candidate",
  "matchingSkills": ["skills from resume that match job requirements"],
  "missingSkills": ["required skills from JD not found in resume"],
  "additionalSkills": ["candidate skills not in JD but potentially valuable"],
  "experienceAnalysis": {
    "totalYears": "estimated total years or 'Not found in resume'",
    "relevantExperience": "description of relevant experience",
    "roleRelevance": "High/Medium/Low with explanation",
    "industryRelevance": "High/Medium/Low with explanation"
  },
  "educationAnalysis": {
    "degree": "highest degree found or 'Not found in resume'",
    "institution": "institution name or 'Not found in resume'",
    "relevance": "relevance to the role"
  },
  "projectAnalysis": {
    "relevantProjects": ["list of projects relevant to the job"],
    "projectQuality": "assessment of project quality and relevance"
  },
  "strengths": ["3-5 meaningful strengths based on resume content"],
  "weaknesses": ["2-3 constructive areas for improvement"],
  "missingRequirements": ["specific JD requirements not satisfied"],
  "recommendation": "STRONG_MATCH or GOOD_MATCH or MODERATE_MATCH or WEAK_MATCH",
  "candidateInfo": {
    "fullName": "extracted full name",
    "email": "extracted email or null",
    "phone": "extracted phone or null",
    "location": "extracted location or null",
    "linkedIn": "extracted LinkedIn URL or null",
    "github": "extracted GitHub URL or null",
    "portfolio": "extracted portfolio URL or null",
    "summary": "candidate's professional summary if present",
    "skills": ["all identified skills"],
    "experience": [{"title": "job title", "company": "company", "duration": "duration", "description": "brief description"}],
    "education": [{"degree": "degree", "institution": "school", "year": "year", "field": "field of study"}],
    "projects": [{"name": "project name", "description": "brief description", "technologies": ["tech used"]}],
    "certifications": ["certification names"],
    "achievements": ["notable achievements"]
  },
  "scores": {
    "technical": {"score": 0-100, "explanation": "why this score"},
    "experience": {"score": 0-100, "explanation": "why this score"},
    "jdMatch": {"score": 0-100, "explanation": "why this score"},
    "projects": {"score": 0-100, "explanation": "why this score"},
    "education": {"score": 0-100, "explanation": "why this score"},
    "certifications": {"score": 0-100, "explanation": "why this score"}
  }
}`;

    try {
      const response = await this.client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      });

      const text = response.content[0].type === "text" ? response.content[0].text : "";
      
      // Try to parse JSON - handle potential markdown wrapping
      let jsonStr = text.trim();
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/```json?\n?/g, "").replace(/```$/g, "").trim();
      }
      
      const result = JSON.parse(jsonStr) as AIAnalysisResult;
      
      // Validate recommendation value
      const validRecs = ["STRONG_MATCH", "GOOD_MATCH", "MODERATE_MATCH", "WEAK_MATCH"];
      if (!validRecs.includes(result.recommendation)) {
        result.recommendation = "MODERATE_MATCH";
      }

      return result;
    } catch (error) {
      console.error("Claude analysis error:", error);
      throw new Error("AI analysis failed. Please try again.");
    }
  }

  async compareCandidate(
    candidates: { id: string; name: string; analysis: string }[],
    jobDescription: string
  ): Promise<AIComparisonResult> {
    const candidateList = candidates.map((c, i) => 
      `CANDIDATE ${i + 1} (ID: ${c.id}, Name: ${c.name}):\n${c.analysis}`
    ).join("\n\n---\n\n");

    const prompt = `You are an expert recruitment analyst. Compare these candidates for the following job.

JOB DESCRIPTION:
${jobDescription}

CANDIDATES:
${candidateList}

Respond ONLY with valid JSON:
{
  "bestTechnicalFit": {"candidateId": "id", "reason": "explanation"},
  "bestExperience": {"candidateId": "id", "reason": "explanation"},
  "bestOverallMatch": {"candidateId": "id", "reason": "explanation"},
  "skillGaps": [{"candidateId": "id", "gaps": ["missing skills"]}],
  "recommendedCandidate": {"candidateId": "id", "reason": "detailed explanation"},
  "comparisonTable": [
    {"category": "Technical Skills", "scores": [{"candidateId": "id", "score": 85, "note": "brief note"}]},
    {"category": "Experience", "scores": [{"candidateId": "id", "score": 80, "note": "brief note"}]},
    {"category": "JD Match", "scores": [{"candidateId": "id", "score": 90, "note": "brief note"}]},
    {"category": "Projects", "scores": [{"candidateId": "id", "score": 75, "note": "brief note"}]},
    {"category": "Education", "scores": [{"candidateId": "id", "score": 70, "note": "brief note"}]}
  ]
}`;

    try {
      const response = await this.client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      });

      const text = response.content[0].type === "text" ? response.content[0].text : "";
      let jsonStr = text.trim();
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/```json?\n?/g, "").replace(/```$/g, "").trim();
      }

      return JSON.parse(jsonStr) as AIComparisonResult;
    } catch (error) {
      console.error("Claude comparison error:", error);
      throw new Error("AI comparison failed. Please try again.");
    }
  }

  async chat(messages: { role: string; content: string }[], context: string): Promise<string> {
    const systemPrompt = `You are an AI Recruitment Assistant for TalentsQR. You help recruiters make data-driven hiring decisions.

CONTEXT (Application Data):
${context}

RULES:
1. Answer ONLY based on the provided context data. Do not make up candidate information.
2. If asked about something not in the data, say "I don't have that information in the current data."
3. Reference specific candidates and jobs by name when relevant.
4. Be concise but informative.
5. If asked to compare, use actual scores and data from the context.`;

    try {
      const response = await this.client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: systemPrompt,
        messages: messages.map(m => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      });

      return response.content[0].type === "text" ? response.content[0].text : "I couldn't generate a response.";
    } catch (error) {
      console.error("Claude chat error:", error);
      throw new Error("AI assistant unavailable. Please try again.");
    }
  }
}
