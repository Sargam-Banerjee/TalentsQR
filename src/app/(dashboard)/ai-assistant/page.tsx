"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/index";
import { Send, Brain, User, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Message { role: "user" | "assistant"; content: string; }

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, { role: "assistant", content: data.data.response }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: data.error || "Sorry, I couldn't process that request." }]);
      }
    } catch {
      toast.error("Failed to get AI response");
    } finally { setLoading(false); }
  };

  const suggestions = [
    "Show me the top candidates for my latest job",
    "Which candidates have React and TypeScript?",
    "Summarize my recruitment pipeline",
    "Who are the strongest candidates overall?",
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col fade-in">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">AI Recruiter Assistant</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Ask questions about your candidates and jobs</p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-full bg-[var(--primary)]/10 flex items-center justify-center mb-4">
                <Sparkles size={28} className="text-[var(--primary)]" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Hi! I&apos;m your AI Recruitment Assistant</h3>
              <p className="text-sm text-[var(--muted-foreground)] max-w-md mb-6">
                Ask me anything about your candidates, jobs, or recruitment data. I use your actual application data to provide insights.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg">
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => { setInput(s); }}
                    className="text-left text-sm p-3 rounded-lg border border-[var(--border)] hover:bg-[var(--secondary)] transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
                    <Brain size={16} className="text-[var(--primary)]" />
                  </div>
                )}
                <div className={`max-w-[80%] p-3 rounded-xl text-sm ${
                  msg.role === "user"
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--secondary)]"
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-[var(--secondary)] flex items-center justify-center flex-shrink-0">
                    <User size={16} />
                  </div>
                )}
              </div>
            ))
          )}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                <Brain size={16} className="text-[var(--primary)]" />
              </div>
              <div className="p-3 rounded-xl bg-[var(--secondary)]">
                <Loader2 size={16} className="animate-spin text-[var(--muted-foreground)]" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-[var(--border)] p-4">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
              placeholder="Ask about candidates, jobs, or your hiring pipeline..."
              className="flex-1 h-10 px-4 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
            <Button onClick={sendMessage} disabled={!input.trim() || loading} size="icon">
              <Send size={16} />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
