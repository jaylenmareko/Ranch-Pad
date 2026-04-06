import React, { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, AlertTriangle, CloudLightning, X, Pill, Baby, Calendar, Stethoscope, Users, CheckCircle2, Upload, Loader2, XCircle, CheckCircle, Lock, Droplets, Wind, RefreshCw, ScanLine, ChevronDown, BookOpen } from "lucide-react";
import { useListAnimals, useListAlerts, useGetWeather, useDismissAlert, useGenerateAlerts, getGetWeatherQueryKey, useGetUpcoming, getGetUpcomingQueryKey, type Animal } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format, differenceInDays, parseISO } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useAuthModal } from "@/contexts/auth-modal-context";
import { useRanch } from "@/contexts/ranch-context";
import { getGuestAnimals, importCsvToGuestStore, clearGuestAnimals, type GuestAnimal } from "@/lib/guest-store";
import { formatDate } from "@/lib/utils";
import { ImportModeDialog } from "@/components/ImportModeDialog";
import { ScanPhotoDialog } from "@/components/ScanPhotoDialog";
import { EmptyHerdOverlay } from "@/components/EmptyHerdOverlay";

type ImportSummary = { animalsCreated: number; skipped: { row: number; reason: string }[] };

const INVARIANT_PLURAL = new Set(["Cattle", "Sheep", "Bison", "Deer"]);
function pluralizeSpecies(species: string) {
  return INVARIANT_PLURAL.has(species) ? species : `${species}s`;
}

// ─── Guest Dashboard ──────────────────────────────────────────────────────────

// ─── Field Notes Section ─────────────────────────────────────────────────────

type RanchNote = { id: number; noteDate: string; noteText: string; createdAt: string };

