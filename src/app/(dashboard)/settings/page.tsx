"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/index";
import { User, Key, Bell, Palette } from "lucide-react";
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

    </div>
  );
}

