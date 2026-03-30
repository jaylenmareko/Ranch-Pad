import React, { useRef, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, Plus, FileText, ChevronDown, ChevronRight, Download, Upload, CheckCircle, XCircle, Loader2, PawPrint, Calendar, MapPin, ArrowRight, ScanLine } from "lucide-react";
import { useListAnimals, type Animal } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatAge } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useAuthModal } from "@/contexts/auth-modal-context";
import { getGuestAnimals, clearGuestAnimals, type GuestAnimal, setPostSignupAction, setPostSignupCsv, getPostSignupAction, clearPostSignupState } from "@/lib/guest-store";
import { SimpleDialog } from "@/components/ui/dialog";
import { ImportModeDialog } from "@/components/ImportModeDialog";
import { ScanPhotoDialog } from "@/components/ScanPhotoDialog";

// ─── CSV Template ──────────────────────────────────────────────────────────────

const CSV_TEMPLATE_HEADERS = [
  "name", "tag_number", "species", "breed", "sex", "date_of_birth",
  "health_event_description", "health_event_date", "health_event_severity",
  "medication_name", "dosage", "date_given", "next_due_date",
].join(",");

const CSV_EXAMPLE_ROW = [
  "Bessie", "A101", "Cattle", "Angus", "Heifer", "2023-04-15",
  "Routine checkup", "2024-01-10", "low",
  "Ivermectin", "5ml", "2024-01-10", "2025-01-10",
].join(",");

