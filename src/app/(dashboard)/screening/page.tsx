"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, Select, Badge } from "@/components/ui/index";
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  Brain,
  ArrowRight,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Sparkles,
  RefreshCw,
  Mail,
  Phone,
  User,
  Clock,
  Download,
  Share2,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import { formatFileSize, formatDate, getScoreColor, getScoreBgColor, getRecommendationColor } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import QRCode from "qrcode";

interface UploadedFile {
  file: File;
  status: "pending" | "uploading" | "parsing" | "analyzing" | "complete" | "error";
  progress: number;
  error?: string;
  candidateId?: string;
  applicationId?: string;
}

interface CandidateApplication {
  id: string;
  status: string;
  appliedAt: string;
  candidate: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    skills: string;
    resumes: Array<{
      id: string;
      fileName: string;
      filePath: string;
      fileSize: number;
    }>;
  };
  score?: {
    overallScore: number;
    technicalScore: number;
    jdMatchScore: number;
    experienceScore: number;
    projectScore: number;
  } | null;
  analysis?: {
    summary: string | null;
    matchingSkills: string;
    missingSkills: string;
    recommendation: string | null;
    strengths: string;
  } | null;
}

interface JobDetail {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  employmentType: string;
  experienceLevel: string;
  description: string;
  candidateCount: number;
  shortlistedCount: number;
  avgScore: number;
  applications: CandidateApplication[];
}

