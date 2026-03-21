import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HoofIcon } from "@/components/HoofIcon";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const token = new URLSearchParams(window.location.search).get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mismatch, setMismatch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("This reset link is missing a token. Please request a new one.");
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMismatch(false);
    setError(null);

    if (password !== confirmPassword) {
      setMismatch(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Could not connect. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
            <HoofIcon className="w-5 h-5 text-primary" />
          </div>
          <span className="font-display font-bold text-xl text-primary tracking-tight">RanchPad</span>
        </div>

        {done ? (
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl text-foreground mb-2">Password updated</h1>
              <p className="text-sm text-muted-foreground">Your password has been changed. You can now log in with your new password.</p>
            </div>
            <Button className="w-full mt-2" onClick={() => navigate("/login")}>
              Go to Log In
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        ) : (
          <>
            <h1 className="font-display font-bold text-3xl text-foreground mb-1 tracking-tight">Set new password</h1>
            <p className="text-sm text-muted-foreground mb-8">Choose a new password for your account.</p>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-3 mb-5">
                <XCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="rp-password">New Password</Label>
                <Input
                  id="rp-password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setMismatch(false); }}
                  required
                  disabled={!token}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rp-confirm">Confirm Password</Label>
                <Input
                  id="rp-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setMismatch(false); }}
                  required
                  disabled={!token}
                  className={mismatch ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {mismatch && (
                  <p className="text-sm text-destructive font-medium">Passwords don't match.</p>
                )}
              </div>
              <Button type="submit" className="w-full" size="lg" isLoading={loading} disabled={!token}>
                Update Password
                {!loading && <ArrowRight className="w-5 h-5 ml-2" />}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
