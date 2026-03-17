import React, { useState } from "react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { PawPrint, Tractor, ArrowRight, Search, CheckCircle2, XCircle, ShieldAlert } from "lucide-react";
import { useLogin, useSignup } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form state
  const [name, setName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [ranchName, setRanchName] = useState("");

  // Address geocoding state
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
          toast({ title: "Login Failed", description: error.message || "Invalid credentials.", variant: "destructive" });
        },
      }
    );
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    signupMutation.mutate(
      { data: { email: signupEmail, password: signupPassword, name, ranchName } },
      {
        onSuccess: async (data) => {
          localStorage.setItem("ranchpad_token", data.token);
          if (geocodedLat !== null && geocodedLon !== null) {
            try {
              await fetch("/api/ranch", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lat: geocodedLat, lon: geocodedLon }),
              });
            } catch {
              // Non-critical — user can set location in Settings
            }
          }
          setAuthContext(data.token);
        },
        onError: (error: Error) => {
          toast({ title: "Signup Failed", description: error.message || "Could not create account.", variant: "destructive" });
        },
      }
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">

      {/* ── Left: Hero Panel ── */}
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-primary/10 p-10 md:p-16">
        <img
          src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
          alt="Ranch landscape"
          className="absolute inset-0 h-full w-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-foreground/90 mix-blend-multiply" />

        <div className="relative z-10 max-w-md text-primary-foreground">
          {/* Logo */}
          <div className="mb-10 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 shadow-2xl backdrop-blur-md border border-white/20">
              <PawPrint className="h-8 w-8 text-white" />
            </div>
            <span className="font-display text-4xl font-black drop-shadow-lg">RanchPad</span>
          </div>

          {/* Description */}
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20">
                <PawPrint className="h-3.5 w-3.5 text-white" />
              </div>
              <p className="text-xl font-semibold text-white/90 leading-snug">
                Manage your livestock.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20">
                <ShieldAlert className="h-3.5 w-3.5 text-white" />
              </div>
              <p className="text-xl font-semibold text-white/90 leading-snug">
                Get AI alerts before disease hits your animals.
              </p>
            </li>
          </ul>
        </div>
      </div>

      {/* ── Right: CTA Panel ── */}
      <div className="flex flex-col items-center justify-center gap-6 p-10 md:w-96 md:p-16">
        <div className="w-full text-center mb-2">
          <h2 className="text-2xl font-black font-display text-foreground">Get started</h2>
          <p className="text-muted-foreground font-medium mt-1 text-sm">Your herd is waiting.</p>
        </div>

        <div className="flex gap-3 w-full">
          <Button
            size="lg"
            className="flex-1 gap-2"
            onClick={() => setShowSignup(true)}
          >
            Sign Up
            <ArrowRight className="w-5 h-5" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="flex-1"
            onClick={() => setShowLogin(true)}
          >
            Log In
          </Button>
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
      <Dialog open={showSignup} onOpenChange={setShowSignup} title="Create your ranch">
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
              onChange={e => setSignupPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-4 pt-2 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Tractor className="w-4 h-4 text-accent" />
              <span className="text-sm font-bold text-accent">Ranch Details</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-ranchName">Ranch Name</Label>
              <Input
                id="signup-ranchName"
                placeholder="e.g. Rolling Hills Ranch"
                value={ranchName}
                onChange={e => setRanchName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>
                Ranch Location{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
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
