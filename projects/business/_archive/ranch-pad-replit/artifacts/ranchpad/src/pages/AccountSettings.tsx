import React, { useEffect, useState } from "react";
import { Save, User, KeyRound, Loader2, UserCog, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useAuthModal } from "@/contexts/auth-modal-context";
import "./AccountSettings.css";

interface UserProfile {
  id: number;
  name: string;
  email: string;
}

export default function AccountSettings() {
  const { toast } = useToast();
  const { isAuthenticated, isViewer, role } = useAuth();
  const { openLogin, openSignup } = useAuthModal();
  const isOwner = role === "owner";

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingName, setIsSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { setIsLoadingProfile(false); return; }
    setIsLoadingProfile(true);
    fetch("/api/auth/me")
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { message?: string }).message ?? "Could not load account info");
        }
        return res.json() as Promise<UserProfile>;
      })
      .then((data) => {
        setUserProfile(data);
        setDisplayName(data.name ?? "");
      })
      .catch(() => {
        toast({ title: "Could not load account info", variant: "destructive" });
      })
      .finally(() => setIsLoadingProfile(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="acct-unauth">
        <div className="acct-header">
          <div className="acct-header-title">Personal Account Settings</div>
        </div>
        <div className="acct-unauth-body">
          <div className="acct-unauth-icon">
            <UserCog size={32} color="#2D6A4F" />
          </div>
          <div className="acct-unauth-heading">Manage your account</div>
          <p className="acct-unauth-sub">
            Create a free account to manage your display name, email, password, and subscription.
          </p>
          <div className="acct-unauth-buttons">
            <button onClick={openSignup} className="acct-unauth-signup">Create Free Account</button>
            <button onClick={openLogin} className="acct-unauth-login">Log In</button>
          </div>
        </div>
      </div>
    );
  }

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) return;
    setIsSavingName(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: displayName.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Save failed");
      }
      const updated: UserProfile = await res.json();
      setUserProfile(updated);
      setDisplayName(updated.name);
      toast({ title: "Name updated", description: "Your display name has been saved." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      toast({ title: "Save failed", description: message, variant: "destructive" });
    } finally {
      setIsSavingName(false);
    }
  }

  async function handleChangeEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailError(null);
    setIsChangingEmail(true);
    try {
      const res = await fetch("/api/auth/me/email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: newEmail.trim(), currentPassword: emailPassword }),
      });
      if (!res.ok) {
        const err = await res.json();
        setEmailError(err.message ?? "Could not update email");
        return;
      }
      const updated: UserProfile = await res.json();
      setUserProfile(updated);
      setNewEmail("");
      setEmailPassword("");
      toast({ title: "Email updated", description: `Your email is now ${updated.email}.` });
    } catch {
      setEmailError("Something went wrong. Try again.");
    } finally {
      setIsChangingEmail(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) return;
    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/auth/me/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Password change failed");
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Password updated", description: "Your new password is active." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      toast({ title: "Password change failed", description: message, variant: "destructive" });
    } finally {
      setIsChangingPassword(false);
    }
  }

  return (
    <div className="acct-page">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="acct-header">
        <div className="acct-header-title">Personal Account Settings</div>
      </div>

      <div className="acct-body">

        {/* ── Your Account ──────────────────────────────────────────────── */}
        <div className="acct-card">
          <div className="acct-card-header">
            <User size={15} color="#2D6A4F" style={{ flexShrink: 0 }} />
            <span className="acct-card-title">Your Account</span>
          </div>

          {isLoadingProfile ? (
            <div className="acct-section">
              <div className="acct-loading-text">
                <Loader2 size={14} style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />
                Loading account info…
              </div>
            </div>
          ) : (
            <>
              {/* Display Name */}
              <form onSubmit={handleSaveName}>
                <div className="acct-section">
                  <div className="acct-section-label">Display Name</div>
                  <div className="acct-name-row">
                    <input
                      className="acct-input"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      placeholder="Your name"
                      required
                    />
                    <button
                      type="submit"
                      className="acct-save-btn"
                      disabled={isSavingName || displayName.trim() === (userProfile?.name ?? "")}
                    >
                      {isSavingName
                        ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                        : <Save size={13} />}
                      Save
                    </button>
                  </div>
                </div>

                {/* Current Email (read-only) */}
                <div className="acct-section">
                  <div className="acct-section-label">Current Email</div>
                  <div className="acct-email-display">{userProfile?.email ?? "—"}</div>
                </div>
              </form>

              {/* Change Email */}
              <form onSubmit={handleChangeEmail}>
                <div className="acct-section">
                  <div className="acct-subsection-label">Change Email</div>
                  <div className="acct-field" style={{ marginBottom: 10 }}>
                    <div className="acct-section-label">New Email Address</div>
                    <input
                      className="acct-input"
                      type="email"
                      value={newEmail}
                      onChange={e => { setNewEmail(e.target.value); setEmailError(null); }}
                      placeholder="new@example.com"
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div className="acct-field" style={{ marginBottom: 10 }}>
                    <div className="acct-section-label">Confirm with Current Password</div>
                    <input
                      className="acct-input"
                      type="password"
                      value={emailPassword}
                      onChange={e => { setEmailPassword(e.target.value); setEmailError(null); }}
                      placeholder="Enter your current password"
                      required
                      autoComplete="current-password"
                    />
                  </div>
                  {emailError && <p className="acct-error">{emailError}</p>}
                  <button
                    type="submit"
                    className="acct-submit-btn"
                    disabled={isChangingEmail || !newEmail.trim() || !emailPassword}
                  >
                    {isChangingEmail
                      ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                      : <Save size={14} />}
                    Update Email
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* ── Change Password ────────────────────────────────────────────── */}
        <div className="acct-card">
          <div className="acct-card-header">
            <KeyRound size={15} color="#2D6A4F" style={{ flexShrink: 0 }} />
            <span className="acct-card-title">Change Password</span>
          </div>
          <form onSubmit={handleChangePassword}>
            <div className="acct-section">
              <div className="acct-field" style={{ marginBottom: 10 }}>
                <div className="acct-section-label">Current Password</div>
                <input
                  className="acct-input"
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  required
                  autoComplete="current-password"
                />
              </div>
              <div className="acct-field" style={{ marginBottom: 10 }}>
                <div className="acct-section-label">New Password</div>
                <input
                  className="acct-input"
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <div className="acct-field" style={{ marginBottom: 10 }}>
                <div className="acct-section-label">Confirm New Password</div>
                <input
                  className="acct-input"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                  autoComplete="new-password"
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="acct-mismatch">Passwords do not match.</p>
                )}
              </div>
              <button
                type="submit"
                className="acct-submit-btn"
                disabled={
                  isChangingPassword ||
                  !currentPassword ||
                  newPassword.length < 6 ||
                  newPassword !== confirmPassword
                }
              >
                {isChangingPassword
                  ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                  : <KeyRound size={14} />}
                Update Password
              </button>
            </div>
          </form>
        </div>

        {/* ── Plan — owners only ─────────────────────────────────────────── */}
        {isOwner && (
          <div className="acct-card">
            <div className="acct-card-header">
              <CheckCircle2 size={15} color="#2D6A4F" style={{ flexShrink: 0 }} />
              <span className="acct-card-title">Plan</span>
            </div>
            <div className="acct-section">
              <div className="acct-billing-badges">
                <span className="acct-status-badge acct-status-badge--active">
                  <CheckCircle2 size={12} /> Free — All Features Included
                </span>
              </div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#8FA393", marginTop: 8 }}>
                RanchPad is free for our founding ranchers. No credit card needed.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
