"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, Badge, EmptyState, Skeleton } from "@/components/ui/index";
import {
  Plus,
  Search,
  Briefcase,
  MapPin,
  Users,
  Clock,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Archive,
  Copy,
} from "lucide-react";
import { getStatusColor, getStatusLabel, formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface JobItem {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  employmentType: string;
  experienceLevel: string;
  status: string;
  candidateCount: number;
  shortlistedCount: number;
  avgScore: number;
  createdAt: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      
      const res = await fetch(`/api/jobs?${params}`);
      const data = await res.json();
      if (data.success) {
        setJobs(data.data);
      }
    } catch (err) {
      console.error("Failed to load jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [search, statusFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this job? This action cannot be undone.")) return;
    
    try {
      const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Job deleted successfully");
        setJobs(jobs.filter(j => j.id !== id));
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Failed to delete job");
    }
    setOpenMenu(null);
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Job ${status.toLowerCase()}`);
        setJobs(jobs.map(j => j.id === id ? { ...j, status } : j));
      }
    } catch {
      toast.error("Failed to update job");
    }
    setOpenMenu(null);
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/jobs/${id}`);
      const data = await res.json();
      if (data.success) {
        const job = data.data;
        const createRes = await fetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `${job.title} (Copy)`,
            department: job.department,
            location: job.location,
            employmentType: job.employmentType,
            experienceLevel: job.experienceLevel,
            description: job.description,
            responsibilities: job.responsibilities,
            qualifications: job.qualifications,
            requiredSkills: job.requiredSkills,
            preferredSkills: job.preferredSkills,
            status: "DRAFT",
          }),
        });
        const createData = await createRes.json();
        if (createData.success) {
          toast.success("Job duplicated");
          fetchJobs();
        }
      }
    } catch {
      toast.error("Failed to duplicate job");
    }
    setOpenMenu(null);
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Jobs</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Manage your job postings and view candidate applications
          </p>
        </div>
        <Link href="/jobs/new">
          <Button>
            <Plus size={16} />
            Create Job
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search jobs..."
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
          <option value="ACTIVE">Active</option>
          <option value="DRAFT">Draft</option>
          <option value="PAUSED">Paused</option>
          <option value="CLOSED">Closed</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {/* Jobs List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-5">
              <div className="flex gap-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={32} />}
          title="No jobs yet"
          description="Create your first job to begin screening candidates."
          action={
            <Link href="/jobs/new">
              <Button><Plus size={16} /> Create Your First Job</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Card key={job.id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <Briefcase size={22} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/jobs/${job.id}`} className="hover:underline">
                      <h3 className="font-semibold text-lg">{job.title}</h3>
                    </Link>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-sm text-[var(--muted-foreground)]">
                      {job.department && (
                        <span className="flex items-center gap-1">
                          <Briefcase size={14} />
                          {job.department}
                        </span>
                      )}
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {job.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users size={14} />
                        {job.candidateCount} candidates
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {formatDate(job.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-medium">{job.shortlistedCount} shortlisted</div>
                    {job.avgScore > 0 && (
                      <div className="text-xs text-[var(--muted-foreground)]">Avg score: {job.avgScore}</div>
                    )}
                  </div>
                  <Badge className={getStatusColor(job.status)}>
                    {getStatusLabel(job.status)}
                  </Badge>
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === job.id ? null : job.id)}
                      className="p-2 rounded-lg hover:bg-[var(--secondary)] transition-colors"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                    {openMenu === job.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                        <div className="absolute right-0 top-full mt-1 w-48 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 py-1">
                          <Link href={`/jobs/${job.id}`} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--secondary)]" onClick={() => setOpenMenu(null)}>
                            <Eye size={14} /> View Details
                          </Link>
                          <Link href={`/jobs/${job.id}/edit`} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--secondary)]" onClick={() => setOpenMenu(null)}>
                            <Edit size={14} /> Edit
                          </Link>
                          <button onClick={() => handleDuplicate(job.id)} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--secondary)]">
                            <Copy size={14} /> Duplicate
                          </button>
                          {job.status === "ACTIVE" ? (
                            <button onClick={() => handleStatusChange(job.id, "ARCHIVED")} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--secondary)]">
                              <Archive size={14} /> Archive
                            </button>
                          ) : (
                            <button onClick={() => handleStatusChange(job.id, "ACTIVE")} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--secondary)]">
                              <Eye size={14} /> Activate
                            </button>
                          )}
                          <button onClick={() => handleDelete(job.id)} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--secondary)] text-red-500">
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
