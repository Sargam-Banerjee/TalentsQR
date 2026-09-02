"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, Badge, EmptyState, Skeleton, ProgressBar, Textarea } from "@/components/ui/index";
import {
  ArrowLeft, Mail, Phone, MapPin, ExternalLink, Code, Globe,
  Brain, Star, AlertTriangle, CheckCircle2, XCircle,
  Send, Clock, Sparkles, RefreshCw, Edit3
} from "lucide-react";
import { getScoreColor, getScoreBgColor, getStatusColor, getStatusLabel, getRecommendationColor, formatDate } from "@/lib/utils";
import { toast } from "sonner";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function CandidateDetailPage() {
  const params = useParams();
  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [screening, setScreening] = useState(false);

  // Candidate contact editing
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [savingContact, setSavingContact] = useState(false);

  const fetchCandidate = useCallback(async () => {
    try {
      const res = await fetch(`/api/candidates/${params.id}`);
      const data = await res.json();
      if (data.success) {
        setCandidate(data.data);
        if (data.data.email) setEditEmail(data.data.email);
        if (data.data.phone) setEditPhone(data.data.phone);
      }
    } catch { /* empty */ } finally { setLoading(false); }
  }, [params.id]);

  useEffect(() => {
    fetchCandidate();
  }, [fetchCandidate]);

  const handleAddNote = async () => {
    if (!note.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/candidates/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: note.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(
          data.message || (candidate?.email ? `Note sent & emailed to ${candidate.email}!` : "Note added")
        );
        setNote("");
        fetchCandidate();
      } else {
        toast.error(data.error || "Failed to add note");
      }
    } catch {
      toast.error("Failed to send note");
    } finally {
      setAddingNote(false);
    }
  };

  const handleStatusChange = async (applicationId: string, status: string) => {
    try {
      const res = await fetch(`/api/candidates/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, status }),
      });
      if ((await res.json()).success) {
        toast.success(`Status updated to ${getStatusLabel(status)}`);
        fetchCandidate();
      }
    } catch { toast.error("Failed to update status"); }
  };

  const handleRunScreening = async (applicationId: string) => {
    setScreening(true);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`AI Screening completed! Match score: ${data.data.overallScore}%`);
        await fetchCandidate();
      } else {
        toast.error(data.error || "AI screening failed");
      }
    } catch {
      toast.error("AI screening failed. Please check network connection.");
    } finally {
      setScreening(false);
    }
  };

  const handleSaveContact = async () => {
    setSavingContact(true);
    try {
      const res = await fetch(`/api/candidates/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updateCandidate: true,
          email: editEmail.trim() || null,
          phone: editPhone.trim() || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Contact info updated successfully!");
        setIsEditingContact(false);
        fetchCandidate();
      } else {
        toast.error(data.error || "Failed to update contact");
      }
    } catch {
      toast.error("Failed to save contact info");
    } finally {
      setSavingContact(false);
    }
  };

  if (loading) return <div className="space-y-6 p-6"><Skeleton className="h-8 w-64" /><Skeleton className="h-64 w-full" /></div>;
  if (!candidate) return <EmptyState title="Candidate not found" description="This candidate does not exist." />;

  const apps: any[] = candidate.applications || [];
  const app: any = apps[0] || {};
  const analysis: any = app.analysis || null;
  const score: any = app.score || null;
  const notes: any[] = candidate.notes || [];
  const skills: string[] = candidate.skills || [];
  const experience: any[] = candidate.experience || [];
  const education: any[] = candidate.education || [];
  const projects: any[] = candidate.projects || [];
  const certs: string[] = candidate.certifications || [];

  return (
    <div className="space-y-6 fade-in p-2 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href="/candidates"><Button variant="ghost" size="icon"><ArrowLeft size={20} /></Button></Link>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-xl font-bold text-[var(--primary)]">
              {String(candidate.fullName || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{String(candidate.fullName)}</h1>
              {app.job?.title && (
                <p className="text-sm font-medium text-[var(--primary)]">
                  Applied for: {app.job.title}
                </p>
              )}
              {candidate.summary && <p className="text-sm text-[var(--muted-foreground)] max-w-xl mt-1 line-clamp-2">{String(candidate.summary)}</p>}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {score && (
            <div className={`text-center px-4 py-2 rounded-xl ${getScoreBgColor(score.overallScore)}`}>
              <div className={`text-3xl font-bold ${getScoreColor(score.overallScore)}`}>{Math.round(score.overallScore)}%</div>
              <div className="text-xs text-[var(--muted-foreground)]">AI Match</div>
            </div>
          )}
          {analysis?.recommendation && (
            <Badge className={`text-sm px-3 py-1 ${getRecommendationColor(String(analysis.recommendation))}`}>
              {getStatusLabel(String(analysis.recommendation))}
            </Badge>
          )}

          {app.id && (
            <Button
              onClick={() => handleRunScreening(app.id)}
              loading={screening}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg flex items-center gap-1.5"
            >
              <Brain size={16} />
              {score ? "Re-Screen with AI" : "⚡ Run AI Screening"}
            </Button>
          )}
        </div>
      </div>

      {/* Status Pipeline Actions */}
      {app.id && (
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium mr-2 text-[var(--muted-foreground)]">Pipeline:</span>
            {["APPLIED","AI_SCREENED","SHORTLISTED","INTERVIEW","SELECTED","REJECTED"].map(s => (
              <Button
                key={s}
                size="sm"
                variant={app.status === s ? "primary" : "outline"}
                onClick={() => handleStatusChange(String(app.id), s)}
                className={`transition-all ${app.status === s ? "shadow-md font-semibold" : "opacity-60 hover:opacity-100"}`}
              >
                {getStatusLabel(s)}
              </Button>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Contact Card with Inline Editor */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Contact</h3>
              <button
                type="button"
                onClick={() => setIsEditingContact(!isEditingContact)}
                className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1"
              >
                <Edit3 size={12} /> {isEditingContact ? "Cancel" : "Edit"}
              </button>
            </div>

            {isEditingContact ? (
              <div className="space-y-2 pt-1 border-t border-[var(--border)]">
                <div>
                  <label className="text-[11px] text-[var(--muted-foreground)]">Email Address</label>
                  <Input
                    placeholder="candidate@example.com"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="text-xs h-8"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[var(--muted-foreground)]">Phone Number</label>
                  <Input
                    placeholder="+1 234 567 8900"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="text-xs h-8"
                  />
                </div>
                <Button
                  size="sm"
                  className="w-full h-8 text-xs mt-2"
                  onClick={handleSaveContact}
                  loading={savingContact}
                >
                  Save Contact Info
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {candidate.email ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail size={14} className="text-[var(--primary)]" />
                    <a href={`mailto:${candidate.email}`} className="hover:underline font-medium text-[var(--primary)]">{String(candidate.email)}</a>
                  </div>
                ) : (
                  <p className="text-xs text-amber-400">
                    ⚠️ No email recorded. Click Edit above to add candidate&apos;s email.
                  </p>
                )}

                {candidate.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone size={14} className="text-[var(--muted-foreground)]" />
                    <span>{String(candidate.phone)}</span>
                  </div>
                )}
                {candidate.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin size={14} className="text-[var(--muted-foreground)]" />
                    <span>{String(candidate.location)}</span>
                  </div>
                )}
                {candidate.linkedIn && (
                  <div className="flex items-center gap-2 text-sm">
                    <ExternalLink size={14} className="text-[var(--muted-foreground)]" />
                    <a href={String(candidate.linkedIn)} target="_blank" rel="noreferrer" className="hover:underline truncate">{String(candidate.linkedIn)}</a>
                  </div>
                )}
                {candidate.github && (
                  <div className="flex items-center gap-2 text-sm">
                    <Code size={14} className="text-[var(--muted-foreground)]" />
                    <a href={String(candidate.github)} target="_blank" rel="noreferrer" className="hover:underline truncate">{String(candidate.github)}</a>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Score Breakdown (if available) */}
          {score && (
            <Card className="p-5 space-y-4">
              <h3 className="font-semibold">Score Breakdown</h3>
              {[
                { label: "Technical Skills (30%)", value: score.technicalScore, explanation: score.technicalExplanation },
                { label: "Experience (20%)", value: score.experienceScore, explanation: score.experienceExplanation },
                { label: "JD Match (20%)", value: score.jdMatchScore, explanation: score.jdMatchExplanation },
                { label: "Projects (15%)", value: score.projectScore, explanation: score.projectExplanation },
                { label: "Education (10%)", value: score.educationScore, explanation: score.educationExplanation },
                { label: "Certifications (5%)", value: score.certScore, explanation: score.certExplanation },
              ].map((item) => (
                <div key={item.label}>
                  <ProgressBar value={item.value} label={item.label} size="md" />
                  {item.explanation && <p className="text-xs text-[var(--muted-foreground)] mt-1">{String(item.explanation)}</p>}
                </div>
              ))}
            </Card>
          )}

          {/* Recruiter Notes & Candidate Email */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Mail size={16} className="text-[var(--primary)]" /> Recruiter Notes & Email
              </h3>
              {candidate?.email && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium flex items-center gap-1">
                  <CheckCircle2 size={10} /> Live Delivery Active
                </span>
              )}
            </div>

            <p className="text-xs text-[var(--muted-foreground)]">
              {candidate?.email 
                ? `Notes shared here are automatically emailed directly to ${candidate.fullName} (${candidate.email}).` 
                : "Add notes regarding this candidate for internal tracking."}
            </p>

            <Textarea
              placeholder={candidate?.email ? `Write a message or update to send to ${candidate.fullName}...` : "Add a note..."}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[80px]"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
              <span className="text-[11px] text-[var(--muted-foreground)] truncate max-w-[200px]">
                {candidate?.email ? `To: ${candidate.email}` : "No email set"}
              </span>
              <Button
                size="sm"
                onClick={handleAddNote}
                loading={addingNote}
                disabled={!note.trim()}
                className="flex items-center gap-1.5 shrink-0"
              >
                <Send size={14} /> Send Note to Candidate
              </Button>
            </div>

            {notes.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-[var(--border)]">
                <div className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                  Sent Notes History ({notes.length})
                </div>
                {notes.map((n: any, i: number) => (
                  <div key={i} className="text-sm p-3 rounded-lg bg-[var(--secondary)] space-y-1">
                    <p className="text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">{String(n.content)}</p>
                    <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)] pt-1 border-t border-[var(--border)]/50">
                      <span>{n.user?.name ? String(n.user.name) : "Recruiter"} · {formatDate(n.createdAt)}</span>
                      {candidate?.email && (
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                          <CheckCircle2 size={10} /> Emailed to candidate
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* If Candidate has not been AI screened yet, display an interactive action card */}
          {!analysis && !score && (
            <Card className="p-8 text-center space-y-5 border-dashed border-2 border-[var(--primary)]/30 bg-[var(--primary)]/5">
              <div className="w-16 h-16 rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center mx-auto">
                <Brain size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-[var(--foreground)]">AI Resume Screening Pending</h3>
                <p className="text-sm text-[var(--muted-foreground)] max-w-md mx-auto">
                  Click below to trigger AI analysis. The AI will parse this candidate&apos;s resume, extract technical skills, evaluate job description match, and calculate match scores.
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => app.id && handleRunScreening(app.id)}
                loading={screening}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl px-8"
              >
                <Brain size={18} className="mr-2" />
                Run AI Screening Now
              </Button>
            </Card>
          )}

          {/* AI Summary */}
          {analysis?.summary && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3"><Brain size={18} className="text-[var(--primary)]" /><h3 className="font-semibold">AI Summary</h3></div>
              <p className="text-sm leading-relaxed">{String(analysis.summary)}</p>
            </Card>
          )}

          {/* Skills Analysis */}
          {analysis && (
            <Card className="p-5 space-y-4">
              <h3 className="font-semibold">Skills Analysis</h3>
              {analysis.matchingSkills?.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 mb-2 text-sm font-medium text-emerald-600 dark:text-emerald-400"><CheckCircle2 size={14} /> Matching Skills</div>
                  <div className="flex flex-wrap gap-1.5">{analysis.matchingSkills.map((s: string, i: number) => <Badge key={i} className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">{s}</Badge>)}</div>
                </div>
              )}
              {analysis.missingSkills?.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 mb-2 text-sm font-medium text-red-600 dark:text-red-400"><XCircle size={14} /> Missing Skills</div>
                  <div className="flex flex-wrap gap-1.5">{analysis.missingSkills.map((s: string, i: number) => <Badge key={i} className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">{s}</Badge>)}</div>
                </div>
              )}
              {analysis.additionalSkills?.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 mb-2 text-sm font-medium text-blue-600 dark:text-blue-400"><Star size={14} /> Additional Skills</div>
                  <div className="flex flex-wrap gap-1.5">{analysis.additionalSkills.map((s: string, i: number) => <Badge key={i}>{s}</Badge>)}</div>
                </div>
              )}
            </Card>
          )}

          {/* Strengths & Weaknesses */}
          {analysis && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.strengths?.length > 0 && (
                <Card className="p-5">
                  <h3 className="font-semibold mb-3 flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Strengths</h3>
                  <ul className="space-y-2">{analysis.strengths.map((s: string, i: number) => <li key={i} className="text-sm flex items-start gap-2"><span className="text-emerald-500 mt-0.5">•</span>{s}</li>)}</ul>
                </Card>
              )}
              {analysis.weaknesses?.length > 0 && (
                <Card className="p-5">
                  <h3 className="font-semibold mb-3 flex items-center gap-2"><AlertTriangle size={16} className="text-amber-500" /> Areas for Improvement</h3>
                  <ul className="space-y-2">{analysis.weaknesses.map((s: string, i: number) => <li key={i} className="text-sm flex items-start gap-2"><span className="text-amber-500 mt-0.5">•</span>{s}</li>)}</ul>
                </Card>
              )}
            </div>
          )}

          {/* Experience */}
          {experience.length > 0 && (
            <Card className="p-5">
              <h3 className="font-semibold mb-3">Experience</h3>
              <div className="space-y-4">{experience.map((exp: any, i: number) => (
                <div key={i} className="border-l-2 border-[var(--border)] pl-4">
                  <div className="font-medium text-sm">{String(exp.title)}</div>
                  <div className="text-sm text-[var(--muted-foreground)]">{String(exp.company)}</div>
                  <div className="text-xs text-[var(--muted-foreground)] flex items-center gap-1"><Clock size={12} />{String(exp.duration)}</div>
                  {exp.description && <p className="text-xs text-[var(--muted-foreground)] mt-1">{String(exp.description)}</p>}
                </div>
              ))}</div>
            </Card>
          )}

          {/* Education */}
          {education.length > 0 && (
            <Card className="p-5">
              <h3 className="font-semibold mb-3">Education</h3>
              <div className="space-y-3">{education.map((edu: any, i: number) => (
                <div key={i}>
                  <div className="font-medium text-sm">{String(edu.degree)}{edu.field ? ` in ${String(edu.field)}` : ""}</div>
                  <div className="text-sm text-[var(--muted-foreground)]">{String(edu.institution)}{edu.year ? ` · ${String(edu.year)}` : ""}</div>
                </div>
              ))}</div>
            </Card>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <Card className="p-5">
              <h3 className="font-semibold mb-3">Projects</h3>
              <div className="space-y-3">{projects.map((p: any, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-[var(--secondary)]">
                  <div className="font-medium text-sm">{String(p.name)}</div>
                  {p.description && <p className="text-xs text-[var(--muted-foreground)] mt-1">{String(p.description)}</p>}
                  {p.technologies?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">{p.technologies.map((t: string, j: number) => <Badge key={j} className="text-[10px]">{t}</Badge>)}</div>
                  )}
                </div>
              ))}</div>
            </Card>
          )}

          {/* Certifications */}
          {certs.length > 0 && (
            <Card className="p-5">
              <h3 className="font-semibold mb-3">Certifications</h3>
              <div className="flex flex-wrap gap-2">{certs.map((c: string, i: number) => <Badge key={i}>{c}</Badge>)}</div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
