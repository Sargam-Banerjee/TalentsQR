"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Users,
  Target,
  BarChart3,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Zap,
  Shield,
  Upload,
  Search,
  ChevronRight,
  Star,
  TrendingUp,
  FileText,
  MessageSquare,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center">
                <Sparkles size={18} className="text-white" />
              </div>
              <span className="text-xl font-bold">
                Talents<span className="text-[var(--primary)]">QR</span>
              </span>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">How It Works</a>
              <a href="#stats" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">Results</a>
              <ThemeToggle />
              <Link href="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-[var(--secondary)]"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-[var(--border)] py-4 space-y-2 fade-in">
              <a href="#features" className="block px-3 py-2 text-sm rounded-lg hover:bg-[var(--secondary)]">Features</a>
              <a href="#how-it-works" className="block px-3 py-2 text-sm rounded-lg hover:bg-[var(--secondary)]">How It Works</a>
              <div className="flex gap-2 pt-2">
                <Link href="/login" className="flex-1"><Button variant="outline" className="w-full">Sign In</Button></Link>
                <Link href="/register" className="flex-1"><Button className="w-full">Get Started</Button></Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 hero-gradient overflow-hidden">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-sm font-medium mb-8">
            <Zap size={14} />
            AI-Powered Recruitment Intelligence
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-balance">
            Hire Smarter. Screen Faster.{" "}
            <span className="gradient-text">Find the Right Talent.</span>
          </h1>

          <p className="text-lg sm:text-xl text-[var(--muted-foreground)] max-w-3xl mx-auto mb-10 text-balance">
            Upload a job description and candidate resumes. TalentsQR&apos;s AI instantly transforms 
            unstructured resumes into ranked, explainable candidate insights — saving hours of manual screening.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="text-base px-8">
                Start Screening Candidates
                <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="text-base px-8">
                Explore Demo
              </Button>
            </Link>
          </div>

          {/* Product Preview */}
          <div className="mt-16 max-w-5xl mx-auto">
            <div className="card p-2 sm:p-4 shadow-2xl border-[var(--border)]">
              <div className="bg-[var(--secondary)] rounded-lg p-4 sm:p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Dashboard Preview Card */}
                  <div className="card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[var(--muted-foreground)]">CANDIDATES SCREENED</span>
                      <TrendingUp size={14} className="text-emerald-500" />
                    </div>
                    <div className="text-2xl font-bold">247</div>
                    <div className="flex gap-1">
                      {[85, 72, 93, 67, 88, 45, 91].map((score, i) => (
                        <div key={i} className="flex-1 bg-[var(--secondary)] rounded-full h-8 relative overflow-hidden">
                          <div
                            className={`absolute bottom-0 w-full rounded-full ${score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-blue-500" : "bg-amber-500"}`}
                            style={{ height: `${score}%` }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Score Card */}
                  <div className="card p-4 space-y-3">
                    <div className="text-xs font-medium text-[var(--muted-foreground)]">TOP CANDIDATE</div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-sm font-bold text-[var(--primary)]">
                        AS
                      </div>
                      <div>
                        <div className="text-sm font-semibold">Alex Smith</div>
                        <div className="text-xs text-[var(--muted-foreground)]">Senior React Developer</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">92</div>
                      <span className="text-xs text-[var(--muted-foreground)]">/ 100</span>
                      <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                        Strong Match
                      </span>
                    </div>
                  </div>

                  {/* Skills Match Card */}
                  <div className="card p-4 space-y-3">
                    <div className="text-xs font-medium text-[var(--muted-foreground)]">SKILLS ANALYSIS</div>
                    {[
                      { skill: "React/Next.js", match: 95 },
                      { skill: "TypeScript", match: 88 },
                      { skill: "System Design", match: 72 },
                    ].map((item) => (
                      <div key={item.skill} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>{item.skill}</span>
                          <span className="font-medium">{item.match}%</span>
                        </div>
                        <div className="h-1.5 bg-[var(--secondary)] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${item.match >= 80 ? "bg-emerald-500" : "bg-blue-500"}`}
                            style={{ width: `${item.match}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] mt-3 italic">
              * Sample dashboard preview with demo data
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--secondary)] text-sm text-[var(--muted-foreground)] mb-4">
              <Star size={14} />
              Powerful Features
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything You Need to{" "}
              <span className="gradient-text">Hire Better</span>
            </h2>
            <p className="text-[var(--muted-foreground)] max-w-2xl mx-auto">
              From AI-powered resume screening to intelligent candidate ranking, TalentsQR gives you the tools to make data-driven hiring decisions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Brain size={24} />,
                title: "AI Resume Screening",
                description: "Automatically parse and analyze resumes using AI. Extract skills, experience, education, and generate comprehensive candidate profiles.",
                color: "text-blue-500 bg-blue-100 dark:bg-blue-900/30",
              },
              {
                icon: <Target size={24} />,
                title: "Intelligent Scoring",
                description: "Transparent 100-point scoring across 6 categories. Every score is explainable — never just a number.",
                color: "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30",
              },
              {
                icon: <Search size={24} />,
                title: "Job Description Matching",
                description: "AI compares each candidate against your job requirements. Identify matching skills, missing skills, and relevant experience instantly.",
                color: "text-purple-500 bg-purple-100 dark:bg-purple-900/30",
              },
              {
                icon: <Users size={24} />,
                title: "Candidate Comparison",
                description: "Compare multiple candidates side-by-side. AI recommends the best technical fit, strongest experience, and overall best match.",
                color: "text-amber-500 bg-amber-100 dark:bg-amber-900/30",
              },
              {
                icon: <BarChart3 size={24} />,
                title: "Recruitment Analytics",
                description: "Visualize your hiring funnel, track conversion rates, analyze skill distributions, and measure job performance.",
                color: "text-pink-500 bg-pink-100 dark:bg-pink-900/30",
              },
              {
                icon: <MessageSquare size={24} />,
                title: "AI Recruiter Assistant",
                description: "Ask questions about candidates and jobs in natural language. Get AI-powered insights based on your actual recruitment data.",
                color: "text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="card p-6 hover:shadow-md transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-[var(--secondary)]/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-[var(--muted-foreground)] max-w-2xl mx-auto">
              Get from job posting to shortlisted candidates in minutes, not days.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { step: 1, icon: <FileText size={24} />, title: "Create Job", desc: "Add your job description and requirements" },
              { step: 2, icon: <Upload size={24} />, title: "Upload Resumes", desc: "Drag & drop multiple resumes at once" },
              { step: 3, icon: <Brain size={24} />, title: "AI Analyzes", desc: "AI parses, scores, and ranks every candidate" },
              { step: 4, icon: <Search size={24} />, title: "Review & Compare", desc: "Explore detailed candidate insights and comparisons" },
              { step: 5, icon: <CheckCircle2 size={24} />, title: "Shortlist & Hire", desc: "Move candidates through your pipeline" },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="card p-6 text-center h-full">
                  <div className="w-10 h-10 rounded-full bg-[var(--primary)] text-white flex items-center justify-center mx-auto mb-4 text-sm font-bold">
                    {item.step}
                  </div>
                  <div className="text-[var(--primary)] mb-3 flex justify-center">{item.icon}</div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-xs text-[var(--muted-foreground)]">{item.desc}</p>
                </div>
                {i < 4 && (
                  <div className="hidden md:flex absolute top-1/2 -right-4 z-10 text-[var(--muted-foreground)]">
                    <ChevronRight size={20} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="card p-8 sm:p-12 bg-gradient-to-br from-[var(--primary)] to-blue-700 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white blur-3xl" />
            </div>
            <div className="relative z-10">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  Trusted by Hiring Teams
                </h2>
                <p className="text-blue-100 max-w-2xl mx-auto">
                  See the impact of AI-powered recruitment screening.
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { value: "85%", label: "Faster Screening" },
                  { value: "3x", label: "More Candidates Reviewed" },
                  { value: "92%", label: "Accuracy Rate" },
                  { value: "60%", label: "Time Saved" },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-3xl sm:text-4xl font-bold mb-1">{stat.value}</div>
                    <div className="text-sm text-blue-200">{stat.label}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-blue-300 mt-6 text-center italic">
                * Statistics based on sample benchmarks for demonstration purposes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-[var(--secondary)]/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Transform Your Hiring?
          </h2>
          <p className="text-[var(--muted-foreground)] mb-8 text-lg">
            Stop spending hours on manual resume screening. Let AI find your best candidates in minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="text-base px-8">
                Start Free
                <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center">
                  <Sparkles size={18} className="text-white" />
                </div>
                <span className="text-lg font-bold">
                  Talents<span className="text-[var(--primary)]">QR</span>
                </span>
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">
                AI-powered recruitment intelligence platform.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Product</h4>
              <div className="space-y-2">
                <a href="#features" className="block text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Features</a>
                <a href="#how-it-works" className="block text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">How It Works</a>
                <Link href="/login" className="block text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Demo</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Company</h4>
              <div className="space-y-2">
                <a href="#" className="block text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">About</a>
                <a href="#" className="block text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Contact</a>
                <a href="#" className="block text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Careers</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Legal</h4>
              <div className="space-y-2">
                <a href="#" className="block text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Privacy Policy</a>
                <a href="#" className="block text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Terms of Service</a>
                <a href="#" className="block text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Security</a>
              </div>
            </div>
          </div>
          <div className="border-t border-[var(--border)] pt-8 text-center text-sm text-[var(--muted-foreground)]">
            © {new Date().getFullYear()} TalentsQR. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