function FieldNotesSection() {
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState<RanchNote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = React.useCallback(async () => {
    try {
      const res = await fetch("/api/ranch-notes");
      if (res.ok) setNotes(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const handleSave = async () => {
    if (!noteText.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/ranch-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteDate: format(new Date(), "yyyy-MM-dd"), noteText: noteText.trim() }),
      });
      if (res.ok) {
        setNoteText("");
        await fetchNotes();
      }
    } finally {
      setSaving(false);
    }
  };

  const formatNoteTimestamp = (createdAt: string) => {
    try {
      const d = new Date(createdAt);
      return format(d, "MMM d · h:mm a");
    } catch {
      return createdAt;
    }
  };

  return (
    <div className="rounded-2xl border-2 border-border overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-primary shrink-0" />
        <h3 className="font-bold text-sm text-foreground">Ranch Journal</h3>
      </div>
      {/* Input area */}
      <div className="p-4 border-b border-border/60 flex flex-col gap-3">
        <textarea
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSave(); }}
          placeholder="What happened on the ranch today?"
          rows={3}
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
        />
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || !noteText.trim()}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : "Save Note"}
          </button>
        </div>
      </div>
      {/* Notes list */}
      {loading ? (
        <div className="p-4 space-y-3">{[1, 2].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded-xl" />)}</div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <BookOpen className="w-8 h-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground font-medium">No entries yet</p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">Log daily observations above</p>
        </div>
      ) : (
        <div className="divide-y divide-border/40">
          {notes.map(note => (
            <div key={note.id} className="px-4 py-3.5">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{formatNoteTimestamp(note.createdAt)}</p>
              <p className="text-sm text-foreground leading-relaxed">{note.noteText}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Guest Dashboard ──────────────────────────────────────────────────────────

function GuestDashboard() {
  const { openSignup } = useAuthModal();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [animals, setAnimals] = useState<GuestAnimal[]>(() => getGuestAnimals());
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [modeDialogOpen, setModeDialogOpen] = useState(false);
  useEffect(() => {
    const refresh = () => setAnimals(getGuestAnimals());
    window.addEventListener("guest-save", refresh);
    return () => window.removeEventListener("guest-save", refresh);
  }, []);

  async function doImport(file: File, replace: boolean) {
    setImporting(true);
    setModeDialogOpen(false);
    setPendingFile(null);
    try {
      const text = await file.text();
      if (replace) clearGuestAnimals();
      const result = importCsvToGuestStore(text);
      setImportSummary(result);
      if (result.animalsCreated > 0) {
        window.dispatchEvent(new CustomEvent("guest-save"));
      }
    } catch {
      setImportError("Something went wrong reading your file. Please try again.");
    } finally {
      setImporting(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setImportError(null);
    setImportSummary(null);
    const isCSV = file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv" || file.type === "application/csv";
    if (!isCSV) { setImportError("Please upload a CSV file."); return; }
    if (file.size === 0) { setImportError("This file appears to be empty."); return; }
    if (animals.length > 0) {
      setPendingFile(file);
      setModeDialogOpen(true);
    } else {
      doImport(file, false);
    }
  }

  function plainEnglishSkipReason(reason: string): string {
    if (reason.includes("Missing required field")) return "Missing name or species — both are required for every row.";
    if (reason.includes("Duplicate tag number") && reason.includes("already exists")) {
      const match = reason.match(/"([^"]+)"/);
      return `Tag number${match ? ` "${match[1]}"` : ""} is already in your herd — skipped to avoid duplicates.`;
    }
    if (reason.includes("Duplicate tag number") && reason.includes("more than once")) {
      const match = reason.match(/"([^"]+)"/);
      return `Tag number${match ? ` "${match[1]}"` : ""} appears more than once in this file — only the first was imported.`;
    }
    return reason;
  }

  const speciesCounts = React.useMemo(() =>
    animals.reduce((acc, a) => { acc[a.species] = (acc[a.species] || 0) + 1; return acc; }, {} as Record<string, number>),
    [animals]
  );
  const femaleCount = animals.filter(a => a.sex === "Female").length;
  const maleCount = animals.filter(a => a.sex === "Male").length;

  return (
    <div className="space-y-8">
      <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />
      <ImportModeDialog
        open={modeDialogOpen}
        onOpenChange={setModeDialogOpen}
        onAdd={() => pendingFile && doImport(pendingFile, false)}
        onReplace={() => pendingFile && doImport(pendingFile, true)}
      />

      {animals.length === 0 ? (
        <EmptyHerdOverlay
          onScan={() => openSignup()}
          onImportClick={() => fileInputRef.current?.click()}
        />
      ) : (
      <>

      {/* Sign-up nudge */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/20">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Lock className="w-4 h-4 text-primary" />
        </div>
        <p className="flex-1 text-sm font-medium text-foreground">
          You're using RanchPad as a guest.{" "}
          <button onClick={openSignup} className="font-bold text-primary hover:underline">Sign up</button>
          {" "}to sync your data across devices.
        </p>
      </div>

      {/* Herd Health Forecast teaser */}
      <Card className="flex flex-col shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-lg flex items-center gap-2 text-foreground">
            <CloudLightning className="w-5 h-5 text-primary" /> Disease Risk This Week
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Lock className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">AI-powered herd risk alerts</p>
          <p className="text-xs text-muted-foreground max-w-xs">Sign up to see local weather conditions and get AI-generated disease risk alerts specific to your cattle, goats, and sheep.</p>
          <button onClick={openSignup} className="mt-1 text-sm font-bold text-primary hover:underline">Sign up free →</button>
        </CardContent>
      </Card>

      {/* Upcoming teaser — full width */}
      <Card className="shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-lg flex items-center gap-2 text-foreground">
            <Stethoscope className="w-5 h-5 text-primary" /> Upcoming Treatments
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Lock className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">Track medications & births</p>
          <p className="text-xs text-muted-foreground max-w-xs">Sign up to get reminders for upcoming treatments and expected calving dates.</p>
          <button onClick={openSignup} className="mt-1 text-sm font-bold text-primary hover:underline">Sign up free →</button>
        </CardContent>
      </Card>

      </>
      )}
    </div>
  );
}

// ─── Weather Alert Row ────────────────────────────────────────────────────────

function WeatherAlertRow({ alert, onDismiss }: {
  alert: { id: number; severity: string; summary?: string | null; message: string; alertType: string; generatedAt: string; animalId?: number | null; animalName?: string | null };
  onDismiss: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const dotColor = alert.severity === 'critical'
    ? 'bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.6)]'
    : alert.severity === 'high'
      ? 'bg-destructive shadow-[0_0_10px_rgba(255,0,0,0.5)]'
      : alert.severity === 'moderate' || alert.severity === 'medium'
        ? 'bg-yellow-500'
        : 'bg-green-500';
  const getFirstSentence = (msg: string) => msg.match(/^(.+?[.!?])(?:\s|$)/)?.[1] ?? msg;
  const collapsedText = alert.summary ?? getFirstSentence(alert.message);
  const hasDetail = !!(alert.summary || alert.message.length > collapsedText.length);

  return (
    <div className="border-b border-border/50 last:border-b-0">
      <div
        className="p-4 md:p-5 flex gap-4 hover:bg-muted/30 transition-colors group cursor-pointer"
        onClick={() => hasDetail && setExpanded(v => !v)}
      >
        <div className="mt-1.5 shrink-0"><div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} /></div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-snug">{collapsedText}</p>
          {!expanded && hasDetail && (
            <span className="text-xs font-semibold text-primary/70 mt-1 inline-flex items-center gap-0.5">
              See details <ChevronDown className="w-3 h-3" />
            </span>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-1">
          {hasDetail && (
            <button
              onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-all"
              aria-label={expanded ? "Collapse" : "Expand"}
            >
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
            </button>
          )}
          <button
            onClick={e => { e.stopPropagation(); onDismiss(alert.id); }}
            className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-2.5 min-w-[44px] min-h-[44px] text-muted-foreground hover:bg-muted hover:text-foreground rounded-full transition-all flex items-center justify-center"
            aria-label="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: expanded ? '400px' : '0px', opacity: expanded ? 1 : 0 }}
      >
        <div className="px-4 md:px-5 pb-4 pt-0 border-t border-border/40 ml-6 md:ml-7">
          <div className="pt-3 space-y-2">
            <p className="text-sm leading-relaxed text-foreground/85 whitespace-pre-line">{alert.message}</p>
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {alert.alertType.replace(/_/g, ' ')}
              </span>
              <span className="text-[10px] text-muted-foreground/50">•</span>
              <span className="text-[10px] text-muted-foreground">{formatDate(alert.generatedAt)}</span>
              <button
                onClick={() => onDismiss(alert.id)}
                className="ml-auto text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Auth Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return <GuestDashboard />;

  return <AuthDashboard />;
}

function AuthDashboard() {
  const { role } = useAuth();
  const { activeRanch } = useRanch();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [modeDialogOpen, setModeDialogOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const { data: animals, isLoading: animalsLoading } = useListAnimals();
  const { data: alerts, isLoading: alertsLoading, refetch: refetchAlerts } = useListAlerts();
  const { data: weather, isLoading: weatherLoading, refetch: refetchWeather, isFetching: weatherFetching } = useGetWeather({ query: { queryKey: getGetWeatherQueryKey(), retry: false } });
  const { data: upcoming, isLoading: upcomingLoading } = useGetUpcoming();

  const generateMutation = useGenerateAlerts({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
        refetchAlerts();
      }
    }
  });

  const dismissMutation = useDismissAlert({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/alerts"] })
    }
  });

  const [resolvingMedIds, setResolvingMedIds] = useState<Set<number>>(new Set());

  const markMedResolved = async (med: { id: number; animalId: number; medicationName: string }) => {
    setResolvingMedIds(prev => new Set(prev).add(med.id));
    try {
      await fetch(`/api/animals/${med.animalId}/medications/${med.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicationName: med.medicationName,
          dateGiven: format(new Date(), "yyyy-MM-dd"),
          nextDueDate: null,
        }),
      });
      queryClient.invalidateQueries({ queryKey: getGetUpcomingQueryKey() });
    } finally {
      setResolvingMedIds(prev => { const s = new Set(prev); s.delete(med.id); return s; });
    }
  };

  const speciesCounts = React.useMemo(() => {
    if (!animals) return {};
    return animals.reduce((acc, animal) => {
      acc[animal.species] = (acc[animal.species] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [animals]);

  const avgAgeMonths = React.useMemo(() => {
    if (!animals || animals.length === 0) return null;
    const now = new Date();
    const totalMonths = animals.reduce((sum, a) => {
      if (!a.dateOfBirth) return sum;
      const dob = new Date(a.dateOfBirth);
      return sum + (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
    }, 0);
    const counted = animals.filter(a => a.dateOfBirth).length;
    return counted > 0 ? Math.round(totalMonths / counted) : null;
  }, [animals]);

  const femaleCount = React.useMemo(() => animals?.filter(a => a.sex === "Female").length ?? 0, [animals]);
  const maleCount = React.useMemo(() => animals?.filter(a => a.sex === "Male").length ?? 0, [animals]);

  const activeAlerts = alerts?.filter(a => !a.isDismissed) || [];
  const weatherAlerts = activeAlerts.filter(a => a.alertType === 'weather_forecast');
  const sortedWeatherAlerts = [...weatherAlerts].sort((a, b) => {
    const weights: Record<string, number> = { critical: 4, high: 3, moderate: 2, medium: 2, low: 1 };
    return (weights[b.severity] ?? 0) - (weights[a.severity] ?? 0);
  });

  const totalAnimals = animals?.length ?? 0;
  // Stat tile links to Action Center which only shows non-weather alerts — count must match
  const activeAlertCount = activeAlerts.filter(a => a.alertType !== 'weather_forecast').length;
  const overdueMedsCount = upcoming?.overdueMedsCount ?? 0;
  const dueSoonCount = upcoming?.dueSoonCount ?? 0;

  function plainEnglishSkipReason(reason: string): string {
    if (reason.includes("Missing required field")) return "Missing name or species — both are required for every row.";
    if (reason.includes("Duplicate tag number") && reason.includes("already exists")) {
      const match = reason.match(/"([^"]+)"/);
      return `Tag number${match ? ` "${match[1]}"` : ""} is already in your herd — skipped to avoid duplicates.`;
    }
    if (reason.includes("Duplicate tag number") && reason.includes("more than once")) {
      const match = reason.match(/"([^"]+)"/);
      return `Tag number${match ? ` "${match[1]}"` : ""} appears more than once in this file — only the first was imported.`;
    }
    return reason;
  }

  async function doImport(file: File, replace: boolean) {
    setImporting(true);
    setModeDialogOpen(false);
    setPendingFile(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const url = replace ? "/api/animals/import-csv?replace=true" : "/api/animals/import-csv";
      const res = await fetch(url, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setImportError(data.message ?? "Import failed. Please check your file and try again.");
      } else {
        setImportSummary(data as ImportSummary);
        queryClient.refetchQueries({ queryKey: ["/api/animals"] });
        generateMutation.mutate();
      }
    } catch {
      setImportError("Something went wrong connecting to the server. Please try again.");
    } finally {
      setImporting(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setImportError(null);
    setImportSummary(null);
    const isCSV = file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv" || file.type === "application/csv";
    if (!isCSV) { setImportError("Please upload a CSV file."); return; }
    if (file.size === 0) { setImportError("This file appears to be empty. Please fill in the template and try again."); return; }
    const hasAnimals = animals && (animals as Animal[]).length > 0;
    if (hasAnimals) {
      setPendingFile(file);
      setModeDialogOpen(true);
    } else {
      doImport(file, false);
    }
  }

  const hasNoAnimals = !animalsLoading && animals !== undefined && animals.length === 0;

  return (
    <div className="space-y-5 max-w-lg mx-auto pb-20">
      <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />
      <ImportModeDialog
        open={modeDialogOpen}
        onOpenChange={setModeDialogOpen}
        onAdd={() => pendingFile && doImport(pendingFile, false)}
        onReplace={() => pendingFile && doImport(pendingFile, true)}
      />
      <ScanPhotoDialog open={scanOpen} onOpenChange={setScanOpen} />

      {hasNoAnimals ? (
        <EmptyHerdOverlay
          onScan={() => setScanOpen(true)}
          onImportClick={() => fileInputRef.current?.click()}
          role={role}
        />
      ) : (
      <>

      {/* Greeting */}
      <div>
        <h1 className="text-xl font-black text-foreground">{activeRanch?.name ?? "Dashboard"}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{format(new Date(), "EEEE, MMMM d")}</p>
      </div>

      {/* Stat tiles — 2×2 grid */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/animals">
          <div className="bg-card border-2 border-border rounded-2xl p-4 hover:border-border/70 transition-colors">
            <p className="text-3xl font-black text-foreground leading-none">{animalsLoading ? "—" : totalAnimals}</p>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1.5">Animals</p>
          </div>
        </Link>
        <Link href="/alerts">
          <div className={`bg-card border-2 rounded-2xl p-4 hover:border-border/70 transition-colors ${activeAlertCount > 0 ? "border-red-500/40" : "border-border"}`}>
            <p className={`text-3xl font-black leading-none ${activeAlertCount > 0 ? "text-destructive" : "text-foreground"}`}>{alertsLoading ? "—" : activeAlertCount}</p>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1.5">Active Alerts</p>
          </div>
        </Link>
        <div className={`bg-card border-2 rounded-2xl p-4 ${overdueMedsCount > 0 ? "border-red-500/40" : "border-border"}`}>
          <p className={`text-3xl font-black leading-none ${overdueMedsCount > 0 ? "text-destructive" : "text-foreground"}`}>{upcomingLoading ? "—" : overdueMedsCount}</p>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1.5">Overdue Meds</p>
        </div>
        <div className={`bg-card border-2 rounded-2xl p-4 ${dueSoonCount > 0 ? "border-yellow-500/40" : "border-border"}`}>
          <p className={`text-3xl font-black leading-none ${dueSoonCount > 0 ? "text-yellow-400" : "text-foreground"}`}>{upcomingLoading ? "—" : dueSoonCount}</p>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1.5">Due This Week</p>
        </div>
      </div>

      {/* Import feedback */}
      {importError && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">{importError}</p>
      )}
      {importSummary && (
        <div className="text-sm bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
          <p className="font-semibold text-green-400">{importSummary.animalsCreated} animal{importSummary.animalsCreated !== 1 ? "s" : ""} imported</p>
          {importSummary.skipped.length > 0 && (
            <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground list-disc list-inside">
              {importSummary.skipped.map((s, i) => <li key={i}>Row {s.row}: {plainEnglishSkipReason(s.reason)}</li>)}
            </ul>
          )}
        </div>
      )}

      {/* Disease Risk This Week */}
      <div className="rounded-2xl border-2 border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CloudLightning className="w-4 h-4 text-primary shrink-0" />
            <h3 className="font-bold text-sm text-foreground">Disease Risk This Week</h3>
            {weatherAlerts.length > 0 && (
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive">{weatherAlerts.length}</span>
            )}
          </div>
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-semibold bg-muted border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3 h-3 ${generateMutation.isPending ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Weather strip */}
        {!weatherLoading && weather && (
          <div className="px-4 py-2 bg-muted/20 border-b border-border/40 flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
            <img src={`https://openweathermap.org/img/wn/${weather.current.icon}.png`} alt="" className="w-5 h-5 opacity-70" />
            <span className="font-bold text-foreground">{Math.round(weather.current.temp)}°F</span>
            <span className="capitalize">{weather.current.description}</span>
            <span className="opacity-40">·</span>
            <span className="flex items-center gap-1"><Droplets className="w-3 h-3" />{weather.current.humidity}%</span>
            <span className="flex items-center gap-1"><Wind className="w-3 h-3" />{Math.round(weather.current.windSpeed)} mph</span>
          </div>
        )}

        {alertsLoading ? (
          <div className="p-4 space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-muted animate-pulse rounded-xl" />)}</div>
        ) : sortedWeatherAlerts.length === 0 ? (
          <div className="flex flex-col">
            <div className="flex flex-col items-center justify-center py-5 text-center px-4 gap-1">
              <CheckCircle2 className="w-7 h-7 text-green-500/50 mb-0.5" />
              <p className="font-bold text-sm text-foreground">All clear</p>
              <p className="text-xs text-muted-foreground">No active weather alerts for your herd.</p>
            </div>
            <div className="border-t border-dashed border-border/50 mx-4" />
            <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest px-4 pt-3 pb-1">Example alerts</p>
            <div className="divide-y divide-border/40 opacity-30 pointer-events-none select-none">
              {[
                { color: "bg-red-600", text: "Clyde (TXS-010) — Bottle jaw and FAMACHA 5 recorded 3 days ago. Barber pole worm burden likely critical given heavy rain forecast." },
                { color: "bg-yellow-500", text: "High humidity forecast — ideal conditions for barber pole worm. Check FAMACHA scores on all sheep and goats." },
              ].map((ex, i) => (
                <div key={i} className="p-4 flex gap-3">
                  <div className="mt-1.5 shrink-0"><div className={`w-2.5 h-2.5 rounded-full ${ex.color}`} /></div>
                  <p className="text-sm text-foreground leading-snug">{ex.text}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            {sortedWeatherAlerts.map(alert => (
              <WeatherAlertRow
                key={alert.id}
                alert={alert}
                onDismiss={(id) => dismissMutation.mutate({ alertId: id })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Upcoming */}
      <div className="rounded-2xl border-2 border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-primary shrink-0" />
          <h3 className="font-bold text-sm text-foreground">Upcoming</h3>
        </div>

        {upcomingLoading ? (
          <div className="p-4 space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded-xl" />)}</div>
        ) : (!upcoming || (upcoming.medications.length === 0 && upcoming.pregnancies.length === 0)) ? (
          <div className="flex flex-col items-center justify-center p-7 text-center gap-1">
            <CheckCircle2 className="w-7 h-7 text-green-500/50 mb-0.5" />
            <p className="font-bold text-sm text-foreground">All clear</p>
            <p className="text-xs text-muted-foreground">No medications or births due soon.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {upcoming.medications.length > 0 && (
              <div className="p-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5" /> Medications
                </p>
                <div className="space-y-2.5">
                  {upcoming.medications.map(med => {
                    const daysUntil = differenceInDays(parseISO(med.nextDueDate), new Date());
                    const isResolving = resolvingMedIds.has(med.id);
                    return (
                      <div key={med.id} className="flex items-center gap-2">
                        <Link href={`/animals/${med.animalId}`} className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{med.animalName}</p>
                          <p className="text-xs text-muted-foreground truncate">{med.medicationName}</p>
                        </Link>
                        <span className={`text-xs font-bold shrink-0 px-2 py-0.5 rounded-full ${med.isOverdue ? "bg-destructive/10 text-destructive" : "bg-yellow-500/10 text-yellow-400"}`}>
                          {med.isOverdue ? `${Math.abs(daysUntil)}d overdue` : daysUntil === 0 ? "Today" : `${daysUntil}d`}
                        </span>
                        <button
                          onClick={() => markMedResolved(med)}
                          disabled={isResolving}
                          className="shrink-0 inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-semibold bg-muted border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50"
                        >
                          {isResolving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                          {isResolving ? "…" : "Done"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {upcoming.pregnancies.length > 0 && (
              <div className="p-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Baby className="w-3.5 h-3.5" /> Expected Births
                </p>
                <div className="space-y-2">
                  {upcoming.pregnancies.map(preg => {
                    const daysUntil = differenceInDays(parseISO(preg.expectedDueDate), new Date());
                    return (
                      <Link key={preg.animalId} href={`/animals/${preg.animalId}`} className="flex items-center justify-between gap-2 hover:bg-muted/40 rounded-lg px-2 py-1 -mx-2 transition-colors">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{preg.animalName}</p>
                          <p className="text-xs text-muted-foreground">{preg.species}</p>
                        </div>
                        <span className={`text-xs font-bold shrink-0 px-2 py-0.5 rounded-full ${daysUntil < 0 ? "bg-destructive/10 text-destructive" : daysUntil <= 7 ? "bg-yellow-500/10 text-yellow-400" : "bg-blue-500/10 text-blue-400"}`}>
                          {daysUntil < 0 ? "Overdue" : daysUntil === 0 ? "Today" : `${daysUntil}d`}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Field Notes — owners and ranch hands only */}
      {(role === "owner" || role === "ranch_hand") && (
        <FieldNotesSection />
      )}

      </>
      )}
    </div>
  );
}

