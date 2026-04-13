import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Warehouse, Shield, Eye } from "lucide-react";
import "./InviteAccept.css";

function roleLabel(role: string): string {
  if (role === "ranch_hand") return "Ranch Hand";
  if (role === "viewer") return "Viewer";
  return role;
}

function RoleDescription({ role }: { role: string }) {
  if (role === "ranch_hand") {
    return (
      <div className="invite-role-desc">
        <Shield size={14} color="#2D6A4F" style={{ flexShrink: 0, marginTop: 2 }} />
        <span>You'll be able to add and edit animal records — but deletions require owner approval.</span>
      </div>
    );
  }
  return (
    <div className="invite-role-desc">
      <Eye size={14} color="#8FA393" style={{ flexShrink: 0, marginTop: 2 }} />
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

  return (
    <div className="invite-page">

      {/* ── Logo ──────────────────────────────────────────────────────────── */}
      <div className="invite-logo">
        <div className="invite-logo-icon">
          <Warehouse size={20} color="#FFFFFF" />
        </div>
        <span className="invite-logo-name">RanchPad</span>
      </div>

      <div className="invite-wrap">

        {/* ── Loading ───────────────────────────────────────────────────── */}
        {loading && (
          <div className="invite-loading">Loading invite…</div>
        )}

        {/* ── Error ─────────────────────────────────────────────────────── */}
        {!loading && loadError && (
          <div className="invite-error-card">
            <p className="invite-error-heading">Invite Unavailable</p>
            <p className="invite-error-sub">{loadError}</p>
            <button onClick={() => setLocation("/")} className="invite-back-link">
              Back to RanchPad
            </button>
          </div>
        )}

        {/* ── Main invite card ──────────────────────────────────────────── */}
        {!loading && inviteInfo && (
          <div className="invite-card">

            {/* Header — always visible */}
            <div className="invite-card-header">
              <p className="invite-tag">You've been invited to join</p>
              <h1 className="invite-ranch-name">{inviteInfo.ranchName}</h1>
              <p className="invite-role-row">
                Role: <span className="invite-role-bold">{roleLabel(inviteInfo.role)}</span>
              </p>
              <RoleDescription role={inviteInfo.role} />
            </div>

            {/* Form area */}
            <div className="invite-card-body">

              {mode === "signup" ? (
                <>
                  <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div className="invite-field">
                      <label className="invite-label">Your Name</label>
                      <input
                        className="invite-input"
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Jane Smith"
                        required
                      />
                    </div>
                    <div className="invite-field">
                      <label className="invite-label">Email</label>
                      <input
                        className="invite-input"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="jane@example.com"
                        required
                      />
                    </div>
                    <div className="invite-field">
                      <label className="invite-label">Password</label>
                      <input
                        className="invite-input"
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        required
                        minLength={6}
                      />
                    </div>
                    {submitError && <p className="invite-form-error">{submitError}</p>}
                    <button type="submit" disabled={submitting} className="invite-submit-btn">
                      {submitting ? "Creating account…" : "Create Account & Join Ranch"}
                    </button>
                  </form>
                  <p className="invite-toggle">
                    Already have an account?{" "}
                    <button
                      className="invite-toggle-btn"
                      onClick={() => { setMode("login"); setSubmitError(null); }}
                    >
                      Sign in instead
                    </button>
                  </p>
                </>
              ) : (
                <>
                  <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div className="invite-field">
                      <label className="invite-label">Email</label>
                      <input
                        className="invite-input"
                        type="email"
                        value={loginEmail}
                        onChange={e => setLoginEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        autoFocus
                      />
                    </div>
                    <div className="invite-field">
                      <label className="invite-label">Password</label>
                      <input
                        className="invite-input"
                        type="password"
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        placeholder="Your password"
                        required
                      />
                    </div>
                    {loginError && <p className="invite-form-error">{loginError}</p>}
                    <button type="submit" disabled={loginSubmitting} className="invite-submit-btn">
                      {loginSubmitting ? "Signing in…" : "Sign In & Join Ranch"}
                    </button>
                  </form>
                  <p className="invite-toggle">
                    Don't have an account?{" "}
                    <button
                      className="invite-toggle-btn"
                      onClick={() => { setMode("signup"); setLoginError(null); }}
                    >
                      Create one instead
                    </button>
                  </p>
                </>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
