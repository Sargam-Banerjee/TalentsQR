import { type ClassValue, clsx } from "clsx";

// Simple clsx implementation since we may not have it as dependency
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Format date to readable string
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Format relative time
export function formatRelativeTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

// Get score color based on value
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 60) return 'text-blue-600 dark:text-blue-400';
  if (score >= 40) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

export function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-emerald-100 dark:bg-emerald-900/30';
  if (score >= 60) return 'bg-blue-100 dark:bg-blue-900/30';
  if (score >= 40) return 'bg-amber-100 dark:bg-amber-900/30';
  return 'bg-red-100 dark:bg-red-900/30';
}

// Get status color
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    APPLIED: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    AI_SCREENED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    SHORTLISTED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    INTERVIEW: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    SELECTED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    PAUSED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    CLOSED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    ARCHIVED: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  };
  return colors[status] || colors.APPLIED;
}

// Get status label
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    APPLIED: 'Applied',
    AI_SCREENED: 'AI Screened',
    SHORTLISTED: 'Shortlisted',
    INTERVIEW: 'Interview',
    SELECTED: 'Selected',
    REJECTED: 'Rejected',
    ACTIVE: 'Active',
    DRAFT: 'Draft',
    PAUSED: 'Paused',
    CLOSED: 'Closed',
    ARCHIVED: 'Archived',
    FULL_TIME: 'Full Time',
    PART_TIME: 'Part Time',
    CONTRACT: 'Contract',
    INTERNSHIP: 'Internship',
    FREELANCE: 'Freelance',
    ENTRY: 'Entry Level',
    MID: 'Mid Level',
    SENIOR: 'Senior',
    LEAD: 'Lead',
    EXECUTIVE: 'Executive',
    STRONG_MATCH: 'Strong Match',
    GOOD_MATCH: 'Good Match',
    MODERATE_MATCH: 'Moderate Match',
    WEAK_MATCH: 'Weak Match',
  };
  return labels[status] || status;
}

// Get recommendation color
export function getRecommendationColor(rec: string): string {
  const colors: Record<string, string> = {
    STRONG_MATCH: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    GOOD_MATCH: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    MODERATE_MATCH: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    WEAK_MATCH: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  };
  return colors[rec] || '';
}

// Parse JSON safely
export function safeParseJSON<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

// Truncate text
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// Generate initials
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
