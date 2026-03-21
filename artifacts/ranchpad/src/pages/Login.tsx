import React, { useState } from "react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SimpleDialog as Dialog } from "@/components/ui/dialog";
import { Tractor, ArrowRight, Search, CheckCircle2, XCircle } from "lucide-react";
import { HoofIcon } from "@/components/HoofIcon";
import { useLogin, useSignup } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [name, setName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMismatch, setPasswordMismatch] = useState(false);

  const [address, setAddress] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodedLat, setGeocodedLat] = useState<number | null>(null);
  const [geocodedLon, setGeocodedLon] = useState<number | null>(null);
  const [geocodeLabel, setGeocodeLabel] = useState<string | null>(null);

  const { login: setAuthContext } = useAuth();
  const { toast } = useToast();
  const loginMutation = useLogin();
  const signupMutation = useSignup();

  async function handleGeocode() {
    if (!address.trim()) return;
    setIsGeocoding(true);
    setGeocodeLabel(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const results = await res.json();
      if (!results || results.length === 0) {
        toast({ title: "Address not found", description: "Try a more specific address.", variant: "destructive" });
        return;
      }
      const { lat, lon, display_name } = results[0];
      setGeocodedLat(parseFloat(parseFloat(lat).toFixed(6)));
      setGeocodedLon(parseFloat(parseFloat(lon).toFixed(6)));
      setGeocodeLabel(display_name);
    } catch {
      toast({ title: "Geocode failed", description: "Could not reach the location service.", variant: "destructive" });
    } finally {
      setIsGeocoding(false);
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
      toast({ title: "Location required", description: "Enter your ranch address and click Find before signing up.", variant: "destructive" });
      return;
    }
    signupMutation.mutate(
      { data: { email: signupEmail, password: signupPassword, name, lat: geocodedLat, lon: geocodedLon } },
      {
        onSuccess: (data) => {
          setAuthContext(data.token);
        },
        onError: (error: Error) => {
          toast({ title: "Signup Failed", description: error.message || "Could not create account.", variant: "destructive" });
        },
      }
    );
  }

  const shadow = "0 1px 3px rgba(0,0,0,0.45)";

  const heroContent = (
    <div className="flex flex-col items-center text-center px-6 max-w-lg w-full">
      {/* Barn icon */}
      <div className="w-16 h-16 md:w-20 md:h-20 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 border border-white/25">
        <HoofIcon className="w-8 h-8 md:w-10 md:h-10 text-white" />
      </div>

      {/* Wordmark */}
      <h1
        className="text-6xl md:text-7xl font-display font-bold text-white mb-3 tracking-wide leading-none"
        style={{ textShadow: shadow }}
      >
        RanchPad
      </h1>

      {/* Tagline */}
      <p
        className="text-base md:text-lg font-sans font-normal text-white/85 mb-8 tracking-widest uppercase"
        style={{ textShadow: shadow, letterSpacing: "0.18em" }}
      >
        Livestock Management
      </p>

      {/* Bullet features */}
      <ul className="w-full max-w-xs mb-10 space-y-4 text-left list-none">
        {[
          "Simple herd log for animals, treatments, and health.",
          "Get early warnings when local conditions raise disease risk.",
          "Get reminders so you never miss shots or treatments.",
        ].map((text) => (
          <li key={text} className="flex items-start gap-3">
            <span
              className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center"
              aria-hidden="true"
            >
              <svg viewBox="0 0 8 8" className="w-2.5 h-2.5">
                <path d="M1.5 4l2 2 3-3.5" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </span>
            <span
              className="text-sm md:text-base text-white/90 font-sans leading-snug"
              style={{ textShadow: shadow }}
            >
              {text}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA buttons */}
      <div className="flex gap-3 w-full max-w-xs">
        <Button
          size="lg"
          className="flex-1 bg-white text-primary font-semibold hover:bg-white/95 font-sans"
          onClick={() => setShowSignup(true)}
        >
          Sign Up
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="flex-1 border-white/60 text-white hover:bg-white/10 hover:text-white font-sans"
          onClick={() => setShowLogin(true)}
        >
          Log In
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">

      {/* ══════════════ HERO ══════════════ */}
      <div
        className="relative min-h-screen overflow-hidden flex flex-col text-white"
        style={{
          backgroundImage: "url('/ranch-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/32" />
        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center py-16 px-4">
          {heroContent}
        </div>
        {/* Footer */}
        <footer className="relative z-10 pb-6 flex items-center justify-center gap-6">
          <a href="/terms"   className="text-xs text-white/50 hover:text-white/80 transition-colors font-sans tracking-wide">Terms</a>
          <a href="/privacy" className="text-xs text-white/50 hover:text-white/80 transition-colors font-sans tracking-wide">Privacy</a>
        </footer>
      </div>

      {/* ── Login Modal ── */}
      <Dialog open={showLogin} onOpenChange={setShowLogin} title="Welcome back">
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="login-email">Email Address</Label>
            <Input
              id="login-email"
              type="email"
              placeholder="john@ranch.com"
              value={loginEmail}
              onChange={e => setLoginEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              type="password"
              value={loginPassword}
              onChange={e => setLoginPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" size="lg" isLoading={loginMutation.isPending}>
            Sign In
            {!loginMutation.isPending && <ArrowRight className="w-5 h-5 ml-2" />}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <button
              type="button"
              className="font-bold text-primary hover:underline"
              onClick={() => { setShowLogin(false); setShowSignup(true); }}
            >
              Sign up
            </button>
          </p>
        </form>
      </Dialog>

      {/* ── Signup Modal ── */}
      <Dialog open={showSignup} onOpenChange={(open) => { setShowSignup(open); if (!open) { setConfirmPassword(""); setPasswordMismatch(false); } }} title="Create your ranch">
        <form onSubmit={handleSignup} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="signup-name">Full Name</Label>
            <Input
              id="signup-name"
              placeholder="John Doe"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-email">Email Address</Label>
            <Input
              id="signup-email"
              type="email"
              placeholder="john@ranch.com"
              value={signupEmail}
              onChange={e => setSignupEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-password">Password</Label>
            <Input
              id="signup-password"
              type="password"
              value={signupPassword}
              onChange={e => { setSignupPassword(e.target.value); if (passwordMismatch) setPasswordMismatch(false); }}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-confirm-password">Confirm Password</Label>
            <Input
              id="signup-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={e => { setConfirmPassword(e.target.value); if (passwordMismatch) setPasswordMismatch(false); }}
              required
              className={passwordMismatch ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {passwordMismatch && (
              <p className="text-sm text-destructive font-medium">Passwords don't match.</p>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Tractor className="w-5 h-5 text-accent" />
              <Label className="text-accent font-bold">Ranch Details</Label>
            </div>
            <div className="space-y-2">
              <Label>Ranch Location</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. 1234 County Rd, Wichita, KS"
                  value={address}
                  onChange={e => {
                    setAddress(e.target.value);
                    if (geocodedLat !== null) {
                      setGeocodedLat(null);
                      setGeocodedLon(null);
                      setGeocodeLabel(null);
                    }
                  }}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleGeocode(); } }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleGeocode}
                  isLoading={isGeocoding}
                  disabled={!address.trim()}
                  className="shrink-0"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              {geocodedLat !== null && geocodedLon !== null && (
                <div className="rounded-xl border bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800 p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      {geocodeLabel && (
                        <p className="text-xs text-muted-foreground truncate mb-0.5">{geocodeLabel}</p>
                      )}
                      <p className="text-xs font-bold font-mono text-foreground">
                        {geocodedLat.toFixed(6)}, {geocodedLon.toFixed(6)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setGeocodedLat(null); setGeocodedLon(null); setGeocodeLabel(null); setAddress(""); }}
                      className="p-0.5 rounded-full hover:bg-muted text-muted-foreground shrink-0"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" isLoading={signupMutation.isPending}>
            Create Ranch
            {!signupMutation.isPending && <ArrowRight className="w-5 h-5 ml-2" />}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <button
              type="button"
              className="font-bold text-primary hover:underline"
              onClick={() => { setShowSignup(false); setShowLogin(true); }}
            >
              Log in
            </button>
          </p>
        </form>
      </Dialog>
    </div>
  );
}
