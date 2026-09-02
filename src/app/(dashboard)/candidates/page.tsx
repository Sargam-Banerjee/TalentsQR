"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, Badge, EmptyState, Skeleton } from "@/components/ui/index";
import { Search, Users, Brain, Filter, ArrowUpDown } from "lucide-react";
import { getScoreColor, getStatusColor, getStatusLabel, formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface CandidateItem {
  applicationId: string;
  id: string;
  fullName: string;
  email: string | null;
  location: string | null;
  skills: string[];
  jobId: string;
  jobTitle: string;
  status: string;
  score: number;
  matchPercentage: number;
  recommendation: string | null;
  appliedAt: string;
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    async function fetchCandidates() {
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (statusFilter) params.set("status", statusFilter);
        params.set("sortBy", sortBy);

        const res = await fetch(`/api/candidates?${params}`);
        const data = await res.json();
        if (data.success) {
          setCandidates(data.data);
        }
      } catch {
        console.error("Failed to load candidates");
      } finally {
        setLoading(false);
      }
    }
    fetchCandidates();
  }, [search, statusFilter, sortBy]);

  const handleStatusChange = async (applicationId: string, candidateId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/candidates/${candidateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Candidate ${getStatusLabel(newStatus).toLowerCase()}`);
        setCandidates(prev => prev.map(c => 
          c.applicationId === applicationId ? { ...c, status: newStatus } : c
        ));
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold">Candidates</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Manage and review all candidates across your jobs
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by name, email, or skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search size={16} />}
          />
        </div>
        <select
          className="h-10 px-3 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="APPLIED">Applied</option>
          <option value="AI_SCREENED">AI Screened</option>
          <option value="SHORTLISTED">Shortlisted</option>
          <option value="INTERVIEW">Interview</option>
          <option value="SELECTED">Selected</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <select
          className="h-10 px-3 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="score_desc">Highest Score</option>
          <option value="score_asc">Lowest Score</option>
        </select>
      </div>

      {/* Candidates */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex gap-4 items-center">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-8 w-16" />
              </div>
            </Card>
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <EmptyState
          icon={<Users size={32} />}
          title="No candidates found"
          description={search || statusFilter ? "Try adjusting your filters." : "Upload resumes to start screening candidates."}
          action={
            <Link href="/screening">
              <Button>Upload Resumes</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-2">
          {/* Table Header */}
          <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
            <div className="col-span-3">Candidate</div>
            <div className="col-span-2">Job</div>
            <div className="col-span-1 text-center">Score</div>
            <div className="col-span-2">Skills</div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-1">Date</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {candidates.map((candidate) => (
            <Card key={candidate.applicationId} className="p-4 hover:shadow-sm transition-shadow">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                {/* Candidate info */}
                <div className="col-span-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-xs font-bold text-[var(--primary)]">
                    {candidate.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <Link href={`/candidates/${candidate.id}`} className="hover:underline">
                      <div className="text-sm font-medium truncate">{candidate.fullName}</div>
                    </Link>
                    <div className="text-xs text-[var(--muted-foreground)] truncate">{candidate.email || "No email"}</div>
                  </div>
                </div>

                {/* Job */}
                <div className="col-span-2 text-sm text-[var(--muted-foreground)] truncate">
                  <Link href={`/jobs/${candidate.jobId}`} className="hover:underline">
                    {candidate.jobTitle}
                  </Link>
                </div>

                {/* Score */}
                <div className="col-span-1 text-center">
                  {candidate.score > 0 ? (
                    <span className={`text-lg font-bold ${getScoreColor(candidate.score)}`}>
                      {Math.round(candidate.score)}
                    </span>
                  ) : (
                    <span className="text-sm text-[var(--muted-foreground)]">—</span>
                  )}
                </div>

                {/* Skills */}
                <div className="col-span-2">
                  <div className="flex flex-wrap gap-1">
                    {candidate.skills.slice(0, 3).map((skill, i) => (
                      <Badge key={i} className="text-[10px] px-1.5 py-0">{skill}</Badge>
                    ))}
                    {candidate.skills.length > 3 && (
                      <Badge className="text-[10px] px-1.5 py-0">+{candidate.skills.length - 3}</Badge>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-1 text-center">
                  <Badge className={getStatusColor(candidate.status)}>
                    {getStatusLabel(candidate.status)}
                  </Badge>
                </div>

                {/* Date */}
                <div className="col-span-1 text-xs text-[var(--muted-foreground)]">
                  {formatDate(candidate.appliedAt)}
                </div>

                {/* Actions */}
                <div className="col-span-2 flex justify-end gap-1">
                  <Link href={`/candidates/${candidate.id}`}>
                    <Button variant="ghost" size="sm">View</Button>
                  </Link>
                  {candidate.status !== "SHORTLISTED" && candidate.status !== "SELECTED" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-emerald-600"
                      onClick={() => handleStatusChange(candidate.applicationId, candidate.id, "SHORTLISTED")}
                    >
                      Shortlist
                    </Button>
                  )}
                  {candidate.status !== "REJECTED" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500"
                      onClick={() => handleStatusChange(candidate.applicationId, candidate.id, "REJECTED")}
                    >
                      Reject
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
