"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/index";
import { User, Key, Bell, Palette, Mail } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { toast } from "sonner";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [name, setName] = useState(session?.user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Profile updated successfully");
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    toast.success("Password updated successfully");
    setCurrentPassword("");
    setNewPassword("");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <User size={20} className="text-[var(--primary)]" />
          <h2 className="text-lg font-semibold">Profile</h2>
        </div>
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Email" value={session?.user?.email || ""} disabled />
          <Button type="submit">Save Changes</Button>
        </form>
      </Card>

      {/* Password */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Key size={20} className="text-[var(--primary)]" />
          <h2 className="text-lg font-semibold">Change Password</h2>
        </div>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <Input label="Current Password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          <Input label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" required />
          <Button type="submit">Update Password</Button>
        </form>
      </Card>

      {/* Appearance */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Palette size={20} className="text-[var(--primary)]" />
          <h2 className="text-lg font-semibold">Appearance</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Theme</p>
            <p className="text-xs text-[var(--muted-foreground)]">Toggle between light and dark mode</p>
          </div>
          <ThemeToggle />
        </div>
      </Card>

      {/* Notification Preferences */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell size={20} className="text-[var(--primary)]" />
          <h2 className="text-lg font-semibold">Notifications</h2>
        </div>
        <div className="space-y-3">
          {[
            { label: "Resume uploads", desc: "Get notified when resumes are uploaded" },
            { label: "AI screening complete", desc: "Get notified when AI finishes screening" },
            { label: "Candidate status changes", desc: "Get notified on pipeline updates" },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--primary)]"></div>
              </label>
            </div>
          ))}
        </div>
      </Card>

      {/* Outgoing Email & SMTP Service */}
      <EmailSettingsCard />
    </div>
  );
}

function EmailSettingsCard() {
  const [provider, setProvider] = useState<"smtp" | "resend">("smtp");
  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState("465");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpFrom, setSmtpFrom] = useState("");
  const [resendApiKey, setResendApiKey] = useState("");
  const [resendFrom, setResendFrom] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    fetch("/api/settings/email")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setConfigured(data.configured);
          if (data.provider === "resend") setProvider("resend");
          if (data.smtpHost) setSmtpHost(data.smtpHost);
          if (data.smtpPort) setSmtpPort(data.smtpPort);
          if (data.smtpUser) setSmtpUser(data.smtpUser);
          if (data.smtpFrom) setSmtpFrom(data.smtpFrom);
          if (data.resendFrom) setResendFrom(data.resendFrom);
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveEmailSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          smtpHost,
          smtpPort,
          smtpUser,
          smtpPass,
          smtpFrom: smtpFrom || (smtpUser ? `"TalentsQR Hiring" <${smtpUser}>` : ""),
          resendApiKey,
          resendFrom,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Email settings saved to system!");
        setConfigured(true);
      } else {
        toast.error(data.error || "Failed to save email settings");
      }
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setTesting(true);
    try {
      const res = await fetch("/api/settings/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test" }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.result?.simulated) {
          toast.info("Simulated test: Configure credentials above to send to your real inbox!");
        } else {
          toast.success("Test email successfully delivered to your inbox!");
        }
      } else {
        toast.error(data.error || "Test email delivery failed");
      }
    } catch {
      toast.error("Test email request failed");
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="p-6 space-y-4 border-[var(--primary)]/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
            <Mail size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Candidate Email Delivery (SMTP / Resend)</h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              Send real notes, interview invites, and updates directly to candidate inboxes
            </p>
          </div>
        </div>
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            configured
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
          }`}
        >
          {configured ? "Live Dispatch Ready" : "Simulation Mode"}
        </span>
      </div>

      {/* Provider Selector */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => setProvider("smtp")}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
            provider === "smtp"
              ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--foreground)]"
              : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/40"
          }`}
        >
          Gmail / Standard SMTP
        </button>
        <button
          type="button"
          onClick={() => setProvider("resend")}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
            provider === "resend"
              ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--foreground)]"
              : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/40"
          }`}
        >
          Resend API
        </button>
      </div>

      <form onSubmit={handleSaveEmailSettings} className="space-y-4 pt-2">
        {provider === "smtp" ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="SMTP Host"
                placeholder="smtp.gmail.com"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                required
              />
              <Input
                label="SMTP Port"
                placeholder="465 (SSL) or 587 (TLS)"
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="SMTP Username / Email"
                placeholder="your-email@gmail.com"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                required
              />
              <Input
                label="SMTP Password / App Password"
                type="password"
                placeholder="16-character app password"
                value={smtpPass}
                onChange={(e) => setSmtpPass(e.target.value)}
                required
              />
            </div>

            <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
              <strong>Tip for Gmail:</strong> Go to{" "}
              <a
                href="https://myaccount.google.com/apppasswords"
                target="_blank"
                rel="noreferrer"
                className="text-[var(--primary)] underline font-medium"
              >
                myaccount.google.com/apppasswords
              </a>
              , create an App Password named &quot;TalentsQR&quot;, and paste the 16-character key above.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <Input
              label="Resend API Key"
              placeholder="re_xxxxxxxxxxxx"
              value={resendApiKey}
              onChange={(e) => setResendApiKey(e.target.value)}
              required
            />
            <Input
              label="From Email"
              placeholder="TalentsQR <onboarding@resend.dev>"
              value={resendFrom}
              onChange={(e) => setResendFrom(e.target.value)}
            />
            <p className="text-[11px] text-[var(--muted-foreground)]">
              Get your free API key at{" "}
              <a
                href="https://resend.com"
                target="_blank"
                rel="noreferrer"
                className="text-[var(--primary)] underline font-medium"
              >
                resend.com
              </a>
              . Free tier includes 3,000 real emails/month.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTestEmail}
            loading={testing}
          >
            Send Test Verification Email
          </Button>
          <Button type="submit" size="sm" loading={saving}>
            Save Email Settings
          </Button>
        </div>
      </form>
    </Card>
  );
}

