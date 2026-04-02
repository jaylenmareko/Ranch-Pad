import React, { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, AlertTriangle, CloudLightning, X, Pill, Baby, Calendar, Stethoscope, Users, CheckCircle2, Upload, Loader2, XCircle, CheckCircle, Lock, Droplets, Wind, RefreshCw, ScanLine, ChevronDown, FileDown } from "lucide-react";
import { useListAnimals, useListAlerts, useGetWeather, useDismissAlert, useGenerateAlerts, getGetWeatherQueryKey, useGetUpcoming, type Animal } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format, differenceInDays, parseISO } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useAuthModal } from "@/contexts/auth-modal-context";
import { useRanch } from "@/contexts/ranch-context";
import { getGuestAnimals, importCsvToGuestStore, clearGuestAnimals, type GuestAnimal } from "@/lib/guest-store";
import { formatDate, formatAge } from "@/lib/utils";
import { ImportModeDialog } from "@/components/ImportModeDialog";
import { ScanPhotoDialog } from "@/components/ScanPhotoDialog";
import { EmptyHerdOverlay } from "@/components/EmptyHerdOverlay";

type ImportSummary = { animalsCreated: number; skipped: { row: number; reason: string }[] };

const INVARIANT_PLURAL = new Set(["Cattle", "Sheep", "Bison", "Deer"]);
function pluralizeSpecies(species: string) {
  return INVARIANT_PLURAL.has(species) ? species : `${species}s`;
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

      {/* Action Banner */}
      <div className="bg-card border border-border rounded-xl px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-black text-foreground tracking-tight whitespace-nowrap">Dashboard</h1>
          <p className="text-muted-foreground text-sm font-medium mt-0.5">{format(new Date(), "EEEE, MMMM do, yyyy")}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg font-semibold text-sm bg-muted border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors whitespace-normal text-left disabled:opacity-60"
          >
            {importing
              ? <><Loader2 className="w-4 h-4 shrink-0 animate-spin" />Importing…</>
              : <><Upload className="w-4 h-4 shrink-0" />Upload CSV</>
            }
          </button>
          <Link href="/animals/new" className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-md shadow-primary/30 whitespace-nowrap shrink-0">
            <PlusCircle className="w-4 h-4" />
            Add Animal
          </Link>
        </div>
      </div>

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

      {/* Import error */}
      {importError && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30">
          <XCircle className="w-5 h-5 shrink-0 text-destructive mt-0.5" />
          <p className="flex-1 text-sm font-semibold text-foreground">{importError}</p>
          <button onClick={() => setImportError(null)} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"><XCircle className="w-4 h-4" /></button>
        </div>
      )}

      {/* Import success */}
      {importSummary && (
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 shrink-0 text-primary" />
              <p className="text-sm font-semibold text-foreground">
                Import complete — {importSummary.animalsCreated} {importSummary.animalsCreated === 1 ? "animal" : "animals"} added
                {importSummary.skipped.length > 0 && `, ${importSummary.skipped.length} ${importSummary.skipped.length === 1 ? "row" : "rows"} skipped`}
              </p>
            </div>
            <button onClick={() => setImportSummary(null)} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"><XCircle className="w-4 h-4" /></button>
          </div>
          {importSummary.skipped.length > 0 && (
            <ul className="space-y-1 pl-7">
              {importSummary.skipped.map((s, i) => (
                <li key={i} className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Row {s.row}:</span> {plainEnglishSkipReason(s.reason)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link href="/animals">
          <div className="group cursor-pointer bg-card rounded-2xl border border-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Users className="w-5 h-5 text-primary" /></div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Animals</p>
              <p className="text-3xl font-black font-display text-primary leading-none mt-0.5">{animals.length}</p>
            </div>
          </div>
        </Link>
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5 flex items-center gap-4 opacity-60">
          <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center shrink-0"><AlertTriangle className="w-5 h-5 text-muted-foreground" /></div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Alerts</p>
            <p className="text-3xl font-black font-display text-muted-foreground leading-none mt-0.5">—</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5 flex items-center gap-4 opacity-60">
          <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center shrink-0"><Pill className="w-5 h-5 text-muted-foreground" /></div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Overdue Meds</p>
            <p className="text-3xl font-black font-display text-muted-foreground leading-none mt-0.5">—</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5 flex items-center gap-4 opacity-60">
          <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center shrink-0"><Calendar className="w-5 h-5 text-muted-foreground" /></div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Due Soon</p>
            <p className="text-3xl font-black font-display text-muted-foreground leading-none mt-0.5">—</p>
          </div>
        </div>
      </div>

      {/* Herd breakdown mini-stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-card to-card/50 border-none shadow-md shadow-black/5">
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-muted-foreground mb-1">Total Herd</p>
            <p className="text-4xl font-black font-display text-primary">{animals.length}</p>
          </CardContent>
        </Card>
        {(() => {
          const speciesCards = Object.entries(speciesCounts).slice(0, 3).map(([species, count]) => (
            <Card key={species} className="border-none shadow-md shadow-black/5">
              <CardContent className="p-5">
                <p className="text-sm font-semibold text-muted-foreground mb-1">{pluralizeSpecies(species)}</p>
                <p className="text-3xl font-bold font-display text-foreground">{count}</p>
              </CardContent>
            </Card>
          ));
          const fallbacks = [
            <Card key="female" className="border-none shadow-md shadow-black/5"><CardContent className="p-5"><p className="text-sm font-semibold text-muted-foreground mb-1">Female</p><p className="text-3xl font-bold font-display text-foreground">{femaleCount}</p></CardContent></Card>,
            <Card key="male" className="border-none shadow-md shadow-black/5"><CardContent className="p-5"><p className="text-sm font-semibold text-muted-foreground mb-1">Male</p><p className="text-3xl font-bold font-display text-foreground">{maleCount}</p></CardContent></Card>,
          ];
          return [...speciesCards, ...fallbacks.slice(0, 3 - speciesCards.length)];
        })()}
      </div>

      {/* Herd Health Forecast teaser */}
      <Card className="flex flex-col shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-lg flex items-center gap-2 text-foreground">
            <CloudLightning className="w-5 h-5 text-primary" /> Herd Health Forecast
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
  const [isExportingPDF, setIsExportingPDF] = useState(false);

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


  const speciesCounts = React.useMemo(() => {
    if (!animals) return {};
    return animals.reduce((acc, animal) => {
      acc[animal.species] = (acc[animal.species] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [animals]);

  const generateHerdReport = async () => {
    if (!animals || (animals as Animal[]).length === 0) return;
    setIsExportingPDF(true);
    try {
      const { jsPDF } = await import("jspdf");

      // Fetch health events for all animals in parallel
      const healthEventsByAnimalId: Record<number, { eventDate: string; description: string; severity: string }[]> = {};
      await Promise.all(
        (animals as Animal[]).map(async (animal) => {
          try {
            const res = await fetch(`/api/animals/${animal.id}/health-events`);
            if (res.ok) healthEventsByAnimalId[animal.id] = await res.json();
          } catch {}
        })
      );

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const ML = 20; const MR = 20;
      const contentWidth = pageWidth - ML - MR;
      let y = 0;

      const today = new Date();
      const in7DaysStr = new Date(today.getTime() + 7 * 86400000).toISOString().split("T")[0];
      const ranchName = activeRanch?.name ?? "My Ranch";

      const checkPage = (needed = 12) => {
        if (y + needed > pageHeight - 18) { doc.addPage(); y = 18; }
      };

      // ── Cover header ──────────────────────────────────────────────────────
      doc.setFillColor(22, 46, 42);
      doc.rect(0, 0, pageWidth, 44, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.text("HERD REPORT", pageWidth / 2, 17, { align: "center" });

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(ranchName, pageWidth / 2, 26, { align: "center" });

      doc.setFontSize(8.5);
      doc.setTextColor(160, 210, 180);
      doc.text(`Generated ${format(today, "MMMM d, yyyy")}`, pageWidth / 2, 33, { align: "center" });

      y = 56;

      // ── Herd Summary ──────────────────────────────────────────────────────
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(22, 46, 42);
      doc.text("HERD SUMMARY", ML, y);
      y += 2;
      doc.setDrawColor(66, 169, 110);
      doc.setLineWidth(0.5);
      doc.line(ML, y, pageWidth - MR, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(40, 40, 40);
      doc.text(`Total Animals: ${(animals as Animal[]).length}`, ML, y);
      y += 5.5;

      const speciesBreakdown = Object.entries(speciesCounts)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([s, c]) => `${s}: ${c}`)
        .join("   ·   ");
      const breakdownLines = doc.splitTextToSize(`Species: ${speciesBreakdown}`, contentWidth);
      doc.text(breakdownLines, ML, y);
      y += breakdownLines.length * 5 + 2;

      const activeAlerts = (alerts || []).filter(a => !a.isDismissed);
      if (activeAlerts.length > 0) {
        doc.setTextColor(180, 60, 40);
        doc.text(`Active Alerts: ${activeAlerts.length}`, ML, y);
        doc.setTextColor(40, 40, 40);
        y += 5.5;
      }
      y += 8;

      // ── Build lookup maps ────────────────────────────────────────────────
      const medsByAnimal: Record<number, { medicationName: string; nextDueDate: string; isOverdue: boolean }[]> = {};
      for (const med of upcoming?.medications ?? []) {
        if (!medsByAnimal[med.animalId]) medsByAnimal[med.animalId] = [];
        medsByAnimal[med.animalId].push(med);
      }
      const alertsByAnimal: Record<number, typeof activeAlerts> = {};
      for (const alert of activeAlerts) {
        if (alert.animalId) {
          if (!alertsByAnimal[alert.animalId]) alertsByAnimal[alert.animalId] = [];
          alertsByAnimal[alert.animalId].push(alert);
        }
      }

      // ── Animals by species ───────────────────────────────────────────────
      const bySpecies = (animals as Animal[]).reduce<Record<string, Animal[]>>((acc, a) => {
        (acc[a.species] = acc[a.species] || []).push(a);
        return acc;
      }, {});

      for (const [species, group] of Object.entries(bySpecies).sort(([a], [b]) => a.localeCompare(b))) {
        checkPage(18);

        // Species header bar
        doc.setFillColor(22, 46, 42);
        doc.rect(ML - 2, y - 5.5, contentWidth + 4, 9, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(255, 255, 255);
        doc.text(`${species.toUpperCase()}  (${group.length})`, ML + 1, y);
        y += 8;

        for (const animal of group) {
          checkPage(14);

          // Animal name + tag
          const tag = animal.tagNumber ? `  #${animal.tagNumber}` : "";
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.5);
          doc.setTextColor(22, 46, 42);
          doc.text(`${animal.name}${tag}`, ML + 3, y);
          y += 4.5;

          // Detail line
          const age = formatAge(animal.dateOfBirth);
          const loc = (animal as Animal & { locationName?: string | null }).locationName
            ? `  ·  ${(animal as Animal & { locationName?: string | null }).locationName}`
            : "";
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(80, 80, 80);
          doc.text(`${animal.breed || "Unknown Breed"}  ·  ${animal.sex}  ·  ${age}${loc}`, ML + 3, y);
          y += 4.5;

          // Most recent health event
          const events = healthEventsByAnimalId[animal.id] ?? [];
          if (events.length > 0) {
            checkPage(6);
            const evt = events[0];
            const sevColors: Record<string, [number, number, number]> = {
              high: [180, 60, 40], medium: [160, 110, 30], low: [50, 120, 70],
            };
            const [r, g, b] = sevColors[evt.severity] ?? [80, 80, 80];
            doc.setTextColor(r, g, b);
            const evtLines = doc.splitTextToSize(
              `Latest health (${evt.eventDate}): ${evt.description} [${evt.severity}]`,
              contentWidth - 6
            );
            doc.text(evtLines, ML + 6, y);
            y += evtLines.length * 4;
          }

          // Overdue meds
          const animalMeds = medsByAnimal[animal.id] ?? [];
          const overdue = animalMeds.filter(m => m.isOverdue);
          if (overdue.length > 0) {
            checkPage(5);
            doc.setTextColor(180, 60, 40);
            const txt = doc.splitTextToSize(
              `Overdue: ${overdue.map(m => `${m.medicationName} (was due ${m.nextDueDate})`).join(", ")}`,
              contentWidth - 6
            );
            doc.text(txt, ML + 6, y);
            y += txt.length * 4;
          }

          // Upcoming meds (next 7 days)
          const soon = animalMeds.filter(m => !m.isOverdue && m.nextDueDate <= in7DaysStr);
          if (soon.length > 0) {
            checkPage(5);
            doc.setTextColor(130, 100, 20);
            const txt = doc.splitTextToSize(
              `Due within 7 days: ${soon.map(m => `${m.medicationName} (${m.nextDueDate})`).join(", ")}`,
              contentWidth - 6
            );
            doc.text(txt, ML + 6, y);
            y += txt.length * 4;
          }

          // Active alerts for this animal
          const animalAlerts = alertsByAnimal[animal.id] ?? [];
          if (animalAlerts.length > 0) {
            checkPage(5);
            doc.setTextColor(160, 90, 20);
            for (const alert of animalAlerts) {
              const txt = doc.splitTextToSize(`Alert: ${alert.summary ?? alert.message}`, contentWidth - 6);
              doc.text(txt, ML + 6, y);
              y += txt.length * 4;
            }
          }

          doc.setTextColor(80, 80, 80);
          // Divider between animals
          doc.setDrawColor(210, 220, 215);
          doc.setLineWidth(0.25);
          doc.line(ML + 3, y + 1.5, pageWidth - MR, y + 1.5);
          y += 5.5;
        }
        y += 3;
      }

      // ── Footer on every page ─────────────────────────────────────────────
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7.5);
        doc.setTextColor(160, 160, 160);
        doc.setFont("helvetica", "normal");
        doc.text(
          `${ranchName}  ·  RanchPad Herd Report  ·  ${format(today, "MMMM d, yyyy")}`,
          pageWidth / 2, pageHeight - 8, { align: "center" }
        );
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - MR, pageHeight - 8, { align: "right" });
      }

      doc.save(`${ranchName.replace(/\s+/g, "_")}_Herd_Report_${format(today, "yyyy-MM-dd")}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsExportingPDF(false);
    }
  };

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
        queryClient.invalidateQueries({ queryKey: ["/api/animals"] });
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
    <div className="space-y-8">
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

      {/* Action Banner */}
      <div className="bg-card border border-border rounded-xl px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-black text-foreground tracking-tight whitespace-nowrap">Dashboard</h1>
          <p className="text-muted-foreground text-sm font-medium mt-0.5">{format(new Date(), "EEEE, MMMM do, yyyy")}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={generateHerdReport}
            disabled={isExportingPDF || !animals || (animals as Animal[]).length === 0}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap shrink-0 disabled:opacity-60 shadow-md shadow-primary/20"
          >
            {isExportingPDF
              ? <><Loader2 className="w-4 h-4 shrink-0 animate-spin" />Generating…</>
              : <><FileDown className="w-4 h-4 shrink-0" />Export Herd Report</>
            }
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg font-semibold text-sm bg-muted border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors whitespace-normal text-left disabled:opacity-60"
          >
            {importing
              ? <><Loader2 className="w-4 h-4 shrink-0 animate-spin" />Importing…</>
              : <><Upload className="w-4 h-4 shrink-0" />Upload CSV</>
            }
          </button>
          <button
            onClick={() => setScanOpen(true)}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg font-semibold text-sm bg-muted border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors whitespace-nowrap shrink-0"
          >
            <ScanLine className="w-4 h-4 shrink-0" />
            Add from Photo
          </button>
          <Link href="/animals/new" className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-md shadow-primary/30 whitespace-nowrap shrink-0">
            <PlusCircle className="w-4 h-4" />
            Add Animal
          </Link>
        </div>
      </div>

      {/* Import error */}
      {importError && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30">
          <XCircle className="w-5 h-5 shrink-0 text-destructive mt-0.5" />
          <p className="flex-1 text-sm font-semibold text-foreground">{importError}</p>
          <button onClick={() => setImportError(null)} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"><XCircle className="w-4 h-4" /></button>
        </div>
      )}

      {/* Import success */}
      {importSummary && (
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 shrink-0 text-primary" />
              <p className="text-sm font-semibold text-foreground">
                Import complete — {importSummary.animalsCreated} {importSummary.animalsCreated === 1 ? "animal" : "animals"} added
                {importSummary.skipped.length > 0 && `, ${importSummary.skipped.length} ${importSummary.skipped.length === 1 ? "row" : "rows"} skipped`}
              </p>
            </div>
            <button onClick={() => setImportSummary(null)} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"><XCircle className="w-4 h-4" /></button>
          </div>
          {importSummary.skipped.length > 0 && (
            <ul className="space-y-1 pl-7">
              {importSummary.skipped.map((s, i) => (
                <li key={i} className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Row {s.row}:</span> {plainEnglishSkipReason(s.reason)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link href="/animals">
          <div className="group cursor-pointer bg-card rounded-2xl border border-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Users className="w-5 h-5 text-primary" /></div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Animals</p>
              <p className="text-3xl font-black font-display text-primary leading-none mt-0.5">{animalsLoading ? "—" : totalAnimals}</p>
            </div>
          </div>
        </Link>

        <Link href="/alerts">
          <div className={`group cursor-pointer rounded-2xl border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-5 flex items-center gap-4 ${activeAlertCount > 0 ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800" : "bg-card border-border"}`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${activeAlertCount > 0 ? "bg-red-100 dark:bg-red-900/50" : "bg-muted"}`}>
              <AlertTriangle className={`w-5 h-5 ${activeAlertCount > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`} />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Alerts</p>
              <p className={`text-3xl font-black font-display leading-none mt-0.5 ${activeAlertCount > 0 ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>{alertsLoading ? "—" : activeAlertCount}</p>
            </div>
          </div>
        </Link>

        <Link href="/animals">
          <div className={`group cursor-pointer rounded-2xl border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-5 flex items-center gap-4 ${overdueMedsCount > 0 ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" : "bg-card border-border"}`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${overdueMedsCount > 0 ? "bg-amber-100 dark:bg-amber-900/50" : "bg-muted"}`}>
              <Pill className={`w-5 h-5 ${overdueMedsCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`} />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Overdue Meds</p>
              <p className={`text-3xl font-black font-display leading-none mt-0.5 ${overdueMedsCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>{upcomingLoading ? "—" : overdueMedsCount}</p>
            </div>
          </div>
        </Link>

        <Link href="/animals?filter=due-soon">
          <div className={`group cursor-pointer rounded-2xl border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-5 flex items-center gap-4 ${dueSoonCount > 0 ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800" : "bg-card border-border"}`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${dueSoonCount > 0 ? "bg-blue-100 dark:bg-blue-900/50" : "bg-muted"}`}>
              <Calendar className={`w-5 h-5 ${dueSoonCount > 0 ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`} />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Due Soon</p>
              <p className={`text-3xl font-black font-display leading-none mt-0.5 ${dueSoonCount > 0 ? "text-blue-600 dark:text-blue-400" : "text-foreground"}`}>{upcomingLoading ? "—" : dueSoonCount}</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Herd breakdown mini-stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {animalsLoading ? (
          Array(4).fill(0).map((_, i) => <div key={i} className="h-28 bg-muted animate-pulse rounded-2xl" />)
        ) : (
          <>
            <Card className="bg-gradient-to-br from-card to-card/50 border-none shadow-md shadow-black/5">
              <CardContent className="p-5">
                <p className="text-sm font-semibold text-muted-foreground mb-1">Total Herd</p>
                <p className="text-4xl font-black font-display text-primary">{animals?.length || 0}</p>
              </CardContent>
            </Card>
            {(() => {
              const speciesCards = Object.entries(speciesCounts).slice(0, 3).map(([species, count]) => (
                <Card key={species} className="border-none shadow-md shadow-black/5">
                  <CardContent className="p-5">
                    <p className="text-sm font-semibold text-muted-foreground mb-1">{pluralizeSpecies(species)}</p>
                    <p className="text-3xl font-bold font-display text-foreground">{count}</p>
                  </CardContent>
                </Card>
              ));
              const fallbacks = [
                <Card key="female" className="border-none shadow-md shadow-black/5"><CardContent className="p-5"><p className="text-sm font-semibold text-muted-foreground mb-1">Female</p><p className="text-3xl font-bold font-display text-foreground">{femaleCount}</p></CardContent></Card>,
                <Card key="male" className="border-none shadow-md shadow-black/5"><CardContent className="p-5"><p className="text-sm font-semibold text-muted-foreground mb-1">Male</p><p className="text-3xl font-bold font-display text-foreground">{maleCount}</p></CardContent></Card>,
                avgAgeMonths !== null ? <Card key="age" className="border-none shadow-md shadow-black/5"><CardContent className="p-5"><p className="text-sm font-semibold text-muted-foreground mb-1">Avg Age</p><p className="text-3xl font-bold font-display text-foreground">{avgAgeMonths}<span className="text-base font-medium text-muted-foreground ml-1">mo</span></p></CardContent></Card> : null,
              ].filter(Boolean);
              return [...speciesCards, ...fallbacks.slice(0, 3 - speciesCards.length)];
            })()}
          </>
        )}
      </div>

      {/* Herd Health Forecast — full width */}
      <Card className="flex flex-col shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl flex items-center gap-2 text-foreground">
                <CloudLightning className="w-5 h-5 text-primary" /> Herd Health Forecast
              </CardTitle>
              <Badge variant="outline" className="font-bold">{weatherAlerts.length}</Badge>
            </div>
            <button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold bg-muted border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${generateMutation.isPending ? "animate-spin" : ""}`} />
              Run Analysis
            </button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 flex flex-col">
          {/* Slim weather context row */}
          {!weatherLoading && weather && (
            <div className="px-5 py-2.5 bg-muted/20 border-b border-border/40 flex items-center gap-2.5 flex-wrap text-xs text-muted-foreground">
              <img src={`https://openweathermap.org/img/wn/${weather.current.icon}.png`} alt="" className="w-5 h-5 opacity-70 -ml-0.5" />
              <span className="font-bold text-foreground text-sm">{Math.round(weather.current.temp)}°F</span>
              <span className="capitalize">{weather.current.description}</span>
              <span className="opacity-40">·</span>
              <span className="flex items-center gap-1"><Droplets className="w-3 h-3" />{weather.current.humidity}%</span>
              <span className="flex items-center gap-1"><Wind className="w-3 h-3" />{Math.round(weather.current.windSpeed)} mph</span>
            </div>
          )}
          {alertsLoading ? (
            <div className="p-6 space-y-4">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)}</div>
          ) : sortedWeatherAlerts.length === 0 ? (
            <div className="flex flex-col">
              <div className="flex flex-col items-center justify-center py-6 text-center px-5">
                <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-3"><CheckCircle2 className="w-7 h-7 text-green-600 dark:text-green-400" /></div>
                <h3 className="font-bold text-base text-foreground">All clear!</h3>
                <p className="text-muted-foreground text-sm mt-1">No active weather alerts for your herd.</p>
              </div>
              <div className="mx-5 border-t border-dashed border-border/60" />
              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest px-5 pt-3 pb-1">Example alerts</p>
              <div className="divide-y divide-border/40 opacity-40 pointer-events-none select-none">
                <div className="p-4 flex gap-4">
                  <div className="mt-0.5 shrink-0"><div className="w-3 h-3 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)]" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground leading-tight">Clyde (TXS-010) — Bottle jaw and FAMACHA 5 recorded 3 days ago. Barber pole worm burden likely critical given heavy rain forecast.</p>
                    <p className="text-xs text-muted-foreground mt-1.5 font-medium uppercase tracking-wider">weather forecast</p>
                  </div>
                </div>
                <div className="p-4 flex gap-4">
                  <div className="mt-0.5 shrink-0"><div className="w-3 h-3 rounded-full bg-destructive shadow-[0_0_8px_rgba(255,0,0,0.4)]" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground leading-tight">High humidity and warm temps forecast this week — ideal conditions for barber pole worm larvae. Check FAMACHA scores on all sheep and goats.</p>
                    <p className="text-xs text-muted-foreground mt-1.5 font-medium uppercase tracking-wider">weather forecast</p>
                  </div>
                </div>
                <div className="p-4 flex gap-4">
                  <div className="mt-0.5 shrink-0"><div className="w-3 h-3 rounded-full bg-yellow-500" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground leading-tight">Freezing overnight temps expected — animals with respiratory history are at elevated risk. Ensure shelter access for Bella and Rex.</p>
                    <p className="text-xs text-muted-foreground mt-1.5 font-medium uppercase tracking-wider">weather forecast</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="divide-y-0">
              {sortedWeatherAlerts.map(alert => (
                <WeatherAlertRow
                  key={alert.id}
                  alert={alert}
                  onDismiss={(id) => dismissMutation.mutate({ alertId: id })}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming — full width */}
      <Card className="flex flex-col shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-xl flex items-center gap-2 text-foreground">
            <Stethoscope className="w-5 h-5 text-primary" /> Upcoming
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex flex-col">
          {upcomingLoading ? (
            <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded-xl" />)}</div>
          ) : (!upcoming || (upcoming.medications.length === 0 && upcoming.pregnancies.length === 0)) ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-3"><CheckCircle2 className="w-7 h-7 text-green-600 dark:text-green-400" /></div>
              <h3 className="font-bold text-base text-foreground">All clear!</h3>
              <p className="text-muted-foreground text-sm mt-1">No medications or births due soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border/50">
              {upcoming.medications.length > 0 && (
                <div className="p-4">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><Pill className="w-3.5 h-3.5" /> Medications</p>
                  <div className="space-y-2">
                    {upcoming.medications.map(med => {
                      const daysUntil = differenceInDays(parseISO(med.nextDueDate), new Date());
                      return (
                        <Link key={med.id} href={`/animals/${med.animalId}`} className="flex items-start justify-between gap-2 group hover:bg-muted/50 rounded-lg p-1.5 -mx-1.5 transition-colors">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{med.animalName}</p>
                            <p className="text-xs text-muted-foreground truncate">{med.medicationName}</p>
                          </div>
                          <span className={`text-xs font-bold shrink-0 px-2 py-0.5 rounded-full ${med.isOverdue ? "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400" : "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400"}`}>
                            {med.isOverdue ? `${Math.abs(daysUntil)}d overdue` : daysUntil === 0 ? "Today" : `${daysUntil}d`}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
              {upcoming.pregnancies.length > 0 && (
                <div className="p-4">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><Baby className="w-3.5 h-3.5" /> Expected Births</p>
                  <div className="space-y-2">
                    {upcoming.pregnancies.map(preg => {
                      const daysUntil = differenceInDays(parseISO(preg.expectedDueDate), new Date());
                      return (
                        <Link key={preg.animalId} href={`/animals/${preg.animalId}`} className="flex items-start justify-between gap-2 group hover:bg-muted/50 rounded-lg p-1.5 -mx-1.5 transition-colors">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{preg.animalName}</p>
                            <p className="text-xs text-muted-foreground">{preg.species}</p>
                          </div>
                          <span className={`text-xs font-bold shrink-0 px-2 py-0.5 rounded-full ${daysUntil < 0 ? "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400" : daysUntil <= 7 ? "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400" : "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400"}`}>
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
        </CardContent>
      </Card>

      </>
      )}
    </div>
  );
}
