import React, { useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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

function SpeciesFolder({
  species,
  animals,
  defaultOpen = false,
}: {
  species: string;
  animals: Animal[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const highCount = animals.filter(a => a.latestHealthSeverity === "high").length;
  const medCount = animals.filter(a => a.latestHealthSeverity === "medium").length;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Folder header */}
      <button
        onClick={() => setOpen(o => !o)}
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

    const formData = new FormData();
    formData.append("file", file);

    setImporting(true);
    setImportError(null);
    setImportSummary(null);

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
      setImportError("Network error — please try again.");
    } finally {
      setImporting(false);
    }
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

      {/* Import result dialog */}
      <Dialog
        open={importSummary !== null || importError !== null}
        onOpenChange={open => { if (!open) { setImportSummary(null); setImportError(null); } }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {importError ? "Import Failed" : "Import Complete"}
            </DialogTitle>
            <DialogDescription>
              {importError
                ? importError
                : importSummary && `${importSummary.animalsCreated} animal${importSummary.animalsCreated !== 1 ? "s" : ""} added to your herd.`
              }
            </DialogDescription>
          </DialogHeader>
          {importSummary && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-3">
                  <div className="text-2xl font-black text-green-600 dark:text-green-400">{importSummary.animalsCreated}</div>
                  <div className="text-xs text-muted-foreground font-medium mt-1">Animals</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3">
                  <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{importSummary.healthEventsCreated}</div>
                  <div className="text-xs text-muted-foreground font-medium mt-1">Health Events</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950/30 rounded-xl p-3">
                  <div className="text-2xl font-black text-purple-600 dark:text-purple-400">{importSummary.medicationRecordsCreated}</div>
                  <div className="text-xs text-muted-foreground font-medium mt-1">Medications</div>
                </div>
              </div>
              {importSummary.skipped.length > 0 && (
                <div className="border border-yellow-300 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20 rounded-xl p-3">
                  <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400 mb-2">
                    {importSummary.skipped.length} row{importSummary.skipped.length !== 1 ? "s" : ""} skipped:
                  </p>
                  <ul className="space-y-1 max-h-40 overflow-y-auto">
                    {importSummary.skipped.map((s, i) => (
                      <li key={i} className="flex gap-2 text-xs text-yellow-700 dark:text-yellow-400">
                        <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span><span className="font-bold">Row {s.row}:</span> {s.reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {importSummary.animalsCreated > 0 && importSummary.skipped.length === 0 && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  All rows imported successfully.
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
              defaultOpen
            />
          ))}
        </div>
      )}
    </div>
  );
}
