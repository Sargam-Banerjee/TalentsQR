"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, Badge, EmptyState, Skeleton, ProgressBar } from "@/components/ui/index";
import {
  ArrowLeft, Edit, Archive, Upload, Users, MapPin, Briefcase,
  Clock, DollarSign, GraduationCap, Star, Brain, Play, Loader2,
} from "lucide-react";
import { getStatusColor, getStatusLabel, getScoreColor, formatDate } from "@/lib/utils";
import { toast } from "sonner";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [screeningAll, setScreeningAll] = useState(false);

  const fetchJob = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs/${params.id}`);
      const data = await res.json();
      if (data.success) {
        setJob(data.data);
      } else {
        toast.error("Job not found");
        router.push("/jobs");
      }
    } catch {
      toast.error("Failed to load job");
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const handleAnalyze = async (applicationId: string) => {
    setAnalyzing(applicationId);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Analysis complete! Score: ${data.data.overallScore}`);
        fetchJob();
      } else {
        toast.error(data.error || "Analysis failed");
      }
    } catch {
      toast.error("AI analysis failed. Please try again.");
    } finally {
      setAnalyzing(null);
    }
  };

  const handleScreenAll = async () => {
    if (!job) return;
    const apps = (job.applications as Array<{ id: string; status: string }>)
      .filter(a => a.status === "APPLIED");
    
    if (apps.length === 0) {
      toast.info("No unscreened candidates to analyze");
      return;
    }

    setScreeningAll(true);
    let completed = 0;

    for (const app of apps) {
      try {
        await fetch("/api/ai/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ applicationId: app.id }),
        });
        completed++;
        toast.success(`Analyzed ${completed}/${apps.length} candidates`);
      } catch {
        toast.error(`Failed to analyze a candidate`);
      }
    }

    setScreeningAll(false);
    fetchJob();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><Card className="p-6"><Skeleton className="h-48 w-full" /></Card></div>
          <Card className="p-6"><Skeleton className="h-48 w-full" /></Card>
        </div>
      </div>
    );
  }

  if (!job) return null;

  const applications = (job.applications || []) as Array<{
    id: string;
    status: string;
    candidateId: string;
    candidate: { id: string; fullName: string; email: string; skills: string };
    score: { overallScore: number; jdMatchScore: number } | null;
    analysis: { recommendation: string } | null;
    appliedAt: string;
  }>;

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href="/jobs">
            <Button variant="ghost" size="icon"><ArrowLeft size={20} /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{job.title as string}</h1>
              <Badge className={getStatusColor(job.status as string)}>
                {getStatusLabel(job.status as string)}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-[var(--muted-foreground)]">
              {job.location && <span className="flex items-center gap-1"><MapPin size={14} />{job.location as string}</span>}
              {job.department && <span className="flex items-center gap-1"><Briefcase size={14} />{job.department as string}</span>}
              <span className="flex items-center gap-1"><Clock size={14} />{formatDate(job.createdAt as string)}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/jobs/${params.id}/edit`}>
            <Button variant="outline"><Edit size={16} /> Edit</Button>
          </Link>
          <Link href={`/screening?jobId=${params.id}`}>
            <Button><Upload size={16} /> Upload Resumes</Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold">{applications.length}</div>
          <div className="text-xs text-[var(--muted-foreground)]">Candidates</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold">{applications.filter(a => a.status !== "APPLIED").length}</div>
          <div className="text-xs text-[var(--muted-foreground)]">Screened</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold">{applications.filter(a => a.status === "SHORTLISTED").length}</div>
          <div className="text-xs text-[var(--muted-foreground)]">Shortlisted</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold">
            {applications.filter(a => a.score).length > 0
              ? Math.round(applications.filter(a => a.score).reduce((s, a) => s + (a.score?.overallScore || 0), 0) / applications.filter(a => a.score).length)
              : "—"}
          </div>
          <div className="text-xs text-[var(--muted-foreground)]">Avg Score</div>
        </Card>
      </div>

      {/* AI Screening Action */}
      {applications.filter(a => a.status === "APPLIED").length > 0 && (
        <Card className="p-4 bg-[var(--primary)]/5 border-[var(--primary)]/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain size={20} className="text-[var(--primary)]" />
              <div>
                <p className="font-medium">AI Screening Available</p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {applications.filter(a => a.status === "APPLIED").length} candidates ready for AI analysis
                </p>
              </div>
            </div>
            <Button onClick={handleScreenAll} loading={screeningAll} disabled={screeningAll}>
              <Play size={16} />
              Screen All Candidates
            </Button>
          </div>
        </Card>
      )}

      {/* Job Details & Candidates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Job Info */}
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold">Job Details</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[var(--muted-foreground)]">Type</span>
              <span>{getStatusLabel(job.employmentType as string)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--muted-foreground)]">Level</span>
              <span>{getStatusLabel(job.experienceLevel as string)}</span>
            </div>
            {(job.salaryMin || job.salaryMax) && (
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted-foreground)]">Salary</span>
                <span className="flex items-center gap-1">
                  <DollarSign size={14} />
                  {job.salaryMin && `${Number(job.salaryMin).toLocaleString()}`}
                  {job.salaryMin && job.salaryMax && " - "}
                  {job.salaryMax && `${Number(job.salaryMax).toLocaleString()}`}
                </span>
              </div>
            )}
          </div>

          {(job.requiredSkills as string[])?.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Required Skills</h4>
              <div className="flex flex-wrap gap-1.5">
                {(job.requiredSkills as string[]).map((s: string, i: number) => (
                  <Badge key={i} className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">{s}</Badge>
                ))}
              </div>
            </div>
          )}

          {(job.preferredSkills as string[])?.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Preferred Skills</h4>
              <div className="flex flex-wrap gap-1.5">
                {(job.preferredSkills as string[]).map((s: string, i: number) => (
                  <Badge key={i} className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">{s}</Badge>
                ))}
              </div>
            </div>
          )}

          {job.description && (
            <div>
              <h4 className="text-sm font-medium mb-2">Description</h4>
              <p className="text-sm text-[var(--muted-foreground)] whitespace-pre-wrap line-clamp-6">
                {job.description as string}
              </p>
            </div>
          )}
        </Card>

        {/* Candidates */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Candidates ({applications.length})</h3>
            {applications.length === 0 ? (
              <EmptyState
                icon={<Users size={24} />}
                title="No candidates yet"
                description="Upload resumes to start screening candidates for this job."
                action={
                  <Link href={`/screening?jobId=${params.id}`}>
                    <Button size="sm"><Upload size={14} /> Upload Resumes</Button>
                  </Link>
                }
              />
            ) : (
              <div className="space-y-3">
                {applications
                  .sort((a, b) => (b.score?.overallScore || 0) - (a.score?.overallScore || 0))
                  .map((app) => (
                  <div key={app.id} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] hover:bg-[var(--secondary)]/50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-xs font-bold text-[var(--primary)]">
                      {app.candidate.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/candidates/${app.candidate.id}`} className="hover:underline">
                        <div className="text-sm font-medium truncate">{app.candidate.fullName}</div>
                      </Link>
                      <div className="text-xs text-[var(--muted-foreground)]">{app.candidate.email || "No email"}</div>
                    </div>
                    {app.score ? (
                      <div className="text-right">
                        <div className={`text-lg font-bold ${getScoreColor(app.score.overallScore)}`}>
                          {Math.round(app.score.overallScore)}
                        </div>
                        <Badge className={getStatusColor(app.status)}>
                          {getStatusLabel(app.status)}
                        </Badge>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAnalyze(app.id)}
                        loading={analyzing === app.id}
                        disabled={analyzing !== null}
                      >
                        {analyzing === app.id ? <Loader2 size={14} className="animate-spin" /> : <Brain size={14} />}
                        Analyze
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
