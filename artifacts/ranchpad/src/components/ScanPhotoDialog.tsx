import React, { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Camera, Upload, Loader2, CheckCircle, XCircle, Check, ChevronLeft } from "lucide-react";
import "./ScanPhotoDialog.css";
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col gap-0">
        <DialogHeader className="pb-3">
          <DialogTitle className="flex items-center gap-2">
            {stage === "idle" && (
              <button
                onClick={() => setStage("species")}
                className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                aria-label="Back"
              >
                <ChevronLeft size={16} />
              </button>
            )}
            {stage === "species" ? "What kind of animal?" : "Scan Record Book"}
          </DialogTitle>
          <DialogDescription>
            {stage !== "species" && `Scanning ${selectedSpecies?.toLowerCase()} records. Snap a photo of your record book, tag list, or handwritten notes.`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0" style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          {/* ── Step 1: Pick species ── */}
          {stage === "species" && (
            <div className="scan-species-grid">
              {SPECIES_OPTIONS.map(({ label, emoji }) => (
                <button key={label} className="scan-species-btn" onClick={() => pickSpecies(label)}>
                  <span className="scan-species-emoji">{emoji}</span>
                  <span className="scan-species-label">{label}</span>
                </button>
              ))}
            </div>
          )}

          {/* ── Step 2: Pick photo ── */}
          {stage === "idle" && (
            <>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: "none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
              />
              <div className="scan-pick-grid">
                <button className="scan-pick-btn" onClick={() => cameraInputRef.current?.click()}>
                  <Camera size={28} className="scan-pick-icon" />
                  <span className="scan-pick-title">Take Photo</span>
                  <span className="scan-pick-sub">Use your camera</span>
                </button>
                <button className="scan-pick-btn" onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file"; input.accept = "image/*";
                  input.onchange = e => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) handleFile(f); };
                  input.click();
                }}>
                  <Upload size={28} className="scan-pick-icon" />
                  <span className="scan-pick-title">Upload Photo</span>
                  <span className="scan-pick-sub">From your device</span>
                </button>
              </div>
              {error && (
                <div className="scan-error">
                  <XCircle size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span className="scan-error-text">{error}</span>
                </div>
              )}
              <p className="scan-pick-hint">Works with record books, tag lists, and handwritten notes.</p>
            </>
          )}

          {/* ── Scanning ── */}
          {stage === "scanning" && (
            <div className="scan-loading">
              <Loader2 size={36} color="#2D6A4F" style={{ animation: "spin 1s linear infinite" }} />
              <span className="scan-loading-title">Reading your records…</span>
              <span className="scan-loading-sub">Scanning the photo for {selectedSpecies?.toLowerCase()} records.</span>
            </div>
          )}

          {/* ── Review ── */}
          {stage === "review" && (
            <>
              <p className="scan-found-count">
                Found <strong>{animals.length} animal{animals.length !== 1 ? "s" : ""}</strong>. Review and edit, then uncheck any you don't want.
              </p>
              {animals.map((animal, i) => (
                <div key={i} className={`scan-animal-card${animal.selected ? "" : " deselected"}`}>
                  <div className="scan-animal-card-inner">
                    <button
                      className={`scan-check-btn${animal.selected ? " checked" : ""}`}
                      onClick={() => toggleAnimal(i)}
                      aria-label={animal.selected ? "Deselect" : "Select"}
                    >
                      {animal.selected && <Check size={12} color="#fff" />}
                    </button>
                    <div className="scan-animal-fields">
                      {[
                        { label: "Tag #", field: "tagNumber" as const, type: "text", placeholder: "—" },
                        { label: "Name", field: "name" as const, type: "text", placeholder: "—" },
                        { label: "Breed", field: "breed" as const, type: "text", placeholder: "—" },
                        { label: "Sex", field: "sex" as const, type: "text", placeholder: "—" },
                        { label: "Date of Birth", field: "dateOfBirth" as const, type: "date" },
                      ].map(({ label, field, type, placeholder }) => (
                        <div key={field} className="scan-field">
                          <span className="scan-field-label">{label}</span>
                          <input
                            type={type}
                            className="scan-field-input"
                            value={(animal[field] as string) ?? ""}
                            placeholder={placeholder}
                            disabled={!animal.selected}
                            onChange={e => updateAnimal(i, field, e.target.value || null)}
                          />
                        </div>
                      ))}
                      <div className="scan-field">
                        <span className="scan-field-label">Species</span>
                        <select
                          className="scan-field-select"
                          value={animal.species}
                          disabled={!animal.selected}
                          onChange={e => updateAnimal(i, "species", e.target.value)}
                        >
                          {SPECIES_OPTIONS.map(({ label }) => <option key={label} value={label}>{label}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                  {animal.notes && (
                    <p className="scan-animal-notes">Note: {animal.notes}</p>
                  )}
                </div>
              ))}
            </>
          )}

          {/* ── Adding ── */}
          {stage === "adding" && (
            <div className="scan-loading">
              <Loader2 size={36} color="#2D6A4F" style={{ animation: "spin 1s linear infinite" }} />
              <span className="scan-loading-title">Adding to your herd…</span>
            </div>
          )}

          {/* ── Done ── */}
          {stage === "done" && (
            <div className="scan-done">
              <CheckCircle size={48} color="#2D6A4F" />
              <span className="scan-done-title">{addedCount} animal{addedCount !== 1 ? "s" : ""} added</span>
              <span className="scan-done-sub">You can edit any animal from the Herd page.</span>
              <button className="scan-done-btn" onClick={() => handleClose(false)}>Done</button>
            </div>
          )}
        </div>

        {/* ── Review footer ── */}
        {stage === "review" && (
          <div className="scan-footer">
            <span className="scan-footer-count">{selectedCount} of {animals.length} selected</span>
            <div className="scan-footer-actions">
              <button className="scan-btn-outline" onClick={() => setStage("idle")}>Try another photo</button>
              <button className="scan-btn-primary" onClick={handleAddSelected} disabled={selectedCount === 0}>
                Add {selectedCount} animal{selectedCount !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
