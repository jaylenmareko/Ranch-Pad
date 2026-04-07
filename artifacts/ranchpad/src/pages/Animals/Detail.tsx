import React, { useState, useRef, useEffect } from "react";
import { format, parseISO, isPast } from "date-fns";
import { useParams, Link, useSearch } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SimpleDialog as Dialog } from "@/components/ui/dialog";
import { Input, Label, Textarea } from "@/components/ui/input";
import { ArrowLeft, Edit2, Activity, Pill, AlertTriangle, Trash2, Plus, Camera, X, Loader2, XCircle, FileDown, Archive, RotateCcw, ScanLine, Scissors } from "lucide-react";
import { 
  useGetAnimal, useDeleteAnimal, 
  useListMedications, useCreateMedication, useDeleteMedication, useUpdateMedication,
  useListHealthEvents, useCreateHealthEvent, useDeleteHealthEvent, useUpdateHealthEvent,
  useListFamachaScores, useCreateFamachaScore, useDeleteFamachaScore, useUpdateFamachaScore,
  useListFieldNotes,
  type AnimalDetail, type HealthEvent, type MedicationRecord, type FamachaScore, type FieldNote
} from "@workspace/api-client-react";
import { useRanch } from "@/contexts/ranch-context";
import { generateAnimalPDF } from "@/lib/export-pdf";
import { formatAge, formatDate } from "@/lib/utils";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { ScanRecordsDialog } from "@/components/ScanRecordsDialog";

// ─── Photo helpers ────────────────────────────────────────────────────────────

type PendingPhoto = {
  id: string;
  file: File;
  previewUrl: string;
  objectPath?: string;
  uploading: boolean;
  error?: string;
};

type SavedPhoto = {
  id: number;
  healthEventId: number | null;
  medicationRecordId: number | null;
  objectPath: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: string;
};

type ArchiveReason = "sold" | "deceased" | "transferred";

type AnimalDetailWithArchive = AnimalDetail & {
  archivedAt?: string | null;
  archiveReason?: ArchiveReason | null;
  archiveDate?: string | null;
  archiveNotes?: string | null;
  locationId?: number | null;
  locationName?: string | null;
  isCull?: boolean;
};

const ARCHIVE_REASON_LABELS: Record<ArchiveReason, string> = {
  sold: "Sold",
  deceased: "Deceased",
  transferred: "Transferred",
};

const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/heic", "image/heif"];
const MAX_PHOTO_SIZE = 10 * 1024 * 1024;

async function uploadPhoto(file: File): Promise<string> {
  const urlRes = await fetch("/api/storage/uploads/request-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type || "image/jpeg" }),
  });
  if (!urlRes.ok) throw new Error("Failed to get upload URL");
  const { uploadURL, objectPath } = await urlRes.json();
  const uploadRes = await fetch(uploadURL, {
    method: "PUT",
    headers: { "Content-Type": file.type || "image/jpeg" },
    body: file,
  });
  if (!uploadRes.ok) throw new Error("Upload failed");
  return objectPath as string;
}

async function attachPhoto(
  animalId: number,
  recordId: number,
  type: "health" | "med",
  photo: PendingPhoto & { objectPath: string },
) {
  const url = type === "health"
    ? `/api/animals/${animalId}/health-events/${recordId}/photos`
    : `/api/animals/${animalId}/medications/${recordId}/photos`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      objectPath: photo.objectPath,
      originalFilename: photo.file.name,
      mimeType: photo.file.type || "image/jpeg",
      fileSize: photo.file.size,
    }),
  });
}

function addPendingPhotos(
  newPhotos: PendingPhoto[],
  setter: React.Dispatch<React.SetStateAction<PendingPhoto[]>>,
) {
  setter(prev => [...prev, ...newPhotos]);
  newPhotos.forEach(photo => {
    uploadPhoto(photo.file)
      .then(objectPath => {
        setter(p => p.map(x => x.id === photo.id ? { ...x, objectPath, uploading: false } : x));
      })
      .catch(() => {
        setter(p => p.map(x => x.id === photo.id ? { ...x, uploading: false, error: "Upload failed" } : x));
      });
  });
}

