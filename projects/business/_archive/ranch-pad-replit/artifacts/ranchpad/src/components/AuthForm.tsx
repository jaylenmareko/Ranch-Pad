import React, { useRef, useState } from "react";
import { ArrowRight, CheckCircle2, XCircle, Tractor, MapPin, FolderOpen, Plus, X, Loader2 } from "lucide-react";
import { useLogin, useSignup } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import "./AuthForm.css";

type AuthView = "login" | "signup" | "forgot" | "pastures";

export interface AuthFormProps {
  initialView?: "login" | "signup";
  /** Called after auth is fully complete (login done, or pastures step finished/skipped). */
  onDone: () => void;
}

export function AuthForm({ initialView = "login", onDone }: AuthFormProps) {
  const [view, setView] = useState<AuthView>(initialView);

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup fields (collected locally — no API call until user finishes pastures)
  const [name, setName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMismatch, setPasswordMismatch] = useState(false);

  // Location autocomplete
  const [address, setAddress] = useState("");
  const [geocodedLat, setGeocodedLat] = useState<number | null>(null);
  const [geocodedLon, setGeocodedLon] = useState<number | null>(null);
  const [geocodeLabel, setGeocodeLabel] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  // Pastures — local only until the user explicitly finishes
  const [setupLocs, setSetupLocs] = useState<string[]>([]);
  const [setupNewLocName, setSetupNewLocName] = useState("");

  const { login: setAuthContext } = useAuth();
  const { toast } = useToast();
  const loginMutation = useLogin();
  const signupMutation = useSignup();

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
        toast({ title: "Poor signal", description: "Couldn't load address suggestions — move to better coverage and try again." });
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

  // ── Login ─────────────────────────────────────────────────────────────────
  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    loginMutation.mutate(
      { data: { email: loginEmail, password: loginPassword } },
      {
        onSuccess: (data) => { setAuthContext(data.token); onDone(); },
        onError: (error: Error) => {
          toast({ title: "Login Failed", description: error.message || "Invalid credentials.", variant: "destructive" });
        },
      }
    );
  }

  // ── Signup step 1: validate locally, advance to pastures ─────────────────
  function handleAdvanceToPastures(e: React.FormEvent) {
    e.preventDefault();
    if (signupPassword !== confirmPassword) { setPasswordMismatch(true); return; }
    setPasswordMismatch(false);
    if (geocodedLat === null || geocodedLon === null) {
      toast({ title: "Location required", description: "Enter your ranch address and select a suggestion.", variant: "destructive" });
      return;
    }
    // No API call — just move to the local pastures setup step
    setView("pastures");
  }

  // ── Signup step 2: create account + pastures in one shot ─────────────────
  function handleFinishSetup(pastures: string[]) {
    signupMutation.mutate(
      {
        data: {
          email: signupEmail,
          password: signupPassword,
          name,
          lat: geocodedLat!,
          lon: geocodedLon!,
          pastures,
        },
      },
      {
        onSuccess: async (data) => {
          setAuthContext(data.token);
          onDone();
        },
        onError: (error: Error) => {
          toast({ title: "Signup Failed", description: error.message || "Could not create account.", variant: "destructive" });
          // Send user back to signup form so they can correct and retry
          setView("signup");
        },
      }
    );
  }

  // ── Forgot password ───────────────────────────────────────────────────────
  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setForgotLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast({ title: "Error", description: data.message || "Something went wrong.", variant: "destructive" });
        return;
      }
      setForgotSent(true);
    } catch {
      toast({ title: "Error", description: "Could not send reset email.", variant: "destructive" });
    } finally {
      setForgotLoading(false);
    }
  }

  // ── Views ─────────────────────────────────────────────────────────────────

  if (view === "login") {
    return (
      <>
        <h1 className="af-heading">Welcome back</h1>
        <p className="af-sub">Sign in to your RanchPad account.</p>
        <form onSubmit={handleLogin} className="af-fields">
          <div className="af-field">
            <label className="af-label" htmlFor="af-login-email">Email</label>
            <input id="af-login-email" className="af-input" type="email" placeholder="you@example.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
          </div>
          <div className="af-field">
            <div className="af-field-row">
              <label className="af-label" htmlFor="af-login-password">Password</label>
              <button type="button" className="af-btn-ghost" onClick={() => setView("forgot")}>
                Forgot password?
              </button>
            </div>
            <input id="af-login-password" className="af-input" type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
          </div>
          <button type="submit" className="af-btn-primary" disabled={loginMutation.isPending}>
            {loginMutation.isPending
              ? <Loader2 size={16} className="af-spinner" />
              : <><span>Sign In</span><ArrowRight size={15} /></>
            }
          </button>
        </form>
        <p className="af-footer">
          Don't have an account?{" "}
          <button type="button" className="af-footer-link" onClick={() => setView("signup")}>
            Sign up free
          </button>
        </p>
      </>
    );
  }

  if (view === "signup") {
    return (
      <>
        <h1 className="af-heading">Create your ranch</h1>
        <p className="af-sub">Free 14-day trial. No credit card required.</p>
        <form onSubmit={handleAdvanceToPastures} className="af-fields">
          <div className="af-field">
            <label className="af-label" htmlFor="af-name">Full Name</label>
            <input id="af-name" className="af-input" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="af-field">
            <label className="af-label" htmlFor="af-email">Email</label>
            <input id="af-email" className="af-input" type="email" placeholder="you@example.com" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} required />
          </div>
          <div className="af-field">
            <label className="af-label" htmlFor="af-password">Password</label>
            <input id="af-password" className="af-input" type="password" value={signupPassword} onChange={e => { setSignupPassword(e.target.value); if (passwordMismatch) setPasswordMismatch(false); }} required />
          </div>
          <div className="af-field">
            <label className="af-label" htmlFor="af-confirm">Confirm Password</label>
            <input id="af-confirm" className={`af-input${passwordMismatch ? " af-input--error" : ""}`} type="password" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); if (passwordMismatch) setPasswordMismatch(false); }} required />
            {passwordMismatch && <p className="af-error-text">Passwords don't match.</p>}
          </div>

          <hr className="af-divider" />

          <div className="af-field">
            <div className="af-section-label">
              <Tractor size={13} />
              Ranch Location
            </div>
            <div className="af-input-wrap">
              <input
                className="af-input"
                placeholder="Start typing your address…"
                value={address}
                onChange={e => handleAddressChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                autoComplete="off"
              />
              {addressLoading && (
                <div className="af-input-spinner">
                  <Loader2 size={15} className="af-spinner" />
                </div>
              )}
              {showSuggestions && suggestions.length > 0 && (
                <div className="af-suggestions">
                  {suggestions.map((s, i) => (
                    <button key={i} type="button" className="af-suggestion-item" onMouseDown={() => selectSuggestion(s)}>
                      <MapPin size={13} style={{ flexShrink: 0, marginTop: 1, color: "#8A9A93" }} />
                      <span style={{ lineHeight: 1.4 }}>{s.display_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {geocodedLat !== null && geocodedLon !== null && (
              <div className="af-geocode-confirm">
                <CheckCircle2 size={14} style={{ color: "#2D6A4F", flexShrink: 0, marginTop: 1 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  {geocodeLabel && <p className="af-geocode-label">{geocodeLabel}</p>}
                  <p className="af-geocode-coords">{geocodedLat.toFixed(6)}, {geocodedLon.toFixed(6)}</p>
                </div>
                <button type="button" onClick={clearLocation} className="af-geocode-clear">
                  <XCircle size={14} />
                </button>
              </div>
            )}
          </div>

          <button type="submit" className="af-btn-primary">
            <span>Next: Set Up Pastures</span><ArrowRight size={15} />
          </button>
        </form>
      </>
    );
  }

  if (view === "pastures") {
    return (
      <>
        <h1 className="af-heading">Set up your pastures</h1>
        <p className="af-sub">
          Add the pastures, pens, or areas on your ranch. You can always manage these later in Settings.
        </p>

        {setupLocs.length > 0 && (
          <ul className="af-pasture-list">
            {setupLocs.map((loc, idx) => (
              <li key={idx} className="af-pasture-item">
                <MapPin size={13} style={{ color: "#2D6A4F", flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{loc}</span>
                <button
                  type="button"
                  onClick={() => setSetupLocs(prev => prev.filter((_, i) => i !== idx))}
                  className="af-pasture-remove"
                  aria-label="Remove"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="af-pasture-add-row">
          <input
            className="af-input"
            style={{ flex: 1 }}
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
            className="af-pasture-add-btn"
            onClick={() => {
              const trimmed = setupNewLocName.trim();
              if (trimmed) { setSetupLocs(prev => [...prev, trimmed]); setSetupNewLocName(""); }
            }}
            disabled={!setupNewLocName.trim()}
          >
            <Plus size={14} />
            Add
          </button>
        </div>

        <button className="af-btn-primary" onClick={() => handleFinishSetup(setupLocs)} disabled={signupMutation.isPending}>
          {signupMutation.isPending
            ? <Loader2 size={16} className="af-spinner" />
            : <><FolderOpen size={15} /><span>Enter RanchPad</span></>
          }
        </button>
        <button
          type="button"
          onClick={() => handleFinishSetup([])}
          disabled={signupMutation.isPending}
          className="af-skip-btn"
        >
          Skip for now
        </button>
      </>
    );
  }

  // view === "forgot"
  if (forgotSent) {
    return (
      <div className="af-success-block">
        <div className="af-success-icon">
          <CheckCircle2 size={20} style={{ color: "#2D6A4F" }} />
        </div>
        <p className="af-success-title">Check your email</p>
        <p className="af-success-desc">
          If an account exists for <strong style={{ color: "#1A3628" }}>{forgotEmail}</strong>, we sent a reset link. It expires in 1 hour.
        </p>
        <button className="af-btn-primary" onClick={() => { setView("login"); setForgotSent(false); setForgotEmail(""); }}>
          Back to Log In
        </button>
      </div>
    );
  }

  return (
    <>
      <h1 className="af-heading">Reset password</h1>
      <p className="af-sub">Enter your email and we'll send a reset link.</p>
      <form onSubmit={handleForgotPassword} className="af-fields">
        <div className="af-field">
          <label className="af-label" htmlFor="af-forgot-email">Email</label>
          <input id="af-forgot-email" className="af-input" type="email" placeholder="you@example.com" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required />
        </div>
        <button type="submit" className="af-btn-primary" disabled={forgotLoading}>
          {forgotLoading
            ? <Loader2 size={16} className="af-spinner" />
            : <><span>Send Reset Link</span><ArrowRight size={15} /></>
          }
        </button>
      </form>
      <p className="af-footer">
        Remember it?{" "}
        <button type="button" className="af-footer-link" onClick={() => setView("login")}>Log in</button>
      </p>
    </>
  );
}
