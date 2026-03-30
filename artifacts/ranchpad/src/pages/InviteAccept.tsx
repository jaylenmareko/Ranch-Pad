import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Warehouse, Shield, Eye } from "lucide-react";

function roleLabel(role: string): string {
  if (role === "ranch_hand") return "Ranch Hand";
  if (role === "viewer") return "Viewer";
  return role;
}

function RoleDescription({ role }: { role: string }) {
  if (role === "ranch_hand") {
    return (
      <div className="flex items-start gap-2 text-sm text-muted-foreground">
        <Shield className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
        <span>You'll be able to add and edit animal records — but deletions require owner approval.</span>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2 text-sm text-muted-foreground">
      <Eye className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
      <span>You'll have read-only access to animals assigned to you by the owner.</span>
    </div>
  );
}

export default function InviteAccept() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const { login } = useAuth();
  const [, setLocation] = useLocation();

  const [inviteInfo, setInviteInfo] = useState<{ role: string; ranchName: string } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Signup form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Login form state (for existing users)
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/team/invite/${token}`)
      .then(async res => {
        const data = await res.json();
        if (!res.ok) {
          setLoadError(data.message ?? "Invalid invite");
        } else {
          setInviteInfo({ role: data.role, ranchName: data.ranchName });
        }
      })
      .catch(() => setLoadError("Failed to load invite. Check your connection."))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setSubmitError("All fields are required");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, inviteToken: token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.message ?? "Failed to create account");
        return;
      }
      await login(data.token);
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError("Email and password are required");
      return;
    }
    setLoginSubmitting(true);
    setLoginError(null);
    try {
      const res = await fetch(`/api/team/invite/${token}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.message ?? "Failed to sign in");
        return;
      }
      await login(data.token);
    } catch {
      setLoginError("Something went wrong. Please try again.");
    } finally {
      setLoginSubmitting(false);
    }
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/50";
  const labelCls = "block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5";
  const btnCls = "w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30">
          <Warehouse className="w-5 h-5" />
        </div>
        <span className="font-display font-bold text-xl tracking-tight text-foreground">RanchPad</span>
      </div>

      <div className="w-full max-w-md">
        {loading ? (
          <div className="text-center text-muted-foreground animate-pulse">Loading invite…</div>
        ) : loadError ? (
          <div className="p-6 rounded-2xl border border-border bg-card text-center space-y-3">
            <p className="text-xl font-bold text-destructive">Invite Unavailable</p>
            <p className="text-sm text-muted-foreground">{loadError}</p>
            <button onClick={() => setLocation("/")} className="text-sm text-primary underline underline-offset-2 font-medium">
              Back to RanchPad
            </button>
          </div>
        ) : inviteInfo ? (
          <div className="p-6 sm:p-8 rounded-2xl border border-border bg-card space-y-6 shadow-xl shadow-black/10">
            {/* Invite header — always visible */}
            <div>
              <p className="text-sm font-semibold text-primary mb-1">You've been invited to join</p>
              <h1 className="text-2xl font-black font-display text-foreground">{inviteInfo.ranchName}</h1>
              <div className="mt-3 space-y-1.5">
                <p className="text-sm font-medium text-foreground">
                  Role: <span className="font-bold">{roleLabel(inviteInfo.role)}</span>
                </p>
                <RoleDescription role={inviteInfo.role} />
              </div>
            </div>

            {mode === "signup" ? (
              <>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <label className={labelCls}>Your Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" required className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" required className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" required minLength={6} className={inputCls} />
                  </div>
                  {submitError && <p className="text-sm text-destructive font-medium">{submitError}</p>}
                  <button type="submit" disabled={submitting} className={btnCls}>
                    {submitting ? "Creating account…" : "Create Account & Join Ranch"}
                  </button>
                </form>
                <p className="text-center text-xs text-muted-foreground">
                  Already have an account?{" "}
                  <button onClick={() => { setMode("login"); setSubmitError(null); }} className="text-primary underline underline-offset-2 font-medium">
                    Sign in instead
                  </button>
                </p>
              </>
            ) : (
              <>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className={labelCls}>Email</label>
                    <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="you@example.com" required className={inputCls} autoFocus />
                  </div>
                  <div>
                    <label className={labelCls}>Password</label>
                    <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="Your password" required className={inputCls} />
                  </div>
                  {loginError && <p className="text-sm text-destructive font-medium">{loginError}</p>}
                  <button type="submit" disabled={loginSubmitting} className={btnCls}>
                    {loginSubmitting ? "Signing in…" : "Sign In & Join Ranch"}
                  </button>
                </form>
                <p className="text-center text-xs text-muted-foreground">
                  Don't have an account?{" "}
                  <button onClick={() => { setMode("signup"); setLoginError(null); }} className="text-primary underline underline-offset-2 font-medium">
                    Create one instead
                  </button>
                </p>
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
