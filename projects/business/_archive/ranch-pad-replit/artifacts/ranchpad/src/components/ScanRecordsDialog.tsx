import React, { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Loader2, CheckCircle, XCircle, Activity, Pill } from "lucide-react";
import { useCreateHealthEvent, useCreateMedication } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";

interface ExtractedHealthEvent {
  eventDate: string;
  description: string;
  severity: "low" | "medium" | "high";
  veterinarian: string | null;
  selected: boolean;
}

interface ExtractedMedication {
  medicationName: string;
  dosage: string | null;
  dateGiven: string;
  nextDueDate: string | null;
  notes: string | null;
  selected: boolean;
}

type Stage = "idle" | "scanning" | "review" | "saving" | "done";

const SEVERITY_LABELS: Record<string, { label: string; color: string }> = {
  high: { label: "High", color: "text-red-400 bg-red-500/10" },
  medium: { label: "Medium", color: "text-yellow-400 bg-yellow-500/10" },
  low: { label: "Low", color: "text-green-400 bg-green-500/10" },
};

interface ScanRecordsDialogProps {
  animalId: number;
  animalName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScanRecordsDialog({ animalId, animalName, open, onOpenChange }: ScanRecordsDialogProps) {
  const [stage, setStage] = useState<Stage>("idle");
  const [healthEvents, setHealthEvents] = useState<ExtractedHealthEvent[]>([]);
  const [medications, setMedications] = useState<ExtractedMedication[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const createHealthEvent = useCreateHealthEvent();
  const createMedication = useCreateMedication();

  function reset() {
    setStage("idle");
    setHealthEvents([]);
    setMedications([]);
    setError(null);
    setSavedCount(0);
  }

  function handleClose(val: boolean) {
    if (!val) reset();
    onOpenChange(val);
  }

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG, HEIC).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image is too large. Please use a photo under 10MB.");
      return;
    }

    setError(null);
    setStage("scanning");

    const formData = new FormData();
    formData.append("photo", file);

