import React, { useRef, useState } from "react";
import { ArrowRight, CheckCircle2, XCircle, Tractor, MapPin, FolderOpen, Plus, X } from "lucide-react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLogin, useSignup } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type AuthView = "login" | "signup" | "forgot" | "pastures";

export interface AuthFormProps {
  initialView?: "login" | "signup";
  /** Called after auth is fully complete (login done, or pastures step finished/skipped). */
  onDone: () => void;
  /**
   * Called immediately when signup succeeds and the pastures step is about to show.
   * The parent can store this token so that if the container is dismissed early
   * (e.g. dialog closed), the user is still logged in — their account is already created.
   */
  onTokenReady?: (token: string) => void;
}

export function AuthForm({ initialView = "login", onDone, onTokenReady }: AuthFormProps) {
  const [view, setView] = useState<AuthView>(initialView);

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup fields
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
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  // Pasture setup (post-signup)
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [setupLocs, setSetupLocs] = useState<Array<{ id: number; name: string }>>([]);
  const [setupNewLocName, setSetupNewLocName] = useState("");
  const [setupAddingLoc, setSetupAddingLoc] = useState(false);

  const { login: setAuthContext } = useAuth();
  const { toast } = useToast();
  const loginMutation = useLogin();
  const signupMutation = useSignup();

  // ── Address autocomplete ──────────────────────────────────────────────────
  function handleAddressChange(value: string) {
    setAddress(value);
    if (geocodedLat !== null) { setGeocodedLat(null); setGeocodedLon(null); setGeocodeLabel(null); }
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    if (value.trim().length < 3) { setSuggestions([]); setShowSuggestions(false); return; }
    suggestTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=5`,
          { headers: { "Accept-Language": "en" } }
        );
        const results: Array<{ display_name: string; lat: string; lon: string }> = await res.json();
        setSuggestions(results ?? []);
        setShowSuggestions((results ?? []).length > 0);
      } catch { setSuggestions([]); setShowSuggestions(false); }
    }, 350);
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

  // ── Signup ────────────────────────────────────────────────────────────────
  function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (signupPassword !== confirmPassword) { setPasswordMismatch(true); return; }
    setPasswordMismatch(false);
    if (geocodedLat === null || geocodedLon === null) {
      toast({ title: "Location required", description: "Enter your ranch address and select a suggestion.", variant: "destructive" });
      return;
    }
    signupMutation.mutate(
      { data: { email: signupEmail, password: signupPassword, name, lat: geocodedLat, lon: geocodedLon } },
      {
        onSuccess: (data) => {
          setPendingToken(data.token);
          onTokenReady?.(data.token);
          setView("pastures");
        },
        onError: (error: Error) => {
          toast({ title: "Signup Failed", description: error.message || "Could not create account.", variant: "destructive" });
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

  // ── Pasture setup ─────────────────────────────────────────────────────────
  async function addSetupLocation() {
    if (!setupNewLocName.trim() || !pendingToken) return;
    setSetupAddingLoc(true);
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${pendingToken}` },
        body: JSON.stringify({ name: setupNewLocName.trim() }),
      });
      if (res.ok) {
        const loc = await res.json();
        setSetupLocs(prev => [...prev, loc]);
        setSetupNewLocName("");
      }
    } finally {
      setSetupAddingLoc(false);
    }
  }

  async function removeSetupLocation(id: number) {
    if (!pendingToken) return;
    const res = await fetch(`/api/locations/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${pendingToken}` },
    });
    if (res.ok) setSetupLocs(prev => prev.filter(l => l.id !== id));
  }

  function handleFinishSetup() {
    if (pendingToken) setAuthContext(pendingToken);
    onDone();
  }

  // ── Views ─────────────────────────────────────────────────────────────────

  if (view === "login") {
    return (
      <>
        <h1 className="text-lg font-semibold text-foreground mb-1">Welcome back</h1>
        <p className="text-sm text-muted-foreground mb-6">Sign in to your RanchPad account.</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="af-login-email">Email</Label>
            <Input id="af-login-email" type="email" placeholder="you@example.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="af-login-password">Password</Label>
              <button type="button" className="text-xs text-muted-foreground hover:text-primary transition-colors" onClick={() => setView("forgot")}>
                Forgot password?
              </button>
            </div>
            <Input id="af-login-password" type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" isLoading={loginMutation.isPending}>
            Sign In {!loginMutation.isPending && <ArrowRight className="w-4 h-4 ml-1.5" />}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-5">
          Don't have an account?{" "}
          <button type="button" className="font-semibold text-primary hover:underline" onClick={() => setView("signup")}>
            Sign up free
          </button>
        </p>
      </>
    );
  }

  if (view === "signup") {
    return (
      <>
        <h1 className="text-lg font-semibold text-foreground mb-1">Create your ranch</h1>
        <p className="text-sm text-muted-foreground mb-6">Free 14-day trial. No credit card required.</p>
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="af-name">Full Name</Label>
            <Input id="af-name" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="af-email">Email</Label>
            <Input id="af-email" type="email" placeholder="you@example.com" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="af-password">Password</Label>
            <Input id="af-password" type="password" value={signupPassword} onChange={e => { setSignupPassword(e.target.value); if (passwordMismatch) setPasswordMismatch(false); }} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="af-confirm">Confirm Password</Label>
            <Input id="af-confirm" type="password" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); if (passwordMismatch) setPasswordMismatch(false); }} required className={cn(passwordMismatch && "border-destructive focus-visible:ring-destructive")} />
            {passwordMismatch && <p className="text-xs text-destructive font-medium">Passwords don't match.</p>}
          </div>
          <div className="space-y-1.5 pt-2 border-t border-border">
            <div className="flex items-center gap-1.5 pt-2 mb-1">
              <Tractor className="w-4 h-4 text-primary" />
              <Label className="text-primary font-semibold text-xs uppercase tracking-wide">Ranch Location</Label>
            </div>
            <div className="relative">
              <Input
                placeholder="Start typing your address…"
                value={address}
                onChange={e => handleAddressChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                autoComplete="off"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 top-full mt-1 left-0 right-0 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                  {suggestions.map((s, i) => (
                    <button key={i} type="button" className="w-full text-left flex items-start gap-2.5 px-3 py-2.5 text-sm hover:bg-muted transition-colors border-b border-border/40 last:border-b-0" onMouseDown={() => selectSuggestion(s)}>
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="text-foreground/85 leading-snug line-clamp-2">{s.display_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {geocodedLat !== null && geocodedLon !== null && (
              <div className="rounded-lg border bg-green-50/60 border-green-200 p-2.5">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    {geocodeLabel && <p className="text-xs text-muted-foreground truncate mb-0.5">{geocodeLabel}</p>}
                    <p className="text-xs font-mono text-foreground">{geocodedLat.toFixed(6)}, {geocodedLon.toFixed(6)}</p>
                  </div>
                  <button type="button" onClick={clearLocation} className="p-0.5 rounded hover:bg-muted text-muted-foreground shrink-0">
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
          <Button type="submit" className="w-full" isLoading={signupMutation.isPending}>
            Create Ranch {!signupMutation.isPending && <ArrowRight className="w-4 h-4 ml-1.5" />}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-5">
          Already have an account?{" "}
          <button type="button" className="font-semibold text-primary hover:underline" onClick={() => setView("login")}>Log in</button>
        </p>
      </>
    );
  }

  if (view === "pastures") {
    return (
      <>
        <h1 className="text-lg font-semibold text-foreground mb-1">Set up your pastures</h1>
        <p className="text-sm text-muted-foreground mb-5">
          Add the pastures, pens, or areas on your ranch. You can always manage these later in Settings.
        </p>

        {setupLocs.length > 0 && (
          <ul className="rounded-xl border border-border divide-y divide-border overflow-hidden mb-3">
            {setupLocs.map(loc => (
              <li key={loc.id} className="flex items-center gap-2.5 px-3 py-2.5">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="flex-1 text-sm font-medium text-foreground">{loc.name}</span>
                <button type="button" onClick={() => removeSetupLocation(loc.id)} className="p-0.5 rounded text-muted-foreground hover:text-destructive transition-colors" aria-label="Remove">
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-2 mb-5">
          <Input
            placeholder="e.g. South Pasture, Barn, Lot A"
            value={setupNewLocName}
            onChange={e => setSetupNewLocName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSetupLocation(); } }}
            className="flex-1"
            autoFocus
          />
          <Button type="button" onClick={addSetupLocation} isLoading={setupAddingLoc} disabled={!setupNewLocName.trim()} className="shrink-0 gap-1">
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>

        <Button className="w-full mb-3" onClick={handleFinishSetup}>
          <FolderOpen className="w-4 h-4 mr-1.5" />
          Enter RanchPad
        </Button>
        <button type="button" onClick={handleFinishSetup} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center block">
          Skip for now
        </button>
      </>
    );
  }

  // view === "forgot"
  if (forgotSent) {
    return (
      <div className="flex flex-col items-center text-center gap-4 py-2">
        <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <p className="font-semibold text-foreground mb-1">Check your email</p>
          <p className="text-sm text-muted-foreground">
            If an account exists for <span className="font-medium text-foreground">{forgotEmail}</span>, we sent a reset link. It expires in 1 hour.
          </p>
        </div>
        <Button className="w-full mt-2" onClick={() => { setView("login"); setForgotSent(false); setForgotEmail(""); }}>
          Back to Log In
        </Button>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-lg font-semibold text-foreground mb-1">Reset password</h1>
      <p className="text-sm text-muted-foreground mb-6">Enter your email and we'll send a reset link.</p>
      <form onSubmit={handleForgotPassword} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="af-forgot-email">Email</Label>
          <Input id="af-forgot-email" type="email" placeholder="you@example.com" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required />
        </div>
        <Button type="submit" className="w-full" isLoading={forgotLoading}>
          Send Reset Link {!forgotLoading && <ArrowRight className="w-4 h-4 ml-1.5" />}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground mt-5">
        Remember it?{" "}
        <button type="button" className="font-semibold text-primary hover:underline" onClick={() => setView("login")}>Log in</button>
      </p>
    </>
  );
}
