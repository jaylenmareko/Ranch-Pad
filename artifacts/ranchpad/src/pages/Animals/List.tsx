import React, { useRef, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, Plus, FileText, ChevronDown, ChevronRight, Download, Upload, CheckCircle, XCircle, Loader2, PawPrint, Calendar, MapPin, ArrowRight, Check, Minus, Trash2, CheckSquare, Archive, FileDown, Scissors } from "lucide-react";
import { useListAnimals, type Animal } from "@workspace/api-client-react";
import { format } from "date-fns";
import { useRanch } from "@/contexts/ranch-context";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { formatAge } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useAuthModal } from "@/contexts/auth-modal-context";
import { SimpleDialog } from "@/components/ui/dialog";
import { ImportModeDialog } from "@/components/ImportModeDialog";
import { EmptyHerdOverlay } from "@/components/EmptyHerdOverlay";
import { useToast } from "@/hooks/use-toast";

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
  Cattle: "🐄", Sheep: "🐑", Goat: "🐐", Goats: "🐐", Pig: "🐷", Pigs: "🐷",
  Horse: "🐴", Horses: "🐴", Chicken: "🐔", Chickens: "🐔", Duck: "🦆",
  Ducks: "🦆", Turkey: "🦃", Turkeys: "🦃", Llama: "🦙", Llamas: "🦙",
  Alpaca: "🦙", Alpacas: "🦙", Rabbit: "🐰", Rabbits: "🐰",
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

// ─── Select Checkbox ───────────────────────────────────────────────────────────

function SelectCheckbox({
  checked,
  indeterminate,
  onClick,
  className = "",
}: {
  checked: boolean;
  indeterminate?: boolean;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0 cursor-pointer ${
        checked || indeterminate
          ? "bg-primary border-primary"
          : "bg-background border-border hover:border-primary/60"
      } ${className}`}
    >
      {checked && <Check className="w-3 h-3 text-primary-foreground" />}
      {!checked && indeterminate && <Minus className="w-3 h-3 text-primary-foreground" />}
    </div>
  );
}

// ─── Animal Row ────────────────────────────────────────────────────────────

function AnimalCard({
  animal,
  selectMode,
  selected,
  onToggle,
}: {
  animal: Animal;
  selectMode?: boolean;
  selected?: boolean;
  onToggle?: () => void;
}) {
  const accentColor =
    animal.latestHealthSeverity === "high"
      ? "#ef4444"
      : animal.latestHealthSeverity === "medium"
      ? "#eab308"
      : "transparent";

  const inner = (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-border bg-card transition-colors hover:bg-muted/20 ${selected ? "bg-primary/5" : ""}`}
      style={{ borderLeft: `4px solid ${accentColor}` }}
    >
      {selectMode && (
        <SelectCheckbox
          checked={!!selected}
          onClick={(e) => { e.stopPropagation(); onToggle?.(); }}
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-foreground leading-tight truncate">
          {animal.tagNumber ? `#${animal.tagNumber}` : animal.name ?? "No tag"}
          {animal.tagNumber && animal.name ? <span className="font-normal text-muted-foreground ml-1.5">{animal.name}</span> : null}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {[animal.sex, animal.breed].filter(Boolean).join(" · ")}
        </p>
        {animal.sex === "Female" && animal.expectedDueDate && (
          <p className="text-xs font-semibold text-pink-400 mt-0.5">
            Due {new Date(animal.expectedDueDate).toLocaleDateString()}
          </p>
        )}
        {animal.latestHealthSeverity === "high" && (
          <span className="inline-flex items-center gap-1 mt-1 text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#ef444420", color: "#ef4444" }}>
            ⚠ Urgent health event
          </span>
        )}
        {animal.latestHealthSeverity === "medium" && (
          <span className="inline-flex items-center gap-1 mt-1 text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#eab30820", color: "#eab308" }}>
            ⚠ Needs monitoring
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0 text-xs text-muted-foreground">
        <span>{formatAge(animal.dateOfBirth)}</span>
        {!selectMode && <ChevronRight className="w-3.5 h-3.5 opacity-40" />}
      </div>
    </div>
  );

  if (selectMode) {
    return <div className="cursor-pointer" onClick={onToggle}>{inner}</div>;
  }

  return <Link href={`/animals/${animal.id}`}>{inner}</Link>;
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