function PhotoUploadArea({
  photos,
  onAdd,
  onRemove,
}: {
  photos: PendingPhoto[];
  onAdd: (photos: PendingPhoto[]) => void;
  onRemove: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileErrors, setFileErrors] = useState<string[]>([]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    const errors: string[] = [];
    const valid: PendingPhoto[] = [];
    for (const file of files) {
      const isAccepted =
        ACCEPTED_PHOTO_TYPES.includes(file.type) ||
        file.name.toLowerCase().endsWith(".heic") ||
        file.name.toLowerCase().endsWith(".heif");
      if (!isAccepted) { errors.push(`${file.name}: only JPG, PNG, or HEIC allowed`); continue; }
      if (file.size > MAX_PHOTO_SIZE) { errors.push(`${file.name}: exceeds 10 MB limit`); continue; }
      valid.push({
        id: Math.random().toString(36).slice(2),
        file,
        previewUrl: URL.createObjectURL(file),
        uploading: true,
      });
    }
    setFileErrors(errors);
    if (valid.length > 0) onAdd(valid);
  }

  return (
    <div className="space-y-2 pt-1">
      {fileErrors.map((err, i) => (
        <p key={i} className="text-xs text-destructive font-medium">{err}</p>
      ))}
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {photos.map(p => (
            <div key={p.id} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border bg-muted shrink-0">
              <img src={p.previewUrl} alt={p.file.name} className="w-full h-full object-cover" />
              {p.uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              )}
              {p.error && (
                <div className="absolute inset-0 bg-destructive/70 flex flex-col items-center justify-center gap-1">
                  <XCircle className="w-5 h-5 text-white" />
                  <span className="text-[9px] text-white font-bold">Failed</span>
                </div>
              )}
              {!p.uploading && (
                <button
                  type="button"
                  onClick={() => onRemove(p.id)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black"
                  aria-label="Remove photo"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors py-1"
      >
        <Camera className="w-4 h-4" />
        Add Photo
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/heic,image/heif,.heic,.heif"
        multiple
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}

function AuthImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    setError(false);
    setBlobUrl(null);
    fetch(src)
      .then(res => {
        if (!res.ok) throw new Error("Failed to load");
        return res.blob();
      })
      .then(blob => {
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch(() => setError(true));
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (error) return <div className={`${className} bg-muted flex items-center justify-center`}><XCircle className="w-5 h-5 text-muted-foreground/50" /></div>;
  if (!blobUrl) return <div className={`${className} bg-muted animate-pulse`} />;
  return <img src={blobUrl} alt={alt} className={className} />;
}

function PhotoGallery({ photos }: { photos: SavedPhoto[] }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  if (photos.length === 0) return null;
  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-1 mt-2">
        {photos.map((photo, idx) => {
          const src = `/api/storage${photo.objectPath}`;
          return (
            <button
              key={photo.id}
              type="button"
              onClick={() => setLightboxIdx(idx)}
              className="shrink-0 group"
            >
              <div className="w-20 h-20 rounded-xl overflow-hidden border border-border bg-muted">
                <AuthImage
                  src={src}
                  alt={photo.originalFilename}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 text-center w-20 truncate">
                {new Date(photo.uploadedAt).toLocaleDateString()}
              </p>
            </button>
          );
        })}
      </div>
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-[200] bg-black/92 flex items-center justify-center"
          onClick={() => setLightboxIdx(null)}
        >
          <AuthImage
            src={`/api/storage${photos[lightboxIdx].objectPath}`}
            alt="Full size"
            className="max-w-[92vw] max-h-[92vh] object-contain rounded-xl shadow-2xl"
          />
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors"
            onClick={() => setLightboxIdx(null)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </>
  );
}

export default function AnimalDetail() {
  const params = useParams();
  const animalId = parseInt(params.id || "0", 10);
  const search = useSearch();
  const fromAlerts = new URLSearchParams(search).get("from") === "alerts";
  const [activeTab, setActiveTab] = useState<"health" | "meds" | "famacha">("health");
  const [isExporting, setIsExporting] = useState(false);
  const [scanRecordsOpen, setScanRecordsOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [archiveReason, setArchiveReason] = useState<ArchiveReason>("sold");
  const [archiveDate, setArchiveDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [archiveNotes, setArchiveNotes] = useState("");
  const [archiving, setArchiving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [culling, setCulling] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { role } = useAuth();
  const { activeRanch } = useRanch();

  const { data: animal, isLoading } = useGetAnimal(animalId);

  // ── Data for PDF export (queries are cached — no extra network cost) ────────
  const { data: pdfHealthEvents } = useListHealthEvents(animalId);
  const { data: pdfMedications }  = useListMedications(animalId);
  const { data: pdfFamacha }      = useListFamachaScores(animalId);
  const { data: pdfFieldNotes }   = useListFieldNotes(animalId);
  const { data: pdfHealthPhotos } = useQuery({
    queryKey: [`/api/animals/${animalId}/health-events/photos`],
    queryFn: async () => {
      const res = await fetch(`/api/animals/${animalId}/health-events/photos`);
      if (!res.ok) return {} as Record<string, SavedPhoto[]>;
      return res.json() as Promise<Record<string, SavedPhoto[]>>;
    },
  });
  const { data: pdfMedPhotos } = useQuery({
    queryKey: [`/api/animals/${animalId}/medications/photos`],
    queryFn: async () => {
      const res = await fetch(`/api/animals/${animalId}/medications/photos`);
      if (!res.ok) return {} as Record<string, SavedPhoto[]>;
      return res.json() as Promise<Record<string, SavedPhoto[]>>;
    },
  });

  async function exportPDF() {
    if (!animal) return;
    setIsExporting(true);
    try {
      await generateAnimalPDF({
        ranchName: activeRanch?.name || "My Ranch",
        name: animal.name,
        tagNumber: animal.tagNumber,
        species: animal.species,
        breed: animal.breed,
        sex: animal.sex,
        dateOfBirth: animal.dateOfBirth,
        locationName: (animal as any).locationName ?? null,
        damName: animal.damName ?? null,
        dam: animal.dam ?? null,
        sireName: animal.sireName ?? null,
        sire: animal.sire ?? null,
        babies: animal.babies ?? [],
        archivedAt: animal.archivedAt ?? null,
        archiveReason: animal.archiveReason ?? null,
        archiveDate: (animal as any).archiveDate ?? null,
        archiveNotes: (animal as any).archiveNotes ?? null,
        healthEvents: (pdfHealthEvents || []).map(ev => ({
          id: ev.id,
          description: ev.description,
          eventDate: ev.eventDate,
          severity: ev.severity,
        })),
        medications: (pdfMedications || []).map(m => ({
          id: m.id,
          medicationName: m.medicationName,
          dosage: m.dosage,
          dateGiven: m.dateGiven,
          nextDueDate: m.nextDueDate,
        })),
        famachaScores: (pdfFamacha || []).map(s => ({
          score: s.score,
          recordedDate: s.recordedDate,
        })),
        fieldNotes: (pdfFieldNotes || []).map(n => ({
          noteText: n.noteText,
          createdAt: n.createdAt,
        })),
        healthPhotos: pdfHealthPhotos || {},
        medPhotos: pdfMedPhotos || {},
      });
    } catch {
      toast({ title: "Export failed", description: "Could not generate PDF. Please try again.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  }

  const deleteMutation = useDeleteAnimal({
    mutation: {
      onSuccess: () => {
        toast({ title: "Animal deleted" });
        window.location.href = "/animals";
      }
    }
  });

  const requestDeleteAnimal = async () => {
    if (!animal) return;
    if (!confirm(`Request deletion of ${animal.name}? The owner will need to approve.`)) return;
    const res = await fetch("/api/team/delete-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resourceType: "animal", resourceId: animalId, resourceName: animal.name }),
    });
    const data = await res.json();
    if (res.ok) {
      toast({ title: "Deletion request sent", description: "The owner will review your request." });
    } else if (res.status === 409) {
      toast({ title: "Request already pending", description: "The owner has been notified." });
    } else {
      toast({ title: "Error", description: data.message, variant: "destructive" });
    }
  };

  const requestArchiveAnimal = async () => {
    if (!animal) return;
    const res = await fetch("/api/team/delete-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resourceType: "animal_archive", resourceId: animalId, resourceName: animal.name }),
    });
    const data = await res.json();
    if (res.ok) {
      toast({ title: "Archive request sent", description: "The owner will review your request." });
    } else if (res.status === 409) {
      toast({ title: "Request already pending", description: "The owner has been notified." });
    } else {
      toast({ title: "Error", description: data.message, variant: "destructive" });
    }
  };

  const submitArchive = async () => {
    if (!animal) return;
    setArchiving(true);
    try {
      const res = await fetch(`/api/animals/${animalId}/archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: archiveReason, date: archiveDate, notes: archiveNotes || null }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast({ title: "Error", description: data.message, variant: "destructive" });
        return;
      }
      toast({ title: `${animal.name} archived`, description: `Marked as ${ARCHIVE_REASON_LABELS[archiveReason]}.` });
      setArchiveDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/animals/${animalId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/animals"] });
    } catch {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setArchiving(false);
    }
  };

  const restoreAnimal = async () => {
    if (!animal) return;
    setRestoring(true);
    try {
      const res = await fetch(`/api/animals/${animalId}/restore`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        toast({ title: "Error", description: data.message, variant: "destructive" });
        return;
      }
      toast({ title: `${animal.name} restored`, description: "Animal is back in the active herd." });
      queryClient.invalidateQueries({ queryKey: [`/api/animals/${animalId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/animals"] });
    } catch {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setRestoring(false);
    }
  };

  const markAsCull = async () => {
    if (!animal) return;
    setCulling(true);
    try {
      const res = await fetch(`/api/animals/${animalId}/cull`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        toast({ title: "Error", description: data.message, variant: "destructive" });
        return;
      }
      const label = animal.tagNumber ? `#${animal.tagNumber}` : animal.name;
      toast({ title: `${label} marked for cull`, description: "This animal has been moved to the Cull list." });
      queryClient.invalidateQueries({ queryKey: [`/api/animals/${animalId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/animals"] });
    } catch {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setCulling(false);
    }
  };

  const removeFromCull = async () => {
    if (!animal) return;
    setCulling(true);
    try {
      const res = await fetch(`/api/animals/${animalId}/uncull`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        toast({ title: "Error", description: data.message, variant: "destructive" });
        return;
      }
      const label = animal.tagNumber ? `#${animal.tagNumber}` : animal.name;
      toast({ title: `${label} removed from cull list`, description: "Animal is back in the active herd." });
      queryClient.invalidateQueries({ queryKey: [`/api/animals/${animalId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/animals"] });
    } catch {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setCulling(false);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-muted-foreground animate-pulse font-bold">Loading profile...</div>;
  }

  if (!animal) {
    return <div className="p-12 text-center text-muted-foreground font-bold text-xl">Animal not found</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <Link href={fromAlerts ? "/alerts" : "/animals"} className="flex items-center text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> {fromAlerts ? "Back to Alerts" : "Back to Herd"}
        </Link>
        {role !== "viewer" && (
          <Button variant="outline" size="sm" className="bg-card min-h-[36px] gap-1.5" onClick={() => setScanRecordsOpen(true)}>
            <ScanLine className="w-4 h-4" />
            Add from Photo
          </Button>
        )}
      </div>

      {/* Header Card */}
      {(() => {
        const a = animal as AnimalDetailWithArchive;
        const isArchived = !!a.archivedAt;
        const SPECIES_EMOJI: Record<string, string> = { Cattle: "🐄", Sheep: "🐑", Goat: "🐐", Pig: "🐖", Horse: "🐴", Chicken: "🐔", Duck: "🦆", Alpaca: "🦙", Llama: "🦙", Rabbit: "🐇", Dog: "🐕" };
        const emoji = SPECIES_EMOJI[animal.species] ?? "🐾";
        const healthColor = (animal as AnimalDetail & { latestHealthSeverity?: string }).latestHealthSeverity === "high"
          ? { dot: "#ef4444", label: "Urgent", bg: "bg-red-500/10 text-red-400" }
          : (animal as AnimalDetail & { latestHealthSeverity?: string }).latestHealthSeverity === "medium"
          ? { dot: "#eab308", label: "Watch", bg: "bg-yellow-500/10 text-yellow-400" }
          : { dot: "#22c55e", label: "Healthy", bg: "bg-green-500/10 text-green-400" };

        const facts = [
          { label: "Species", value: animal.species },
          { label: "Sex", value: animal.sex },
          { label: "Breed", value: animal.breed || "Unknown" },
          { label: "Age", value: formatAge(animal.dateOfBirth) },
          ...(a.locationName ? [{ label: "Location", value: a.locationName }] : []),
          ...(animal.dateOfBirth ? [{ label: "Born", value: format(parseISO(animal.dateOfBirth), "MMM d, yyyy") }] : []),
        ];

        return (
          <Card className="overflow-hidden border-2 border-border">
            {isArchived && (
              <div className="bg-amber-900/30 border-b border-amber-600/30 px-5 py-2.5 flex items-center gap-2.5">
                <Archive className="w-4 h-4 text-amber-400 shrink-0" />
                <p className="text-sm text-amber-300 font-semibold">
                  Archived — {a.archiveReason ? ARCHIVE_REASON_LABELS[a.archiveReason as ArchiveReason] : "Archived"}
                  {a.archiveDate && ` on ${a.archiveDate}`}
                  {a.archiveNotes && <span className="ml-2 font-normal opacity-75">· {a.archiveNotes}</span>}
                </p>
              </div>
            )}

            <div className="p-5 space-y-4">
              {/* Identity row */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center shrink-0 text-4xl leading-none">
                  {emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-black font-display text-foreground leading-tight">{animal.name}</h1>
                    {animal.tagNumber && (
                      <span className="text-sm font-bold font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-lg border border-border">#{animal.tagNumber}</span>
                    )}
                  </div>
                  {/* Health status badge */}
                  <span className={`inline-flex items-center gap-1.5 mt-1 text-xs font-bold px-2.5 py-1 rounded-full ${healthColor.bg}`}>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: healthColor.dot }} />
                    {healthColor.label}
                  </span>
                </div>
              </div>

              {/* Fact chips grid */}
              <div className="grid grid-cols-2 gap-2">
                {facts.map(({ label, value }) => (
                  <div key={label} className="bg-muted/50 rounded-xl px-3 py-2.5 border border-border/60">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>
                    <p className="text-sm font-bold text-foreground">{value}</p>
                  </div>
                ))}
              </div>

              {/* Lineage */}
              {(animal.sire || animal.sireName || animal.dam || animal.damName) && (
                <div className="flex flex-wrap gap-2 pt-1 border-t border-border/50">
                  {(animal.sire || animal.sireName) && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-semibold text-muted-foreground">Sire:</span>
                      {animal.sire
                        ? <Link href={`/animals/${animal.sire.id}`} className="font-bold text-primary hover:underline">{animal.sire.name}</Link>
                        : <span className="font-bold text-foreground">{animal.sireName}</span>
                      }
                    </div>
                  )}
                  {(animal.sire || animal.sireName) && (animal.dam || animal.damName) && (
                    <span className="text-muted-foreground/40">·</span>
                  )}
                  {(animal.dam || animal.damName) && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-semibold text-muted-foreground">Dam:</span>
                      {animal.dam
                        ? <Link href={`/animals/${animal.dam.id}`} className="font-bold text-primary hover:underline">{animal.dam.name}</Link>
                        : <span className="font-bold text-foreground">{animal.damName}</span>
                      }
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        );
      })()}

      {/* Action Buttons */}
      {(() => {
        const a = animal as AnimalDetailWithArchive;
        const isArchived = !!a.archivedAt;
        const isCullFlag = !!a.isCull;
        return (
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="bg-card min-h-[44px]"
              onClick={exportPDF}
              isLoading={isExporting}
              aria-label="Export animal record as PDF"
            >
              <FileDown className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            {!isArchived && role !== "viewer" && (
              <Link href={`/animals/${animal.id}/edit`}>
                <Button variant="outline" size="sm" className="bg-card min-h-[44px]"><Edit2 className="w-4 h-4 mr-2" /> Edit Profile</Button>
              </Link>
            )}
            {!isArchived && role !== "viewer" && !isCullFlag && (
              <Button
                variant="outline"
                size="sm"
                className="min-h-[44px] border-orange-600/40 text-orange-400 hover:bg-orange-600/10"
                onClick={markAsCull}
                disabled={culling}
              >
                {culling ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Scissors className="w-4 h-4 mr-1.5" />}
                Mark as Cull
              </Button>
            )}
            {!isArchived && role !== "viewer" && isCullFlag && (
              <Button
                variant="outline"
                size="sm"
                className="min-h-[44px] border-orange-600/60 bg-orange-600/10 text-orange-400 hover:bg-orange-600/20"
                onClick={removeFromCull}
                disabled={culling}
              >
                {culling ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Scissors className="w-4 h-4 mr-1.5" />}
                Remove from Cull
              </Button>
            )}
            {!isArchived && role === "owner" && (
              <Button variant="outline" size="sm" className="min-h-[44px] border-amber-600/40 text-amber-500 hover:bg-amber-600/10" onClick={() => setArchiveDialogOpen(true)}>
                <Archive className="w-4 h-4 mr-1.5" /> Archive
              </Button>
            )}
            {!isArchived && role === "ranch_hand" && (
              <Button variant="outline" size="sm" className="min-h-[44px] border-amber-600/40 text-amber-500 hover:bg-amber-600/10" onClick={requestArchiveAnimal}>
                <Archive className="w-4 h-4 mr-1.5" /> Request Archive
              </Button>
            )}
            {isArchived && role === "owner" && (
              <>
                <Button variant="outline" size="sm" className="min-h-[44px] border-primary/40 text-primary hover:bg-primary/10" onClick={restoreAnimal} disabled={restoring}>
                  {restoring ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-1.5" />}
                  Restore
                </Button>
                <Button variant="destructive" size="sm" className="min-w-[44px] min-h-[44px]" aria-label="Delete animal" onClick={() => {
                  if(confirm("Permanently delete this animal? All records will be lost.")) {
                    deleteMutation.mutate({ animalId });
                  }
                }}><Trash2 className="w-4 h-4" /></Button>
              </>
            )}
            {!isArchived && role === "owner" && (
              <Button variant="destructive" size="sm" className="min-w-[44px] min-h-[44px]" aria-label="Delete animal" onClick={() => {
                if(confirm("Are you sure you want to delete this animal? All history will be lost.")) {
                  deleteMutation.mutate({ animalId });
                }
              }}><Trash2 className="w-4 h-4" /></Button>
            )}
            {!isArchived && role === "ranch_hand" && (
              <Button variant="outline" size="sm" className="min-h-[44px] border-destructive/40 text-destructive hover:bg-destructive/10" onClick={requestDeleteAnimal}>
                <Trash2 className="w-4 h-4 mr-1.5" /> Request Deletion
              </Button>
            )}
          </div>
        );
      })()}

      {/* Tab Navigation */}
      {(() => {
        const showFamacha = ["Sheep", "Goat"].includes(animal.species);
        const tabs = [
          { id: "health", label: "Health Events", icon: Activity },
          { id: "meds", label: "Medications", icon: Pill },
          ...(showFamacha ? [{ id: "famacha", label: "FAMACHA", icon: AlertTriangle }] : []),
        ];
        return (
          <div className="relative">
            <div className="flex overflow-x-auto hide-scrollbar border-b border-border/60 pb-px gap-2 sm:gap-6">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as "health" | "meds" | "famacha")}
                  className={`flex items-center gap-2 py-3 px-1 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  {tab.icon && <tab.icon className="w-4 h-4" />}
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-background to-transparent pointer-events-none sm:hidden" />
          </div>
        );
      })()}

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "health" && <HealthTab animalId={animalId} />}
        {activeTab === "meds" && <MedsTab animalId={animalId} />}
        {activeTab === "famacha" && ["Sheep", "Goat"].includes(animal.species) && <FamachaTab animalId={animalId} />}
      </div>

      {/* Archive Dialog */}
      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen} title="Archive Animal">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Archiving <strong>{animal.name}</strong> removes them from your active herd. All health records and history are preserved.
          </p>
          <div className="space-y-2">
            <Label>Reason</Label>
            <select
              value={archiveReason}
              onChange={e => setArchiveReason(e.target.value as ArchiveReason)}
              className="flex h-12 w-full rounded-xl border-2 border-border bg-background px-4 py-2 font-medium"
            >
              <option value="sold">Sold</option>
              <option value="deceased">Deceased</option>
              <option value="transferred">Transferred</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={archiveDate}
              onChange={e => setArchiveDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="e.g. Sold to Smith Ranch for $450"
              value={archiveNotes}
              onChange={e => setArchiveNotes(e.target.value)}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setArchiveDialogOpen(false)}>Cancel</Button>
            <Button
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white border-0"
              onClick={submitArchive}
              isLoading={archiving}
            >
              <Archive className="w-4 h-4 mr-1.5" /> Archive Animal
            </Button>
          </div>
        </div>
      </Dialog>

      <ScanRecordsDialog
        animalId={animalId}
        animalName={animal.name ?? `#${animal.tagNumber}`}
        open={scanRecordsOpen}
        onOpenChange={setScanRecordsOpen}
      />
    </div>
  );
}

// Sub-components for Tabs

function HealthTab({ animalId }: { animalId: number }) {
  const { data: events, isLoading } = useListHealthEvents(animalId);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { role } = useAuth();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState("");
  const [sev, setSev] = useState<"low"|"medium"|"high">("low");
  const [pendingAddPhotos, setPendingAddPhotos] = useState<PendingPhoto[]>([]);

  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editSev, setEditSev] = useState<"low"|"medium"|"high">("low");
  const [pendingEditPhotos, setPendingEditPhotos] = useState<PendingPhoto[]>([]);

  const { data: healthPhotos, refetch: refetchHealthPhotos } = useQuery({
    queryKey: [`/api/animals/${animalId}/health-events/photos`],
    queryFn: async () => {
      const res = await fetch(`/api/animals/${animalId}/health-events/photos`);
      if (!res.ok) return {} as Record<string, SavedPhoto[]>;
      return res.json() as Promise<Record<string, SavedPhoto[]>>;
    },
  });

  const createMutation = useCreateHealthEvent();
  const updateMutation = useUpdateHealthEvent();
  const deleteMutation = useDeleteHealthEvent({
    mutation: { onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/animals/${animalId}/health-events`] });
      queryClient.invalidateQueries({ queryKey: [`/api/animals/${animalId}`] });
    }}
  });

  const requestDeleteEvent = async (eventId: number, eventDate: string) => {
    if (!confirm("Request deletion of this health event?")) return;
    const res = await fetch("/api/team/delete-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resourceType: "health_event", resourceId: eventId, resourceName: `Health event on ${eventDate}` }),
    });
    const d = await res.json();
    toast({ title: res.ok ? "Request sent" : (res.status === 409 ? "Already pending" : "Error"), description: res.ok ? "Owner will review." : d.message, variant: res.ok || res.status === 409 ? "default" : "destructive" });
  };

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const event = await createMutation.mutateAsync({ animalId, data: { description: desc, eventDate: date, severity: sev } });
      const readyPhotos = pendingAddPhotos.filter(p => p.objectPath && !p.uploading && !p.error) as (PendingPhoto & { objectPath: string })[];
      await Promise.all(readyPhotos.map(p => attachPhoto(animalId, event.id, "health", p)));
      queryClient.invalidateQueries({ queryKey: [`/api/animals/${animalId}/health-events`] });
      queryClient.invalidateQueries({ queryKey: [`/api/animals/${animalId}`] });
      if (readyPhotos.length > 0) refetchHealthPhotos();
      setIsAddOpen(false);
      setDesc(""); setDate(""); setSev("low");
      setPendingAddPhotos([]);
      toast({ title: "Event recorded" });
    } catch {}
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingEventId) return;
    try {
      await updateMutation.mutateAsync({ animalId, healthEventId: editingEventId, data: { description: editDesc, eventDate: editDate, severity: editSev } });
      const readyPhotos = pendingEditPhotos.filter(p => p.objectPath && !p.uploading && !p.error) as (PendingPhoto & { objectPath: string })[];
      await Promise.all(readyPhotos.map(p => attachPhoto(animalId, editingEventId, "health", p)));
      queryClient.invalidateQueries({ queryKey: [`/api/animals/${animalId}/health-events`] });
      queryClient.invalidateQueries({ queryKey: [`/api/animals/${animalId}`] });
      if (readyPhotos.length > 0) refetchHealthPhotos();
      setEditingEventId(null);
      setPendingEditPhotos([]);
      toast({ title: "Event updated" });
    } catch {}
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-display font-bold text-xl">Health History</h3>
        {role !== "viewer" && <Button size="sm" onClick={() => setIsAddOpen(true)}><Plus className="w-4 h-4 mr-1"/> Log Event</Button>}
      </div>

      <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) setPendingAddPhotos([]); }} title="Log Health Event">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" required value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Severity</Label>
            <select value={sev} onChange={e => setSev(e.target.value as "low" | "medium" | "high")} className="flex h-12 w-full rounded-xl border-2 border-border bg-background px-4 py-2 font-medium">
              <option value="low">Low (Routine)</option>
              <option value="medium">Medium (Requires watching)</option>
              <option value="high">High (Urgent/Vet needed)</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea required placeholder="e.g. Limping on back left leg" value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
          <PhotoUploadArea
            photos={pendingAddPhotos}
            onAdd={newPhotos => addPendingPhotos(newPhotos, setPendingAddPhotos)}
            onRemove={id => setPendingAddPhotos(prev => prev.filter(p => p.id !== id))}
          />
          <Button type="submit" className="w-full" isLoading={createMutation.isPending}>Save Event</Button>
        </form>
      </Dialog>

      <Dialog open={editingEventId !== null} onOpenChange={(open) => { if (!open) { setEditingEventId(null); setPendingEditPhotos([]); } }} title="Edit Health Event">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" required value={editDate} onChange={e => setEditDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Severity</Label>
            <select value={editSev} onChange={e => setEditSev(e.target.value as "low" | "medium" | "high")} className="flex h-12 w-full rounded-xl border-2 border-border bg-background px-4 py-2 font-medium">
              <option value="low">Low (Routine)</option>
              <option value="medium">Medium (Requires watching)</option>
              <option value="high">High (Urgent/Vet needed)</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea required value={editDesc} onChange={e => setEditDesc(e.target.value)} />
          </div>
          <PhotoUploadArea
            photos={pendingEditPhotos}
            onAdd={newPhotos => addPendingPhotos(newPhotos, setPendingEditPhotos)}
            onRemove={id => setPendingEditPhotos(prev => prev.filter(p => p.id !== id))}
          />
          <Button type="submit" className="w-full" isLoading={updateMutation.isPending}>Update Event</Button>
        </form>
      </Dialog>

      {isLoading ? <div className="animate-pulse bg-card h-32 rounded-xl" /> :
       events?.length === 0 ? <p className="text-muted-foreground p-8 text-center bg-card rounded-xl border border-dashed">No health events recorded.</p> : (
        <div className="grid gap-3">
          {events?.sort((a: HealthEvent, b: HealthEvent) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()).map((ev: HealthEvent) => (
            <Card key={ev.id} className="border-l-4 overflow-hidden shadow-sm group" style={{ borderLeftColor: ev.severity === 'high' ? 'var(--color-destructive)' : ev.severity === 'medium' ? '#eab308' : '#22c55e' }}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-foreground">{formatDate(ev.eventDate)}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                        ev.severity === 'high' ? 'bg-red-500/15 text-red-400 border border-red-500/30' :
                        ev.severity === 'medium' ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30' :
                        'bg-green-500/15 text-green-400 border border-green-500/30'
                      }`}>{ev.severity}</span>
                    </div>
                    <p className="text-foreground">{ev.description}</p>
                  </div>
                  <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                    {role !== "viewer" && (
                      <button onClick={() => { setEditingEventId(ev.id); setEditDesc(ev.description); setEditDate(ev.eventDate); setEditSev(ev.severity as "low"|"medium"|"high"); setPendingEditPhotos([]); }} className="inline-flex items-center gap-1.5 px-3 min-h-[36px] text-sm font-semibold text-muted-foreground hover:text-primary bg-muted hover:bg-muted/80 border border-border rounded-lg transition-colors" aria-label="Edit event">
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                    )}
                    {role === "owner" && (
                      <button onClick={() => { if(confirm("Delete this event?")) deleteMutation.mutate({ animalId, healthEventId: ev.id }) }} className="inline-flex items-center gap-1.5 px-3 min-h-[36px] text-sm font-semibold text-red-400 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 hover:text-red-300 rounded-lg transition-colors" aria-label="Delete event">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    )}
                    {role === "ranch_hand" && (
                      <button onClick={() => requestDeleteEvent(ev.id, ev.eventDate)} className="inline-flex items-center gap-1.5 px-3 min-h-[36px] text-sm font-semibold text-red-400 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 hover:text-red-300 rounded-lg transition-colors" aria-label="Request deletion" title="Request deletion">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    )}
                  </div>
                </div>
                <PhotoGallery photos={healthPhotos?.[ev.id] ?? []} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function MedsTab({ animalId }: { animalId: number }) {
  const { data: meds, isLoading } = useListMedications(animalId);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { role } = useAuth();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingMedId, setEditingMedId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [dose, setDosage] = useState("");
  const [date, setDate] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [pendingAddPhotos, setPendingAddPhotos] = useState<PendingPhoto[]>([]);

  const [editName, setEditName] = useState("");
  const [editDose, setEditDose] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editNextDate, setEditNextDate] = useState("");
  const [pendingEditPhotos, setPendingEditPhotos] = useState<PendingPhoto[]>([]);

  const { data: medPhotos, refetch: refetchMedPhotos } = useQuery({
    queryKey: [`/api/animals/${animalId}/medications/photos`],
    queryFn: async () => {
      const res = await fetch(`/api/animals/${animalId}/medications/photos`);
      if (!res.ok) return {} as Record<string, SavedPhoto[]>;
      return res.json() as Promise<Record<string, SavedPhoto[]>>;
    },
  });

  const createMutation = useCreateMedication();
  const updateMutation = useUpdateMedication();
  const deleteMutation = useDeleteMedication({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/animals/${animalId}/medications`] }) }
  });

  const requestDeleteMed = async (medId: number, medName: string) => {
    if (!confirm(`Request deletion of ${medName}?`)) return;
    const res = await fetch("/api/team/delete-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resourceType: "medication", resourceId: medId, resourceName: medName }),
    });
    const d = await res.json();
    toast({ title: res.ok ? "Request sent" : (res.status === 409 ? "Already pending" : "Error"), description: res.ok ? "Owner will review." : d.message, variant: res.ok || res.status === 409 ? "default" : "destructive" });
  };

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const record = await createMutation.mutateAsync({ animalId, data: { medicationName: name, dosage: dose, dateGiven: date, nextDueDate: nextDate || null } });
      const readyPhotos = pendingAddPhotos.filter(p => p.objectPath && !p.uploading && !p.error) as (PendingPhoto & { objectPath: string })[];
      await Promise.all(readyPhotos.map(p => attachPhoto(animalId, record.id, "med", p)));
      queryClient.invalidateQueries({ queryKey: [`/api/animals/${animalId}/medications`] });
      if (readyPhotos.length > 0) refetchMedPhotos();
      setIsAddOpen(false);
      setName(""); setDosage(""); setDate(""); setNextDate("");
      setPendingAddPhotos([]);
      toast({ title: "Medication recorded" });
    } catch {}
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingMedId) return;
    try {
      await updateMutation.mutateAsync({ animalId, medicationId: editingMedId, data: { medicationName: editName, dosage: editDose, dateGiven: editDate, nextDueDate: editNextDate || null } });
      const readyPhotos = pendingEditPhotos.filter(p => p.objectPath && !p.uploading && !p.error) as (PendingPhoto & { objectPath: string })[];
      await Promise.all(readyPhotos.map(p => attachPhoto(animalId, editingMedId, "med", p)));
      queryClient.invalidateQueries({ queryKey: [`/api/animals/${animalId}/medications`] });
      if (readyPhotos.length > 0) refetchMedPhotos();
      setEditingMedId(null);
      setPendingEditPhotos([]);
      toast({ title: "Medication updated" });
    } catch {}
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-display font-bold text-xl">Medication Records</h3>
        {role !== "viewer" && <Button size="sm" onClick={() => setIsAddOpen(true)}><Plus className="w-4 h-4 mr-1"/> Log Med</Button>}
      </div>

      <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) setPendingAddPhotos([]); }} title="Record Medication">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label>Medication Name</Label>
            <Input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ivermectin" />
          </div>
          <div className="space-y-2">
            <Label>Dosage</Label>
            <Input value={dose} onChange={e => setDosage(e.target.value)} placeholder="e.g. 5ml" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date Given</Label>
              <Input type="date" required value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Next Due (Optional)</Label>
              <Input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)} />
            </div>
          </div>
          <PhotoUploadArea
            photos={pendingAddPhotos}
            onAdd={newPhotos => addPendingPhotos(newPhotos, setPendingAddPhotos)}
            onRemove={id => setPendingAddPhotos(prev => prev.filter(p => p.id !== id))}
          />
          <Button type="submit" className="w-full" isLoading={createMutation.isPending}>Save Record</Button>
        </form>
      </Dialog>

      <Dialog open={editingMedId !== null} onOpenChange={(open) => { if (!open) { setEditingMedId(null); setPendingEditPhotos([]); } }} title="Edit Medication">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="space-y-2">
            <Label>Medication Name</Label>
            <Input required value={editName} onChange={e => setEditName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Dosage</Label>
            <Input value={editDose} onChange={e => setEditDose(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date Given</Label>
              <Input type="date" required value={editDate} onChange={e => setEditDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Next Due</Label>
              <Input type="date" value={editNextDate} onChange={e => setEditNextDate(e.target.value)} />
            </div>
          </div>
          <PhotoUploadArea
            photos={pendingEditPhotos}
            onAdd={newPhotos => addPendingPhotos(newPhotos, setPendingEditPhotos)}
            onRemove={id => setPendingEditPhotos(prev => prev.filter(p => p.id !== id))}
          />
          <Button type="submit" className="w-full" isLoading={updateMutation.isPending}>Update Record</Button>
        </form>
      </Dialog>

      {isLoading ? <div className="animate-pulse bg-card h-32 rounded-xl" /> :
       meds?.length === 0 ? <p className="text-muted-foreground p-8 text-center bg-card rounded-xl border border-dashed">No medications recorded.</p> : (
        <div className="grid gap-3">
          {meds?.sort((a: MedicationRecord, b: MedicationRecord) => new Date(b.dateGiven).getTime() - new Date(a.dateGiven).getTime()).map((med: MedicationRecord) => (
            <Card key={med.id} className="shadow-sm group">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-primary text-lg">{med.medicationName}</h4>
                      {med.dosage && <Badge variant="secondary">{med.dosage}</Badge>}
                    </div>
                    <div className="text-sm text-muted-foreground font-medium mt-1 flex flex-wrap gap-3">
                      <span>Given {format(parseISO(med.dateGiven + (med.dateGiven.length === 10 ? "T12:00:00" : "")), "MMM d, yyyy")}</span>
                      {med.nextDueDate && (() => {
                        const dueDate = parseISO(med.nextDueDate + "T12:00:00");
                        const overdue = isPast(dueDate);
                        return (
                          <span className={overdue ? "text-red-500 dark:text-red-400 font-semibold" : "text-amber-600 dark:text-amber-400 font-semibold"}>
                            {overdue ? "Overdue" : "Due"} · {format(dueDate, "MMM d, yyyy")}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                    {role !== "viewer" && (
                      <button onClick={() => { setEditingMedId(med.id); setEditName(med.medicationName); setEditDose(med.dosage || ""); setEditDate(med.dateGiven); setEditNextDate(med.nextDueDate || ""); setPendingEditPhotos([]); }} className="inline-flex items-center gap-1.5 px-3 min-h-[36px] text-sm font-semibold text-muted-foreground hover:text-primary bg-muted hover:bg-muted/80 border border-border rounded-lg transition-colors" aria-label="Edit medication">
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                    )}
                    {role === "owner" && (
                      <button onClick={() => { if(confirm("Delete?")) deleteMutation.mutate({ animalId, medicationId: med.id }) }} className="inline-flex items-center gap-1.5 px-3 min-h-[36px] text-sm font-semibold text-red-400 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 hover:text-red-300 rounded-lg transition-colors" aria-label="Delete medication">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    )}
                    {role === "ranch_hand" && (
                      <button onClick={() => requestDeleteMed(med.id, med.medicationName)} className="inline-flex items-center gap-1.5 px-3 min-h-[36px] text-sm font-semibold text-red-400 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 hover:text-red-300 rounded-lg transition-colors" aria-label="Request deletion" title="Request deletion">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    )}
                  </div>
                </div>
                <PhotoGallery photos={medPhotos?.[med.id] ?? []} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function FamachaTab({ animalId }: { animalId: number }) {
  const { data: scores, isLoading } = useListFamachaScores(animalId);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { role } = useAuth();

  const requestDeleteFamacha = async (scoreId: number, recordedDate: string) => {
    if (!confirm("Request deletion of this FAMACHA score?")) return;
    const res = await fetch("/api/team/delete-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resourceType: "famacha_score", resourceId: scoreId, resourceName: `FAMACHA score on ${recordedDate}` }),
    });
    const d = await res.json();
    toast({ title: res.ok ? "Request sent" : (res.status === 409 ? "Already pending" : "Error"), description: res.ok ? "Owner will review." : d.message, variant: res.ok || res.status === 409 ? "default" : "destructive" });
  };
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [score, setScore] = useState(3);
  const [date, setDate] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editScore, setEditScore] = useState(3);
  const [editDate, setEditDate] = useState("");

  const createMutation = useCreateFamachaScore({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/api/animals/${animalId}/famacha`] });
        setIsAddOpen(false); setDate("");
        toast({ title: "Score saved" });
      }
    }
  });

  const updateMutation = useUpdateFamachaScore({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/api/animals/${animalId}/famacha`] });
        setEditingId(null);
        toast({ title: "Score updated" });
      }
    }
  });

  const deleteFamachaMutation = useDeleteFamachaScore({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/api/animals/${animalId}/famacha`] });
        toast({ title: "Score deleted" });
      }
    }
  });

  const chartData = [...(scores || [])]
    .sort((a: FamachaScore, b: FamachaScore) => new Date(a.recordedDate).getTime() - new Date(b.recordedDate).getTime())
    .map((s: FamachaScore) => {
      const d = new Date(s.recordedDate + "T12:00:00");
      return { date: `${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}`, score: s.score };
    });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-display font-bold text-xl">FAMACHA Eye Scores</h3>
          <p className="text-sm text-muted-foreground">Monitor anemia/parasite load (1=Critical, 5=Healthy)</p>
        </div>
        {role !== "viewer" && <Button size="sm" onClick={() => setIsAddOpen(true)}><Plus className="w-4 h-4 mr-1"/> Log Score</Button>}
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen} title="Record FAMACHA">
        <form onSubmit={e => { e.preventDefault(); createMutation.mutate({ animalId, data: { score, recordedDate: date } }); }} className="space-y-6">
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" required value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="space-y-4">
            <Label>Score (1-5)</Label>
            <div className="flex justify-between gap-2">
              {[1,2,3,4,5].map(num => (
                <button 
                  key={num} 
                  type="button"
                  onClick={() => setScore(num)}
                  className={`flex-1 h-14 rounded-xl font-black text-xl transition-all ${
                    score === num ? 'ring-4 ring-offset-2 ring-primary scale-110 shadow-lg' : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: num === 1 ? '#ef4444' : num === 2 ? '#f97316' : num === 3 ? '#eab308' : num === 4 ? '#86efac' : '#22c55e',
                    color: num <= 3 ? 'white' : '#14532d'
                  }}
                >{num}</button>
              ))}
            </div>
            <p className="text-xs text-center text-muted-foreground font-bold">1 = Critical (Anemic) <span className="mx-2">|</span> 5 = Healthy (Clear)</p>
          </div>
          <Button type="submit" className="w-full" isLoading={createMutation.isPending}>Save Score</Button>
        </form>
      </Dialog>

      {chartData.length > 1 && (
        <Card className="p-4 shadow-sm border-border bg-card">
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{fontSize: 12, fill: 'var(--color-muted-foreground)'}} axisLine={false} tickLine={false} />
                <YAxis domain={[1, 5]} reversed={true} ticks={[1,2,3,4,5]} tick={{fontSize: 12, fill: 'var(--color-muted-foreground)'}} axisLine={false} tickLine={false} />
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="score" stroke="var(--color-primary)" strokeWidth={4} dot={{r: 6, fill: 'var(--color-card)', strokeWidth: 3}} activeDot={{r: 8}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <Dialog open={editingId !== null} onOpenChange={(open) => { if (!open) setEditingId(null); }} title="Edit FAMACHA Score">
        <form onSubmit={e => { e.preventDefault(); if (editingId) updateMutation.mutate({ animalId, famachaId: editingId, data: { score: editScore, recordedDate: editDate } }); }} className="space-y-6">
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" required value={editDate} onChange={e => setEditDate(e.target.value)} />
          </div>
          <div className="space-y-4">
            <Label>Score (1-5)</Label>
            <div className="flex justify-between gap-2">
              {[1,2,3,4,5].map(num => (
                <button key={num} type="button" onClick={() => setEditScore(num)}
                  className={`flex-1 h-14 rounded-xl font-black text-xl transition-all ${editScore === num ? 'ring-4 ring-offset-2 ring-primary scale-110 shadow-lg' : 'opacity-60 hover:opacity-100'}`}
                  style={{ backgroundColor: num === 1 ? '#ef4444' : num === 2 ? '#f97316' : num === 3 ? '#eab308' : num === 4 ? '#86efac' : '#22c55e', color: num <= 3 ? 'white' : '#14532d' }}
                >{num}</button>
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full" isLoading={updateMutation.isPending}>Update Score</Button>
        </form>
      </Dialog>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {scores?.sort((a: FamachaScore, b: FamachaScore) => new Date(b.recordedDate).getTime() - new Date(a.recordedDate).getTime()).map((s: FamachaScore) => (
          <Card key={s.id} className="text-center shadow-sm group relative">
            <CardContent className="p-3">
              <div className="text-3xl font-black mb-1" style={{ color: s.score === 1 ? '#ef4444' : s.score === 2 ? '#f97316' : s.score === 3 ? '#eab308' : '#22c55e' }}>
                {s.score}
              </div>
              <div className="text-xs font-bold text-muted-foreground">{formatDate(s.recordedDate)}</div>
              {/* Mobile: always-visible action row */}
              {role !== "viewer" && (
                <div className="flex justify-center gap-1 mt-2 sm:hidden">
                  <button
                    onClick={() => { setEditingId(s.id); setEditScore(s.score); setEditDate(s.recordedDate); }}
                    className="flex items-center justify-center w-[44px] h-[44px] text-muted-foreground hover:text-primary rounded-lg hover:bg-muted"
                    aria-label="Edit FAMACHA score"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {role === "owner" && (
                    <button
                      onClick={() => { if(confirm("Delete this FAMACHA score?")) deleteFamachaMutation.mutate({ animalId, famachaId: s.id }); }}
                      className="flex items-center justify-center w-[44px] h-[44px] text-muted-foreground hover:text-destructive rounded-lg hover:bg-muted"
                      aria-label="Delete FAMACHA score"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {role === "ranch_hand" && (
                    <button
                      onClick={() => requestDeleteFamacha(s.id, s.recordedDate)}
                      className="flex items-center justify-center w-[44px] h-[44px] text-muted-foreground hover:text-destructive rounded-lg hover:bg-muted"
                      aria-label="Request deletion"
                      title="Request deletion"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
              {/* Desktop: hover-reveal corner buttons */}
              {role !== "viewer" && (
                <div className="absolute top-0.5 right-0.5 hidden sm:flex opacity-0 group-hover:opacity-100 transition-all gap-0.5">
                  <button
                    onClick={() => { setEditingId(s.id); setEditScore(s.score); setEditDate(s.recordedDate); }}
                    className="p-1.5 rounded-full hover:bg-muted"
                    title="Edit score"
                    aria-label="Edit FAMACHA score"
                  >
                    <Edit2 className="w-3 h-3 text-muted-foreground" />
                  </button>
                  {role === "owner" && (
                    <button
                      onClick={() => { if(confirm("Delete this FAMACHA score?")) deleteFamachaMutation.mutate({ animalId, famachaId: s.id }); }}
                      className="p-1.5 rounded-full hover:bg-muted"
                      title="Delete score"
                      aria-label="Delete FAMACHA score"
                    >
                      <Trash2 className="w-3 h-3 text-destructive/70" />
                    </button>
                  )}
                  {role === "ranch_hand" && (
                    <button
                      onClick={() => requestDeleteFamacha(s.id, s.recordedDate)}
                      className="p-1.5 rounded-full hover:bg-muted"
                      title="Request deletion"
                      aria-label="Request deletion"
                    >
                      <Trash2 className="w-3 h-3 text-destructive/70" />
                    </button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* How alerts work */}
      <div className="rounded-xl border border-border/50 bg-muted/30 px-4 py-3 space-y-1.5">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">How score alerts work</p>
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-yellow-500" />
          <span>An alert fires in the Alerts page when three consecutive readings are each worse than the last — for example, 2 → 3 → 4.</span>
        </div>
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground/50" />
          <span>Each score must be logged on a separate date. Scores are compared in chronological order.</span>
        </div>
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground/50" />
          <span>If you dismiss an alert and then log another worse score, a new alert will appear automatically.</span>
        </div>
      </div>
    </div>
  );
}


