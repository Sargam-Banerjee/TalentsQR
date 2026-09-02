"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, Textarea, Select } from "@/components/ui/index";
import { ArrowLeft, Plus, X, Brain, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function NewJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    department: "",
    location: "",
    employmentType: "FULL_TIME",
    experienceLevel: "MID",
    salaryMin: "",
    salaryMax: "",
    description: "",
    responsibilities: "",
    qualifications: "",
    educationReq: "",
    experienceReq: "",
  });
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [preferredSkills, setPreferredSkills] = useState<string[]>([]);
  const [newRequiredSkill, setNewRequiredSkill] = useState("");
  const [newPreferredSkill, setNewPreferredSkill] = useState("");

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addSkill = (type: "required" | "preferred") => {
    if (type === "required" && newRequiredSkill.trim()) {
      setRequiredSkills([...requiredSkills, newRequiredSkill.trim()]);
      setNewRequiredSkill("");
    } else if (type === "preferred" && newPreferredSkill.trim()) {
      setPreferredSkills([...preferredSkills, newPreferredSkill.trim()]);
      setNewPreferredSkill("");
    }
  };

  const removeSkill = (type: "required" | "preferred", index: number) => {
    if (type === "required") {
      setRequiredSkills(requiredSkills.filter((_, i) => i !== index));
    } else {
      setPreferredSkills(preferredSkills.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error("Title and description are required");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          requiredSkills,
          preferredSkills,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Job created successfully!");
        router.push("/jobs");
        router.refresh();
      } else {
        toast.error(data.error || "Failed to create job");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create job");
    } finally {
      setLoading(false);
    }
  };

  const generateDescriptionWithAI = async () => {
    if (!formData.title.trim()) {
      toast.error("Please enter a job title first");
      return;
    }
    
    setGeneratingDesc(true);
    try {
      const res = await fetch("/api/ai/generate-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          department: formData.department,
          location: formData.location,
          employmentType: formData.employmentType,
          experienceLevel: formData.experienceLevel,
          requiredSkills,
          preferredSkills
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setFormData(prev => ({ ...prev, description: data.description }));
      toast.success("Job description generated with AI!");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate description");
    } finally {
      setGeneratingDesc(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in">
      <div className="flex items-center gap-4">
        <Link href="/jobs">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Create New Job</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Add a new job posting to start screening candidates
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card className="p-6 space-y-5">
          <h2 className="text-lg font-semibold">Basic Information</h2>
          <Input
            label="Job Title *"
            placeholder="e.g., Senior Frontend Developer"
            value={formData.title}
            onChange={(e) => handleChange("title", e.target.value)}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Department"
              placeholder="e.g., Engineering"
              value={formData.department}
              onChange={(e) => handleChange("department", e.target.value)}
            />
            <Input
              label="Location"
              placeholder="e.g., Remote, New York, NY"
              value={formData.location}
              onChange={(e) => handleChange("location", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Employment Type"
              value={formData.employmentType}
              onChange={(e) => handleChange("employmentType", e.target.value)}
              options={[
                { value: "FULL_TIME", label: "Full Time" },
                { value: "PART_TIME", label: "Part Time" },
                { value: "CONTRACT", label: "Contract" },
                { value: "INTERNSHIP", label: "Internship" },
                { value: "FREELANCE", label: "Freelance" },
              ]}
            />
            <Select
              label="Experience Level"
              value={formData.experienceLevel}
              onChange={(e) => handleChange("experienceLevel", e.target.value)}
              options={[
                { value: "ENTRY", label: "Entry Level" },
                { value: "MID", label: "Mid Level" },
                { value: "SENIOR", label: "Senior" },
                { value: "LEAD", label: "Lead" },
                { value: "EXECUTIVE", label: "Executive" },
              ]}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Minimum Salary"
              type="number"
              placeholder="e.g., 80000"
              value={formData.salaryMin}
              onChange={(e) => handleChange("salaryMin", e.target.value)}
            />
            <Input
              label="Maximum Salary"
              type="number"
              placeholder="e.g., 120000"
              value={formData.salaryMax}
              onChange={(e) => handleChange("salaryMax", e.target.value)}
            />
          </div>
        </Card>

        {/* Description */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Job Description</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generateDescriptionWithAI}
              disabled={generatingDesc || !formData.title}
              className="text-primary border-primary hover:bg-primary/10 transition-colors"
            >
              {generatingDesc ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Brain className="w-4 h-4 mr-2" />
              )}
              Generate with AI
            </Button>
          </div>
          <Textarea
            label="Description *"
            placeholder="Paste your full job description here..."
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
            className="min-h-[200px]"
            required
          />
          <Textarea
            label="Responsibilities"
            placeholder="Key responsibilities for this role..."
            value={formData.responsibilities}
            onChange={(e) => handleChange("responsibilities", e.target.value)}
          />
          <Textarea
            label="Qualifications"
            placeholder="Required qualifications..."
            value={formData.qualifications}
            onChange={(e) => handleChange("qualifications", e.target.value)}
          />
        </Card>

        {/* Skills */}
        <Card className="p-6 space-y-5">
          <h2 className="text-lg font-semibold">Skills</h2>

          {/* Required Skills */}
          <div>
            <label className="block text-sm font-medium mb-2">Required Skills</label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="e.g., React"
                value={newRequiredSkill}
                onChange={(e) => setNewRequiredSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill("required"))}
              />
              <Button type="button" variant="outline" onClick={() => addSkill("required")}>
                <Plus size={16} />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {requiredSkills.map((skill, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm">
                  {skill}
                  <button type="button" onClick={() => removeSkill("required", i)} className="hover:text-red-500">
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Preferred Skills */}
          <div>
            <label className="block text-sm font-medium mb-2">Preferred Skills</label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="e.g., TypeScript"
                value={newPreferredSkill}
                onChange={(e) => setNewPreferredSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill("preferred"))}
              />
              <Button type="button" variant="outline" onClick={() => addSkill("preferred")}>
                <Plus size={16} />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {preferredSkills.map((skill, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm">
                  {skill}
                  <button type="button" onClick={() => removeSkill("preferred", i)} className="hover:text-red-500">
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </Card>

        {/* Requirements */}
        <Card className="p-6 space-y-5">
          <h2 className="text-lg font-semibold">Requirements</h2>
          <Input
            label="Education Requirement"
            placeholder="e.g., Bachelor's in Computer Science or related field"
            value={formData.educationReq}
            onChange={(e) => handleChange("educationReq", e.target.value)}
          />
          <Input
            label="Experience Requirement"
            placeholder="e.g., 3+ years of frontend development experience"
            value={formData.experienceReq}
            onChange={(e) => handleChange("experienceReq", e.target.value)}
          />
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link href="/jobs">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" loading={loading}>
            Create Job
          </Button>
        </div>
      </form>
    </div>
  );
}