// ─── Species Folder ────────────────────────────────────────────────────────────

function SpeciesFolder({
  species,
  animals,
  initialOpen,
  selectMode,
  selectedIds,
  onToggleAnimal,
  onToggleSpecies,
  nested,
}: {
  species: string;
  animals: Animal[];
  initialOpen?: boolean;
  selectMode?: boolean;
  selectedIds?: Set<number>;
  onToggleAnimal?: (id: number) => void;
  onToggleSpecies?: (ids: number[], allSelected: boolean) => void;
  nested?: boolean;
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
  const accentColor = highCount > 0 ? "#ef4444" : medCount > 0 ? "#eab308" : "transparent";

  const animalIds = animals.map(a => a.id);
  const selectedCount = selectMode && selectedIds ? animalIds.filter(id => selectedIds.has(id)).length : 0;
  const allSelected = selectMode ? selectedCount === animals.length : false;
  const someSelected = selectMode ? selectedCount > 0 && selectedCount < animals.length : false;

  if (nested) {
    // Inner style — matches Alerts TypeFolder
    return (
      <div className="rounded-xl border border-border/60 bg-background/30 overflow-hidden">
        <button
          onClick={toggle}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/3 transition-colors text-left"
        >
          {selectMode && (
            <SelectCheckbox
              checked={allSelected}
              indeterminate={someSelected}
              onClick={(e) => { e.stopPropagation(); onToggleSpecies?.(animalIds, allSelected); }}
            />
          )}
          <ChevronDown
            className="w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform duration-200"
            style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}
          />
          <span className="text-sm font-semibold text-foreground flex-1 truncate">{species}</span>
          {!open && <span className="text-xs text-muted-foreground/60 font-medium shrink-0">tap to open</span>}
          {highCount > 0 && <span className="text-xs font-bold text-destructive">⚠ {highCount}</span>}
          {medCount > 0 && highCount === 0 && <span className="text-xs font-bold text-yellow-500">⚠ {medCount}</span>}
          <span className="text-xs text-muted-foreground font-medium">{animals.length}</span>
        </button>
        {open && (
          <div className="px-2.5 pb-2.5 space-y-2 border-t border-border/40 pt-2.5">
            {animals.map(animal => (
              <AnimalCard
                key={animal.id}
                animal={animal}
                selectMode={selectMode}
                selected={selectedIds?.has(animal.id)}
                onToggle={() => onToggleAnimal?.(animal.id)}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Outer/standalone style — matches Alerts SeverityFolder
  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-sm" style={{ borderLeft: `4px solid ${accentColor}` }}>
      <button
        onClick={toggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/3 transition-colors text-left"
      >
        {selectMode && (
          <SelectCheckbox
            checked={allSelected}
            indeterminate={someSelected}
            onClick={(e) => { e.stopPropagation(); onToggleSpecies?.(animalIds, allSelected); }}
          />
        )}
        <ChevronDown
          className="w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200"
          style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}
        />
        <span className="font-bold text-sm text-foreground flex-1 truncate">{species}</span>
        {!open && <span className="text-xs text-muted-foreground/60 font-medium shrink-0">tap to open</span>}
        <div className="flex items-center gap-1.5">
          {highCount > 0 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#ef444420", color: "#ef4444" }}>
              {highCount} urgent
            </span>
          )}
          {medCount > 0 && highCount === 0 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#eab30820", color: "#eab308" }}>
              {medCount} watch
            </span>
          )}
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${accentColor === "transparent" ? "#ffffff" : accentColor}15`, color: accentColor === "transparent" ? "var(--muted-foreground)" : accentColor }}
          >
            {animals.length} {animals.length === 1 ? "animal" : "animals"}
          </span>
        </div>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2 border-t border-border/50 pt-3">
          {animals.map(animal => (
            <AnimalCard
              key={animal.id}
              animal={animal}
              selectMode={selectMode}
              selected={selectedIds?.has(animal.id)}
              onToggle={() => onToggleAnimal?.(animal.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Location Folder ───────────────────────────────────────────────────────────

function LocationFolder({
  locationId,
  locationName,
  animals,
  initialOpen,
  selectMode,
  selectedIds,
  onToggleAnimal,
  onToggleSpecies,
}: {
  locationId: number | null;
  locationName: string | null;
  animals: Animal[];
  initialOpen?: boolean;
  selectMode?: boolean;
  selectedIds?: Set<number>;
  onToggleAnimal?: (id: number) => void;
  onToggleSpecies?: (ids: number[], allSelected: boolean) => void;
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

  const allIds = animals.map(a => a.id);
  const selectedCount = selectMode && selectedIds ? allIds.filter(id => selectedIds.has(id)).length : 0;
  const allSelected = selectMode ? selectedCount === animals.length : false;
  const someSelected = selectMode ? selectedCount > 0 && selectedCount < animals.length : false;

  const accentColor = highCount > 0 ? "#ef4444" : medCount > 0 ? "#eab308" : "transparent";

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-sm" style={{ borderLeft: `4px solid ${accentColor}` }}>
      <button
        onClick={toggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/3 transition-colors text-left"
      >
        {selectMode && (
          <SelectCheckbox
            checked={allSelected}
            indeterminate={someSelected}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSpecies?.(allIds, allSelected);
            }}
          />
        )}
        <ChevronDown
          className="w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200"
          style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}
        />
        <MapPin className={`w-4 h-4 shrink-0 ${isUnassigned ? "text-muted-foreground/40" : "text-primary"}`} />
        <span className="font-bold text-sm text-foreground flex-1 truncate">
          {isUnassigned ? "No Location Set" : locationName}
        </span>
        {!open && <span className="text-xs text-muted-foreground/60 font-medium shrink-0">tap to open</span>}
        <div className="flex items-center gap-1.5">
          {highCount > 0 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#ef444420", color: "#ef4444" }}>
              {highCount} urgent
            </span>
          )}
          {medCount > 0 && highCount === 0 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#eab30820", color: "#eab308" }}>
              {medCount} watch
            </span>
          )}
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${accentColor === "transparent" ? "#ffffff" : accentColor}15`, color: accentColor === "transparent" ? "var(--muted-foreground)" : accentColor }}
          >
            {animals.length} {animals.length === 1 ? "animal" : "animals"}
          </span>
        </div>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2 border-t border-border/50 pt-3">
          {bySpecies.map(([species, speciesAnimals]) => (
            <SpeciesFolder
              key={`${folderKey}-${species}`}
              species={species}
              animals={speciesAnimals}
              selectMode={selectMode}
              selectedIds={selectedIds}
              onToggleAnimal={onToggleAnimal}
              onToggleSpecies={onToggleSpecies}
              nested
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Animal List ──────────────────────────────────────────────────────────

export default function AnimalList() {
  const [location, setLocation] = useLocation();
  const [search, setSearch] = useState("");

  const dueSoonFilter = new URLSearchParams(location.includes("?") ? location.split("?")[1] : "").get("filter") === "due-soon";
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [modeDialogOpen, setModeDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { isAuthenticated, role } = useAuth();
  const { toast } = useToast();
  const { activeRanch } = useRanch();
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // ─── Bulk-delete state ─────────────────────────────────────────────────────
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // ─── Archive tab ───────────────────────────────────────────────────────────
  const [showArchived, setShowArchived] = useState(false);

  const { data: archivedAnimals, isLoading: archivedLoading } = useQuery<Animal[]>({
    queryKey: ["/api/animals", { archived: true }],
    queryFn: async () => {
      const res = await fetch("/api/animals?archived=true");
      if (!res.ok) throw new Error("Failed to load archived animals");
      return res.json();
    },
    enabled: isAuthenticated && showArchived,
  });

  // ─── Cull section ───────────────────────────────────────────────────────────
  const [showCull, setShowCull] = useState(false);
  const [openNoteId, setOpenNoteId] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  const { data: cullAnimals } = useQuery<Animal[]>({
    queryKey: ["/api/animals", { cull: true }],
    queryFn: async () => {
      const res = await fetch("/api/animals?cull=true");
      if (!res.ok) throw new Error("Failed to load cull animals");
      return res.json();
    },
    enabled: isAuthenticated && !showArchived,
  });

  // Auto-enter select mode when navigated here with ?select=true
  useEffect(() => {
    const params = new URLSearchParams(location.includes("?") ? location.split("?")[1] : "");
    if (params.get("select") === "true") {
      setSelectMode(true);
      setLocation("/animals", { replace: true });
    }
  }, [location]);

  const { data: animals, isLoading } = useListAnimals(
    { search: search.length > 0 ? search : undefined },
    { query: { enabled: isAuthenticated } },
  );


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
      }
    } catch {
      setImportError("Something went wrong connecting to the server. Please try again.");
    } finally {
      setImporting(false);
    }
  }

  const generateHerdReport = async () => {
    if (!animals || (animals as Animal[]).length === 0) return;
    setIsExportingPDF(true);
    try {
      const { jsPDF } = await import("jspdf");

      const healthEventsByAnimalId: Record<number, { eventDate: string; description: string; severity: string }[]> = {};
      const [upcomingData, alertsData] = await Promise.all([
        fetch("/api/upcoming").then(r => r.ok ? r.json() : { medications: [] }).catch(() => ({ medications: [] })),
        fetch("/api/alerts").then(r => r.ok ? r.json() : []).catch(() => []),
        ...((animals as Animal[]).map(async (animal) => {
          try {
            const res = await fetch(`/api/animals/${animal.id}/health-events`);
            if (res.ok) healthEventsByAnimalId[animal.id] = await res.json();
          } catch {}
        })),
      ]);

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

      const speciesCounts = (animals as Animal[]).reduce((acc, a) => {
        acc[a.species] = (acc[a.species] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const speciesBreakdown = Object.entries(speciesCounts)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([s, c]) => `${s}: ${c}`)
        .join("   ·   ");
      const breakdownLines = doc.splitTextToSize(`Species: ${speciesBreakdown}`, contentWidth);
      doc.text(breakdownLines, ML, y);
      y += breakdownLines.length * 5 + 2;

      type AlertRow = { isDismissed: boolean; animalId?: number | null; summary?: string; message: string };
      const activeAlerts = (alertsData as AlertRow[]).filter(a => !a.isDismissed);
      if (activeAlerts.length > 0) {
        doc.setTextColor(180, 60, 40);
        doc.text(`Active Alerts: ${activeAlerts.length}`, ML, y);
        doc.setTextColor(40, 40, 40);
        y += 5.5;
      }
      y += 8;

      type MedRow = { animalId: number; medicationName: string; nextDueDate: string; isOverdue: boolean };
      const medsByAnimal: Record<number, MedRow[]> = {};
      for (const med of ((upcomingData as { medications?: MedRow[] }).medications ?? [])) {
        if (!medsByAnimal[med.animalId]) medsByAnimal[med.animalId] = [];
        medsByAnimal[med.animalId].push(med);
      }
      const alertsByAnimal: Record<number, AlertRow[]> = {};
      for (const alert of activeAlerts) {
        if (alert.animalId) {
          if (!alertsByAnimal[alert.animalId]) alertsByAnimal[alert.animalId] = [];
          alertsByAnimal[alert.animalId].push(alert);
        }
      }

      const bySpecies = (animals as Animal[]).reduce<Record<string, Animal[]>>((acc, a) => {
        (acc[a.species] = acc[a.species] || []).push(a);
        return acc;
      }, {});

      for (const [species, group] of Object.entries(bySpecies).sort(([a], [b]) => a.localeCompare(b))) {
        checkPage(18);
        doc.setFillColor(22, 46, 42);
        doc.rect(ML - 2, y - 5.5, contentWidth + 4, 9, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(255, 255, 255);
        doc.text(`${species.toUpperCase()}  (${group.length})`, ML + 1, y);
        y += 8;

        for (const animal of group) {
          checkPage(14);
          const tag = animal.tagNumber ? `  #${animal.tagNumber}` : "";
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.5);
          doc.setTextColor(22, 46, 42);
          doc.text(`${animal.name}${tag}`, ML + 3, y);
          y += 4.5;

          const age = formatAge(animal.dateOfBirth);
          const loc = (animal as Animal & { locationName?: string | null }).locationName
            ? `  ·  ${(animal as Animal & { locationName?: string | null }).locationName}`
            : "";
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(80, 80, 80);
          doc.text(`${animal.breed || "Unknown Breed"}  ·  ${animal.sex}  ·  ${age}${loc}`, ML + 3, y);
          y += 4.5;

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
          doc.setDrawColor(210, 220, 215);
          doc.setLineWidth(0.25);
          doc.line(ML + 3, y + 1.5, pageWidth - MR, y + 1.5);
          y += 5.5;
        }
        y += 3;
      }

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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setImportError(null);
    setImportSummary(null);
    const isCSV = file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv" || file.type === "application/csv";
    if (!isCSV) { setImportError("Please upload a CSV (.csv) file."); return; }
    if (file.size === 0) { setImportError("This file appears to be empty — no animals found to import."); return; }
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

  // ─── Selection handlers ────────────────────────────────────────────────────

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
  }

  function toggleAnimal(id: number) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleGroup(ids: number[], allSelected: boolean) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        ids.forEach(id => next.delete(id));
      } else {
        ids.forEach(id => next.add(id));
      }
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(filteredAnimals.map(a => a.id)));
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    const animalsToDelete = filteredAnimals.filter(a => ids.includes(a.id));
    setBulkDeleting(true);
    try {
      if (role === "owner") {
        await Promise.all(ids.map(id =>
          fetch(`/api/animals/${id}`, { method: "DELETE" })
        ));
        queryClient.invalidateQueries({ queryKey: ["/api/animals"] });
        toast({ title: `${ids.length} ${ids.length === 1 ? "animal" : "animals"} deleted` });
      } else {
        const results = await Promise.all(
          animalsToDelete.map(a =>
            fetch("/api/team/delete-requests", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ resourceType: "animal", resourceId: a.id, resourceName: a.name }),
            })
          )
        );
        const sent = results.filter(r => r.ok || r.status === 409).length;
        toast({
          title: "Deletion requests sent",
          description: `${sent} request${sent === 1 ? "" : "s"} sent to the owner for approval.`,
        });
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setBulkDeleting(false);
      setBulkDeleteOpen(false);
      exitSelectMode();
    }
  }

  // ─── Filtering & grouping ──────────────────────────────────────────────────

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


    return result;
  }, [animals, search, dueSoonFilter]);
  const hasActiveFilters = dueSoonFilter;

  function clearAllFilters() {
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

  const hasNoAnimals = !showArchived && isAuthenticated && !isLoading && animals !== undefined && (animals as Animal[]).length === 0 && search.length === 0 && Array.isArray(cullAnimals) && cullAnimals.length === 0;

  const isOwnerOrHand = role === "owner" || role === "ranch_hand";

  // Confirmation dialog copy changes by role
  const bulkDeleteTitle = role === "owner"
    ? `Delete ${selectedIds.size} ${selectedIds.size === 1 ? "animal" : "animals"}?`
    : `Request deletion of ${selectedIds.size} ${selectedIds.size === 1 ? "animal" : "animals"}?`;
  const bulkDeleteBody = role === "owner"
    ? `This will permanently delete ${selectedIds.size} ${selectedIds.size === 1 ? "animal" : "animals"} and all of their records. This cannot be undone.`
    : `This will send ${selectedIds.size} deletion ${selectedIds.size === 1 ? "request" : "requests"} to the ranch owner for approval.`;
  const bulkDeleteConfirmLabel = role === "owner" ? "Delete" : "Send Requests";

  return (
    <div className="space-y-5">
      {/* Always-present hidden inputs and dialogs */}
      <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />
      <ImportModeDialog
        open={modeDialogOpen}
        onOpenChange={setModeDialogOpen}
        onAdd={() => pendingFile && doImport(pendingFile, false)}
        onReplace={() => pendingFile && doImport(pendingFile, true)}
      />
      {/* Bulk Delete Confirmation Dialog */}
      <SimpleDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen} title={bulkDeleteTitle}>
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground leading-relaxed">{bulkDeleteBody}</p>
          <div className="flex gap-3">
            <Button
              variant={role === "owner" ? "destructive" : "default"}
              className="flex-1"
              isLoading={bulkDeleting}
              onClick={handleBulkDelete}
            >
              {!bulkDeleting && role === "owner" && <Trash2 className="w-4 h-4 mr-2" />}
              {bulkDeleteConfirmLabel}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setBulkDeleteOpen(false)} disabled={bulkDeleting}>
              Cancel
            </Button>
          </div>
        </div>
      </SimpleDialog>

      {hasNoAnimals ? (
        <EmptyHerdOverlay role={role} />
      ) : (
      <>

      {/* Select-mode toolbar */}
      {selectMode && (
        <div className="flex gap-2">
          <button
            onClick={selectAll}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg font-semibold text-sm bg-muted border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors flex-1"
          >
            Select All
          </button>
          <Button
            variant="destructive"
            disabled={selectedIds.size === 0}
            onClick={() => setBulkDeleteOpen(true)}
            className="h-10 px-4 rounded-lg font-semibold text-sm flex-1"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete ({selectedIds.size})
          </Button>
          <button
            onClick={exitSelectMode}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg font-semibold text-sm bg-muted border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors flex-1"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Active / Archived tab bar */}
      {!selectMode && (
        <div className="flex items-center border-b border-border/60 pb-px gap-6">
          <button
            onClick={() => setShowArchived(false)}
            className={`flex items-center gap-2 py-2.5 px-1 text-sm font-bold transition-all border-b-2 ${
              !showArchived ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <PawPrint className="w-4 h-4" />
            Active Herd
          </button>
          <button
            onClick={() => setShowArchived(true)}
            className={`flex items-center gap-2 py-2.5 px-1 text-sm font-bold transition-all border-b-2 ${
              showArchived ? "border-amber-500 text-amber-400" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Archive className="w-4 h-4" />
            Archived
          </button>
          <div className="ml-auto flex items-center gap-1">
            {isOwnerOrHand && (
              <button
                onClick={() => setSelectMode(true)}
                className="flex items-center gap-1.5 py-1.5 px-3 text-sm font-semibold rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            )}
          </div>
        </div>
      )}

      {/* Import error */}
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

      {/* Import success */}
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
      {!selectMode && !showArchived && (
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
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="shrink-0 text-destructive hover:text-destructive">
                Clear filters
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Archived Animals Content */}
      {showArchived && (
        archivedLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="h-14 bg-muted/40 animate-pulse" />
                <div className="divide-y divide-border/40">
                  {[1, 2, 3].map(j => <div key={j} className="h-12 bg-muted/20 animate-pulse" />)}
                </div>
              </div>
            ))}
          </div>
        ) : !archivedAnimals || archivedAnimals.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-3xl border border-border border-dashed">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Archive className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <h3 className="text-xl font-bold text-foreground">No archived animals</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto text-sm">
              Archive an animal from its detail page when it's sold, deceased, or transferred. Records are preserved.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(
              archivedAnimals.reduce<Record<string, Animal[]>>((acc, a) => {
                (acc[a.species] = acc[a.species] || []).push(a);
                return acc;
              }, {})
            ).sort(([a], [b]) => a.localeCompare(b)).map(([species, speciesAnimals]) => (
              <SpeciesFolder
                key={`archived-${species}`}
                species={species}
                animals={speciesAnimals}
                initialOpen
              />
            ))}
          </div>
        )
      )}

      {/* Content */}
      {!showArchived && (isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="h-14 bg-muted/40 animate-pulse" />
              <div className="divide-y divide-border/40">
                {[1, 2, 3].map(j => <div key={j} className="h-12 bg-muted/20 animate-pulse" />)}
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
              selectMode={selectMode}
              selectedIds={selectedIds}
              onToggleAnimal={toggleAnimal}
              onToggleSpecies={toggleGroup}
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
              selectMode={selectMode}
              selectedIds={selectedIds}
              onToggleAnimal={toggleAnimal}
              onToggleSpecies={toggleGroup}
            />
          ))}
        </div>
      ))}

      {/* Cull Section */}
      {!showArchived && !selectMode && cullAnimals && cullAnimals.length > 0 && (
        <div className="mt-4 rounded-xl border border-orange-500/30 overflow-hidden" style={{ background: "rgba(234,88,12,0.04)" }}>
          <button
            className="w-full flex items-center gap-2 py-2.5 px-3 text-sm font-bold transition-all"
            onClick={() => setShowCull(v => !v)}
          >
            <Scissors className="w-4 h-4 text-orange-400" />
            <span className="text-orange-400">Cull List</span>
            <span className="ml-1 text-xs font-bold bg-orange-500/15 text-orange-400 border border-orange-500/25 rounded-full px-2 py-0.5">
              {cullAnimals.length}
            </span>
            {showCull
              ? <ChevronDown className="w-4 h-4 text-orange-400/60 ml-auto" />
              : <ChevronRight className="w-4 h-4 text-orange-400/60 ml-auto" />}
          </button>
          {showCull && (
            <div className="px-3 pb-3 space-y-2">
              {cullAnimals.map(animal => {
                const noteOpen = openNoteId === animal.id;
                return (
                  <div key={animal.id} className="rounded-xl border-2 bg-card overflow-hidden" style={{ borderColor: "rgba(234,88,12,0.25)", borderLeftColor: "#f97316", borderLeftWidth: 4 }}>
                    {/* Card header row — toggles note, or navigate via arrow */}
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => {
                          if (role !== "viewer") {
                            if (noteOpen) { setOpenNoteId(null); }
                            else { setOpenNoteId(animal.id); setNoteDraft(animal.cullNote ?? ""); }
                          }
                        }}
                      >
                        <p className="font-bold text-sm text-foreground leading-tight truncate">
                          {animal.tagNumber ? `#${animal.tagNumber}` : animal.name ?? "No tag"}
                          {animal.tagNumber && animal.name ? <span className="font-normal text-muted-foreground ml-1.5">{animal.name}</span> : null}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {[animal.sex, animal.breed].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      {role !== "viewer" && !noteOpen && (
                        <span className="text-xs text-muted-foreground/50 font-medium shrink-0 whitespace-nowrap">
                          {animal.cullNote ? "tap to edit note" : "tap to open note"}
                        </span>
                      )}
                      {role === "viewer" && animal.cullNote && !noteOpen && (
                        <FileText className="w-3.5 h-3.5 text-orange-400/50 shrink-0" />
                      )}
                      <Link href={`/animals/${animal.id}`}>
                        <ChevronRight className="w-4 h-4 text-orange-400/50 shrink-0 hover:text-orange-400 transition-colors" />
                      </Link>
                    </div>
                    {/* Note area — viewer sees read-only note */}
                    {role === "viewer" && animal.cullNote && noteOpen && (
                      <div className="px-4 pb-3 pt-0 border-t border-orange-500/20 text-xs text-foreground/70 leading-relaxed">
                        {animal.cullNote}
                      </div>
                    )}
                    {/* Note editor — owners/hands */}
                    {role !== "viewer" && noteOpen && (
                      <div className="px-3 pb-3 pt-0 border-t border-orange-500/20">
                        <textarea
                          autoFocus
                          className="w-full mt-2.5 rounded-lg border border-orange-500/30 text-xs text-foreground placeholder:text-muted-foreground p-2.5 resize-none focus:outline-none focus:border-orange-500/60 transition-colors"
                          style={{ background: "rgba(234,88,12,0.06)" }}
                          rows={3}
                          placeholder="Reason for cull, sale status, destination…"
                          value={noteDraft}
                          onChange={e => setNoteDraft(e.target.value)}
                        />
                        <div className="flex gap-2 mt-1.5">
                          <button
                            onClick={async () => {
                              await fetch(`/api/animals/${animal.id}/cull-note`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ cullNote: noteDraft.trim() || null }),
                              });
                              queryClient.invalidateQueries({ queryKey: ["/api/animals", { cull: true }] });
                              setOpenNoteId(null);
                            }}
                            className="text-xs font-semibold bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setOpenNoteId(null)}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      </>
      )}
    </div>
  );
}
