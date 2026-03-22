import React, { useRef, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, Upload, Plus, Loader2 } from "lucide-react";
import { HoofIcon } from "@/components/HoofIcon";
import { useNavigation } from "@/contexts/navigation-context";
import { useAuth } from "@/hooks/use-auth";
import { addGuestAnimal, importCsvToGuestStore } from "@/lib/guest-store";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const BULLETS = [
  "Simple herd log for animals, treatments, and health.",
  "Get early warnings when local conditions raise disease risk.",
  "Get reminders so you never miss shots or treatments.",
];

const SPECIES_OPTIONS = [
  "Cattle",
  "Sheep",
  "Goat",
  "Pig",
  "Poultry",
  "Horse",
  "Other",
];

export default function Landing() {
  const { markNavigated } = useNavigation();
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    tagNumber: "",
    species: "Cattle",
    sex: "Female",
  });

  // ── CSV import ────────────────────────────────────────────────────────────

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast({ title: "Please select a .csv file", variant: "destructive" });
      return;
    }

    setImporting(true);
    try {
      if (isAuthenticated) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/animals/import-csv", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("Import failed");
        const data = await res.json();
        await qc.invalidateQueries({ queryKey: ["/api/animals"] });
        toast({ title: `Imported ${data.animalsCreated ?? 0} animals` });
      } else {
        const text = await file.text();
        const result = importCsvToGuestStore(text);
        toast({ title: `Imported ${result.animalsCreated} animals` });
      }
      markNavigated();
      navigate("/animals");
    } catch {
      toast({ title: "Import failed. Please check your file.", variant: "destructive" });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // ── Add animal ────────────────────────────────────────────────────────────

  async function handleSaveAnimal(e: React.FormEvent) {
    e.preventDefault();
    if (!form.species || !form.sex) return;

    setSaving(true);
    try {
      if (isAuthenticated) {
        const res = await fetch("/api/animals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name || null,
            tagNumber: form.tagNumber || null,
            species: form.species,
            sex: form.sex,
            breed: null,
            dateOfBirth: null,
            notes: null,
          }),
        });
        if (!res.ok) throw new Error("Save failed");
        await qc.invalidateQueries({ queryKey: ["/api/animals"] });
      } else {
        addGuestAnimal({
          name: form.name || "",
          tagNumber: form.tagNumber || null,
          species: form.species,
          sex: form.sex,
          breed: null,
          dateOfBirth: null,
          expectedDueDate: null,
          notes: null,
        });
      }
      markNavigated();
      navigate("/animals");
    } catch {
      toast({ title: "Could not save animal. Please try again.", variant: "destructive" });
      setSaving(false);
    }
  }

  function field(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center relative"
        style={{
          backgroundImage: "url('/pasture-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/25" />

        <div className="relative z-10 flex flex-col items-center max-w-sm w-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg">
              <HoofIcon className="w-7 h-7 text-white" />
            </div>
            <span className="font-display font-bold text-4xl text-white drop-shadow tracking-tight">
              RanchPad
            </span>
          </div>

          {/* Tagline */}
          <p className="text-base font-semibold text-white/90 mb-8 drop-shadow tracking-wide uppercase">
            Livestock Management
          </p>

          {/* Bullets */}
          <ul className="flex flex-col gap-3 mb-10 text-left w-full">
            {BULLETS.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-white shrink-0 mt-0.5 drop-shadow" />
                <span className="text-white/90 font-medium text-sm leading-relaxed drop-shadow">
                  {point}
                </span>
              </li>
            ))}
          </ul>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="flex-1 inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl font-semibold text-sm bg-white/15 backdrop-blur-sm border border-white/40 text-white hover:bg-white/25 transition-colors shadow-md disabled:opacity-60"
            >
              {importing ? (
                <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 shrink-0" />
              )}
              Upload your herd from a csv file here
            </button>

            <button
              onClick={() => setSheetOpen(true)}
              className="flex-1 inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl font-semibold text-sm bg-white text-green-800 hover:bg-white/90 transition-colors shadow-md"
            >
              <Plus className="w-4 h-4 shrink-0" />
              Add Animal
            </button>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFile}
      />

      {/* Add Animal sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-safe max-w-lg mx-auto">
          <SheetHeader className="mb-5">
            <SheetTitle className="text-lg font-bold">Add your first animal</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSaveAnimal} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bessie"
                  value={form.name}
                  onChange={(e) => field("name", e.target.value)}
                  className="h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Tag #
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1042"
                  value={form.tagNumber}
                  onChange={(e) => field("tagNumber", e.target.value)}
                  className="h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Species <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.species}
                  onChange={(e) => field("species", e.target.value)}
                  required
                  className="h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {SPECIES_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Sex <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.sex}
                  onChange={(e) => field("sex", e.target.value)}
                  required
                  className="h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="flex-1 h-11 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Add Animal
              </button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
