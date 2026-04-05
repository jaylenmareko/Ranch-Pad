import React, { useRef, useState } from "react";
import { Link } from "wouter";
import { ScanLine, Plus, Upload, Download, FileDown, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useListAnimals, type Animal } from "@workspace/api-client-react";
import { format } from "date-fns";
import { useRanch } from "@/contexts/ranch-context";
import { useQueryClient } from "@tanstack/react-query";
import { formatAge } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { ScanPhotoDialog } from "@/components/ScanPhotoDialog";
import { ImportModeDialog } from "@/components/ImportModeDialog";

// ─── CSV Template ─────────────────────────────────────────────────────────────

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
  skipped: ImportSkip[];
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

export function ImportExport() {
  const { isAuthenticated, role } = useAuth();
  const { activeRanch } = useRanch();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [scanOpen, setScanOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [modeDialogOpen, setModeDialogOpen] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const { data: animals } = useListAnimals(
    { search: undefined },
    { query: { enabled: isAuthenticated } },
  );

  const isViewer = role === "viewer";

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

  return (
    <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto w-full">
      <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />

      <ScanPhotoDialog open={scanOpen} onOpenChange={setScanOpen} />
      <ImportModeDialog
        open={modeDialogOpen}
        onOpenChange={setModeDialogOpen}
        onConfirm={(replace) => pendingFile && doImport(pendingFile, replace)}
      />

      {/* Card */}
      <div className="bg-card border border-border rounded-xl px-6 py-4 flex flex-col gap-4">
        <h1 className="text-xl font-black text-foreground tracking-tight">Import or Export Data</h1>

        <div className="flex flex-col gap-3 w-full">
          {!isViewer && (
            <button
              onClick={() => setScanOpen(true)}
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-md shadow-primary/30 w-full"
            >
              <ScanLine className="w-4 h-4 shrink-0" />
              Add from Photo
            </button>
          )}

          {!isViewer && (
            <Link href="/animals/new" className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg font-semibold text-sm bg-muted border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors w-full">
              <Plus className="w-4 h-4 shrink-0" />
              Add Animal
            </Link>
          )}

          {!isViewer && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg font-semibold text-sm bg-muted border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors w-full disabled:opacity-60"
            >
              {importing ? (
                <><Loader2 className="w-4 h-4 shrink-0 animate-spin" />Importing…</>
              ) : (
                <><Upload className="w-4 h-4 shrink-0" />Upload CSV</>
              )}
            </button>
          )}

          <button
            onClick={downloadTemplate}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg font-semibold text-sm bg-muted border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors w-full"
          >
            <Download className="w-4 h-4 shrink-0" />
            Download CSV Template
          </button>

          <button
            onClick={generateHerdReport}
            disabled={isExportingPDF || !animals || (animals as Animal[]).length === 0}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg font-semibold text-sm bg-muted border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors w-full disabled:opacity-60"
          >
            {isExportingPDF ? (
              <><Loader2 className="w-4 h-4 shrink-0 animate-spin" />Generating…</>
            ) : (
              <><FileDown className="w-4 h-4 shrink-0" />Export Herd Report</>
            )}
          </button>

        </div>
      </div>

      {/* Import error */}
      {importError && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30">
          <XCircle className="w-5 h-5 shrink-0 text-destructive mt-0.5" />
          <p className="flex-1 text-sm font-semibold text-foreground">{importError}</p>
          <button onClick={() => setImportError(null)} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Import success */}
      {importSummary && (
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 shrink-0 text-primary" />
            <p className="text-sm font-semibold text-foreground">
              Import complete — {importSummary.animalsCreated} {importSummary.animalsCreated === 1 ? "animal" : "animals"} added
              {importSummary.skipped.length > 0 && `, ${importSummary.skipped.length} ${importSummary.skipped.length === 1 ? "row" : "rows"} skipped`}
            </p>
          </div>
          {importSummary.skipped.length > 0 && (
            <ul className="space-y-1 pl-7">
              {importSummary.skipped.map((s, i) => (
                <li key={i} className="text-xs text-muted-foreground">
                  Row {s.row}: {plainEnglishSkipReason(s.reason)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
