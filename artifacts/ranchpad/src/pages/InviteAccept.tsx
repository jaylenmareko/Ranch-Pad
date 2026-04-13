import React, { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Warehouse, Shield, Eye, Tractor, MapPin, CheckCircle2, XCircle, Plus, X, FolderOpen, Loader2, ArrowRight } from "lucide-react";
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

  // Step navigation: "signup" | "pastures"
  const [step, setStep] = useState<"signup" | "pastures">("signup");

  // Signup form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Location autocomplete
  const [address, setAddress] = useState("");
  const [geocodedLat, setGeocodedLat] = useState<number | null>(null);
  const [geocodedLon, setGeocodedLon] = useState<number | null>(null);
  const [geocodeLabel, setGeocodeLabel] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pastures
  const [setupLocs, setSetupLocs] = useState<string[]>([]);
  const [setupNewLocName, setSetupNewLocName] = useState("");

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

  // ── Address autocomplete ──────────────────────────────────────────────────
  function handleAddressChange(value: string) {
    setAddress(value);
    if (geocodedLat !== null) { setGeocodedLat(null); setGeocodedLon(null); setGeocodeLabel(null); }
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    if (value.trim().length < 3) { setSuggestions([]); setShowSuggestions(false); setAddressLoading(false); return; }
    setAddressLoading(true);
    suggestTimer.current = setTimeout(async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=5&countrycodes=us&addressdetails=0`,
          { headers: { "Accept-Language": "en" }, signal: controller.signal }
        );
        clearTimeout(timeout);
        const results: Array<{ display_name: string; lat: string; lon: string }> = await res.json();
        setSuggestions(results ?? []);
        setShowSuggestions((results ?? []).length > 0);
      } catch {
        clearTimeout(timeout);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setAddressLoading(false);
      }
    }, 150);
  }

  function selectSuggestion(s: { display_name: string; lat: string; lon: string }) {
    setAddress(s.display_name);
    setGeocodedLat(parseFloat(parseFloat(s.lat).toFixed(6)));
    setGeocodedLon(parseFloat(parseFloat(s.lon).toFixed(6)));
    setGeocodeLabel(s.display_name);
    setSuggestions([]);
    setShowSuggestions(false);
  }

  function clearLocation() {
    setGeocodedLat(null); setGeocodedLon(null); setGeocodeLabel(null);
    setAddress(""); setSuggestions([]);
  }

  // ── Step 1: validate and advance to pastures ──────────────────────────────
  function handleAdvanceToPastures(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) { setPasswordMismatch(true); return; }
    setPasswordMismatch(false);
    if (geocodedLat === null || geocodedLon === null) {
      setSubmitError("Enter your ranch address and select a suggestion.");
      return;
    }
    setSubmitError(null);
    setStep("pastures");
  }

  // ── Step 2: create account + join ranch ───────────────────────────────────
  async function handleFinishSetup(pastures: string[]) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          lat: geocodedLat,
          lon: geocodedLon,
          pastures,
          inviteToken: token,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.message ?? "Failed to create account");
        setStep("signup");
        return;
      }
      await login(data.token);
    } catch {
      setSubmitError("Something went wrong. Please try again.");
      setStep("signup");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Login (existing user accepts invite) ──────────────────────────────────
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

              {/* ── LOGIN MODE ────────────────────────────────────────────── */}
              {mode === "login" && (
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
                      onClick={() => { setMode("signup"); setLoginError(null); setStep("signup"); }}
                    >
                      Create one instead
                    </button>
                  </p>
                </>
              )}

              {/* ── SIGNUP MODE — STEP 1: account + location ──────────────── */}
              {mode === "signup" && step === "signup" && (
                <>
                  <form onSubmit={handleAdvanceToPastures} style={{ display: "flex", flexDirection: "column", gap: 12 }}>

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
                        onChange={e => { setPassword(e.target.value); if (passwordMismatch) setPasswordMismatch(false); }}
                        placeholder="At least 6 characters"
                        required
                        minLength={6}
                      />
                    </div>

                    <div className="invite-field">
                      <label className="invite-label">Confirm Password</label>
                      <input
                        className={`invite-input${passwordMismatch ? " invite-input--error" : ""}`}
                        type="password"
                        value={confirmPassword}
                        onChange={e => { setConfirmPassword(e.target.value); if (passwordMismatch) setPasswordMismatch(false); }}
                        placeholder="Repeat password"
                        required
                      />
                      {passwordMismatch && <p className="invite-form-error">Passwords don't match.</p>}
                    </div>

                    {/* Ranch Location */}
                    <div className="invite-location-section">
                      <div className="invite-location-label-row">
                        <Tractor size={13} color="#2D6A4F" />
                        <span className="invite-label" style={{ margin: 0 }}>Ranch Location</span>
                      </div>
                      <div style={{ position: "relative" }}>
                        <input
                          className="invite-input"
                          placeholder="Start typing your address…"
                          value={address}
                          onChange={e => handleAddressChange(e.target.value)}
                          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                          autoComplete="off"
                          style={{ paddingRight: 36 }}
                        />
                        {addressLoading && (
                          <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                            <Loader2 size={14} color="#8FA393" style={{ animation: "spin 1s linear infinite" }} />
                          </div>
                        )}
                        {showSuggestions && suggestions.length > 0 && (
                          <div className="invite-suggestions">
                            {suggestions.map((s, i) => (
                              <button
                                key={i}
                                type="button"
                                className="invite-suggestion-item"
                                onMouseDown={() => selectSuggestion(s)}
                              >
                                <MapPin size={12} color="#8FA393" style={{ flexShrink: 0, marginTop: 2 }} />
                                <span>{s.display_name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {geocodedLat !== null && geocodedLon !== null && (
                        <div className="invite-geocoded">
                          <CheckCircle2 size={13} color="#2D6A4F" style={{ flexShrink: 0, marginTop: 1 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {geocodeLabel && <p className="invite-geocoded-label">{geocodeLabel}</p>}
                            <p className="invite-geocoded-coords">{geocodedLat.toFixed(6)}, {geocodedLon.toFixed(6)}</p>
                          </div>
                          <button type="button" onClick={clearLocation} className="invite-geocoded-clear">
                            <XCircle size={13} color="#8FA393" />
                          </button>
                        </div>
                      )}
                    </div>

                    {submitError && <p className="invite-form-error">{submitError}</p>}

                    <button type="submit" className="invite-submit-btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                      Next: Set Up Pastures
                      <ArrowRight size={15} />
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
              )}

              {/* ── SIGNUP MODE — STEP 2: pastures ────────────────────────── */}
              {mode === "signup" && step === "pastures" && (
                <>
                  <div className="invite-pastures-heading">Set up your pastures</div>
                  <p className="invite-pastures-sub">
                    Add the pastures, pens, or areas on your ranch. You can manage these later in Settings.
                  </p>

                  {setupLocs.length > 0 && (
                    <ul className="invite-pasture-list">
                      {setupLocs.map((loc, idx) => (
                        <li key={idx} className="invite-pasture-item">
                          <MapPin size={13} color="#2D6A4F" style={{ flexShrink: 0 }} />
                          <span className="invite-pasture-name">{loc}</span>
                          <button
                            type="button"
                            className="invite-pasture-remove"
                            onClick={() => setSetupLocs(prev => prev.filter((_, i) => i !== idx))}
                            aria-label="Remove"
                          >
                            <X size={13} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="invite-pasture-add-row">
                    <input
                      className="invite-input"
                      placeholder="e.g. South Pasture, Barn, Lot A"
                      value={setupNewLocName}
                      onChange={e => setSetupNewLocName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const trimmed = setupNewLocName.trim();
                          if (trimmed) { setSetupLocs(prev => [...prev, trimmed]); setSetupNewLocName(""); }
                        }
                      }}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="invite-pasture-add-btn"
                      disabled={!setupNewLocName.trim()}
                      onClick={() => {
                        const trimmed = setupNewLocName.trim();
                        if (trimmed) { setSetupLocs(prev => [...prev, trimmed]); setSetupNewLocName(""); }
                      }}
                    >
                      <Plus size={14} />
                      Add
                    </button>
                  </div>

                  {submitError && <p className="invite-form-error">{submitError}</p>}

                  <button
                    type="button"
                    className="invite-submit-btn"
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}
                    disabled={submitting}
                    onClick={() => handleFinishSetup(setupLocs)}
                  >
                    {submitting
                      ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Creating account…</>
                      : <><FolderOpen size={15} /> Enter RanchPad</>}
                  </button>

                  <button
                    type="button"
                    className="invite-skip-btn"
                    disabled={submitting}
                    onClick={() => handleFinishSetup([])}
                  >
                    Skip for now
                  </button>
                </>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
