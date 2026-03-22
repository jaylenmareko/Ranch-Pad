import React, { useState, useRef } from "react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, XCircle, Tractor, MapPin } from "lucide-react";
import { HoofIcon } from "@/components/HoofIcon";
import { useLogin, useSignup } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type View = "login" | "signup" | "forgot";

export default function Login() {
  const [view, setView] = useState<View>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("signup") === "1" ? "signup" : "login";
  });
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [name, setName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMismatch, setPasswordMismatch] = useState(false);

  const [address, setAddress] = useState("");
  const [geocodedLat, setGeocodedLat] = useState<number | null>(null);
  const [geocodedLon, setGeocodedLon] = useState<number | null>(null);
  const [geocodeLabel, setGeocodeLabel] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { login: setAuthContext } = useAuth();
  const { toast } = useToast();
  const loginMutation = useLogin();
  const signupMutation = useSignup();

  function handleAddressChange(value: string) {
    setAddress(value);
    if (geocodedLat !== null) {
      setGeocodedLat(null);
      setGeocodedLon(null);
      setGeocodeLabel(null);
    }
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    if (value.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    suggestTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=5`,
          { headers: { "Accept-Language": "en" } }
        );
        const results: Array<{ display_name: string; lat: string; lon: string }> = await res.json();
        setSuggestions(results ?? []);
        setShowSuggestions((results ?? []).length > 0);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      }
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
      toast({ title: "Error", description: "Could not send reset email. Please try again.", variant: "destructive" });
    } finally {
      setForgotLoading(false);
    }
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    loginMutation.mutate(
      { data: { email: loginEmail, password: loginPassword } },
      {
        onSuccess: (data) => setAuthContext(data.token),
        onError: (error: Error) => {
          toast({ title: "Login Failed", description: error.message || "Invalid credentials. Please try again.", variant: "destructive" });
        },
      }
    );
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (signupPassword !== confirmPassword) {
      setPasswordMismatch(true);
      return;
    }
    setPasswordMismatch(false);
    if (geocodedLat === null || geocodedLon === null) {
      toast({ title: "Location required", description: "Enter your ranch address and select a suggestion before signing up.", variant: "destructive" });
      return;
    }
    signupMutation.mutate(
      { data: { email: signupEmail, password: signupPassword, name, lat: geocodedLat, lon: geocodedLon } },
      {
        onSuccess: (data) => setAuthContext(data.token),
        onError: (error: Error) => {
          toast({ title: "Signup Failed", description: error.message || "Could not create account.", variant: "destructive" });
        },
      }
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">

      {/* Brand mark */}
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
          <HoofIcon className="w-4.5 h-4.5" />
        </div>
        <span className="font-display font-bold text-xl tracking-tight text-foreground">RanchPad</span>
      </div>

      {/* Auth card */}
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-sm p-7">

        {/* ── Login ── */}
        {view === "login" && (
          <>
            <h1 className="text-lg font-semibold text-foreground mb-1">Welcome back</h1>
            <p className="text-sm text-muted-foreground mb-6">Sign in to your RanchPad account.</p>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password">Password</Label>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => setView("forgot")}
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  id="login-password"
                  type="password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" isLoading={loginMutation.isPending}>
                Sign In
                {!loginMutation.isPending && <ArrowRight className="w-4 h-4 ml-1.5" />}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-5">
              Don't have an account?{" "}
              <button
                type="button"
                className="font-semibold text-primary hover:underline"
                onClick={() => setView("signup")}
              >
                Sign up free
              </button>
            </p>
          </>
        )}

        {/* ── Sign Up ── */}
        {view === "signup" && (
          <>
            <h1 className="text-lg font-semibold text-foreground mb-1">Create your ranch</h1>
            <p className="text-sm text-muted-foreground mb-6">Free 14-day trial. No credit card required.</p>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="signup-name">Full Name</Label>
                <Input
                  id="signup-name"
                  placeholder="John Doe"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  value={signupEmail}
                  onChange={e => setSignupEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={signupPassword}
                  onChange={e => { setSignupPassword(e.target.value); if (passwordMismatch) setPasswordMismatch(false); }}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                <Input
                  id="signup-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); if (passwordMismatch) setPasswordMismatch(false); }}
                  required
                  className={cn(passwordMismatch && "border-destructive focus-visible:ring-destructive")}
                />
                {passwordMismatch && (
                  <p className="text-xs text-destructive font-medium">Passwords don't match.</p>
                )}
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
                        <button
                          key={i}
                          type="button"
                          className="w-full text-left flex items-start gap-2.5 px-3 py-2.5 text-sm hover:bg-muted transition-colors border-b border-border/40 last:border-b-0"
                          onMouseDown={() => selectSuggestion(s)}
                        >
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
                        {geocodeLabel && (
                          <p className="text-xs text-muted-foreground truncate mb-0.5">{geocodeLabel}</p>
                        )}
                        <p className="text-xs font-mono text-foreground">
                          {geocodedLat.toFixed(6)}, {geocodedLon.toFixed(6)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setGeocodedLat(null); setGeocodedLon(null); setGeocodeLabel(null); setAddress(""); setSuggestions([]); }}
                        className="p-0.5 rounded hover:bg-muted text-muted-foreground shrink-0"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" isLoading={signupMutation.isPending}>
                Create Ranch
                {!signupMutation.isPending && <ArrowRight className="w-4 h-4 ml-1.5" />}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-5">
              Already have an account?{" "}
              <button
                type="button"
                className="font-semibold text-primary hover:underline"
                onClick={() => setView("login")}
              >
                Log in
              </button>
            </p>
          </>
        )}

        {/* ── Forgot Password ── */}
        {view === "forgot" && (
          <>
            {forgotSent ? (
              <div className="flex flex-col items-center text-center gap-4 py-2">
                <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">Check your email</p>
                  <p className="text-sm text-muted-foreground">
                    If an account exists for <span className="font-medium text-foreground">{forgotEmail}</span>, we've sent a reset link. It expires in 1 hour.
                  </p>
                </div>
                <Button
                  className="w-full mt-2"
                  onClick={() => { setView("login"); setForgotSent(false); setForgotEmail(""); }}
                >
                  Back to Log In
                </Button>
              </div>
            ) : (
              <>
                <h1 className="text-lg font-semibold text-foreground mb-1">Reset password</h1>
                <p className="text-sm text-muted-foreground mb-6">Enter your email and we'll send a reset link.</p>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="forgot-email">Email</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="you@example.com"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" isLoading={forgotLoading}>
                    Send Reset Link
                    {!forgotLoading && <ArrowRight className="w-4 h-4 ml-1.5" />}
                  </Button>
                </form>
                <p className="text-center text-sm text-muted-foreground mt-5">
                  Remember it?{" "}
                  <button
                    type="button"
                    className="font-semibold text-primary hover:underline"
                    onClick={() => setView("login")}
                  >
                    Log in
                  </button>
                </p>
              </>
            )}
          </>
        )}
      </div>

      <footer className="mt-8 flex items-center gap-6">
        <a href="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms</a>
        <a href="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
      </footer>
    </div>
  );
}
