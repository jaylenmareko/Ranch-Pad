import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { PawPrint, Tractor, ArrowRight, Search, CheckCircle2, XCircle } from "lucide-react";
import { useLogin, useSignup } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form
  const [name, setName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [ranchName, setRanchName] = useState("");

  // Address geocoding
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
    if (geocodedLat === null || geocodedLon === null) {
      toast({ title: "Location required", description: "Enter your ranch address and click Find before signing up.", variant: "destructive" });
      return;
    }
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

      {/* ── Left: Hero Image Panel ── */}
      <div className="hidden md:flex flex-1 relative bg-primary/10 overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-foreground/90" />
        <div className="relative z-10 text-center p-12 text-primary-foreground">
          <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl border border-white/20">
            <PawPrint className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-display font-black mb-4 drop-shadow-lg">RanchPad</h1>
          <p className="text-xl font-medium text-white/80 max-w-md mx-auto">
            Manage your livestock and get AI alerts before disease hits your animals.
          </p>
        </div>
      </div>

      {/* ── Right: CTA Panel ── */}
      <div className="md:w-[40%] flex flex-col items-center justify-center p-6 sm:p-10 relative overflow-hidden">
        {/* Mobile background */}
        <div className="absolute top-0 left-0 right-0 h-64 bg-primary md:hidden rounded-b-[40px] -z-10" />

        <div className="w-full max-w-md animate-in space-y-6">
          {/* Mobile logo */}
          <div className="md:hidden flex items-center justify-center gap-3 mb-2 text-primary-foreground">
            <PawPrint className="w-8 h-8" />
            <span className="font-display font-bold text-3xl">RanchPad</span>
          </div>

          <Card className="border-0 shadow-2xl shadow-black/5 md:border md:shadow-xl rounded-3xl overflow-hidden bg-primary/10 bg-gradient-to-br from-primary/80 to-foreground/90">
            <CardHeader className="pt-8 pb-4 text-center">
              <CardTitle className="text-3xl text-primary-foreground">Welcome</CardTitle>
              <CardDescription className="text-base text-primary-foreground/70">
                Livestock management for modern ranches.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-8">
              <div className="flex gap-3">
                <Button
                  size="lg"
                  className="flex-1 whitespace-nowrap bg-white text-primary hover:bg-white/90"
                  onClick={() => setShowSignup(true)}
                >
                  Sign Up
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1 whitespace-nowrap border-white/50 text-white hover:bg-white/10 hover:text-white"
                  onClick={() => setShowLogin(true)}
                >
                  Log In
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Mobile feature highlights */}
          <div className="md:hidden space-y-3 pt-2">
            {[
              { icon: "🐄", title: "Track Your Herd", desc: "Manage every animal — tags, health, age, and breed in one place." },
              { icon: "⚠️", title: "AI Health Alerts", desc: "Get notified before disease spreads through your livestock." },
              { icon: "🌤️", title: "Ranch Weather", desc: "Live forecast tailored to your ranch location." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4 p-4 bg-card rounded-2xl border border-border shadow-sm">
                <span className="text-2xl mt-0.5">{icon}</span>
                <div>
                  <p className="font-bold text-foreground">{title}</p>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
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

          <div className="space-y-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Tractor className="w-5 h-5 text-accent" />
              <Label className="text-accent font-bold">Ranch Details</Label>
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
