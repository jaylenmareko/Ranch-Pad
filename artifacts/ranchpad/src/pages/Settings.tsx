import React, { useEffect, useRef, useState } from "react";
import { MapPin, Save, XCircle, Cog, Loader2, Plus } from "lucide-react";
import "./Settings.css";
import { useGetRanch, useUpdateRanch } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";

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
      <div className="settings-unauth">
        <div className="settings-unauth-icon">
          <Cog size={32} color="#5A7A6A" />
        </div>
        <div className="settings-unauth-title">Ranch Settings</div>
        <p className="settings-unauth-sub">Sign in as a ranch owner to manage your ranch name and location.</p>
      </div>
    );
  }

  if (isLoading || !role) {
    return (
      <div className="settings-loading">
        <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
        Loading…
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
    <div className="settings-page">

      <div className="settings-header">
        <span className="settings-header-title">Ranch Settings</span>
      </div>

      <div className="settings-body">

        {/* ── Ranch Info + Location ── */}
        <form onSubmit={handleSubmit}>
          <div className="settings-card">

            {/* Ranch Name */}
            <div className="settings-card-section">
              <div className="settings-section-label">Ranch Name</div>
              <input
                className="settings-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Double Bar Ranch"
                required
              />
            </div>

            {/* Location */}
            <div className="settings-card-section">
              <div className="settings-section-label">Location</div>

              {lat !== null && lon !== null && (
                <div className="settings-location-confirmed">
                  <MapPin size={15} color="#2D6A4F" style={{ flexShrink: 0, marginTop: 1 }} />
                  <p className="settings-location-text">
                    {geocodeLabel ?? `${lat.toFixed(6)}, ${lon.toFixed(6)}`}
                  </p>
                  <button
                    type="button"
                    className="settings-location-clear"
                    onClick={() => { setLat(null); setLon(null); setGeocodeLabel(null); setAddress(""); setSuggestions([]); }}
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              )}

              <div className="settings-address-wrap">
                <input
                  className="settings-input"
                  value={address}
                  onChange={e => handleAddressChange(e.target.value)}
                  placeholder={lat !== null ? "Enter new address…" : "Search for your ranch address…"}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  autoComplete="off"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <ul className="settings-suggestions">
                    {suggestions.map((s, i) => (
                      <li key={i} className="settings-suggestion-item" onMouseDown={() => selectSuggestion(s)}>
                        {s.display_name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {lat === null && lon === null && (
                <p className="settings-location-hint">Used for weather data and AI-powered herd alerts.</p>
              )}
            </div>

            {/* Save */}
            <div className="settings-card-section">
              <button
                type="submit"
                className="settings-save-btn"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending
                  ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />Saving…</>
                  : <><Save size={15} />Save Changes</>
                }
              </button>
            </div>
          </div>
        </form>

        {/* ── Pastures & Locations ── */}
        <div className="settings-card">
          <div className="settings-pastures-header">
            <div className="settings-pastures-title">Pastures &amp; Locations</div>
            <span className="settings-pastures-sub">Tag animals to specific areas. They'll be grouped by location in the Herd page.</span>
          </div>

          {locations.length > 0 && (
            <ul className="settings-loc-list">
              {locations.map(loc => (
                <li key={loc.id} className="settings-loc-item">

                  {editingLocId === loc.id ? (
                    <div className="settings-loc-edit-row">
                      <input
                        className="settings-input-sm"
                        value={editLocName}
                        onChange={e => setEditLocName(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); saveLocEdit(loc.id); } }}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="settings-loc-edit-save"
                        onClick={() => saveLocEdit(loc.id)}
                        disabled={savingLoc}
                      >
                        {savingLoc ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : null}
                        Save
                      </button>
                      <button type="button" className="settings-loc-edit-cancel" onClick={() => setEditingLocId(null)}>Cancel</button>
                    </div>
                  ) : assigningLocId === loc.id ? (
                    <div className="settings-assign-panel">
                      <div className="settings-assign-header">
                        <span className="settings-assign-name">{loc.name}</span>
                        <span className="settings-assign-count">{selectedAnimalIds.size} of {allAnimals?.length ?? "…"} selected</span>
                      </div>

                      {allAnimals === null ? (
                        <div className="settings-assign-loading">
                          <Loader2 size={14} style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />
                          Loading animals…
                        </div>
                      ) : allAnimals.length === 0 ? (
                        <p className="settings-assign-empty">No animals in your herd yet.</p>
                      ) : (
                        <div className="settings-assign-list">
                          {allAnimals.map(a => (
                            <label key={a.id} className="settings-assign-item">
                              <input
                                type="checkbox"
                                checked={selectedAnimalIds.has(a.id)}
                                onChange={e => {
                                  setSelectedAnimalIds(prev => {
                                    const next = new Set(prev);
                                    if (e.target.checked) next.add(a.id); else next.delete(a.id);
                                    return next;
                                  });
                                }}
                                style={{ width: 16, height: 16, flexShrink: 0, accentColor: "#1A3628" }}
                              />
                              <span className="settings-assign-animal-name">{a.name}</span>
                              {a.tagNumber && <span className="settings-assign-tag">#{a.tagNumber}</span>}
                              <span className="settings-assign-species">{a.species}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      <div className="settings-assign-actions">
                        <button
                          type="button"
                          className="settings-assign-save"
                          onClick={saveAssignments}
                          disabled={savingAssign || allAnimals === null}
                        >
                          {savingAssign && <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />}
                          Save Assignments
                        </button>
                        <button type="button" className="settings-assign-cancel" onClick={() => setAssigningLocId(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="settings-loc-row">
                      <span className="settings-loc-name">{loc.name}</span>
                      <button type="button" className="settings-loc-btn" onClick={() => openAssignPanel(loc.id)}>Assign Animals</button>
                      <button type="button" className="settings-loc-btn" onClick={() => { setEditingLocId(loc.id); setEditLocName(loc.name); setAssigningLocId(null); }}>Edit Name</button>
                      <button type="button" className="settings-loc-btn-danger" onClick={() => deleteLocation(loc.id)}>Delete</button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="settings-add-loc-row">
            <input
              className="settings-input-sm"
              value={newLocName}
              onChange={e => setNewLocName(e.target.value)}
              placeholder="e.g. South Pasture, Barn, Lot A"
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addLocation(); } }}
              style={{ height: 44, borderRadius: 10 }}
            />
            <button
              type="button"
              className="settings-add-loc-btn"
              onClick={addLocation}
              disabled={addingLoc || !newLocName.trim()}
            >
              {addingLoc
                ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                : <Plus size={15} />
              }
              Add
            </button>
          </div>
        </div>

        {/* ── Account Settings link ── */}
        <div className="settings-card">
          <Link href="/account" className="settings-nav-link">
            <div className="settings-nav-link-icon">👤</div>
            <div className="settings-nav-link-body">
              <div className="settings-nav-link-title">Account Settings</div>
              <div className="settings-nav-link-sub">Profile, password &amp; subscription</div>
            </div>
            <span className="settings-nav-link-chevron">›</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
