"use client";

import { useEffect, useState } from "react";
import { Card, Skeleton, EmptyState } from "@/components/ui/index";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/index";
import {
  Briefcase,
  Users,
  FileSearch,
  UserCheck,
  Calendar,
  Star,
  TrendingUp,
  Brain,
  ArrowRight,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { getScoreColor, getStatusColor, getStatusLabel, formatDate } from "@/lib/utils";
import type { DashboardStats, RecentCandidate, AIInsight } from "@/types";

interface DashboardData {
  stats: DashboardStats;
  recentCandidates: RecentCandidate[];
  activeJobs: { id: string; title: string; candidates: number; shortlisted: number; status: string; createdAt: string }[];
  funnelData: { stage: string; count: number }[];
  scoreDistribution: { range: string; count: number }[];
  aiInsights: AIInsight[];
}

function StatCard({ title, value, icon, trend, color }: {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: string;
  color: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--muted-foreground)]">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {trend && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
              <TrendingUp size={12} />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-xl ${color}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-5">
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-8 w-16" />
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6"><Skeleton className="h-64 w-full" /></Card>
        <Card className="p-6"><Skeleton className="h-64 w-full" /></Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/analytics/dashboard");
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) return <DashboardSkeleton />;

  const stats = data?.stats || {
    totalJobs: 0,
    totalCandidates: 0,
    candidatesScreened: 0,
    shortlisted: 0,
    interviews: 0,
    selected: 0,
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Overview of your recruitment activity
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/jobs/new">
            <Button>
              <Plus size={16} />
              Create Job
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Jobs"
          value={stats.totalJobs}
          icon={<Briefcase size={20} className="text-blue-600 dark:text-blue-400" />}
          color="bg-blue-100 dark:bg-blue-900/30"
        />
        <StatCard
          title="Total Candidates"
          value={stats.totalCandidates}
          icon={<Users size={20} className="text-purple-600 dark:text-purple-400" />}
          color="bg-purple-100 dark:bg-purple-900/30"
        />
        <StatCard
          title="AI Screened"
          value={stats.candidatesScreened}
          icon={<FileSearch size={20} className="text-indigo-600 dark:text-indigo-400" />}
          color="bg-indigo-100 dark:bg-indigo-900/30"
        />
        <StatCard
          title="Shortlisted"
          value={stats.shortlisted}
          icon={<Star size={20} className="text-amber-600 dark:text-amber-400" />}
          color="bg-amber-100 dark:bg-amber-900/30"
        />
        <StatCard
          title="Interviews"
          value={stats.interviews}
          icon={<Calendar size={20} className="text-emerald-600 dark:text-emerald-400" />}
          color="bg-emerald-100 dark:bg-emerald-900/30"
        />
        <StatCard
          title="Selected"
          value={stats.selected}
          icon={<UserCheck size={20} className="text-green-600 dark:text-green-400" />}
          color="bg-green-100 dark:bg-green-900/30"
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hiring Funnel */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Hiring Funnel</h3>
          {data?.funnelData && data.funnelData.length > 0 ? (
            <div className="space-y-3">
              {data.funnelData.map((stage, i) => {
                const maxCount = Math.max(...data.funnelData.map(s => s.count), 1);
                const width = (stage.count / maxCount) * 100;
                const colors = ["bg-blue-500", "bg-indigo-500", "bg-purple-500", "bg-amber-500", "bg-emerald-500", "bg-red-400"];
                return (
                  <div key={stage.stage} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{stage.stage}</span>
                      <span className="font-medium">{stage.count}</span>
                    </div>
                    <div className="h-6 bg-[var(--secondary)] rounded-lg overflow-hidden">
                      <div
                        className={`h-full rounded-lg transition-all duration-500 ${colors[i % colors.length]}`}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No pipeline data yet"
              description="Upload resumes and run AI screening to see your hiring funnel."
            />
          )}
        </Card>

        {/* Score Distribution */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Candidate Score Distribution</h3>
          {data?.scoreDistribution && data.scoreDistribution.some(d => d.count > 0) ? (
            <div className="flex items-end gap-2 h-48">
              {data.scoreDistribution.map((bucket) => {
                const maxCount = Math.max(...data.scoreDistribution.map(b => b.count), 1);
                const height = (bucket.count / maxCount) * 100;
                return (
                  <div key={bucket.range} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-medium">{bucket.count}</span>
                    <div className="w-full bg-[var(--secondary)] rounded-t-lg relative" style={{ height: "160px" }}>
                      <div
                        className="absolute bottom-0 w-full bg-[var(--primary)] rounded-t-lg transition-all duration-500"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className="text-xs text-[var(--muted-foreground)]">{bucket.range}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No scores yet"
              description="AI-scored candidates will appear here."
            />
          )}
        </Card>
      </div>

      {/* Recent Candidates & Active Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Candidates */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent Candidates</h3>
            <Link href="/candidates">
              <Button variant="ghost" size="sm">
                View All <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
          {data?.recentCandidates && data.recentCandidates.length > 0 ? (
            <div className="space-y-3">
              {data.recentCandidates.slice(0, 5).map((candidate) => (
                <Link key={candidate.id} href={`/candidates/${candidate.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--secondary)] transition-colors cursor-pointer">
                    <div className="w-9 h-9 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-xs font-bold text-[var(--primary)]">
                      {candidate.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{candidate.name}</div>
                      <div className="text-xs text-[var(--muted-foreground)] truncate">{candidate.jobTitle}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${getScoreColor(candidate.score)}`}>
                        {candidate.score > 0 ? candidate.score : "—"}
                      </div>
                      <Badge className={getStatusColor(candidate.status)}>
                        {getStatusLabel(candidate.status)}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Users size={24} />}
              title="No candidates yet"
              description="Upload resumes to start screening candidates."
              action={
                <Link href="/screening">
                  <Button size="sm">Upload Resumes</Button>
                </Link>
              }
            />
          )}
        </Card>

        {/* Active Jobs */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Active Jobs</h3>
            <Link href="/jobs">
              <Button variant="ghost" size="sm">
                View All <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
          {data?.activeJobs && data.activeJobs.length > 0 ? (
            <div className="space-y-3">
              {data.activeJobs.slice(0, 5).map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--secondary)] transition-colors cursor-pointer">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Briefcase size={16} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{job.title}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">
                        {job.candidates} candidates · {job.shortlisted} shortlisted
                      </div>
                    </div>
                    <Badge className={getStatusColor(job.status)}>
                      {getStatusLabel(job.status)}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Briefcase size={24} />}
              title="No jobs yet"
              description="Create your first job to begin screening candidates."
              action={
                <Link href="/jobs/new">
                  <Button size="sm"><Plus size={14} /> Create Job</Button>
                </Link>
              }
            />
          )}
        </Card>
      </div>

      {/* AI Insights */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain size={20} className="text-[var(--primary)]" />
          <h3 className="font-semibold">AI Insights</h3>
        </div>
        {data?.aiInsights && data.aiInsights.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.aiInsights.map((insight) => (
              <div
                key={insight.id}
                className={`p-4 rounded-lg border ${
                  insight.type === "success"
                    ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800"
                    : insight.type === "warning"
                    ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800"
                    : "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800"
                }`}
              >
                <p className="text-sm">{insight.message}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--muted-foreground)]">
            AI insights will appear here once you have candidates analyzed.
          </p>
        )}
      </Card>
    </div>
  );
}