function downloadTemplate() {
  const content = `${CSV_TEMPLATE_HEADERS}\n${CSV_EXAMPLE_ROW}\n`;
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ranchpad-animal-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

interface ImportSkip { row: number; reason: string; }
interface ImportSummary {
  animalsCreated: number;
  healthEventsCreated: number;
  medicationRecordsCreated: number;
  skipped: ImportSkip[];
}

// ─── Species Icons ─────────────────────────────────────────────────────────────

const SPECIES_ICONS: Record<string, string> = {
  Cattle: "🐄",
  Sheep: "🐑",
  Goat: "🐐",
  Goats: "🐐",
  Pig: "🐷",
  Pigs: "🐷",
  Horse: "🐴",
  Horses: "🐴",
  Chicken: "🐔",
  Chickens: "🐔",
  Duck: "🦆",
  Ducks: "🦆",
  Turkey: "🦃",
  Turkeys: "🦃",
  Llama: "🦙",
  Llamas: "🦙",
  Alpaca: "🦙",
  Alpacas: "🦙",
  Rabbit: "🐰",
  Rabbits: "🐰",
};

function speciesIcon(species: string): string {
  return SPECIES_ICONS[species] ?? "🐾";
}

function HealthDot({ severity }: { severity?: string | null }) {
  let colorClass = "bg-muted border-border/50";
  if (severity === "high") colorClass = "bg-destructive shadow-[0_0_8px_rgba(255,0,0,0.5)] border-transparent";
  else if (severity === "medium") colorClass = "bg-yellow-500 border-transparent";
  else if (severity === "low") colorClass = "bg-green-500 border-transparent";
  return <span className={`inline-block w-2.5 h-2.5 rounded-full border ${colorClass} shrink-0`} title={`Health: ${severity || "Clear"}`} />;
}

// ─── Animal Card ────────────────────────────────────────────────────────────

function AnimalCard({ animal }: { animal: Animal }) {
  return (
    <Link href={`/animals/${animal.id}`}>
      <Card className="h-full transition-all duration-200 cursor-pointer group hover:shadow-md hover:border-primary/40">
        <CardContent className="p-4 flex flex-col h-full">
          <div className="flex items-start gap-2.5 mb-3">
            <HealthDot severity={animal.latestHealthSeverity} />
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-base text-foreground leading-tight truncate group-hover:text-primary transition-colors">
                {animal.name}
              </h3>
              {animal.tagNumber && (
                <span className="text-xs font-mono font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded mt-0.5 inline-block">
                  #{animal.tagNumber}
                </span>
              )}
            </div>
          </div>
          <div className="mt-auto space-y-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="outline" className="border-border text-muted-foreground text-xs py-0">{animal.sex}</Badge>
              {animal.breed && (
                <Badge variant="outline" className="border-border text-muted-foreground text-xs py-0">{animal.breed}</Badge>
              )}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              {animal.dateOfBirth ? (
                <span>{new Date(animal.dateOfBirth).toLocaleDateString()}</span>
              ) : <span />}
              <span>{formatAge(animal.dateOfBirth)}</span>
            </div>
            {animal.sex === "Female" && animal.expectedDueDate && (
              <p className="text-xs font-semibold text-pink-600 dark:text-pink-400">
                Due: {new Date(animal.expectedDueDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ─── Guest Animal Card ─────────────────────────────────────────────────────────

function GuestAnimalCard({ animal }: { animal: GuestAnimal }) {
  return (
    <Card className="h-full border-dashed border-border/70">
      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex items-start gap-2.5 mb-3">
          <span className="text-lg leading-none">{SPECIES_ICONS[animal.species] ?? "🐾"}</span>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-base text-foreground leading-tight truncate">{animal.name}</h3>
            {animal.tagNumber && (
              <span className="text-xs font-mono font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded mt-0.5 inline-block">
                #{animal.tagNumber}
              </span>
            )}
          </div>
        </div>
        <div className="mt-auto space-y-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="outline" className="border-border text-muted-foreground text-xs py-0">{animal.sex}</Badge>
            {animal.breed && (
              <Badge variant="outline" className="border-border text-muted-foreground text-xs py-0">{animal.breed}</Badge>
            )}
          </div>
          {animal.dateOfBirth && (
            <p className="text-xs text-muted-foreground font-medium">
              {new Date(animal.dateOfBirth).toLocaleDateString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Save Your Herd Dialog ─────────────────────────────────────────────────────

function SaveHerdDialog({ open, onOpenChange, onSignup, onLogin }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignup: () => void;
  onLogin: () => void;
}) {
  return (
    <SimpleDialog open={open} onOpenChange={onOpenChange} title="Save Your Herd">
      <div className="flex flex-col items-center text-center gap-5 py-1">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <span className="text-3xl leading-none">🐄</span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
          Create a free account to keep your animals forever — accessible on any device, with alerts and health reminders.
        </p>
        <div className="flex flex-col gap-2.5 w-full max-w-xs">
          <button
            onClick={onSignup}
            className="w-full inline-flex items-center justify-center gap-2 h-10 px-6 rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Create Free Account <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onLogin}
            className="w-full inline-flex items-center justify-center h-10 px-6 rounded-xl font-semibold border border-border text-foreground hover:bg-muted transition-colors"
          >
            Log In
          </button>
          <button
            onClick={() => onOpenChange(false)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            Not now
          </button>
        </div>
      </div>
    </SimpleDialog>
  );
}

// ─── Guest Animal List ─────────────────────────────────────────────────────────

function GuestSpeciesFolder({ species, animals }: { species: string; animals: GuestAnimal[] }) {
  const [open, setOpen] = useState(() => getFolderOpen(species));

  function toggle() {
    setOpen(o => {
      const next = !o;
      setFolderOpen(species, next);
      return next;
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <button
        onClick={toggle}
        className="relative w-full flex items-center gap-3 px-5 py-3.5 bg-muted/40 hover:bg-muted/70 transition-colors border-b border-border/50"
      >
        <span className="text-2xl leading-none">{speciesIcon(species)}</span>
        <span className="font-black text-lg text-foreground font-display flex-1 text-left">{species}</span>
        {!open && (
          <span className="absolute left-1/2 -translate-x-1/2 text-xs font-semibold text-muted-foreground pointer-events-none">
            Click Here
          </span>
        )}
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
            {animals.length} {animals.length === 1 ? "animal" : "animals"}
          </span>
          {open
            ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
            : <ChevronRight className="w-4 h-4 text-muted-foreground" />
          }
        </div>
      </button>
      {open && (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {animals.map(a => <GuestAnimalCard key={a.id} animal={a} />)}
        </div>
      )}
    </div>
  );
}

function GuestAnimalList() {
  const { openSignup, openLogin } = useAuthModal();
  const [guestAnimals, setGuestAnimals] = useState<GuestAnimal[]>(() => getGuestAnimals());
  const [readingFile, setReadingFile] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [saveHerdOpen, setSaveHerdOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const refresh = () => setGuestAnimals(getGuestAnimals());
    window.addEventListener("guest-save", refresh);
    return () => window.removeEventListener("guest-save", refresh);
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setImportError(null);
    const isCSV = file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv" || file.type === "application/csv";
    if (!isCSV) { setImportError("Please upload a CSV file."); return; }
    if (file.size === 0) { setImportError("This file appears to be empty."); return; }
    setReadingFile(true);
    file.text().then(text => {
      setPostSignupCsv(text);
      setPostSignupAction("import");
      setSaveHerdOpen(true);
    }).catch(() => {
      setImportError("Something went wrong reading your file. Please try again.");
    }).finally(() => setReadingFile(false));
  }

  function handleAddAnimal() {
    setPostSignupAction("add");
    setSaveHerdOpen(true);
  }

  function handleSignup() {
    setSaveHerdOpen(false);
    openSignup();
  }

  function handleLogin() {
    clearPostSignupState();
    setSaveHerdOpen(false);
    openLogin();
  }

  function handleDismiss() {
    clearPostSignupState();
    setSaveHerdOpen(false);
  }

  const bySpecies = guestAnimals.reduce<Record<string, GuestAnimal[]>>((acc, a) => {
    (acc[a.species] = acc[a.species] || []).push(a);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-foreground whitespace-nowrap">Herd Directory</h1>
          <p className="text-muted-foreground font-medium mt-1">{guestAnimals.length} animals</p>
        </div>
        <TooltipProvider delayDuration={300}>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={downloadTemplate} className="h-10 min-w-[44px] px-2.5 sm:px-4 rounded-xl font-semibold text-sm" aria-label="Download CSV template">
                  <Download className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Download Template</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download CSV template</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={readingFile} className="h-10 px-3 sm:px-4 rounded-xl font-semibold text-sm" aria-label="Upload your herd from a csv file here">
                  {readingFile
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" />Reading…</>
                    : <><Upload className="w-4 h-4 mr-2 shrink-0" />Upload your herd from a csv file here</>
                  }
                </Button>
              </TooltipTrigger>
              <TooltipContent>Upload your herd from a csv file here</TooltipContent>
            </Tooltip>
            <Button onClick={handleAddAnimal} className="h-10 px-4 sm:px-5 rounded-xl font-semibold bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:-translate-y-0.5 transition-transform text-sm whitespace-nowrap">
              <Plus className="w-4 h-4 mr-2" /> Add Animal
            </Button>
          </div>
        </TooltipProvider>
      </div>

      {importError && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
          <XCircle className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
          <p className="flex-1 text-sm font-semibold text-red-700 dark:text-red-300">{importError}</p>
          <button onClick={() => setImportError(null)} className="shrink-0 text-red-400 hover:text-red-600 transition-colors" aria-label="Dismiss"><XCircle className="w-4 h-4" /></button>
        </div>
      )}

      {guestAnimals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-5">
            <span className="text-4xl leading-none">🐄</span>
          </div>
          <h2 className="font-bold text-xl text-foreground mb-2">No animals yet</h2>
          <p className="text-muted-foreground text-sm max-w-xs mb-6 leading-relaxed">
            Add your first animal to get started. Create a free account to save your herd across devices.
          </p>
          <Button onClick={handleAddAnimal} className="h-11 px-6 rounded-xl font-semibold bg-primary text-primary-foreground hover:-translate-y-0.5 transition-transform shadow-md shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" /> Add Your First Animal
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(bySpecies).map(([species, animals]) => (
            <GuestSpeciesFolder key={species} species={species} animals={animals} />
          ))}
          <p className="text-xs text-muted-foreground text-center pt-2">
            You're using RanchPad as a guest.{" "}
            <button onClick={openSignup} className="underline text-primary font-semibold">Sign up</button>{" "}
            to sync your herd across devices.
          </p>
        </div>
      )}

      <SaveHerdDialog
        open={saveHerdOpen}
        onOpenChange={open => { if (!open) handleDismiss(); else setSaveHerdOpen(true); }}
        onSignup={handleSignup}
        onLogin={handleLogin}
      />
    </div>
  );
}

const FOLDER_STORAGE_KEY = "ranchpad:folderOpen";

function getFolderOpen(species: string): boolean {
  try {
    const stored = localStorage.getItem(FOLDER_STORAGE_KEY);
    if (!stored) return false;
    const map = JSON.parse(stored) as Record<string, boolean>;
    return map[species] ?? false;
  } catch {
    return false;
  }
}

function setFolderOpen(species: string, value: boolean): void {
  try {
    const stored = localStorage.getItem(FOLDER_STORAGE_KEY);
    const map = stored ? (JSON.parse(stored) as Record<string, boolean>) : {};
    map[species] = value;
    localStorage.setItem(FOLDER_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

function SpeciesFolder({
  species,
  animals,
  initialOpen,
}: {
  species: string;
  animals: Animal[];
  initialOpen?: boolean;
}) {
  const [open, setOpen] = useState(() => initialOpen !== undefined ? initialOpen : getFolderOpen(species));

  function toggle() {
    setOpen(o => {
      const next = !o;
      setFolderOpen(species, next);
      return next;
    });
  }

  const highCount = animals.filter(a => a.latestHealthSeverity === "high").length;
  const medCount = animals.filter(a => a.latestHealthSeverity === "medium").length;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <button
        onClick={toggle}
        className="relative w-full flex items-center gap-3 px-5 py-3.5 bg-muted/40 hover:bg-muted/70 transition-colors border-b border-border/50"
      >
        <span className="text-2xl leading-none">{speciesIcon(species)}</span>
        <span className="font-black text-lg text-foreground font-display flex-1 text-left">{species}</span>
        {!open && (
          <span className="absolute left-1/2 -translate-x-1/2 text-xs font-semibold text-muted-foreground pointer-events-none">
            Click Here
          </span>
        )}
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
            {animals.length} {animals.length === 1 ? "animal" : "animals"}
          </span>
          {highCount > 0 && (
            <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
              {highCount} urgent
            </span>
          )}
          {medCount > 0 && highCount === 0 && (
            <span className="text-xs font-bold text-yellow-600 bg-yellow-500/10 px-2 py-0.5 rounded-full">
              {medCount} watch
            </span>
          )}
          {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {animals.map(animal => (
            <AnimalCard key={animal.id} animal={animal} />
          ))}
        </div>
      )}
    </div>
  );
}

function LocationFolder({
  locationId,
  locationName,
  animals,
  initialOpen,
}: {
  locationId: number | null;
  locationName: string | null;
  animals: Animal[];
  initialOpen?: boolean;
}) {
  const folderKey = locationId != null ? `loc:${locationId}` : "loc:unassigned";
  const [open, setOpen] = useState(() => initialOpen !== undefined ? initialOpen : getFolderOpen(folderKey));

  function toggle() {
    setOpen(o => {
      const next = !o;
      setFolderOpen(folderKey, next);
      return next;
    });
  }

  const bySpecies = React.useMemo(() => {
    const map: Record<string, Animal[]> = {};
    for (const a of animals) {
      if (!map[a.species]) map[a.species] = [];
      map[a.species].push(a);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [animals]);

  const highCount = animals.filter(a => a.latestHealthSeverity === "high").length;
  const medCount = animals.filter(a => a.latestHealthSeverity === "medium").length;
  const isUnassigned = locationId == null;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <button
        onClick={toggle}
        className="relative w-full flex items-center gap-3 px-5 py-3.5 bg-muted/40 hover:bg-muted/70 transition-colors border-b border-border/50"
      >
        <MapPin className={`w-5 h-5 shrink-0 ${isUnassigned ? "text-muted-foreground/50" : "text-primary"}`} />
        <span className="font-black text-lg text-foreground font-display flex-1 text-left">
          {isUnassigned ? "Unassigned" : locationName}
        </span>
        {!open && (
          <span className="absolute left-1/2 -translate-x-1/2 text-xs font-semibold text-muted-foreground pointer-events-none">
            Click Here
          </span>
        )}
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
            {animals.length} {animals.length === 1 ? "animal" : "animals"}
          </span>
          {highCount > 0 && (
            <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
              {highCount} urgent
            </span>
          )}
          {medCount > 0 && highCount === 0 && (
            <span className="text-xs font-bold text-yellow-600 bg-yellow-500/10 px-2 py-0.5 rounded-full">
              {medCount} watch
            </span>
          )}
          {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="p-4 space-y-3">
          {bySpecies.map(([species, speciesAnimals]) => (
            <SpeciesFolder
              key={`${folderKey}-${species}`}
              species={species}
              animals={speciesAnimals}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AnimalList() {
  const [location, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [sexFilter, setSexFilter] = useState("All");
  const [breedFilter, setBreedFilter] = useState("All");

  const dueSoonFilter = new URLSearchParams(location.includes("?") ? location.split("?")[1] : "").get("filter") === "due-soon";
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [modeDialogOpen, setModeDialogOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { isAuthenticated, role } = useAuth();

  // After signup: carry out the pending action (navigate to add form)
  useEffect(() => {
    if (!isAuthenticated) return;
    const action = getPostSignupAction();
    if (action === "add") {
      clearPostSignupState();
      setLocation("/animals/new");
    }
  }, [isAuthenticated]);

  const { data: animals, isLoading } = useListAnimals(
    { search: search.length > 2 ? search : undefined },
    { query: { enabled: isAuthenticated } },
  );

  // Guest users see their locally-stored animals
  if (!isAuthenticated) return <GuestAnimalList />;

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
    if (!isCSV) { setImportError("Please upload a CSV file. Download our template to get started."); return; }
    if (file.size === 0) { setImportError("This file appears to be empty. Please fill in the template and try again."); return; }
    const hasAnimals = animals && (animals as Animal[]).length > 0;
    if (hasAnimals) {
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

  const filteredAnimals = React.useMemo(() => {
    if (!animals) return [];
    let result = animals as Animal[];

    if (dueSoonFilter) {
      const today = new Date();
      const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      const todayStr = today.toISOString().split("T")[0];
      const in30DaysStr = in30Days.toISOString().split("T")[0];
      result = result.filter(a =>
        a.expectedDueDate &&
        a.expectedDueDate >= todayStr &&
        a.expectedDueDate <= in30DaysStr
      );
    }

    if (search.length > 0 && search.length <= 2) {
      const lower = search.toLowerCase();
      result = result.filter(a =>
        a.name.toLowerCase().includes(lower) ||
        (a.tagNumber && a.tagNumber.toLowerCase().includes(lower))
      );
    }
    if (sexFilter !== "All") result = result.filter(a => a.sex === sexFilter);
    if (breedFilter !== "All") result = result.filter(a => a.breed === breedFilter);

    return result;
  }, [animals, search, sexFilter, breedFilter, dueSoonFilter]);

  const uniqueBreeds: string[] = ["All", ...Array.from(new Set((animals || []).map((a: Animal) => a.breed).filter(Boolean))).sort() as string[]];
  const hasActiveFilters = sexFilter !== "All" || breedFilter !== "All" || dueSoonFilter;

  function clearAllFilters() {
    setSexFilter("All");
    setBreedFilter("All");
    if (dueSoonFilter) setLocation("/animals");
  }

  const grouped = React.useMemo(() => {
    const map: Record<string, Animal[]> = {};
    for (const animal of filteredAnimals) {
      if (!map[animal.species]) map[animal.species] = [];
      map[animal.species].push(animal);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredAnimals]);

  const locationGrouped = React.useMemo(() => {
    if (!filteredAnimals.some(a => a.locationId != null)) return null;
    const map = new Map<number | null, { name: string | null; animals: Animal[] }>();
    for (const a of filteredAnimals) {
      const locId = a.locationId ?? null;
      if (!map.has(locId)) map.set(locId, { name: a.locationName ?? null, animals: [] });
      map.get(locId)!.animals.push(a);
    }
    const entries = Array.from(map.entries());
    const assigned = entries.filter(([id]) => id != null).sort(([, a], [, b]) => (a.name ?? "").localeCompare(b.name ?? ""));
    const unassigned = entries.filter(([id]) => id == null);
    return [...assigned, ...unassigned] as Array<[number | null, { name: string | null; animals: Animal[] }]>;
  }, [filteredAnimals]);

  return (
    <div className="space-y-5">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-foreground whitespace-nowrap">Herd Directory</h1>
          <p className="text-muted-foreground font-medium mt-1">
            {isLoading
              ? "Loading…"
              : locationGrouped
                ? `${filteredAnimals.length} animals across ${locationGrouped.length} ${locationGrouped.length === 1 ? "location" : "locations"}`
                : `${(animals || []).length} animals across ${grouped.length} ${grouped.length === 1 ? "group" : "groups"}`}
          </p>
        </div>
        <TooltipProvider delayDuration={300}>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={downloadTemplate}
                  className="h-10 min-w-[44px] px-2.5 sm:px-4 rounded-xl font-semibold text-sm"
                  aria-label="Download CSV template"
                >
                  <Download className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Download Template</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download CSV template</TooltipContent>
            </Tooltip>
            {role !== "viewer" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={importing}
                    className="h-10 px-3 sm:px-4 rounded-xl font-semibold text-sm"
                    aria-label="Upload your herd from a csv file here"
                  >
                    {importing ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" />Importing…</>
                    ) : (
                      <><Upload className="w-4 h-4 mr-2 shrink-0" />Upload your herd from a csv file here</>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Upload your herd from a csv file here</TooltipContent>
              </Tooltip>
            )}
            {role !== "viewer" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={() => setScanOpen(true)}
                    className="h-10 px-3 sm:px-4 rounded-xl font-semibold text-sm"
                    aria-label="Scan record book to add animals"
                  >
                    <ScanLine className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Add from Photo</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Take a photo of your record book — Claude reads it and adds your animals automatically</TooltipContent>
              </Tooltip>
            )}
            {role !== "viewer" && (
              <Link href="/animals/new" className="inline-flex items-center justify-center h-10 px-4 sm:px-5 rounded-xl font-semibold bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:-translate-y-0.5 transition-transform text-sm whitespace-nowrap">
                <Plus className="w-4 h-4 mr-2" />
                Add Animal
              </Link>
            )}
          </div>
        </TooltipProvider>
      </div>

      {/* Import error — inline, red, impossible to miss */}
      {importError && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
          <XCircle className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-700 dark:text-red-300">{importError}</p>
          </div>
          <button onClick={() => setImportError(null)} className="shrink-0 text-red-400 hover:text-red-600 transition-colors" aria-label="Dismiss">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Import success — inline, green */}
      {importSummary && (
        <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 shrink-0 text-green-600 dark:text-green-400" />
              <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                Import complete — {importSummary.animalsCreated} {importSummary.animalsCreated === 1 ? "animal" : "animals"} added
                {importSummary.skipped.length > 0 && `, ${importSummary.skipped.length} ${importSummary.skipped.length === 1 ? "row" : "rows"} skipped`}
              </p>
            </div>
            <button onClick={() => setImportSummary(null)} className="shrink-0 text-green-400 hover:text-green-600 transition-colors" aria-label="Dismiss">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
          {importSummary.skipped.length > 0 && (
            <ul className="space-y-1 pl-7">
              {importSummary.skipped.map((s, i) => (
                <li key={i} className="text-xs text-yellow-700 dark:text-yellow-400">
                  <span className="font-semibold">Row {s.row}:</span> {plainEnglishSkipReason(s.reason)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Due Soon banner */}
      {dueSoonFilter && (
        <div className="flex items-center justify-between gap-3 px-5 py-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              Showing animals due within the next 30 days
            </p>
          </div>
          <button
            onClick={() => setLocation("/animals")}
            className="shrink-0 text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors text-xs font-semibold uppercase tracking-wide"
          >
            Show all
          </button>
        </div>
      )}

      {/* Filter bar */}
      <div className="bg-card border border-border p-3 rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by name or tag..."
              className="pl-12 border-none bg-muted/30 focus-visible:bg-background"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            value={breedFilter}
            onChange={e => setBreedFilter(e.target.value)}
            className="h-12 px-4 rounded-xl border-none bg-muted/30 font-medium text-sm focus:outline-none focus:bg-background transition-colors w-full md:w-48"
          >
            {uniqueBreeds.map(breed => (
              <option key={breed} value={breed}>{breed === "All" ? "All Breeds" : breed}</option>
            ))}
          </select>
          <select
            value={sexFilter}
            onChange={e => setSexFilter(e.target.value)}
            className="h-12 px-4 rounded-xl border-none bg-muted/30 font-medium text-sm focus:outline-none focus:bg-background transition-colors w-full md:w-36"
          >
            <option value="All">All Sexes</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Wether">Wether</option>
            <option value="Castrated">Castrated</option>
          </select>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="shrink-0 text-destructive hover:text-destructive">
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="h-14 bg-muted/40 animate-pulse" />
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[1, 2, 3].map(j => <div key={j} className="h-28 bg-muted rounded-xl animate-pulse" />)}
              </div>
            </div>
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-3xl border border-border border-dashed">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl leading-none">🐄</span>
          </div>
          <h3 className="text-xl font-bold text-foreground">No animals found</h3>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            {search || hasActiveFilters
              ? "Try adjusting your search or filters."
              : role === "viewer"
                ? "No animals have been assigned to you yet. Contact the ranch owner."
                : "Your herd is empty. Add your first animal to get started."}
          </p>
          {!search && !hasActiveFilters && role !== "viewer" && (
            <Button className="mt-6" onClick={() => setLocation("/animals/new")}>Add First Animal</Button>
          )}
        </div>
      ) : locationGrouped ? (
        <div className="space-y-4">
          {locationGrouped.map(([locId, { name, animals: locAnimals }]) => (
            <LocationFolder
              key={locId ?? "unassigned"}
              locationId={locId}
              locationName={name}
              animals={locAnimals}
              initialOpen={dueSoonFilter ? true : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([species, speciesAnimals]) => (
            <SpeciesFolder
              key={`${species}-${dueSoonFilter}`}
              species={species}
              animals={speciesAnimals}
              initialOpen={dueSoonFilter ? true : undefined}
            />
          ))}
        </div>
      )}

      <ImportModeDialog
        open={modeDialogOpen}
        onOpenChange={setModeDialogOpen}
        onAdd={() => pendingFile && doImport(pendingFile, false)}
        onReplace={() => pendingFile && doImport(pendingFile, true)}
      />

      <ScanPhotoDialog open={scanOpen} onOpenChange={setScanOpen} />
    </div>
  );
}
