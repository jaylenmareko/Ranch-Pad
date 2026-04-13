import React, { useRef, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, Plus, ChevronDown, ChevronRight, Download, Upload, CheckCircle, XCircle, Loader2, PawPrint, Calendar, MapPin, ArrowRight, Check, Minus, Trash2, CheckSquare, Archive, FileDown, Scissors } from "lucide-react";
import "./List.css";
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

  const statusClass = animal.latestHealthSeverity === "high" ? "alert"
    : animal.latestHealthSeverity === "medium" ? "watch" : "healthy";
  const statusLabel = animal.latestHealthSeverity === "high" ? "⚠ Urgent"
    : animal.latestHealthSeverity === "medium" ? "Watch" : "Healthy";

  const inner = (
    <div className={`herd-animal-card${selected ? " selected" : ""}`}>
      {selectMode ? (
        <SelectCheckbox
          checked={!!selected}
          onClick={(e) => { e.stopPropagation(); onToggle?.(); }}
        />
      ) : (
        <div className="herd-animal-avatar">{speciesIcon(animal.species)}</div>
      )}
      <div className="herd-animal-info">
        <div className="herd-animal-name">
          {animal.tagNumber ? `#${animal.tagNumber}` : animal.name ?? "No tag"}
          {animal.tagNumber && animal.name ? <span className="herd-animal-tag-name"> · {animal.name}</span> : null}
        </div>
        <div className="herd-animal-meta">
          {[animal.sex, animal.breed, formatAge(animal.dateOfBirth)].filter(Boolean).join(" · ")}
        </div>
        {animal.sex === "Female" && animal.expectedDueDate && (
          <span className="herd-animal-due">
            Due {new Date(animal.expectedDueDate).toLocaleDateString()}
          </span>
        )}
      </div>
      <div className="herd-animal-right">
        <span className={`herd-status-badge ${statusClass}`}>{statusLabel}</span>
        {!selectMode && <span className="herd-chevron">›</span>}
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
    return (
      <div className="herd-nested-folder">
        <button onClick={toggle} className="herd-nested-folder-header">
          {selectMode && (
            <SelectCheckbox
              checked={allSelected}
              indeterminate={someSelected}
              onClick={(e) => { e.stopPropagation(); onToggleSpecies?.(animalIds, allSelected); }}
            />
          )}
          <ChevronDown
            className="herd-nested-chevron"
            style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}
          />
          <span className="herd-nested-title">{species}</span>
          {!open && <span className="herd-folder-hint">tap to open</span>}
          <div className="herd-folder-badges">
            {highCount > 0 && <span className="herd-folder-badge alert">{highCount} urgent</span>}
            {medCount > 0 && highCount === 0 && <span className="herd-folder-badge watch">{medCount} watch</span>}
            <span className="herd-folder-badge count">{animals.length}</span>
          </div>
        </button>
        {open && (
          <div className="herd-nested-body">
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

  return (
    <div className="herd-folder">
      <button onClick={toggle} className="herd-folder-header">
        {selectMode && (
          <SelectCheckbox
            checked={allSelected}
            indeterminate={someSelected}
            onClick={(e) => { e.stopPropagation(); onToggleSpecies?.(animalIds, allSelected); }}
          />
        )}
        <ChevronDown
          className="herd-folder-chevron"
          style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}
        />
        <span className="herd-folder-icon">{speciesIcon(species)}</span>
        <span className="herd-folder-title">{species}</span>
        {!open && <span className="herd-folder-hint">tap to open</span>}
        <div className="herd-folder-badges">
          {highCount > 0 && <span className="herd-folder-badge alert">{highCount} urgent</span>}
          {medCount > 0 && highCount === 0 && <span className="herd-folder-badge watch">{medCount} watch</span>}
          <span className="herd-folder-badge count">{animals.length}</span>
        </div>
      </button>
      {open && (
        <div className="herd-folder-body">
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
    <div className="herd-folder">
      <button onClick={toggle} className="herd-folder-header">
        {selectMode && (
          <SelectCheckbox
            checked={allSelected}
            indeterminate={someSelected}
            onClick={(e) => { e.stopPropagation(); onToggleSpecies?.(allIds, allSelected); }}
          />
        )}
        <ChevronDown
          className="herd-folder-chevron"
          style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}
        />
        <MapPin className={`herd-folder-mappin ${isUnassigned ? "unassigned" : "assigned"}`} />
        <span className="herd-folder-title">
          {isUnassigned ? "No Location Set" : locationName}
        </span>
        {!open && <span className="herd-folder-hint">tap to open</span>}
        <div className="herd-folder-badges">
          {highCount > 0 && <span className="herd-folder-badge alert">{highCount} urgent</span>}
          {medCount > 0 && highCount === 0 && <span className="herd-folder-badge watch">{medCount} watch</span>}
          <span className="herd-folder-badge count">{animals.length}</span>
        </div>
      </button>

      {open && (
        <div className="herd-folder-body">
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
    <div className="herd-page">
      {/* Always-present hidden inputs and dialogs */}
      <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />
      <ImportModeDialog
        open={modeDialogOpen}
        onOpenChange={setModeDialogOpen}
        onAdd={() => pendingFile && doImport(pendingFile, false)}
        onReplace={() => pendingFile && doImport(pendingFile, true)}
      />
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

      {/* Dark green header */}
      <div className="herd-header">
        <div className="herd-header-row">
          <div>
            <div className="herd-page-label">Your Herd</div>
            <div className="herd-page-title">{activeRanch?.name ?? "Herd"}</div>
            {animals && !isLoading && (
              <div className="herd-header-count">
                {(animals as Animal[]).length} {(animals as Animal[]).length === 1 ? "animal" : "animals"}
              </div>
            )}
          </div>
          {isOwnerOrHand && (
            <Link href="/animals/new">
              <button className="herd-add-btn">+ Add</button>
            </Link>
          )}
        </div>
      </div>

      {hasNoAnimals ? (
        <div className="herd-body">
          <EmptyHerdOverlay role={role} />
        </div>
      ) : (
      <div className="herd-body">

        {/* Select-mode toolbar */}
        {selectMode && (
          <div className="herd-select-toolbar">
            <button onClick={selectAll} className="herd-select-btn">Select All</button>
            <button
              className="herd-select-btn delete"
              disabled={selectedIds.size === 0}
              onClick={() => setBulkDeleteOpen(true)}
            >
              <Trash2 style={{ width: 14, height: 14 }} />
              Delete ({selectedIds.size})
            </button>
            <button onClick={exitSelectMode} className="herd-select-btn">Cancel</button>
          </div>
        )}

        {/* Active / Archived tab bar */}
        {!selectMode && (
          <div className="herd-tabs">
            <button
              onClick={() => setShowArchived(false)}
              className={`herd-tab${!showArchived ? " active" : ""}`}
            >
              Active
              {!showArchived && animals && (
                <span className="herd-tab-count">{(animals as Animal[]).length}</span>
              )}
            </button>
            <button
              onClick={() => setShowArchived(true)}
              className={`herd-tab${showArchived ? " active" : ""}`}
            >
              Archived
            </button>
            {isOwnerOrHand && (
              <button
                onClick={() => setSelectMode(true)}
                className="herd-tab-delete-btn"
              >
                <Trash2 style={{ width: 13, height: 13 }} />
                Delete
              </button>
            )}
          </div>
        )}

        {/* Import error */}
        {importError && (
          <div className="herd-error-banner">
            <XCircle style={{ width: 16, height: 16, color: "#c0392b", flexShrink: 0, marginTop: 1 }} />
            <p className="herd-error-banner-msg">{importError}</p>
            <button onClick={() => setImportError(null)} className="herd-error-banner-close" aria-label="Dismiss">
              <XCircle style={{ width: 14, height: 14 }} />
            </button>
          </div>
        )}

        {/* Import success */}
        {importSummary && (
          <div className="herd-success-banner">
            <div className="herd-success-banner-row">
              <span className="herd-success-banner-text">
                <CheckCircle style={{ width: 15, height: 15, flexShrink: 0 }} />
                Import complete — {importSummary.animalsCreated} {importSummary.animalsCreated === 1 ? "animal" : "animals"} added
                {importSummary.skipped.length > 0 && `, ${importSummary.skipped.length} skipped`}
              </span>
              <button onClick={() => setImportSummary(null)} style={{ color: "#8FA393", background: "none", border: "none", cursor: "pointer" }} aria-label="Dismiss">
                <XCircle style={{ width: 14, height: 14 }} />
              </button>
            </div>
            {importSummary.skipped.length > 0 && (
              <ul style={{ paddingLeft: 22, display: "flex", flexDirection: "column", gap: 4 }}>
                {importSummary.skipped.map((s, i) => (
                  <li key={i} style={{ fontSize: 11, color: "#8a7200" }}>
                    <strong>Row {s.row}:</strong> {plainEnglishSkipReason(s.reason)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Due Soon banner */}
        {dueSoonFilter && (
          <div className="herd-due-banner">
            <span className="herd-due-banner-text">
              <Calendar style={{ width: 14, height: 14, flexShrink: 0 }} />
              Showing animals due within the next 30 days
            </span>
            <button onClick={() => setLocation("/animals")} className="herd-due-banner-clear">
              Show all
            </button>
          </div>
        )}

        {/* Search bar */}
        {!selectMode && !showArchived && (
          <div className="herd-search-wrap">
            <Search className="herd-search-icon" />
            <input
              className="herd-search-input"
              placeholder="Search by name or tag..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {hasActiveFilters && (
              <button onClick={clearAllFilters} className="herd-clear-btn">Clear</button>
            )}
          </div>
        )}

        {/* Archived Animals Content */}
        {showArchived && (
          archivedLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[1, 2].map(i => (
                <div key={i} className="herd-skeleton">
                  <div className="herd-skeleton-header" />
                  {[1, 2, 3].map(j => <div key={j} className="herd-skeleton-row" />)}
                </div>
              ))}
            </div>
          ) : !archivedAnimals || archivedAnimals.length === 0 ? (
            <div className="herd-empty">
              <div className="herd-empty-icon"><Archive style={{ width: 24, height: 24, color: "#8FA393" }} /></div>
              <div className="herd-empty-title">No archived animals</div>
              <p className="herd-empty-sub">Archive an animal from its detail page when it's sold, deceased, or transferred. Records are preserved.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {Object.entries(
                archivedAnimals.reduce<Record<string, Animal[]>>((acc, a) => {
                  (acc[a.species] = acc[a.species] || []).push(a);
                  return acc;
                }, {})
              ).sort(([a], [b]) => a.localeCompare(b)).map(([species, speciesAnimals]) => (
                <SpeciesFolder key={`archived-${species}`} species={species} animals={speciesAnimals} initialOpen />
              ))}
            </div>
          )
        )}

        {/* Main Content */}
        {!showArchived && (isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[1, 2].map(i => (
              <div key={i} className="herd-skeleton">
                <div className="herd-skeleton-header" />
                {[1, 2, 3].map(j => <div key={j} className="herd-skeleton-row" />)}
              </div>
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <div className="herd-empty">
            <div className="herd-empty-icon">🐄</div>
            <div className="herd-empty-title">No animals found</div>
            <p className="herd-empty-sub">
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
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
          <div className="herd-cull-folder">
            <button className="herd-cull-header" onClick={() => setShowCull(v => !v)}>
              <Scissors style={{ width: 14, height: 14, color: "#ea580c", flexShrink: 0 }} />
              <span className="herd-cull-title">Cull List</span>
              <span className="herd-cull-count">{cullAnimals.length}</span>
              {showCull
                ? <ChevronDown style={{ width: 14, height: 14, color: "rgba(234,88,12,0.5)", marginLeft: "auto" }} />
                : <ChevronRight style={{ width: 14, height: 14, color: "rgba(234,88,12,0.5)", marginLeft: "auto" }} />}
            </button>
            {showCull && (
              <div className="herd-cull-body">
                {cullAnimals.map(animal => (
                  <Link key={animal.id} href={`/animals/${animal.id}`}>
                    <div className="herd-cull-card">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="herd-cull-card-name">
                          {animal.tagNumber ? `#${animal.tagNumber}` : animal.name ?? "No tag"}
                          {animal.tagNumber && animal.name
                            ? <span style={{ fontWeight: 400, color: "#666" }}> · {animal.name}</span>
                            : null}
                        </div>
                        <div className="herd-cull-card-meta">
                          {[animal.sex, animal.breed].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      <span className="herd-cull-hint">
                        {animal.cullNote ? "tap to edit" : "tap to open"}
                      </span>
                      <ChevronRight style={{ width: 13, height: 13, color: "rgba(234,88,12,0.4)", flexShrink: 0 }} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
      )}
    </div>
  );
}