export default function ScreeningPage() {
  const [jobs, setJobs] = useState<{ id: string; title: string }[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [selectedJob, setSelectedJob] = useState<JobDetail | null>(null);
  const [loadingJob, setLoadingJob] = useState(false);

  // Direct upload state
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Link & QR Code state
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "STRONG" | "GOOD" | "MODERATE">("ALL");
  const [analyzingAppId, setAnalyzingAppId] = useState<string | null>(null);

  // Load jobs list
  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/jobs");
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setJobs(data.data.map((j: { id: string; title: string }) => ({ id: j.id, title: j.title })));
        if (!selectedJobId) {
          setSelectedJobId(data.data[0].id);
        }
      }
    } catch {
      toast.error("Failed to load jobs");
    }
  }, [selectedJobId]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Load selected job details & candidates
  const loadJobDetails = useCallback(async (jobId: string) => {
    if (!jobId) return;
    setLoadingJob(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedJob(data.data);
      }
    } catch {
      toast.error("Failed to load job candidates");
    } finally {
      setLoadingJob(false);
    }
  }, []);

  useEffect(() => {
    if (selectedJobId) {
      loadJobDetails(selectedJobId);
    }
  }, [selectedJobId, loadJobDetails]);

  // Generate QR code for the application link
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shareableJobUrl = `${origin}/apply?jobId=${selectedJobId}`;
  const generalApplyUrl = `${origin}/apply`;

  useEffect(() => {
    if (selectedJobId && origin) {
      QRCode.toDataURL(shareableJobUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error("QR Code generation error", err));
    }
  }, [selectedJobId, shareableJobUrl, origin]);

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      toast.success("Application link copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  // Direct File Selection
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter((f) => {
      const validType =
        f.type === "application/pdf" ||
        f.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        f.name.match(/\.(pdf|docx)$/i);
      const validSize = f.size <= 10 * 1024 * 1024;

      if (!validType) toast.error(`${f.name}: Only PDF and DOCX files are supported`);
      if (!validSize) toast.error(`${f.name}: File exceeds 10MB limit`);

      return validType && validSize;
    });

    setFiles((prev) => [
      ...prev,
      ...validFiles.map((file) => ({
        file,
        status: "pending" as const,
        progress: 0,
      })),
    ]);
  };

  // Upload and Auto-Screen
  const handleUploadAndScreen = async () => {
    if (!selectedJobId) {
      toast.error("Please select a job role first");
      return;
    }

    const pendingFiles = files.filter((f) => f.status === "pending");
    if (pendingFiles.length === 0) {
      toast.error("Please add files to upload");
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("jobId", selectedJobId);
    pendingFiles.forEach((f) => formData.append("files", f.file));

    // Mark as uploading
    setFiles((prev) =>
      prev.map((f) => (f.status === "pending" ? { ...f, status: "uploading" as const, progress: 30 } : f))
    );

    try {
      // 1. Upload files
      setFiles((prev) =>
        prev.map((f) => (f.status === "uploading" ? { ...f, status: "parsing" as const, progress: 60 } : f))
      );

      const res = await fetch("/api/resumes/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        const results = data.data as Array<{
          fileName: string;
          success: boolean;
          error?: string;
          candidateId?: string;
          applicationId?: string;
        }>;

        // 2. For each successful upload, run AI screening immediately
        for (const item of results) {
          if (item.success && item.applicationId) {
            setFiles((prev) =>
              prev.map((f) =>
                f.file.name === item.fileName ? { ...f, status: "analyzing" as const, progress: 85 } : f
              )
            );

            try {
              await fetch("/api/ai/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ applicationId: item.applicationId }),
              });
            } catch (screenErr) {
              console.warn("AI screening error for uploaded resume:", screenErr);
            }
          }
        }

        // Mark files as complete
        setFiles((prev) =>
          prev.map((f) => {
            const result = results.find((r) => r.fileName === f.file.name);
            if (result) {
              return {
                ...f,
                status: result.success ? ("complete" as const) : ("error" as const),
                progress: result.success ? 100 : 0,
                error: result.error,
                candidateId: result.candidateId,
                applicationId: result.applicationId,
              };
            }
            return f;
          })
        );

        const successCount = results.filter((r) => r.success).length;
        toast.success(`${successCount} resume${successCount > 1 ? "s" : ""} uploaded and screened!`);

        // Refresh candidates list for this job
        await loadJobDetails(selectedJobId);
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch {
      toast.error("Upload failed. Please check network connection.");
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Run AI analysis manually on an application
  const handleManualAnalyze = async (applicationId: string) => {
    setAnalyzingAppId(applicationId);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Screened! AI Score: ${data.data.overallScore}%`);
        await loadJobDetails(selectedJobId);
      } else {
        toast.error(data.error || "AI screening failed");
      }
    } catch {
      toast.error("Could not complete AI screening");
    } finally {
      setAnalyzingAppId(null);
    }
  };

  // Filter candidates
  const filteredApplications = (selectedJob?.applications || []).filter((app) => {
    if (activeFilter === "ALL") return true;
    const rec = app.analysis?.recommendation || "";
    if (activeFilter === "STRONG") return rec === "STRONG_MATCH";
    if (activeFilter === "GOOD") return rec === "GOOD_MATCH";
    if (activeFilter === "MODERATE") return rec === "MODERATE_MATCH" || rec === "WEAK_MATCH";
    return true;
  });

  return (
    <div className="space-y-6 fade-in max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5">
            <Brain className="text-[var(--primary)]" size={28} /> Resume Screening Hub
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Collect candidate applications via shareable link / QR code or upload resumes for instant AI evaluation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadJobDetails(selectedJobId)}
            loading={loadingJob}
            className="flex items-center gap-2"
          >
            <RefreshCw size={14} /> Refresh Candidates
          </Button>
          <Link href="/jobs/new">
            <Button size="sm" className="flex items-center gap-2">
              <Briefcase size={14} /> Post New Job
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content: Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Controls, Link Sharing & Direct Upload (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. Job Role Selection */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Briefcase size={16} className="text-[var(--primary)]" /> Select Active Job Role
              </label>
              <span className="text-xs text-[var(--muted-foreground)]">
                {jobs.length} position{jobs.length !== 1 ? "s" : ""}
              </span>
            </div>

            {jobs.length > 0 ? (
              <Select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                options={jobs.map((j) => ({ value: j.id, label: j.title }))}
              />
            ) : (
              <div className="text-sm text-[var(--muted-foreground)] py-2">
                No active jobs.{" "}
                <Link href="/jobs/new" className="text-[var(--primary)] hover:underline font-medium">
                  Create a job post
                </Link>{" "}
                to start screening.
              </div>
            )}

            {selectedJob && (
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border)] text-center text-xs">
                <div className="p-2 rounded-lg bg-[var(--secondary)]/40">
                  <div className="text-[var(--muted-foreground)]">Applicants</div>
                  <div className="text-base font-bold text-[var(--foreground)] mt-0.5">
                    {selectedJob.candidateCount}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-[var(--secondary)]/40">
                  <div className="text-[var(--muted-foreground)]">Shortlisted</div>
                  <div className="text-base font-bold text-emerald-500 mt-0.5">
                    {selectedJob.shortlistedCount}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-[var(--secondary)]/40">
                  <div className="text-[var(--muted-foreground)]">Avg Match</div>
                  <div className="text-base font-bold text-[var(--primary)] mt-0.5">
                    {selectedJob.avgScore ? `${selectedJob.avgScore}%` : "—"}
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* 2. Public Candidate Application Portal & QR Code */}
          <Card className="p-5 space-y-4 border-[var(--primary)]/30 bg-gradient-to-b from-[var(--primary)]/5 to-transparent relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                  <Share2 size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Public Application Link & QR</h3>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Share this form with candidates
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]">
                Auto-Updating Form
              </Badge>
            </div>

            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
              Whenever you create a new job post, it immediately appears on this application link. Candidates fill the form, attach their resumes, and AI scores them right beside this role!
            </p>

            {/* Direct Link Input with Copy Button */}
            <div className="space-y-2">
              <div className="text-[11px] font-medium text-[var(--muted-foreground)]">
                Shareable Link (Pre-selects current job role):
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareableJobUrl}
                  className="w-full bg-[var(--secondary)]/60 border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--foreground)] font-mono select-all focus:outline-none"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(shareableJobUrl)}
                  className="shrink-0 flex items-center gap-1.5"
                >
                  {copiedLink ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  {copiedLink ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            {/* Action Buttons: Open in New Tab & Show QR Code */}
            <div className="flex items-center gap-2 pt-1">
              <a
                href={shareableJobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-semibold hover:opacity-90 transition-all shadow-sm"
              >
                <ExternalLink size={14} /> Open Form <ArrowRight size={12} />
              </a>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setQrModalOpen(!qrModalOpen)}
                className="flex items-center gap-1.5 text-xs"
              >
                <QrCode size={14} /> {qrModalOpen ? "Hide QR" : "Show QR Code"}
              </Button>
            </div>

            {/* Expandable QR Code Card */}
            {qrModalOpen && (
              <div className="pt-3 border-t border-[var(--border)] text-center space-y-3 fade-in">
                <div className="inline-block p-3 bg-white rounded-xl shadow-lg border border-slate-200">
                  {qrCodeUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qrCodeUrl} alt="Application QR Code" className="w-48 h-48 mx-auto" />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-xs text-gray-500">
                      Generating QR...
                    </div>
                  )}
                </div>
                <div className="text-xs text-[var(--muted-foreground)]">
                  Scan to apply instantly for <span className="font-semibold text-[var(--foreground)]">{selectedJob?.title}</span>
                </div>
                {qrCodeUrl && (
                  <a
                    href={qrCodeUrl}
                    download={`QR_${selectedJob?.title || "Job"}.png`}
                    className="inline-flex items-center gap-1 text-xs text-[var(--primary)] hover:underline font-medium"
                  >
                    <Download size={12} /> Download QR Code Image
                  </a>
                )}
              </div>
            )}
          </Card>

          {/* 3. Direct Resume Upload Card */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Upload size={16} className="text-[var(--primary)]" /> Direct Resume Upload
                </h3>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Or upload candidate files manually
                </p>
              </div>
              <Badge variant="outline" className="text-[10px]">PDF & DOCX</Badge>
            </div>

            {/* Drag and drop zone */}
            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
                dragOver
                  ? "border-[var(--primary)] bg-[var(--primary)]/10"
                  : "border-[var(--border)] hover:border-[var(--primary)]/50 bg-[var(--secondary)]/20"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileSelect}
              />
              <Upload size={32} className="mx-auto mb-2 text-[var(--muted-foreground)]" />
              <p className="text-xs font-semibold text-[var(--foreground)]">
                Drop resumes here or click to browse
              </p>
              <p className="text-[11px] text-[var(--muted-foreground)] mt-1">
                Max 10MB per file · Automatic AI screening
              </p>
            </div>

            {/* Queued Files List */}
            {files.length > 0 && (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {files.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg border border-[var(--border)] bg-[var(--secondary)]/30 text-xs"
                  >
                    <div className="shrink-0">
                      {f.status === "complete" ? (
                        <CheckCircle2 size={16} className="text-emerald-500" />
                      ) : f.status === "error" ? (
                        <XCircle size={16} className="text-red-500" />
                      ) : f.status === "pending" ? (
                        <FileText size={16} className="text-[var(--muted-foreground)]" />
                      ) : (
                        <Loader2 size={16} className="text-[var(--primary)] animate-spin" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{f.file.name}</div>
                      <div className="text-[10px] text-[var(--muted-foreground)]">
                        {formatFileSize(f.file.size)}
                        {f.status === "uploading" && " · Uploading..."}
                        {f.status === "parsing" && " · Extracting text..."}
                        {f.status === "analyzing" && " · AI screening..."}
                        {f.status === "complete" && " · Screened & Saved"}
                        {f.status === "error" && ` · ${f.error || "Failed"}`}
                      </div>
                    </div>

                    {f.status === "pending" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(i);
                        }}
                        className="text-[var(--muted-foreground)] hover:text-red-400 p-1"
                      >
                        <XCircle size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {files.length > 0 && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-[var(--muted-foreground)]">
                  {files.filter((f) => f.status === "pending").length} ready to screen
                </span>
                <Button
                  size="sm"
                  onClick={handleUploadAndScreen}
                  loading={uploading}
                  disabled={!selectedJobId || files.filter((f) => f.status === "pending").length === 0}
                  className="flex items-center gap-1.5"
                >
                  <Sparkles size={14} /> Upload & Screen with AI
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT COLUMN: Candidates Beside the Selected Job Role (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[var(--foreground)]">
                    Resumes & Candidates for Role
                  </h2>
                  <Badge variant="outline" className="text-xs font-mono font-bold">
                    {filteredApplications.length}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  Live applications submitted via public form or uploaded directly
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-[var(--secondary)]/60 p-1 rounded-lg text-xs">
                {(["ALL", "STRONG", "GOOD", "MODERATE"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                      activeFilter === filter
                        ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs"
                        : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {filter === "ALL" ? "All" : filter === "STRONG" ? "Strong" : filter === "GOOD" ? "Good" : "Other"}
                  </button>
                ))}
              </div>
            </div>

            {/* Candidates List / Stream */}
            {loadingJob ? (
              <div className="py-16 text-center text-sm text-[var(--muted-foreground)] flex items-center justify-center gap-3">
                <Loader2 className="animate-spin text-[var(--primary)]" size={20} />
                Loading candidate applications...
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="py-12 px-4 text-center border-2 border-dashed border-[var(--border)] rounded-xl space-y-3">
                <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center mx-auto">
                  <User size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[var(--foreground)]">
                    No candidates for this position yet
                  </h4>
                  <p className="text-xs text-[var(--muted-foreground)] max-w-sm mx-auto mt-1">
                    Share the public application link above or upload resumes on the left. The moment a candidate submits, their profile and AI score will appear right here!
                  </p>
                </div>
                <div className="pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(shareableJobUrl)}
                    className="flex items-center gap-1.5 mx-auto text-xs"
                  >
                    <Copy size={12} /> Copy Application Link
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredApplications.map((app) => {
                  const score = app.score?.overallScore;
                  const recommendation = app.analysis?.recommendation;
                  const candidate = app.candidate;
                  const resume = candidate.resumes && candidate.resumes[0];

                  let matchingSkillsList: string[] = [];
                  try {
                    matchingSkillsList = JSON.parse(app.analysis?.matchingSkills || "[]");
                  } catch {
                    matchingSkillsList = [];
                  }

                  return (
                    <div
                      key={app.id}
                      className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/40 transition-all space-y-3 shadow-xs"
                    >
                      {/* Candidate Header Row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[var(--foreground)]">
                              {candidate.fullName}
                            </span>
                            {recommendation ? (
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-semibold ${getRecommendationColor(recommendation)}`}
                              >
                                {recommendation.replace("_", " ")}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-400/20">
                                Pending AI
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted-foreground)]">
                            {candidate.email && (
                              <span className="flex items-center gap-1">
                                <Mail size={12} /> {candidate.email}
                              </span>
                            )}
                            {candidate.phone && (
                              <span className="flex items-center gap-1">
                                <Phone size={12} /> {candidate.phone}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock size={12} /> {formatDate(app.appliedAt)}
                            </span>
                          </div>
                        </div>

                        {/* AI Match Score Circular Badge */}
                        {score !== undefined && score !== null ? (
                          <div className="text-center shrink-0">
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-sm border ${getScoreBgColor(
                                score
                              )} ${getScoreColor(score)}`}
                            >
                              {score}%
                            </div>
                            <span className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider block mt-0.5">
                              Match
                            </span>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs shrink-0 flex items-center gap-1"
                            onClick={() => handleManualAnalyze(app.id)}
                            loading={analyzingAppId === app.id}
                          >
                            <Brain size={12} /> Screen
                          </Button>
                        )}
                      </div>

                      {/* Matching Skills Badges */}
                      {matchingSkillsList.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] font-medium text-[var(--muted-foreground)] mr-1">
                            Skills:
                          </span>
                          {matchingSkillsList.slice(0, 5).map((skill, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                          {matchingSkillsList.length > 5 && (
                            <span className="text-[10px] text-[var(--muted-foreground)]">
                              +{matchingSkillsList.length - 5} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Candidate Footer Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] text-xs">
                        {resume ? (
                          <a
                            href={`/api/resumes/download/${resume.filePath}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[var(--primary)] hover:underline font-medium"
                          >
                            <FileText size={13} /> {resume.fileName} ({formatFileSize(resume.fileSize)})
                          </a>
                        ) : (
                          <span className="text-[var(--muted-foreground)] text-xs">No file attached</span>
                        )}

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/candidates/${candidate.id}`}
                            className="inline-flex items-center gap-1 font-semibold text-[var(--primary)] hover:underline"
                          >
                            View AI Scorecard <ArrowRight size={12} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
