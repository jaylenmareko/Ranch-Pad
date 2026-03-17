import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { MapPin, Building2, Save } from "lucide-react";
import { useGetRanch, useUpdateRanch } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: ranch, isLoading } = useGetRanch();

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");

  useEffect(() => {
    if (ranch) {
      setName(ranch.name ?? "");
      setCity(ranch.locationCity ?? "");
      setState(ranch.locationState ?? "");
      setLat(ranch.lat != null ? String(ranch.lat) : "");
      setLon(ranch.lon != null ? String(ranch.lon) : "");
    }
  }, [ranch]);

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
        lat: lat !== "" ? parseFloat(lat) : null,
        lon: lon !== "" ? parseFloat(lon) : null,
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
        <p className="text-muted-foreground font-medium mt-1">Manage your ranch profile and location.</p>
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
              Location Coordinates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground font-medium">
              Required for weather data and weather alerts. Find your coordinates on{" "}
              <span className="font-bold text-foreground">Google Maps</span> by right-clicking your ranch location — the lat/lon appears at the top of the menu.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Latitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={lat}
                  onChange={e => setLat(e.target.value)}
                  placeholder="e.g. 37.6872"
                />
              </div>
              <div className="space-y-2">
                <Label>Longitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={lon}
                  onChange={e => setLon(e.target.value)}
                  placeholder="e.g. -97.3301"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full gap-2" isLoading={updateMutation.isPending}>
          <Save className="w-4 h-4" />
          Save Settings
        </Button>
      </form>
    </div>
  );
}
