import React, { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, AlertTriangle, CloudLightning, X, Pill, Baby, Calendar, Stethoscope, Users, CheckCircle2, Upload, Loader2, XCircle, CheckCircle, Lock, Droplets, Wind, RefreshCw, ScanLine, ChevronDown, BookOpen } from "lucide-react";
import { useListAnimals, useListAlerts, useGetWeather, useDismissAlert, useGenerateAlerts, getGetWeatherQueryKey, useGetUpcoming, getGetUpcomingQueryKey, type Animal } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format, differenceInDays, parseISO, addDays } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useAuthModal } from "@/contexts/auth-modal-context";
import { useRanch } from "@/contexts/ranch-context";
import { formatDate } from "@/lib/utils";
import { ImportModeDialog } from "@/components/ImportModeDialog";
import { ScanPhotoDialog } from "@/components/ScanPhotoDialog";
import { EmptyHerdOverlay } from "@/components/EmptyHerdOverlay";
import { SimpleDialog } from "@/components/ui/dialog";

type ImportSummary = { animalsCreated: number; skipped: { row: number; reason: string }[] };

const INVARIANT_PLURAL = new Set(["Cattle", "Sheep", "Bison", "Deer"]);
function pluralizeSpecies(species: string) {
  return INVARIANT_PLURAL.has(species) ? species : `${species}s`;
}

// ─── Guest Dashboard ──────────────────────────────────────────────────────────

// ─── Ranch Notes Dialog ───────────────────────────────────────────────────────

type RanchNote = { id: number; noteDate: string; noteText: string; createdAt: string };

function RanchNotesDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState<RanchNote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ranch-notes");
      if (res.ok) setNotes(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (open) fetchNotes(); }, [open, fetchNotes]);

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
      return format(new Date(createdAt), "MMM d · h:mm a");
    } catch {
      return createdAt;
    }
  };

  return (
    <SimpleDialog open={open} onOpenChange={onOpenChange} title="Ranch Notes">
      <div className="flex flex-col gap-4">
        {/* Input area */}
        <div className="flex flex-col gap-3">
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
          <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded-xl" />)}</div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <BookOpen className="w-8 h-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground font-medium">No notes yet</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">Log daily observations above</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40 -mx-6">
            {notes.map(note => (
              <div key={note.id} className="px-6 py-3.5">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{formatNoteTimestamp(note.createdAt)}</p>
                <p className="text-sm text-foreground leading-relaxed">{note.noteText}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </SimpleDialog>
  );
}
// ─── Auth Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
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
  const [notesOpen, setNotesOpen] = useState(false);
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
    if (file.size === 0) { setImportError("This file appears to be empty — no animals found to import."); return; }
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
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-foreground">{activeRanch?.name ?? "Dashboard"}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{format(new Date(), "EEEE, MMMM d")}</p>
        </div>
        {(role === "owner" || role === "ranch_hand") && (
          <button
            onClick={() => setNotesOpen(true)}
            className="shrink-0 flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-semibold transition-colors border bg-primary border-primary text-primary-foreground hover:bg-primary/90"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Ranch Notes
          </button>
        )}
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
            <h3 className="font-bold text-sm text-foreground">
              Disease Risk &middot; {format(new Date(), "MMM d")}–{
                weather?.forecast?.length
                  ? format(parseISO(weather.forecast[weather.forecast.length - 1].date), "MMM d")
                  : format(addDays(new Date(), 4), "MMM d")
              }
            </h3>
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
                { color: "bg-red-600", text: "Rosie (#114) — FAMACHA score has declined 3→4→5 over 6 weeks. Barber pole worm burden likely critical with 2.1\" of rain this week." },
                { color: "bg-red-600", text: "Buck (#07, Goat) — 4 high-severity health events in 30 days including respiratory infection and bottle jaw. Immediate vet evaluation recommended." },
                { color: "bg-red-600", text: "High barber pole worm risk — 3.4\" of rain forecast through Friday with temps staying above 68°F. Mae (#T-105) was treated 3 weeks ago and is due for a FAMACHA recheck before larvae counts spike." },
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

      {/* Ranch Notes dialog */}
      <RanchNotesDialog open={notesOpen} onOpenChange={setNotesOpen} />

      </>
      )}
    </div>
  );
}

