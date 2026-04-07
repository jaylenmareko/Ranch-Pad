import React, { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Loader2, CheckCircle, XCircle, Check, ChevronLeft } from "lucide-react";
import { useCreateAnimal } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

interface ExtractedAnimal {
  name: string;
  tagNumber: string | null;
  species: string;
  breed: string | null;
  sex: string | null;
  dateOfBirth: string | null;
  notes: string | null;
}

type Stage = "species" | "idle" | "scanning" | "review" | "adding" | "done";

const SPECIES_OPTIONS = [
  { label: "Cattle", emoji: "🐄" },
  { label: "Sheep",  emoji: "🐑" },
  { label: "Goat",   emoji: "🐐" },
  { label: "Pig",    emoji: "🐖" },
  { label: "Horse",  emoji: "🐴" },
  { label: "Other",  emoji: "🐾" },
];

interface ScanPhotoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScanPhotoDialog({ open, onOpenChange }: ScanPhotoDialogProps) {
  const [stage, setStage] = useState<Stage>("species");
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null);
  const [animals, setAnimals] = useState<(ExtractedAnimal & { selected: boolean })[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [addedCount, setAddedCount] = useState(0);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const createMutation = useCreateAnimal();

  function reset() {
    setStage("species");
    setSelectedSpecies(null);
    setAnimals([]);
    setError(null);
    setAddedCount(0);
  }

  function handleClose(val: boolean) {
    if (!val) reset();
    onOpenChange(val);
  }

  function pickSpecies(species: string) {
    setSelectedSpecies(species);
    setStage("idle");
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
    if (selectedSpecies) formData.append("species", selectedSpecies);

    try {
      const res = await fetch("/api/animals/scan-photo", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Scan failed. Please try again.");
        setStage("idle");
        return;
      }
      if (!data.animals || data.animals.length === 0) {
        setError("No animal records found in this photo. Try a clearer image or a different page.");
        setStage("idle");
        return;
      }
      setAnimals(data.animals.map((a: ExtractedAnimal) => ({ ...a, selected: true })));
      setStage("review");
    } catch {
      setError("Something went wrong. Please try again.");
      setStage("idle");
    }
  }

  async function handleAddSelected() {
    const selected = animals.filter(a => a.selected);
    if (selected.length === 0) return;
    setStage("adding");

    let count = 0;
    for (const animal of selected) {
      try {
        await createMutation.mutateAsync({
          data: {
            name: animal.name,
            tagNumber: animal.tagNumber ?? undefined,
            species: animal.species,
            breed: animal.breed ?? undefined,
            sex: animal.sex ?? "Heifer",
            dateOfBirth: animal.dateOfBirth ?? undefined,
          },
        });
        count++;
      } catch {
        // continue adding remaining animals if one fails
      }
    }

    setAddedCount(count);
    queryClient.invalidateQueries({ queryKey: ["/api/animals"] });
    setStage("done");
  }

  function updateAnimal(index: number, field: keyof ExtractedAnimal, value: string | null) {
    setAnimals(prev => prev.map((a, i) => i === index ? { ...a, [field]: value } : a));
  }

  function toggleAnimal(index: number) {
    setAnimals(prev => prev.map((a, i) => i === index ? { ...a, selected: !a.selected } : a));
  }

  const selectedCount = animals.filter(a => a.selected).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col gap-0">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2">
            {stage === "idle" && (
              <button
                onClick={() => setStage("species")}
                className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                aria-label="Back to species selection"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            Scan Record Book
          </DialogTitle>
          <DialogDescription>
            {stage === "species"
              ? "First, what kind of animal are these records for? This helps when the sheet doesn't list the animal type."
              : `Scanning for ${selectedSpecies} records. Take or upload a photo of your record book, tag list, or handwritten notes.`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-3">

          {/* ── Step 1: Pick species ── */}
          {stage === "species" && (
            <div className="py-1">
              <div className="grid grid-cols-3 gap-3">
                {SPECIES_OPTIONS.map(({ label, emoji }) => (
                  <button
                    key={label}
                    onClick={() => pickSpecies(label)}
                    className="flex flex-col items-center gap-2 rounded-2xl border-2 border-border p-5 hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <span className="text-3xl">{emoji}</span>
                    <span className="font-semibold text-sm">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 2: Pick photo ── */}
          {stage === "idle" && (
            <div className="space-y-4 py-1">
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = "";
                }}
              />

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border p-8 hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <Camera className="w-8 h-8 text-muted-foreground" />
                  <div className="text-center">
                    <p className="font-semibold text-sm">Take Photo</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Use your camera</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = e => {
                      const f = (e.target as HTMLInputElement).files?.[0];
                      if (f) handleFile(f);
                    };
                    input.click();
                  }}
                  className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border p-8 hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <div className="text-center">
                    <p className="font-semibold text-sm">Upload Photo</p>
                    <p className="text-xs text-muted-foreground mt-0.5">From your device</p>
                  </div>
                </button>
              </div>

              {error && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                  <XCircle className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              <p className="text-xs text-muted-foreground text-center pb-2">
                Works with handwritten record books, printed ear tag lists, and typed documents.
              </p>
            </div>
          )}

          {/* ── Scanning ── */}
          {stage === "scanning" && (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <div className="text-center">
                <p className="font-semibold">Reading your records…</p>
                <p className="text-sm text-muted-foreground mt-1">Claude is scanning the photo for {selectedSpecies?.toLowerCase()} records.</p>
              </div>
            </div>
          )}

          {/* ── Review extracted animals ── */}
          {stage === "review" && (
            <>
              <p className="text-sm text-muted-foreground pb-1">
                Found <span className="font-semibold text-foreground">{animals.length} animal{animals.length !== 1 ? "s" : ""}</span>. Review and edit before adding to your herd. Uncheck any you don't want.
              </p>

              {animals.map((animal, i) => (
                <div
                  key={i}
                  className={`rounded-2xl border p-4 transition-colors ${
                    animal.selected
                      ? "border-primary/30 bg-primary/5"
                      : "border-border bg-muted/30 opacity-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleAnimal(i)}
                      className={`mt-0.5 w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center transition-colors ${
                        animal.selected ? "bg-primary border-primary" : "border-border bg-background"
                      }`}
                      aria-label={animal.selected ? "Deselect animal" : "Select animal"}
                    >
                      {animal.selected && <Check className="w-3 h-3 text-primary-foreground" />}
                    </button>

                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
                      {[
                        { label: "Tag #", field: "tagNumber" as const, type: "text", placeholder: "—" },
                        { label: "Name", field: "name" as const, type: "text", placeholder: "—" },
                        { label: "Breed", field: "breed" as const, type: "text", placeholder: "—" },
                        { label: "Sex", field: "sex" as const, type: "text", placeholder: "—" },
                        { label: "Date of Birth", field: "dateOfBirth" as const, type: "date" },
                      ].map(({ label, field, type, placeholder }) => (
                        <div key={field}>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>
                          <input
                            type={type}
                            className="w-full text-sm font-medium bg-transparent border-b border-border focus:border-primary outline-none py-0.5 disabled:cursor-not-allowed"
                            value={(animal[field] as string) ?? ""}
                            placeholder={placeholder}
                            disabled={!animal.selected}
                            onChange={e => updateAnimal(i, field, e.target.value || null)}
                          />
                        </div>
                      ))}

                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Species</p>
                        <select
                          className="w-full text-sm font-medium bg-transparent border-b border-border focus:border-primary outline-none py-0.5 disabled:cursor-not-allowed"
                          value={animal.species}
                          disabled={!animal.selected}
                          onChange={e => updateAnimal(i, "species", e.target.value)}
                        >
                          {SPECIES_OPTIONS.map(({ label }) => (
                            <option key={label} value={label}>{label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {animal.notes && (
                    <p className="mt-2.5 ml-8 text-xs text-muted-foreground italic leading-relaxed">
                      Note: {animal.notes}
                    </p>
                  )}
                </div>
              ))}
            </>
          )}

          {/* ── Adding ── */}
          {stage === "adding" && (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="font-semibold">Adding animals to your herd…</p>
            </div>
          )}

          {/* ── Done ── */}
          {stage === "done" && (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <CheckCircle className="w-12 h-12 text-green-500" />
              <div className="text-center">
                <p className="font-semibold text-lg">
                  {addedCount} animal{addedCount !== 1 ? "s" : ""} added to your herd
                </p>
                <p className="text-sm text-muted-foreground mt-1">You can edit any animal from the Herd Directory.</p>
              </div>
              <Button onClick={() => handleClose(false)}>Done</Button>
            </div>
          )}
        </div>

        {/* ── Review footer ── */}
        {stage === "review" && (
          <div className="flex items-center justify-between gap-3 pt-4 mt-2 border-t border-border">
            <p className="text-sm text-muted-foreground">
              {selectedCount} of {animals.length} selected
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStage("idle")}>Try another photo</Button>
              <Button onClick={handleAddSelected} disabled={selectedCount === 0}>
                Add {selectedCount} animal{selectedCount !== 1 ? "s" : ""} to herd
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