    try {
      const res = await fetch(`/api/animals/${animalId}/scan-records`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { message?: string }).message || "Scan failed");
      }

      const data = await res.json() as { healthEvents: Omit<ExtractedHealthEvent, "selected">[]; medications: Omit<ExtractedMedication, "selected">[] };

      const he = (data.healthEvents ?? []).map(e => ({ ...e, selected: true }));
      const meds = (data.medications ?? []).map(m => ({ ...m, selected: true }));

      if (he.length === 0 && meds.length === 0) {
        setError("No health records or medications found in this image. Try a clearer photo of a vet record, treatment log, or medication label.");
        setStage("idle");
        return;
      }

      setHealthEvents(he);
      setMedications(meds);
      setStage("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed. Please try again.");
      setStage("idle");
    }
  }

  async function handleSave() {
    const selectedEvents = healthEvents.filter(e => e.selected);
    const selectedMeds = medications.filter(m => m.selected);

    setStage("saving");
    let count = 0;

    for (const event of selectedEvents) {
      try {
        await createHealthEvent.mutateAsync({
          animalId,
          data: {
            eventDate: event.eventDate,
            description: event.description,
            severity: event.severity,
          },
        });
        count++;
      } catch {
        // continue with remaining records
      }
    }

    for (const med of selectedMeds) {
      try {
        await createMedication.mutateAsync({
          animalId,
          data: {
            medicationName: med.medicationName,
            dosage: med.dosage ?? undefined,
            dateGiven: med.dateGiven,
            nextDueDate: med.nextDueDate ?? undefined,
            notes: med.notes ?? undefined,
          },
        });
        count++;
      } catch {
        // continue with remaining records
      }
    }

    await queryClient.invalidateQueries({ queryKey: [`/api/animals/${animalId}/health-events`] });
    await queryClient.invalidateQueries({ queryKey: [`/api/animals/${animalId}/medications`] });

    setSavedCount(count);
    setStage("done");
  }

  const totalSelected = healthEvents.filter(e => e.selected).length + medications.filter(m => m.selected).length;

  function formatDate(d: string) {
    try { return format(parseISO(d), "MMM d, yyyy"); } catch { return d; }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Scan Records</DialogTitle>
          <DialogDescription>
            {stage === "idle" && `Take or upload a photo of a vet record, treatment log, or medication label for ${animalName}.`}
            {stage === "scanning" && "Reading your photo…"}
            {stage === "review" && "Review the extracted records before saving."}
            {stage === "saving" && "Saving records…"}
            {stage === "done" && `${savedCount} record${savedCount !== 1 ? "s" : ""} saved to ${animalName}'s profile.`}
          </DialogDescription>
        </DialogHeader>

        {/* ── idle ── */}
        {stage === "idle" && (
          <div className="space-y-3 pt-1">
            {error && (
              <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 rounded-xl px-3 py-2.5">
                <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="w-full flex items-center gap-4 rounded-xl border-2 border-border p-4 text-left hover:bg-muted transition-colors"
            >
              <Camera className="w-6 h-6 text-primary shrink-0" />
              <div>
                <p className="font-semibold text-sm text-foreground">Take a Photo</p>
                <p className="text-xs text-muted-foreground mt-0.5">Photograph a vet record, treatment note, or medication label</p>
              </div>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-4 rounded-xl border-2 border-border p-4 text-left hover:bg-muted transition-colors"
            >
              <Upload className="w-6 h-6 text-muted-foreground shrink-0" />
              <div>
                <p className="font-semibold text-sm text-foreground">Upload Image</p>
                <p className="text-xs text-muted-foreground mt-0.5">Choose a photo from your library (JPG, PNG, HEIC)</p>
              </div>
            </button>
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>
        )}

        {/* ── scanning ── */}
        {stage === "scanning" && (
          <div className="flex flex-col items-center gap-3 py-10">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground font-medium">Analyzing your photo…</p>
          </div>
        )}

        {/* ── review ── */}
        {stage === "review" && (
          <div className="space-y-4 pt-1">
            {healthEvents.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm font-bold text-foreground">Health Events</p>
                  <span className="text-xs text-muted-foreground">({healthEvents.length})</span>
                </div>
                {healthEvents.map((event, i) => (
                  <label key={i} className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${event.selected ? "border-primary/50 bg-primary/5" : "border-border bg-card/50 opacity-50"}`}>
                    <input
                      type="checkbox"
                      checked={event.selected}
                      onChange={e => setHealthEvents(prev => prev.map((ev, j) => j === i ? { ...ev, selected: e.target.checked } : ev))}
                      className="mt-0.5 accent-primary shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-xs font-medium text-muted-foreground">{formatDate(event.eventDate)}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${SEVERITY_LABELS[event.severity]?.color ?? ""}`}>
                          {SEVERITY_LABELS[event.severity]?.label}
                        </span>
                      </div>
                      <p className="text-sm text-foreground leading-snug">{event.description}</p>
                      {event.veterinarian && <p className="text-xs text-muted-foreground mt-0.5">Vet: {event.veterinarian}</p>}
                    </div>
                  </label>
                ))}
              </div>
            )}

            {medications.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm font-bold text-foreground">Medications</p>
                  <span className="text-xs text-muted-foreground">({medications.length})</span>
                </div>
                {medications.map((med, i) => (
                  <label key={i} className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${med.selected ? "border-primary/50 bg-primary/5" : "border-border bg-card/50 opacity-50"}`}>
                    <input
                      type="checkbox"
                      checked={med.selected}
                      onChange={e => setMedications(prev => prev.map((m, j) => j === i ? { ...m, selected: e.target.checked } : m))}
                      className="mt-0.5 accent-primary shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{med.medicationName}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                        <span className="text-xs text-muted-foreground">Given: {formatDate(med.dateGiven)}</span>
                        {med.dosage && <span className="text-xs text-muted-foreground">Dose: {med.dosage}</span>}
                        {med.nextDueDate && <span className="text-xs text-primary">Next: {formatDate(med.nextDueDate)}</span>}
                      </div>
                      {med.notes && <p className="text-xs text-muted-foreground mt-0.5">{med.notes}</p>}
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" className="flex-1" onClick={reset}>
                Scan Another
              </Button>
              <Button size="sm" className="flex-1" onClick={handleSave} disabled={totalSelected === 0}>
                Save {totalSelected > 0 ? `${totalSelected} Record${totalSelected !== 1 ? "s" : ""}` : "Selected"}
              </Button>
            </div>
          </div>
        )}

        {/* ── saving ── */}
        {stage === "saving" && (
          <div className="flex flex-col items-center gap-3 py-10">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground font-medium">Saving records…</p>
          </div>
        )}

        {/* ── done ── */}
        {stage === "done" && (
          <div className="flex flex-col items-center gap-3 py-8">
            <CheckCircle className="w-12 h-12 text-primary" />
            <p className="text-base font-bold text-foreground text-center">
              {savedCount} record{savedCount !== 1 ? "s" : ""} added to {animalName}
            </p>
            <div className="flex gap-2 w-full pt-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={reset}>
                Scan More
              </Button>
              <Button size="sm" className="flex-1" onClick={() => handleClose(false)}>
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
