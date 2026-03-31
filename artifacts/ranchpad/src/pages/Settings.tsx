import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { MapPin, Building2, Save, CheckCircle2, XCircle, Cog, Loader2, FolderOpen, Plus, Pencil, Trash2, ListChecks } from "lucide-react";
import { useGetRanch, useUpdateRanch } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

interface PastureLocation { id: number; name: string; }
interface HerdAnimal { id: number; name: string; tagNumber?: string | null; species: string; locationId?: number | null; }

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
  const [geocodeLabel, setGeocodeLabel] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [locations, setLocations] = useState<PastureLocation[]>([]);
  const [newLocName, setNewLocName] = useState("");
  const [addingLoc, setAddingLoc] = useState(false);
  const [editingLocId, setEditingLocId] = useState<number | null>(null);
  const [editLocName, setEditLocName] = useState("");
  const [savingLoc, setSavingLoc] = useState(false);

  const [assigningLocId, setAssigningLocId] = useState<number | null>(null);
  const [allAnimals, setAllAnimals] = useState<HerdAnimal[] | null>(null);
  const [selectedAnimalIds, setSelectedAnimalIds] = useState<Set<number>>(new Set());
  const [savingAssign, setSavingAssign] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetch("/api/locations").then(r => r.json()).then(setLocations).catch(() => {});
  }, [isAuthenticated]);

  // Sync checkbox selections whenever the assign panel opens or animals load
  useEffect(() => {
    if (allAnimals !== null && assigningLocId !== null) {
      setSelectedAnimalIds(new Set(allAnimals.filter(a => a.locationId === assigningLocId).map(a => a.id)));
    }
  }, [allAnimals, assigningLocId]);

  async function openAssignPanel(locId: number) {
    setAssigningLocId(locId);
    setEditingLocId(null);
    if (allAnimals !== null) {
      setSelectedAnimalIds(new Set(allAnimals.filter(a => a.locationId === locId).map(a => a.id)));
      return;
    }
    try {
      const res = await fetch("/api/animals");
      if (res.ok) setAllAnimals(await res.json());
    } catch { /* ignore */ }
  }

  async function saveAssignments() {
    if (assigningLocId == null) return;
    setSavingAssign(true);
    try {
      const res = await fetch("/api/animals/location", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId: assigningLocId, animalIds: Array.from(selectedAnimalIds) }),
      });
      if (res.ok) {
        const refreshed = await fetch("/api/animals");
        if (refreshed.ok) setAllAnimals(await refreshed.json());
        setAssigningLocId(null);
        toast({ title: `${selectedAnimalIds.size} ${selectedAnimalIds.size === 1 ? "animal" : "animals"} assigned` });
      }
    } finally {
      setSavingAssign(false);
    }
  }

  async function addLocation() {
    if (!newLocName.trim()) return;
    setAddingLoc(true);
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newLocName.trim() }),
      });
      if (res.ok) {
        const loc = await res.json();
        setLocations(prev => [...prev, loc]);
        setNewLocName("");
        toast({ title: "Location added — now assign animals" });
        await openAssignPanel(loc.id);
      }
    } finally {
      setAddingLoc(false);
    }
  }

  async function saveLocEdit(id: number) {
    if (!editLocName.trim()) return;
    setSavingLoc(true);
    try {
      const res = await fetch(`/api/locations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editLocName.trim() }),
      });
      if (res.ok) {
        const updated = await res.json();
        setLocations(prev => prev.map(l => l.id === id ? updated : l));
        setEditingLocId(null);
        toast({ title: "Location updated" });
      }
    } finally {
      setSavingLoc(false);
    }
  }

  async function deleteLocation(id: number) {
    const res = await fetch(`/api/locations/${id}`, { method: "DELETE" });
    if (res.ok) {
      setLocations(prev => prev.filter(l => l.id !== id));
      toast({ title: "Location removed" });
    }
  }

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

  function handleAddressChange(value: string) {
    setAddress(value);
    if (lat !== null) { setLat(null); setLon(null); setGeocodeLabel(null); }
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
    setLat(parseFloat(parseFloat(s.lat).toFixed(6)));
    setLon(parseFloat(parseFloat(s.lon).toFixed(6)));
    setGeocodeLabel(s.display_name);
    setSuggestions([]);
    setShowSuggestions(false);
  }

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

            <div className="relative">
              <Input
                value={address}
                onChange={e => handleAddressChange(e.target.value)}
                placeholder="Start typing your address…"
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                autoComplete="off"
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-popover shadow-lg overflow-hidden">
                  {suggestions.map((s, i) => (
                    <li
                      key={i}
                      onMouseDown={() => selectSuggestion(s)}
                      className="px-4 py-2.5 text-sm cursor-pointer hover:bg-muted text-foreground truncate border-b border-border last:border-0"
                    >
                      {s.display_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {lat !== null && lon !== null && (
              <div className="rounded-xl border p-4 space-y-2 bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
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
                    onClick={() => { setLat(null); setLon(null); setGeocodeLabel(null); setAddress(""); setSuggestions([]); }}
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
                No coordinates set — weather data won't be available until you select your location above.
              </p>
            )}
          </CardContent>
        </Card>

        <Button type="submit" className="w-full gap-2" isLoading={updateMutation.isPending}>
          <Save className="w-4 h-4" />
          Save Ranch Settings
        </Button>
      </form>

      {/* Pastures & Locations */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-primary" />
            Pastures &amp; Locations
          </h2>
          <p className="text-sm text-muted-foreground font-medium mt-0.5 ml-6">
            Tag animals to specific pastures or areas. Animals are then grouped by location in the Herd Directory.
          </p>
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-0">
            {locations.length === 0 ? (
              <p className="px-6 py-5 text-sm text-muted-foreground font-medium">
                No locations yet — add your first pasture or pen below.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {locations.map(loc => (
                  <li
                    key={loc.id}
                    className={assigningLocId === loc.id ? "px-4 py-4 space-y-3" : "flex items-center gap-3 px-4 py-3"}
                  >
                    {editingLocId === loc.id ? (
                      <>
                        <Input
                          value={editLocName}
                          onChange={e => setEditLocName(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); saveLocEdit(loc.id); } }}
                          className="flex-1 h-9"
                          autoFocus
                        />
                        <Button size="sm" onClick={() => saveLocEdit(loc.id)} isLoading={savingLoc} className="shrink-0">
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingLocId(null)} className="shrink-0">
                          Cancel
                        </Button>
                      </>
                    ) : assigningLocId === loc.id ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-foreground">{loc.name}</span>
                          <span className="text-xs text-muted-foreground font-medium">
                            {selectedAnimalIds.size} of {allAnimals?.length ?? "…"} selected
                          </span>
                        </div>
                        {allAnimals === null ? (
                          <div className="flex items-center gap-2 py-2 text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                            <span className="text-sm">Loading animals…</span>
                          </div>
                        ) : allAnimals.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-2">No animals in your herd yet.</p>
                        ) : (
                          <div className="max-h-52 overflow-y-auto rounded-xl border border-border divide-y divide-border">
                            {allAnimals.map(a => (
                              <label
                                key={a.id}
                                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedAnimalIds.has(a.id)}
                                  onChange={e => {
                                    setSelectedAnimalIds(prev => {
                                      const next = new Set(prev);
                                      if (e.target.checked) next.add(a.id);
                                      else next.delete(a.id);
                                      return next;
                                    });
                                  }}
                                  className="w-4 h-4 rounded accent-primary shrink-0"
                                />
                                <span className="text-sm font-semibold text-foreground truncate flex-1">{a.name}</span>
                                {a.tagNumber && (
                                  <span className="text-xs text-muted-foreground font-mono shrink-0">#{a.tagNumber}</span>
                                )}
                                <span className="text-xs text-muted-foreground shrink-0 ml-1">{a.species}</span>
                              </label>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={saveAssignments}
                            isLoading={savingAssign}
                            disabled={allAnimals === null}
                            className="shrink-0"
                          >
                            Save Assignments
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setAssigningLocId(null)} className="shrink-0">
                            Cancel
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm font-semibold text-foreground">{loc.name}</span>
                        <button
                          onClick={() => openAssignPanel(loc.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Assign animals to this location"
                        >
                          <ListChecks className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setEditingLocId(loc.id); setEditLocName(loc.name); setAssigningLocId(null); }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Edit location name"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteLocation(loc.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete location"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Input
            value={newLocName}
            onChange={e => setNewLocName(e.target.value)}
            placeholder="e.g. South Pasture, Barn, Lot A"
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addLocation(); } }}
          />
          <Button
            type="button"
            onClick={addLocation}
            isLoading={addingLoc}
            disabled={!newLocName.trim()}
            className="shrink-0 gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
