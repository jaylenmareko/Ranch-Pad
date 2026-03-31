import React, { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, AlertTriangle, CloudLightning, ChevronRight, X, Pill, Baby, Calendar, Stethoscope, Users, CheckCircle2, Upload, Loader2, XCircle, CheckCircle, Lock, Droplets, Wind, RefreshCw, ScanLine } from "lucide-react";
import { useListAnimals, useListAlerts, useGetWeather, useDismissAlert, useGenerateAlerts, getGetWeatherQueryKey, useGetUpcoming, type Animal } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format, differenceInDays, parseISO } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useAuthModal } from "@/contexts/auth-modal-context";
import { getGuestAnimals, importCsvToGuestStore, clearGuestAnimals, type GuestAnimal } from "@/lib/guest-store";
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

// ─── Auth Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return <GuestDashboard />;

  return <AuthDashboard />;
}

function AuthDashboard() {
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [modeDialogOpen, setModeDialogOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);

  const { data: animals, isLoading: animalsLoading } = useListAnimals();
  const { data: alerts, isLoading: alertsLoading } = useListAlerts();
  const { data: weather, isLoading: weatherLoading, refetch: refetchWeather, isFetching: weatherFetching } = useGetWeather({ query: { queryKey: getGetWeatherQueryKey(), retry: false } });
  const { data: upcoming, isLoading: upcomingLoading } = useGetUpcoming();

  const generateMutation = useGenerateAlerts({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/alerts"] })
    }
  });

  const dismissMutation = useDismissAlert({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/alerts"] })
    }
  });

  useEffect(() => {
    generateMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  const sortedAlerts = [...activeAlerts].sort((a, b) => {
    const weights = { high: 3, medium: 2, low: 1 };
    return weights[b.severity as keyof typeof weights] - weights[a.severity as keyof typeof weights];
  }).slice(0, 5);

  const totalAnimals = animals?.length ?? 0;
  const activeAlertCount = activeAlerts.length;
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
              <Badge variant="outline" className="font-bold">{activeAlerts.length}</Badge>
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
          ) : sortedAlerts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4"><CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" /></div>
              <h3 className="font-bold text-lg text-foreground">All clear!</h3>
              <p className="text-muted-foreground text-sm mt-1">No active alerts right now.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50 overflow-y-auto max-h-[400px]">
              {sortedAlerts.map(alert => (
                <div key={alert.id} className="p-5 flex gap-4 hover:bg-muted/30 transition-colors group">
                  <div className="mt-0.5"><div className={`w-3 h-3 rounded-full ${alert.severity === 'critical' ? 'bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.6)]' : alert.severity === 'high' ? 'bg-destructive shadow-[0_0_10px_rgba(255,0,0,0.5)]' : alert.severity === 'moderate' || alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} /></div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground leading-tight">
                      {alert.animalName ? <Link href={`/animals/${alert.animalId}`} className="text-primary hover:underline">{alert.animalName}</Link> : null}
                      {alert.animalName ? ' — ' : ''}{alert.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1.5 font-medium uppercase tracking-wider">{alert.alertType.replace(/_/g, ' ')}</p>
                  </div>
                  <button onClick={() => dismissMutation.mutate({ alertId: alert.id })} className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-2.5 min-w-[44px] min-h-[44px] text-muted-foreground hover:bg-muted hover:text-foreground rounded-full transition-all shrink-0 self-start flex items-center justify-center" aria-label="Dismiss alert">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {activeAlerts.length > 5 && (
            <div className="p-4 border-t border-border/50 bg-muted/10 text-center">
              <Link href="/alerts" className="text-sm font-bold text-primary hover:underline flex items-center justify-center">View all {activeAlerts.length} alerts <ChevronRight className="w-4 h-4 ml-1" /></Link>
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
