import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { MapPin, Building2, Save, Search, CheckCircle2, XCircle, User, LogOut, KeyRound } from "lucide-react";
import { useGetRanch, useUpdateRanch } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface UserProfile {
  id: number;
  name: string;
  email: string;
}

export default function Settings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { logout } = useAuth();
  const { data: ranch, isLoading } = useGetRanch();

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);

  const [address, setAddress] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeLabel, setGeocodeLabel] = useState<string | null>(null);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingName, setIsSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (ranch) {
      setName(ranch.name ?? "");
      setCity(ranch.locationCity ?? "");
      setState(ranch.locationState ?? "");
      setLat(ranch.lat ?? null);
      setLon(ranch.lon ?? null);
    }
  }, [ranch]);

  useEffect(() => {
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
  }, []);

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

  async function handleGeocode() {
    if (!address.trim()) return;
    setIsGeocoding(true);
    setGeocodeLabel(null);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
      const res = await fetch(url, { headers: { "Accept-Language": "en" } });
      const results = await res.json();
      if (!results || results.length === 0) {
        toast({ title: "Address not found", description: "Try a more specific address or check for typos.", variant: "destructive" });
        return;
      }
      const { lat: foundLat, lon: foundLon, display_name } = results[0];
      setLat(parseFloat(parseFloat(foundLat).toFixed(6)));
      setLon(parseFloat(parseFloat(foundLon).toFixed(6)));
      setGeocodeLabel(display_name);
    } catch {
      toast({ title: "Geocode failed", description: "Could not reach the location service. Try again.", variant: "destructive" });
    } finally {
      setIsGeocoding(false);
    }
  }

  const updateMutation = useUpdateRanch({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/ranch"] });
        toast({ title: "Settings saved", description: "Your ranch profile has been updated." });
      },
      onError: () => {
        toast({ title: "Save failed", description: "Something went wrong. Try again.", variant: "destructive" });
      },
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateMutation.mutate({
      data: {
        name: name || undefined,
        locationCity: city || null,
        locationState: state || null,
        lat: lat ?? null,
        lon: lon ?? null,
      },
    });
  }

  if (isLoading) {
    return <div className="p-12 text-center text-muted-foreground animate-pulse font-bold">Loading settings...</div>;
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-black font-display text-foreground">Settings</h1>
        <p className="text-muted-foreground font-medium mt-1">Manage your account and ranch profile.</p>
      </div>

      {/* Your Account */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <User className="w-5 h-5 text-primary" />
            Your Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingProfile ? (
            <p className="text-sm text-muted-foreground animate-pulse font-medium">Loading account info...</p>
          ) : (
            <form onSubmit={handleSaveName} className="space-y-4">
              <div className="space-y-2">
                <Label>Display Name</Label>
                <div className="flex gap-2">
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    required
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    variant="secondary"
                    isLoading={isSavingName}
                    disabled={isSavingName || displayName.trim() === (userProfile?.name ?? "")}
                    className="shrink-0"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={userProfile?.email ?? ""}
                  readOnly
                  disabled
                  className="bg-muted/50 text-muted-foreground cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground font-medium">Email cannot be changed at this time.</p>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <KeyRound className="w-5 h-5 text-primary" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                required
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                required
                autoComplete="new-password"
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-destructive font-medium">Passwords do not match.</p>
              )}
            </div>
            <Button
              type="submit"
              variant="secondary"
              isLoading={isChangingPassword}
              disabled={
                isChangingPassword ||
                !currentPassword ||
                newPassword.length < 6 ||
                newPassword !== confirmPassword
              }
              className="w-full gap-2"
            >
              <KeyRound className="w-4 h-4" />
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Ranch Info */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <Building2 className="w-5 h-5 text-primary" />
              Ranch Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Ranch Name</Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Double Bar Ranch"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="e.g. Wichita"
                />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input
                  value={state}
                  onChange={e => setState(e.target.value)}
                  placeholder="e.g. Kansas"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <MapPin className="w-5 h-5 text-primary" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground font-medium">
              Enter your ranch address to automatically find coordinates. These are used for weather data and AI alerts.
            </p>

            <div className="flex gap-2">
              <Input
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="e.g. 1234 County Road, Wichita, KS 67202"
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleGeocode(); } }}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleGeocode}
                isLoading={isGeocoding}
                className="shrink-0"
              >
                <Search className="w-4 h-4 mr-2" />
                Find
              </Button>
            </div>

            {/* Result */}
            {lat !== null && lon !== null && (
              <div className={`rounded-xl border p-4 space-y-2 ${geocodeLabel ? "bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800" : "bg-muted/40 border-border"}`}>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    {geocodeLabel && (
                      <p className="text-xs text-muted-foreground font-medium truncate mb-1">{geocodeLabel}</p>
                    )}
                    <p className="text-sm font-bold text-foreground font-mono">
                      {lat.toFixed(6)}, {lon.toFixed(6)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setLat(null); setLon(null); setGeocodeLabel(null); setAddress(""); }}
                    className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
                    title="Clear coordinates"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {lat === null && lon === null && (
              <p className="text-xs text-muted-foreground font-medium">
                No coordinates set — weather data won't be available until you search for your location.
              </p>
            )}
          </CardContent>
        </Card>

        <Button type="submit" className="w-full gap-2" isLoading={updateMutation.isPending}>
          <Save className="w-4 h-4" />
          Save Ranch Settings
        </Button>
      </form>

      {/* Log Out */}
      <div className="border-t pt-6">
        <Button
          variant="destructive"
          className="w-full gap-2"
          onClick={logout}
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </Button>
      </div>
    </div>
  );
}
