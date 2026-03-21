import React, { useState } from "react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SimpleDialog as Dialog } from "@/components/ui/dialog";
import { Tractor, ArrowRight, Search, CheckCircle2, XCircle } from "lucide-react";
import { HoofIcon } from "@/components/HoofIcon";
import { KansasSkyBackground } from "@/components/KansasSkyBackground";
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

  const heroContent = (
    <div className="relative z-10 flex flex-col items-center text-center px-10 py-10 rounded-3xl"
         style={{ background: "radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.10) 55%, rgba(0,0,0,0) 78%)" }}>
      {/* Barn icon in frosted glass tile */}
      <div className="w-20 h-20 md:w-24 md:h-24 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center mb-5 shadow-2xl border border-white/20">
        <HoofIcon className="w-10 h-10 md:w-12 md:h-12 text-white" />
      </div>

      {/* Wordmark */}
      <h1
        className="text-5xl md:text-6xl font-display font-black text-white mb-3 tracking-tight"
        style={{ textShadow: "0 2px 24px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.7)" }}
      >
        RanchPad
      </h1>

      {/* Subtitle */}
      <p
        className="text-lg md:text-xl font-semibold text-white/90 mb-3 max-w-xs md:max-w-md"
        style={{ textShadow: "0 1px 12px rgba(0,0,0,0.60)" }}
      >
        Livestock management web app
      </p>

      {/* Bullet features */}
      <ul
        className="text-sm md:text-base text-white/80 max-w-xs md:max-w-sm mb-8 space-y-2 text-left list-none"
        style={{ textShadow: "0 1px 8px rgba(0,0,0,0.55)" }}
      >
        <li className="flex items-start gap-2"><span className="mt-0.5 text-amber-300">•</span><span>Simple herd log for animals, treatments, and health.</span></li>
        <li className="flex items-start gap-2"><span className="mt-0.5 text-amber-300">•</span><span>Get early warnings when local conditions raise disease risk.</span></li>
        <li className="flex items-start gap-2"><span className="mt-0.5 text-amber-300">•</span><span>Get reminders so you never miss shots or treatments.</span></li>
      </ul>

      {/* CTA buttons */}
      <div className="flex gap-3 w-full max-w-sm">
        <Button
          size="lg"
          className="flex-1 bg-white text-primary font-bold hover:bg-white/92 shadow-xl"
          onClick={() => setShowSignup(true)}
        >
          Sign Up
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="flex-1 border-white/50 text-white hover:bg-white/10 hover:text-white backdrop-blur-sm shadow-xl"
          onClick={() => setShowLogin(true)}
        >
          Log In
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">

      {/* ══════════════ MOBILE ══════════════ */}
      <div className="md:hidden relative min-h-screen overflow-hidden flex flex-col text-white">
        <KansasSkyBackground />
        {/* Content sits in the sky (upper ~60%) */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center pb-40">
          {heroContent}
        </div>
      </div>

      {/* ══════════════ DESKTOP ══════════════ */}
      <div className="hidden md:flex relative min-h-screen overflow-hidden flex-col text-white">
        <KansasSkyBackground />
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center pb-40">
          {heroContent}
        </div>
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
