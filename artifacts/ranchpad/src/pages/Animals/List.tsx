import React, { useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, Plus, FileText, ChevronDown, ChevronRight, Download, Upload, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useListAnimals, type Animal } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatAge } from "@/lib/utils";

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

function AnimalCard({ animal }: { animal: Animal }) {
  return (
    <Link href={`/animals/${animal.id}`}>
      <Card className="hover:shadow-md hover:border-primary/40 transition-all duration-200 cursor-pointer group h-full">
        <CardContent className="p-4 flex flex-col h-full">
          <div className="flex items-start gap-2.5 mb-3">
            <HealthDot severity={animal.latestHealthSeverity} />
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors leading-tight truncate">
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
}: {
  species: string;
  animals: Animal[];
}) {
  const [open, setOpen] = useState(() => getFolderOpen(species));

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
      {/* Folder header */}
      <button
        onClick={toggle}
        className="w-full flex items-center gap-3 px-5 py-3.5 bg-muted/40 hover:bg-muted/70 transition-colors border-b border-border/50"
      >
        <span className="text-2xl leading-none">{speciesIcon(species)}</span>
        <span className="font-black text-lg text-foreground font-display flex-1 text-left">{species}</span>
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
          {open
            ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
            : <ChevronRight className="w-4 h-4 text-muted-foreground" />
          }
        </div>
      </button>

      {/* Animals grid */}
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

export default function AnimalList() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [sexFilter, setSexFilter] = useState("All");
  const [breedFilter, setBreedFilter] = useState("All");
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: animals, isLoading } = useListAnimals({ search: search.length > 2 ? search : undefined });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setImportError(null);
    setImportSummary(null);

    // Client-side: check file type
    const isCSV = file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv" || file.type === "application/csv";
    if (!isCSV) {
      setImportError("Please upload a CSV file. Download our template to get started.");
      return;
    }

    // Client-side: check for empty file
    if (file.size === 0) {
      setImportError("This file appears to be empty. Please fill in the template and try again.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setImporting(true);

    try {
      const res = await fetch("/api/animals/import-csv", { method: "POST", body: formData });
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
  }, [animals, search, sexFilter, breedFilter]);

  const uniqueBreeds: string[] = ["All", ...Array.from(new Set((animals || []).map((a: Animal) => a.breed).filter(Boolean))).sort() as string[]];
  const hasActiveFilters = sexFilter !== "All" || breedFilter !== "All";

  const grouped = React.useMemo(() => {
    const map: Record<string, Animal[]> = {};
    for (const animal of filteredAnimals) {
      if (!map[animal.species]) map[animal.species] = [];
      map[animal.species].push(animal);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
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
          <h1 className="text-3xl font-black text-foreground">Herd Directory</h1>
          <p className="text-muted-foreground font-medium mt-1">
            {isLoading ? "Loading…" : `${(animals || []).length} animals across ${grouped.length} ${grouped.length === 1 ? "group" : "groups"}`}
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
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                  className="h-10 min-w-[44px] px-2.5 sm:px-4 rounded-xl font-semibold text-sm"
                  aria-label="Import CSV"
                >
                  {importing ? (
                    <><Loader2 className="w-4 h-4 sm:mr-2 animate-spin" /><span className="hidden sm:inline">Importing…</span></>
                  ) : (
                    <><Upload className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">Import CSV</span></>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Import animals from CSV</TooltipContent>
            </Tooltip>
            <Link href="/animals/new" className="inline-flex items-center justify-center h-10 px-4 sm:px-5 rounded-xl font-semibold bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:-translate-y-0.5 transition-transform text-sm whitespace-nowrap">
              <Plus className="w-4 h-4 mr-2" />
              Add Animal
            </Link>
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
            <Button variant="ghost" size="sm" onClick={() => { setSexFilter("All"); setBreedFilter("All"); }} className="shrink-0 text-destructive hover:text-destructive">
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
            <FileText className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold text-foreground">No animals found</h3>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            {search || hasActiveFilters
              ? "Try adjusting your search or filters."
              : "Your herd is empty. Add your first animal to get started."}
          </p>
          {!search && !hasActiveFilters && (
            <Button className="mt-6" onClick={() => setLocation("/animals/new")}>Add First Animal</Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([species, speciesAnimals]) => (
            <SpeciesFolder
              key={species}
              species={species}
              animals={speciesAnimals}
            />
          ))}
        </div>
      )}
    </div>
  );
}
