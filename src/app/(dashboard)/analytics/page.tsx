"use client";
import { Card, EmptyState } from "@/components/ui/index";
import { BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/dashboard").then(r => r.json()).then(d => {
      if (d.success) setData(d.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-4">{Array.from({length:3}).map((_,i) => <Card key={i} className="p-6 h-48 skeleton">{" "}</Card>)}</div>;

  const stats = data?.stats as Record<string, number> || {};
  const funnel = data?.funnelData as Array<{stage:string;count:number}> || [];
  const scoreDist = data?.scoreDistribution as Array<{range:string;count:number}> || [];

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Recruitment metrics and insights</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Applications", value: stats.totalCandidates || 0, color: "text-blue-600", suffix: "" },
          { label: "Screened", value: stats.candidatesScreened || 0, color: "text-indigo-600", suffix: "" },
          { label: "Shortlisted", value: stats.shortlisted || 0, color: "text-amber-600", suffix: "" },
          { label: "Interviews", value: stats.interviews || 0, color: "text-purple-600", suffix: "" },
          { label: "Selected", value: stats.selected || 0, color: "text-emerald-600", suffix: "" },
          { label: "Conversion", value: stats.totalCandidates > 0 ? Math.round((stats.selected / stats.totalCandidates) * 100) : 0, color: "text-green-600", suffix: "%" },
        ].map((m) => (
          <Card key={m.label} className="p-4 text-center">
            <div className={`text-2xl font-bold ${m.color}`}>{m.value}{m.suffix}</div>
            <div className="text-xs text-[var(--muted-foreground)] mt-1">{m.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Hiring Funnel</h3>
          {funnel.length > 0 ? (
            <div className="space-y-3">
              {funnel.map((s, i) => {
                const max = Math.max(...funnel.map(f => f.count), 1);
                const colors = ["bg-blue-500","bg-indigo-500","bg-purple-500","bg-amber-500","bg-emerald-500"];
                return (
                  <div key={s.stage}>
                    <div className="flex justify-between text-sm mb-1"><span>{s.stage}</span><span className="font-medium">{s.count}</span></div>
                    <div className="h-8 bg-[var(--secondary)] rounded-lg overflow-hidden">
                      <div className={`h-full rounded-lg ${colors[i % 5]}`} style={{width:`${(s.count/max)*100}%`}} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <EmptyState title="No data yet" description="Start screening to see funnel data." />}
        </Card>

        {/* Score Distribution */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Score Distribution</h3>
          {scoreDist.some(d => d.count > 0) ? (
            <div className="flex items-end gap-3 h-48">
              {scoreDist.map((b) => {
                const max = Math.max(...scoreDist.map(d => d.count), 1);
                return (
                  <div key={b.range} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-medium">{b.count}</span>
                    <div className="w-full bg-[var(--secondary)] rounded-t-lg relative" style={{height:"160px"}}>
                      <div className="absolute bottom-0 w-full bg-[var(--primary)] rounded-t-lg" style={{height:`${(b.count/max)*100}%`}} />
                    </div>
                    <span className="text-xs text-[var(--muted-foreground)]">{b.range}</span>
                  </div>
                );
              })}
            </div>
          ) : <EmptyState title="No scores yet" description="AI-scored candidates will appear here." />}
        </Card>
      </div>
    </div>
  );
}
