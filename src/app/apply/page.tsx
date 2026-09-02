"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Briefcase,
  User,
  Mail,
  Phone,
  Link2,
  Globe,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  MapPin,
  Clock,
  Building,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface PublicJob {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  employmentType: string;
  experienceLevel: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
}

function ApplicationFormContent() {
  const searchParams = useSearchParams();
  const initialJobId = searchParams.get("jobId") || searchParams.get("job") || "";

  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState(initialJobId);

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedIn, setLinkedIn] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [summary, setSummary] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  // Submission states
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    jobTitle: string;
    candidateName: string;
    applicationId: string;
  } | null>(null);

  useEffect(() => {
    async function loadPublicJobs() {
      try {
        const res = await fetch("/api/jobs/public");
        const json = await res.json();
        if (json.success && json.data) {
          setJobs(json.data);
          if (initialJobId && json.data.some((j: PublicJob) => j.id === initialJobId)) {
            setSelectedJobId(initialJobId);
          } else if (json.data.length > 0 && !selectedJobId) {
            setSelectedJobId(json.data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load jobs", err);
        toast.error("Could not load available job openings.");
      } finally {
        setLoadingJobs(false);
      }
    }
    loadPublicJobs();
  }, [initialJobId]);

  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Resume file size must be less than 10MB");
        return;
      }
      if (!file.name.match(/\.(pdf|docx)$/i)) {
        toast.error("Only PDF and DOCX files are supported");
        return;
      }
      setResumeFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedJobId) {
      toast.error("Please select a job role to apply for.");
      return;
    }
    if (!fullName.trim()) {
      toast.error("Please enter your full name.");
      return;
    }
    if (!email.trim()) {
      toast.error("Please enter your email address.");
      return;
    }
    if (!resumeFile) {
      toast.error("Please upload your resume (PDF or DOCX).");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("jobId", selectedJobId);
      formData.append("fullName", fullName.trim());
      formData.append("email", email.trim());
      if (phone.trim()) formData.append("phone", phone.trim());
      if (linkedIn.trim()) formData.append("linkedIn", linkedIn.trim());
      if (portfolio.trim()) formData.append("portfolio", portfolio.trim());
      if (summary.trim()) formData.append("summary", summary.trim());
      formData.append("resume", resumeFile);

      const res = await fetch("/api/apply", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit application");
      }

      setSubmittedData({
        jobTitle: selectedJob?.title || "Role",
        candidateName: fullName,
        applicationId: data.applicationId || "TQ-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
      });
      setSubmitted(true);
      toast.success("Application submitted successfully!");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted && submittedData) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <div className="bg-[#111928]/80 border border-emerald-500/30 rounded-2xl p-8 md:p-12 text-center backdrop-blur-xl shadow-2xl space-y-6">
          <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 size={44} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Application Received!</h2>
            <p className="text-gray-400">
              Thank you, <span className="text-white font-medium">{submittedData.candidateName}</span>. Your application for{" "}
              <span className="text-emerald-400 font-semibold">{submittedData.jobTitle}</span> has been submitted to the recruitment team.
            </p>
          </div>

          <div className="bg-[#1e293b]/60 border border-white/5 rounded-xl p-4 max-w-sm mx-auto text-sm text-gray-300">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Application Reference</div>
            <div className="font-mono text-emerald-400 font-semibold">{submittedData.applicationId}</div>
          </div>

          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300 max-w-md mx-auto flex items-center gap-2">
            <Sparkles size={16} className="shrink-0 text-blue-400" />
            <span>Our AI screening system has received your resume and analyzed your qualifications for our hiring team.</span>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => {
                setSubmitted(false);
                setResumeFile(null);
                setFullName("");
                setEmail("");
                setPhone("");
                setLinkedIn("");
                setPortfolio("");
                setSummary("");
              }}
              className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-sm transition-all"
            >
              Submit Another Application
            </button>
            <Link
              href="/"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-sm transition-all flex items-center gap-2"
            >
              Back to Home <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
          <Sparkles size={14} /> TalentsQR Candidate Portal
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          Job Application Form
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto text-sm md:text-base">
          Submit your profile and resume. Every new position posted by our recruiters appears here automatically.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Select Position */}
        <div className="bg-[#111928]/90 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-xl space-y-4 shadow-xl">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400">
              <Briefcase size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">1. Select Position</h2>
              <p className="text-xs text-gray-400">Choose the job role you want to apply for</p>
            </div>
          </div>

          {loadingJobs ? (
            <div className="py-8 flex items-center justify-center gap-3 text-gray-400 text-sm">
              <Loader2 className="animate-spin text-blue-500" size={20} />
              Loading open positions...
            </div>
          ) : jobs.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-white/10 rounded-xl space-y-2">
              <AlertCircle size={32} className="mx-auto text-amber-400" />
              <div className="text-white font-medium">No open positions right now</div>
              <p className="text-xs text-gray-400">
                Check back soon or contact the hiring manager for new openings.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full bg-[#1e293b]/90 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                required
              >
                {jobs.map((job) => (
                  <option key={job.id} value={job.id} className="bg-[#1e293b] text-white">
                    {job.title} {job.department ? `· ${job.department}` : ""} {job.location ? `(${job.location})` : ""}
                  </option>
                ))}
              </select>

              {selectedJob && (
                <div className="bg-[#1e293b]/50 border border-white/5 rounded-xl p-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300">
                    {selectedJob.department && (
                      <span className="flex items-center gap-1">
                        <Building size={14} className="text-blue-400" /> {selectedJob.department}
                      </span>
                    )}
                    {selectedJob.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={14} className="text-blue-400" /> {selectedJob.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock size={14} className="text-blue-400" /> {selectedJob.employmentType.replace("_", " ")}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white/10 text-gray-200">
                      {selectedJob.experienceLevel} Level
                    </span>
                  </div>

                  {selectedJob.requiredSkills && selectedJob.requiredSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedJob.requiredSkills.slice(0, 6).map((skill, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
                    {selectedJob.description}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Candidate Contact Information */}
        <div className="bg-[#111928]/90 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-xl space-y-4 shadow-xl">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">2. Personal & Contact Details</h2>
              <p className="text-xs text-gray-400">Let recruiters know how to reach you</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <User size={14} /> Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Alex Johnson"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-[#1e293b]/90 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Mail size={14} /> Email Address <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                placeholder="alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1e293b]/90 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Phone size={14} /> Phone Number
              </label>
              <input
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#1e293b]/90 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Link2 size={14} /> LinkedIn Profile
              </label>
              <input
                type="url"
                placeholder="https://linkedin.com/in/alexjohnson"
                value={linkedIn}
                onChange={(e) => setLinkedIn(e.target.value)}
                className="w-full bg-[#1e293b]/90 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
              <Globe size={14} /> Portfolio / GitHub / Website
            </label>
            <input
              type="url"
              placeholder="https://github.com/alexjohnson or personal website"
              value={portfolio}
              onChange={(e) => setPortfolio(e.target.value)}
              className="w-full bg-[#1e293b]/90 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300">
              Professional Summary / Brief Note to Recruiter
            </label>
            <textarea
              rows={3}
              placeholder="Briefly describe your background, key highlights, or why you're interested in this role..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full bg-[#1e293b]/90 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>
        </div>

        {/* Step 3: Resume Upload */}
        <div className="bg-[#111928]/90 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-xl space-y-4 shadow-xl">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400">
              <Upload size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">3. Upload Resume</h2>
              <p className="text-xs text-gray-400">Upload your PDF or DOCX resume (Max 10MB)</p>
            </div>
          </div>

          <div className="border-2 border-dashed border-white/15 hover:border-emerald-500/50 rounded-2xl p-8 text-center transition-all bg-white/[0.02]">
            <input
              type="file"
              id="resume-upload"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileChange}
              className="hidden"
            />

            {resumeFile ? (
              <div className="space-y-3">
                <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
                  <FileText size={28} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{resumeFile.name}</div>
                  <div className="text-xs text-gray-400">
                    {(resumeFile.size / 1024 / 1024).toFixed(2)} MB · Ready to upload
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setResumeFile(null)}
                  className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
                >
                  Change file
                </button>
              </div>
            ) : (
              <label htmlFor="resume-upload" className="cursor-pointer space-y-3 block">
                <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto text-gray-400 hover:text-emerald-400 transition-colors">
                  <Upload size={24} />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">
                    Click to select resume or drag and drop
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Supports PDF or DOCX (up to 10MB)</div>
                </div>
                <div className="inline-block px-4 py-2 bg-emerald-600/20 text-emerald-400 text-xs font-semibold rounded-lg border border-emerald-500/30">
                  Browse Resume File
                </div>
              </label>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting || !selectedJobId || !resumeFile}
          className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:opacity-95 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Submitting & Screening Application with AI...
            </>
          ) : (
            <>
              <Sparkles size={20} />
              Submit Application
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function PublicApplicationPage() {
  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-white/10 bg-[#0b0f19]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Sparkles size={18} className="text-white" />
            </div>
            <span className="font-extrabold text-lg text-white tracking-tight">
              Talents<span className="text-blue-500">QR</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
              Candidate Portal
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="py-24 text-center text-gray-400 flex items-center justify-center gap-3">
              <Loader2 className="animate-spin text-blue-500" size={24} />
              Loading Application Portal...
            </div>
          }
        >
          <ApplicationFormContent />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 text-center text-xs text-gray-500">
        <div className="max-w-6xl mx-auto px-4">
          Powered by TalentsQR AI Recruitment Engine · Secure candidate application portal
        </div>
      </footer>
    </div>
  );
}
