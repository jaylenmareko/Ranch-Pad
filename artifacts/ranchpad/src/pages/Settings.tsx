import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { MapPin, Building2, Save, Search, CheckCircle2, XCircle, Cog, Loader2 } from "lucide-react";
import { useGetRanch, useUpdateRanch } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

export default function Settings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isAuthenticated, role } = useAuth();
  const [, setLocation] = useLocation();
  const { data: ranch, isLoading } = useGetRanch({ query: { enabled: isAuthenticated } });

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);

  const [address, setAddress] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeLabel, setGeocodeLabel] = useState<string | null>(null);

  useEffect(() => {
    if (ranch) {
      setName(ranch.name ?? "");
      setCity(ranch.locationCity ?? "");
      setState(ranch.locationState ?? "");
      setLat(ranch.lat ?? null);
      setLon(ranch.lon ?? null);
    }
  }, [ranch]);

  // Redirect non-owners to account settings
  useEffect(() => {
    if (isAuthenticated && role && role !== "owner") {
      setLocation("/account");
    }
  }, [isAuthenticated, role, setLocation]);

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-black text-foreground whitespace-nowrap">Ranch Settings</h1>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-5">
            <Cog className="w-10 h-10 text-primary/50" />
          </div>
          <h2 className="font-bold text-xl text-foreground mb-2">Ranch Settings</h2>
          <p className="text-muted-foreground text-sm max-w-xs mb-8 leading-relaxed">
            Sign in as a ranch owner to manage your ranch name and location.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading || !role) {
    return (
      <div className="flex items-center gap-2 p-12 text-muted-foreground animate-pulse">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="font-bold text-sm">Loading...</span>
      </div>
    );
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

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-black font-display text-foreground whitespace-nowrap">Ranch Settings</h1>
        <p className="text-muted-foreground font-medium mt-1">Manage your ranch name and location.</p>
      </div>

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
                    className="p-1 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
                    title="Clear coordinates"
                    aria-label="Clear coordinates"
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
    </div>
  );
}
