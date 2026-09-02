// Types for the TalentsQR application

// ============================================
// User & Auth Types
// ============================================
export type UserRole = 'RECRUITER' | 'ADMIN' | 'HIRING_MANAGER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string | null;
  organizationId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Job Types
// ============================================
export type JobStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'CLOSED' | 'ARCHIVED';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'FREELANCE';
export type ExperienceLevel = 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE';

export interface Job {
  id: string;
  title: string;
  department?: string | null;
  location?: string | null;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency: string;
  status: JobStatus;
  description: string;
  responsibilities?: string | null;
  qualifications?: string | null;
  requiredSkills: string[];
  preferredSkills: string[];
  educationReq?: string | null;
  experienceReq?: string | null;
  userId: string;
  organizationId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    applications: number;
  };
}

// ============================================
// Candidate Types
// ============================================
export interface WorkExperience {
  title: string;
  company: string;
  duration: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  current?: boolean;
}

export interface Education {
  degree: string;
  institution: string;
  year?: string;
  field?: string;
  gpa?: string;
}

export interface Project {
  name: string;
  description?: string;
  technologies?: string[];
  url?: string;
}

export interface Candidate {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  linkedIn?: string | null;
  github?: string | null;
  portfolio?: string | null;
  summary?: string | null;
  skills: string[];
  experience: WorkExperience[];
  education: Education[];
  projects: Project[];
  certifications: string[];
  achievements: string[];
  languages: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Application Types
// ============================================
export type ApplicationStatus = 'APPLIED' | 'AI_SCREENED' | 'SHORTLISTED' | 'INTERVIEW' | 'SELECTED' | 'REJECTED';

export interface Application {
  id: string;
  status: ApplicationStatus;
  candidateId: string;
  jobId: string;
  candidate?: Candidate;
  job?: Job;
  analysis?: CandidateAnalysis | null;
  score?: CandidateScore | null;
  appliedAt: Date;
  updatedAt: Date;
}

// ============================================
// AI Analysis Types
// ============================================
export type Recommendation = 'STRONG_MATCH' | 'GOOD_MATCH' | 'MODERATE_MATCH' | 'WEAK_MATCH';

export interface ExperienceAnalysis {
  totalYears: string;
  relevantExperience: string;
  roleRelevance: string;
  industryRelevance: string;
}

export interface EducationAnalysis {
  degree: string;
  institution: string;
  relevance: string;
}

export interface ProjectAnalysis {
  relevantProjects: string[];
  projectQuality: string;
}

export interface CandidateAnalysis {
  id: string;
  applicationId: string;
  summary?: string | null;
  matchingSkills: string[];
  missingSkills: string[];
  additionalSkills: string[];
  experienceAnalysis?: ExperienceAnalysis | null;
  educationAnalysis?: EducationAnalysis | null;
  projectAnalysis?: ProjectAnalysis | null;
  strengths: string[];
  weaknesses: string[];
  missingReqs: string[];
  recommendation?: Recommendation | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Scoring Types
// ============================================
export interface CandidateScore {
  id: string;
  applicationId: string;
  overallScore: number;
  technicalScore: number;
  experienceScore: number;
  jdMatchScore: number;
  projectScore: number;
  educationScore: number;
  certScore: number;
  technicalExplanation?: string | null;
  experienceExplanation?: string | null;
  jdMatchExplanation?: string | null;
  projectExplanation?: string | null;
  educationExplanation?: string | null;
  certExplanation?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScoringWeights {
  technicalWeight: number;
  experienceWeight: number;
  jdMatchWeight: number;
  projectWeight: number;
  educationWeight: number;
  certWeight: number;
}

// ============================================
// Notification Types
// ============================================
export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  link?: string | null;
  userId: string;
  createdAt: Date;
}

// ============================================
// AI Assistant Types
// ============================================
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  conversationId: string;
  createdAt: Date;
}

export interface AIConversation {
  id: string;
  title: string;
  userId: string;
  messages?: AIMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// API Response Types
// ============================================
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================
// Dashboard Types
// ============================================
export interface DashboardStats {
  totalJobs: number;
  totalCandidates: number;
  candidatesScreened: number;
  shortlisted: number;
  interviews: number;
  selected: number;
}

export interface FunnelData {
  stage: string;
  count: number;
  percentage: number;
}

export interface ScoreDistribution {
  range: string;
  count: number;
}

export interface RecentCandidate {
  id: string;
  name: string;
  jobTitle: string;
  score: number;
  matchPercentage: number;
  status: ApplicationStatus;
  appliedAt: Date;
}

export interface AIInsight {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  icon: string;
}

// ============================================
// Filter Types
// ============================================
export interface CandidateFilters {
  search?: string;
  jobId?: string;
  status?: ApplicationStatus;
  minScore?: number;
  maxScore?: number;
  skills?: string[];
  location?: string;
  sortBy?: 'score_desc' | 'score_asc' | 'newest' | 'oldest' | 'experience';
  page?: number;
  pageSize?: number;
}

export interface JobFilters {
  search?: string;
  status?: JobStatus;
  department?: string;
  sortBy?: 'newest' | 'oldest' | 'candidates';
  page?: number;
  pageSize?: number;
}
