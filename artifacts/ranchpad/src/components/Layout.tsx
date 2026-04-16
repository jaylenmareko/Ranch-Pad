import React, { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import {
  Plus, MapPin, CheckCircle2, XCircle, Tractor, X, FolderOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useRanch, type RanchInfo } from "@/contexts/ranch-context";
import { SimpleDialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

// ── My Ranch Setup Dialog ──────────────────────────────────────────────────────

function MyRanchSetupDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (ranch: RanchInfo) => void;
}) {
  const { createPersonalRanch } = useRanch();
  const { toast } = useToast();

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [pastures, setPastures] = useState<string[]>([]);
  const [newPastureName, setNewPastureName] = useState("");

  const [address, setAddress] = useState("");
  const [geocodedLat, setGeocodedLat] = useState<number | null>(null);
  const [geocodedLon, setGeocodedLon] = useState<number | null>(null);
  const [geocodeLabel, setGeocodeLabel] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleAddressChange(value: string) {
    setAddress(value);
    if (geocodedLat !== null) { setGeocodedLat(null); setGeocodedLon(null); setGeocodeLabel(null); }
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
    setGeocodedLat(parseFloat(parseFloat(s.lat).toFixed(6)));
    setGeocodedLon(parseFloat(parseFloat(s.lon).toFixed(6)));
    setGeocodeLabel(s.display_name);
    setSuggestions([]);
    setShowSuggestions(false);
  }

  function addPasture() {
    const trimmed = newPastureName.trim();
    if (trimmed) { setPastures(prev => [...prev, trimmed]); setNewPastureName(""); }
  }

  function resetForm() {
    setStep(1);
    setName("");
    setPastures([]);
    setNewPastureName("");
    setAddress("");
    setGeocodedLat(null);
    setGeocodedLon(null);
    setGeocodeLabel(null);
    setSuggestions([]);
    setShowSuggestions(false);
  }

  function handleAdvanceToPastures(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Ranch name required", variant: "destructive" });
      return;
    }
    if (geocodedLat === null || geocodedLon === null) {
      toast({ title: "Location required", description: "Enter your ranch address and select a suggestion.", variant: "destructive" });
      return;
    }
    setStep(2);
  }

  async function handleCreate(finalPastures: string[]) {
    setIsSaving(true);
    try {
      const ranch = await createPersonalRanch({ name, lat: geocodedLat, lon: geocodedLon, pastures: finalPastures });
      toast({ title: "Ranch created!", description: `${name} is ready.` });
      onCreated(ranch);
      onOpenChange(false);
      resetForm();
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to create ranch", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SimpleDialog open={open} onOpenChange={(val) => { onOpenChange(val); if (!val) resetForm(); }} title="Set Up My Ranch">
      {step === 1 ? (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            Create your own personal ranch to track your own livestock, separate from the ranches you work on.
          </p>
          <form onSubmit={handleAdvanceToPastures} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Ranch Name</Label>
              <Input required placeholder="e.g. Sunrise Acres" value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div className="space-y-1.5 pt-2 border-t border-border">
              <div className="flex items-center gap-1.5 pt-2 mb-1">
                <Tractor className="w-4 h-4 text-primary" />
                <Label className="text-primary font-semibold text-xs uppercase tracking-wide">Ranch Location</Label>
              </div>
              <div className="relative">
                <Input
                  placeholder="Start typing your address…"
                  value={address}
                  onChange={e => handleAddressChange(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  autoComplete="off"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 top-full mt-1 left-0 right-0 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        className="w-full text-left flex items-start gap-2.5 px-3 py-2.5 text-sm hover:bg-muted transition-colors border-b border-border/40 last:border-b-0"
                        onMouseDown={() => selectSuggestion(s)}
                      >
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        <span className="text-foreground/85 leading-snug line-clamp-2">{s.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {geocodedLat !== null && geocodedLon !== null && (
                <div className="rounded-lg border bg-green-50/60 border-green-200 p-2.5">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      {geocodeLabel && <p className="text-xs text-muted-foreground truncate mb-0.5">{geocodeLabel}</p>}
                      <p className="text-xs font-mono text-foreground">{geocodedLat.toFixed(6)}, {geocodedLon.toFixed(6)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setGeocodedLat(null); setGeocodedLon(null); setGeocodeLabel(null); setAddress(""); setSuggestions([]); }}
                      className="p-0.5 rounded hover:bg-muted text-muted-foreground shrink-0"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Button type="submit" className="w-full">
              Next: Set Up Pastures
            </Button>
          </form>
        </>
      ) : (
        <>
          <h2 className="text-base font-semibold text-foreground mb-1">Set up your pastures</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Add the pastures, pens, or areas on your ranch. You can always manage these later in Settings.
          </p>

          {pastures.length > 0 && (
            <ul className="rounded-xl border border-border divide-y divide-border overflow-hidden mb-3">
              {pastures.map((loc, idx) => (
                <li key={idx} className="flex items-center gap-2.5 px-3 py-2.5">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="flex-1 text-sm font-medium text-foreground">{loc}</span>
                  <button
                    type="button"
                    onClick={() => setPastures(prev => prev.filter((_, i) => i !== idx))}
                    className="p-0.5 rounded text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Remove"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex gap-2 mb-5">
            <Input
              placeholder="e.g. South Pasture, Barn, Lot A"
              value={newPastureName}
              onChange={e => setNewPastureName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addPasture(); } }}
              className="flex-1"
              autoFocus
            />
            <Button type="button" onClick={addPasture} disabled={!newPastureName.trim()} className="shrink-0 gap-1">
              <Plus className="w-4 h-4" /> Add
            </Button>
          </div>

          <Button className="w-full mb-3" onClick={() => handleCreate(pastures)} isLoading={isSaving}>
            <FolderOpen className="w-4 h-4 mr-1.5" /> Create My Ranch
          </Button>
          <button
            type="button"
            onClick={() => handleCreate([])}
            disabled={isSaving}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center block disabled:opacity-50"
          >
            Skip for now
          </button>
        </>
      )}
    </SimpleDialog>
  );
}

// ── Bottom Tab Bar ─────────────────────────────────────────────────────────────

const TABS = [
  { href: "/",              emoji: "🏠", label: "Home"     },
  { href: "/animals",       emoji: "🐄", label: "Herd"     },
  { href: "/alerts",        emoji: "🔔", label: "Alerts"   },
  { href: "/import-export", emoji: "➕",  label: "Add"      },
  { href: "/settings",      emoji: "⚙️", label: "Settings" },
];

function BottomNav({ location }: { location: string }) {
  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  return (
    <nav style={{
      display: "flex",
      alignItems: "stretch",
      background: "#ffffff",
      borderTop: "1px solid #EAF0EC",
      height: "calc(64px + env(safe-area-inset-bottom))",
      paddingBottom: "env(safe-area-inset-bottom)",
      flexShrink: 0,
    }}>
      {TABS.map(tab => {
        const active = isActive(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              textDecoration: "none",
              position: "relative",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {active && (
              <span style={{
                position: "absolute",
                top: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: 28,
                height: 3,
                background: "#1A3628",
                borderRadius: "0 0 4px 4px",
              }} />
            )}
            <span style={{ fontSize: 20, lineHeight: 1 }}>{tab.emoji}</span>
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 10,
              fontWeight: active ? 700 : 500,
              color: active ? "#1A3628" : "#8FA393",
              letterSpacing: "0.02em",
              lineHeight: 1,
            }}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

// ── Main Layout ────────────────────────────────────────────────────────────────

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  const { setActiveRanch, refreshRanches } = useRanch();
  const [setupOpen, setSetupOpen] = useState(false);

  const isLanding = !isAuthenticated;

  return (
    <div className={cn("h-dvh overflow-hidden flex flex-col", isLanding ? "bg-background" : "bg-[#F5F1EA]")}>

      {/* Ranch Setup Dialog */}
      <MyRanchSetupDialog
        open={setupOpen}
        onOpenChange={setSetupOpen}
        onCreated={(ranch) => {
          setActiveRanch(ranch.id);
          refreshRanches();
        }}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className={cn("flex-1 overflow-y-auto", isLanding ? "flex flex-col" : "")}>
          <div className={cn("w-full", isLanding ? "flex-1 flex flex-col" : "")}>
            {children}
          </div>
        </div>
      </main>

      {/* Bottom Navigation — authenticated only */}
      {!isLanding && <BottomNav location={location} />}
    </div>
  );
}
