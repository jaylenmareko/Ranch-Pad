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
      const ranchLat = ranch.lat ?? null;
      const ranchLon = ranch.lon ?? null;
      setLat(ranchLat);
      setLon(ranchLon);

      // Reverse-geocode to populate the address input with the saved location
      if (ranchLat !== null && ranchLon !== null) {
        fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${ranchLat}&lon=${ranchLon}&format=json`,
          { headers: { "User-Agent": "RanchPad/1.0" } }
        )
          .then(r => r.json())
          .then(data => {
            if (data.display_name) {
              setGeocodeLabel(data.display_name);
            }
          })
          .catch(() => {});
      }
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
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=5`,
          { headers: { "Accept-Language": "en" }, signal: controller.signal }
        );
        clearTimeout(timeout);
        const results: Array<{ display_name: string; lat: string; lon: string }> = await res.json();
        setSuggestions(results ?? []);
        setShowSuggestions((results ?? []).length > 0);
      } catch {
        clearTimeout(timeout);
        setSuggestions([]);
        setShowSuggestions(false);
        toast({ title: "Poor signal", description: "Couldn't load address suggestions — move to better coverage and try again." });
      }
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
        lat: lat ?? null,
        lon: lon ?? null,
      },
    });
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-black font-display text-foreground whitespace-nowrap">Ranch Settings</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Ranch Info */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold">
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
          </CardContent>
        </Card>

        {/* Location */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold">
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Address display */}
            {lat !== null && lon !== null && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Current Address</Label>
                <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2.5">
                  <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="flex-1 text-sm text-foreground font-medium leading-snug min-w-0 break-words">
                    {geocodeLabel ?? `${lat.toFixed(6)}, ${lon.toFixed(6)}`}
                  </p>
                  <button
                    type="button"
                    onClick={() => { setLat(null); setLon(null); setGeocodeLabel(null); setAddress(""); setSuggestions([]); }}
                    className="p-1 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
                    title="Clear location"
                    aria-label="Clear location"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* New address search */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {lat !== null ? "Enter New Address" : "Address"}
              </Label>
              <div className="relative">
                <Input
                  value={address}
                  onChange={e => handleAddressChange(e.target.value)}
                  placeholder="Enter new address…"
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
            </div>

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
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold">
            Pastures &amp; Locations
          </CardTitle>
          <p className="text-sm text-muted-foreground font-medium">
            Tag animals to specific pastures or areas. Animals are then grouped by location in the Herd Directory.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {locations.length === 0 ? (
            <p className="text-sm text-muted-foreground font-medium">
              No locations yet — add your first pasture or pen below.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden">
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
        </CardContent>
      </Card>
    </div>
  );
}
