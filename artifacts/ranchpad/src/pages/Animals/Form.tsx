import React, { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Search, X, Check, MapPin } from "lucide-react";
import { useCreateAnimal, useGetAnimal, useUpdateAnimal, useListAnimals, getGetAnimalQueryKey, type Animal } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { addGuestAnimal } from "@/lib/guest-store";

interface PastureLocation { id: number; name: string; }

// ─── Species-specific sex options ─────────────────────────────────────────────
const SEX_OPTIONS: Record<string, Array<{ value: string; label: string }>> = {
  Cattle: [
    { value: "Heifer", label: "Heifer — young female, not yet bred" },
    { value: "Cow", label: "Cow — mature female, has been bred" },
    { value: "Bull", label: "Bull — intact male" },
    { value: "Steer", label: "Steer — castrated male" },
  ],
  Sheep: [
    { value: "Ewe", label: "Ewe — female" },
    { value: "Ram", label: "Ram — intact male" },
    { value: "Wether", label: "Wether — castrated male" },
  ],
  Goat: [
    { value: "Doe", label: "Doe — female" },
    { value: "Buck", label: "Buck — intact male" },
    { value: "Wether", label: "Wether — castrated male" },
  ],
  Pig: [
    { value: "Gilt", label: "Gilt — young female, not yet bred" },
    { value: "Sow", label: "Sow — mature female, has been bred" },
    { value: "Boar", label: "Boar — intact male" },
    { value: "Barrow", label: "Barrow — castrated male" },
  ],
  Horse: [
    { value: "Filly", label: "Filly — young female" },
    { value: "Mare", label: "Mare — mature female" },
    { value: "Stallion", label: "Stallion — intact male" },
    { value: "Gelding", label: "Gelding — castrated male" },
  ],
  Other: [
    { value: "Female", label: "Female" },
    { value: "Male", label: "Male — intact" },
    { value: "Castrated Male", label: "Castrated Male" },
  ],
};

const FEMALE_SEXES = new Set([
  "Heifer", "Cow", "Ewe", "Doe", "Gilt", "Sow", "Filly", "Mare", "Female",
]);

// ─── Form schema ──────────────────────────────────────────────────────────────
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  tagNumber: z.string().nullable().optional(),
  species: z.string().min(1, "Species is required"),
  breed: z.string().nullable().optional(),
  sex: z.string().min(1, "Sex is required"),
  dateOfBirth: z.string().nullable().optional(),
  expectedDueDate: z.string().nullable().optional(),
  sireId: z.number().nullable().optional(),
  damId: z.number().nullable().optional(),
  sireName: z.string().nullable().optional(),
  damName: z.string().nullable().optional(),
  locationId: z.number().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Helper: select dropdown class ───────────────────────────────────────────
const selectClass = "flex h-12 w-full appearance-none rounded-xl border-2 border-border bg-background px-4 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 transition-all font-medium";
const chevron = (
  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
    <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
    </svg>
  </div>
);

// ─── Parent selector sub-component ───────────────────────────────────────────
type ParentMode = "unknown" | "manual" | "herd";

function ParentField({
  label,
  animals,
  idValue,
  nameValue,
  onIdChange,
  onNameChange,
}: {
  label: string;
  animals: Animal[];
  idValue: number | null | undefined;
  nameValue: string | null | undefined;
  onIdChange: (v: number | null) => void;
  onNameChange: (v: string) => void;
}) {
  const [mode, setMode] = useState<ParentMode>(() =>
    idValue != null ? "herd" : nameValue ? "manual" : "unknown"
  );
  const [search, setSearch] = useState("");

  // Sync mode when parent resets form data (e.g. during edit load)
  useEffect(() => {
    if (idValue != null) setMode("herd");
    else if (nameValue) setMode("manual");
  }, [idValue, nameValue]);

  const selectedAnimal = idValue != null ? animals.find(a => a.id === idValue) : null;
  const filtered = animals.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.tagNumber ?? "").toLowerCase().includes(search.toLowerCase())
  );

  function selectMode(next: ParentMode) {
    setMode(next);
    if (next === "unknown") { onIdChange(null); onNameChange(""); }
    if (next === "manual") { onIdChange(null); }
    if (next === "herd") { onNameChange(""); setSearch(""); }
  }

  const btnBase = "flex-1 h-9 px-3 rounded-lg text-xs font-semibold border transition-colors";
  const btnActive = "bg-primary text-primary-foreground border-primary";
  const btnInactive = "bg-muted border-border text-muted-foreground hover:bg-accent hover:text-foreground";

  return (
    <div className="space-y-3">
      <Label>{label}</Label>

      {/* Mode selector */}
      <div className="flex gap-2">
        <button type="button" onClick={() => selectMode("unknown")} className={`${btnBase} ${mode === "unknown" ? btnActive : btnInactive}`}>
          Unknown / Other
        </button>
        <button type="button" onClick={() => selectMode("manual")} className={`${btnBase} ${mode === "manual" ? btnActive : btnInactive}`}>
          Enter Manually
        </button>
        <button type="button" onClick={() => selectMode("herd")} className={`${btnBase} ${mode === "herd" ? btnActive : btnInactive}`}>
          From Herd
        </button>
      </div>

      {/* Manual name input */}
      {mode === "manual" && (
        <Input
          placeholder={`Enter ${label.toLowerCase()} name`}
          value={nameValue || ""}
          onChange={e => onNameChange(e.target.value)}
        />
      )}

      {/* Herd directory browser */}
      {mode === "herd" && (
        <div className="rounded-xl border border-border bg-muted/40 overflow-hidden">
          {selectedAnimal ? (
            <div className="flex items-center gap-3 px-4 py-3">
              <Check className="w-4 h-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{selectedAnimal.name}</p>
                {selectedAnimal.tagNumber && <p className="text-xs text-muted-foreground">#{selectedAnimal.tagNumber}</p>}
              </div>
              <button type="button" onClick={() => { onIdChange(null); setSearch(""); }} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  placeholder="Search herd by name or tag…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
              </div>
              <ul className="max-h-44 overflow-y-auto divide-y divide-border">
                {filtered.length === 0 ? (
                  <li className="px-4 py-3 text-sm text-muted-foreground text-center">
                    {animals.length === 0 ? "No other animals in herd yet." : "No matches found."}
                  </li>
                ) : (
                  filtered.map(a => (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => { onIdChange(a.id); setSearch(""); }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors flex items-center gap-3"
                      >
                        <span className="font-semibold text-foreground truncate">{a.name}</span>
                        {a.tagNumber && <span className="text-xs text-muted-foreground shrink-0">#{a.tagNumber}</span>}
                        {a.breed && <span className="text-xs text-muted-foreground shrink-0 ml-auto">{a.breed}</span>}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </>
          )}
        </div>
      )}

      {mode === "unknown" && (
        <p className="text-xs text-muted-foreground italic">Not recorded — parentage will be left blank.</p>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AnimalForm() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const isEditing = !!params.id;
  const animalId = parseInt(params.id || "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isViewer } = useAuth();

  // Viewers cannot add or edit animals
  useEffect(() => {
    if (isViewer) setLocation("/animals");
  }, [isViewer, setLocation]);

  const [locations, setLocations] = useState<PastureLocation[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetch("/api/locations").then(r => r.json()).then(setLocations).catch(() => {});
  }, [isAuthenticated]);

  // Breeding status — UI only, gates expectedDueDate visibility
  const [breedingStatus, setBreedingStatus] = useState<"unknown" | "open" | "bred">("unknown");

  // Parentage section — collapsed by default, expanded when editing an animal that already has data
  const [showParentage, setShowParentage] = useState(false);

  const { data: animal, isLoading: loadingAnimal } = useGetAnimal(animalId, {
    query: { queryKey: getGetAnimalQueryKey(animalId), enabled: isEditing }
  });
  const { data: allAnimals } = useListAnimals(undefined, { query: { enabled: isAuthenticated } });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      tagNumber: "",
      species: "Cattle",
      breed: "",
      sex: "Heifer",
      dateOfBirth: "",
      expectedDueDate: "",
      sireId: null,
      damId: null,
      sireName: "",
      damName: "",
      locationId: null,
    }
  });

  const selectedSpecies = form.watch("species");
  const selectedSex = form.watch("sex");
  const sexOptions = SEX_OPTIONS[selectedSpecies] ?? SEX_OPTIONS.Other;
  const isFemale = FEMALE_SEXES.has(selectedSex);
  const showDueDate = isFemale && breedingStatus === "bred";

  // Guard: skip clearing parents when form.reset() fires during data load
  const skipParentReset = useRef(false);

  // When species changes, reset sex to first valid option and clear parent selections
  useEffect(() => {
    const currentSex = form.getValues("sex");
    const valid = (SEX_OPTIONS[selectedSpecies] ?? SEX_OPTIONS.Other).map(o => o.value);
    if (!valid.includes(currentSex)) {
      form.setValue("sex", valid[0]);
    }
    if (!skipParentReset.current) {
      form.setValue("sireId", null);
      form.setValue("sireName", "");
      form.setValue("damId", null);
      form.setValue("damName", "");
    }
    skipParentReset.current = false;
  }, [selectedSpecies, form]);

  // When sex changes to a non-female, reset breeding status and clear due date
  useEffect(() => {
    if (!FEMALE_SEXES.has(selectedSex)) {
      setBreedingStatus("unknown");
      form.setValue("expectedDueDate", "");
    }
  }, [selectedSex, form]);

  // When breeding status is no longer "bred", clear due date
  useEffect(() => {
    if (breedingStatus !== "bred") {
      form.setValue("expectedDueDate", "");
    }
  }, [breedingStatus, form]);

  useEffect(() => {
    if (animal && isEditing) {
      skipParentReset.current = true;
      form.reset({
        name: animal.name,
        tagNumber: animal.tagNumber || "",
        species: animal.species,
        breed: animal.breed || "",
        sex: animal.sex,
        dateOfBirth: animal.dateOfBirth ? animal.dateOfBirth.split('T')[0] : "",
        expectedDueDate: animal.expectedDueDate ? animal.expectedDueDate.split('T')[0] : "",
        sireId: animal.sireId ?? null,
        damId: animal.damId ?? null,
        sireName: (animal as any).sireName || "",
        damName: (animal as any).damName || "",
        locationId: animal.locationId ?? null,
      });
      // Infer breeding status from existing due date
      if (animal.expectedDueDate) setBreedingStatus("bred");
      // Auto-expand parentage if the animal already has data
      if (animal.sireId || animal.damId || (animal as any).sireName || (animal as any).damName) {
        setShowParentage(true);
      }
    }
  }, [animal, isEditing, form]);

  const createMutation = useCreateAnimal({
    mutation: {
      onSuccess: () => {
        toast({ title: "Animal added successfully" });
        queryClient.invalidateQueries({ queryKey: ["/api/animals"] });
        setLocation("/animals");
      }
    }
  });

  const updateMutation = useUpdateAnimal({
    mutation: {
      onSuccess: (data: Animal) => {
        toast({ title: "Animal updated successfully" });
        queryClient.invalidateQueries({ queryKey: ["/api/animals"] });
        queryClient.invalidateQueries({ queryKey: [`/api/animals/${animalId}`] });
        setLocation(`/animals/${data.id}`);
      }
    }
  });

  const onSubmit = (values: FormValues) => {
    // Guest mode: save to localStorage
    if (!isAuthenticated) {
      addGuestAnimal({
        name: values.name,
        tagNumber: values.tagNumber || null,
        species: values.species,
        breed: values.breed || null,
        sex: values.sex,
        dateOfBirth: values.dateOfBirth || null,
        expectedDueDate: showDueDate ? (values.expectedDueDate || null) : null,
        notes: null,
      });
      toast({ title: "Animal added", description: "Saved locally — sign up to keep it forever." });
      window.dispatchEvent(new CustomEvent("guest-save"));
      setLocation("/animals");
      return;
    }

    const payload = {
      ...values,
      tagNumber: values.tagNumber || null,
      breed: values.breed || null,
      dateOfBirth: values.dateOfBirth || null,
      expectedDueDate: showDueDate ? (values.expectedDueDate || null) : null,
      sireId: values.sireId ?? null,
      damId: values.damId ?? null,
      sireName: values.sireName || null,
      damName: values.damName || null,
      locationId: values.locationId ?? null,
    };

    if (isEditing) {
      updateMutation.mutate({ animalId, data: payload });
    } else {
      createMutation.mutate({ data: payload });
    }
  };

  if (isEditing && loadingAnimal) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse font-bold">Loading...</div>;
  }

  // Filter herd animals excluding this animal itself (when editing)
  const herdAnimals = (allAnimals ?? []).filter(a => !isEditing || a.id !== animalId);
  // Parent options: only same-species animals
  const sameSpeciesAnimals = herdAnimals.filter(a => a.species === selectedSpecies);

  const breedBtn = (val: typeof breedingStatus, label: string) => (
    <button
      type="button"
      onClick={() => setBreedingStatus(val)}
      className={`flex-1 h-9 px-3 rounded-lg text-xs font-semibold border transition-colors ${
        breedingStatus === val
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-muted border-border text-muted-foreground hover:bg-accent hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="max-w-lg mx-auto pb-20 space-y-6">

      {/* Header */}
      <div>
        <button
          onClick={() => window.history.back()}
          className="flex items-center text-sm font-bold text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </button>
        <h1 className="text-xl font-black text-foreground">{isEditing ? "Edit Animal" : "Add Animal"}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Fill in what you know — everything except name and species is optional.</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

        {/* ── Identity ── */}
        <div className="bg-card border-2 border-border rounded-2xl p-4 space-y-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Identity</p>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
              <Input id="name" {...form.register("name")} placeholder="e.g. Bessie" />
              {form.formState.errors.name && <p className="text-xs text-destructive font-semibold">{form.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tagNumber">Tag Number <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input id="tagNumber" {...form.register("tagNumber")} placeholder="e.g. 104" />
            </div>
          </div>
        </div>

        {/* ── Type ── */}
        <div className="bg-card border-2 border-border rounded-2xl p-4 space-y-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Animal Type</p>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="species">Species <span className="text-destructive">*</span></Label>
              <div className="relative">
                <select id="species" {...form.register("species")} className={selectClass}>
                  {["Cattle", "Goat", "Sheep", "Pig", "Horse", "Other"].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {chevron}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sex">Sex <span className="text-destructive">*</span></Label>
              <div className="relative">
                <select id="sex" {...form.register("sex")} className={selectClass}>
                  {sexOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                {chevron}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="breed">Breed <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input id="breed" {...form.register("breed")} placeholder="e.g. Angus, Hereford" />
            </div>
          </div>
        </div>

        {/* ── Details ── */}
        <div className="bg-card border-2 border-border rounded-2xl p-4 space-y-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Details</p>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="dateOfBirth">Date of Birth <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input id="dateOfBirth" type="date" {...form.register("dateOfBirth")} className="font-medium" />
            </div>
            {isFemale && (
              <div className="space-y-1.5">
                <Label>Breeding Status</Label>
                <div className="flex gap-2">
                  {breedBtn("unknown", "Unknown")}
                  {breedBtn("open", "Open")}
                  {breedBtn("bred", "Bred")}
                </div>
              </div>
            )}
            {showDueDate && (
              <div className="space-y-1.5">
                <Label htmlFor="expectedDueDate">Expected Due Date</Label>
                <Input id="expectedDueDate" type="date" {...form.register("expectedDueDate")} className="font-medium" />
              </div>
            )}
          </div>
        </div>

        {/* ── Location ── */}
        {isAuthenticated && (
          <div className="bg-card border-2 border-border rounded-2xl p-4 space-y-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Location <span className="normal-case font-normal text-muted-foreground/60">(optional)</span></p>
            <div className="space-y-1.5">
              <Label htmlFor="locationId">Pasture / Location</Label>
              <div className="relative">
                <select
                  id="locationId"
                  value={form.watch("locationId") ?? ""}
                  onChange={e => form.setValue("locationId", e.target.value ? parseInt(e.target.value, 10) : null)}
                  className={selectClass}
                >
                  <option value="">— No location —</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
                {chevron}
              </div>
              {locations.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No pastures yet. Add them in{" "}
                  <a href="/settings" className="underline text-primary font-semibold">Ranch Settings</a>.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Parentage ── */}
        <div className="bg-card border-2 border-border rounded-2xl p-4 space-y-4">
          {showParentage ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Parentage</p>
                <button
                  type="button"
                  onClick={() => {
                    setShowParentage(false);
                    form.setValue("sireId", null);
                    form.setValue("sireName", "");
                    form.setValue("damId", null);
                    form.setValue("damName", "");
                  }}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors font-semibold"
                >
                  Remove
                </button>
              </div>
              <div className="space-y-3">
                <ParentField
                  label="Sire (Father)"
                  animals={sameSpeciesAnimals}
                  idValue={form.watch("sireId")}
                  nameValue={form.watch("sireName")}
                  onIdChange={v => form.setValue("sireId", v)}
                  onNameChange={v => form.setValue("sireName", v)}
                />
                <ParentField
                  label="Dam (Mother)"
                  animals={sameSpeciesAnimals}
                  idValue={form.watch("damId")}
                  nameValue={form.watch("damName")}
                  onIdChange={v => form.setValue("damId", v)}
                  onNameChange={v => form.setValue("damName", v)}
                />
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setShowParentage(true)}
              className="w-full flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              <Users className="w-4 h-4" />
              Add parentage info
              <span className="text-xs font-normal opacity-60 ml-1">(optional)</span>
            </button>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" className="flex-1" onClick={() => window.history.back()}>Cancel</Button>
          <Button type="submit" className="flex-1" isLoading={createMutation.isPending || updateMutation.isPending}>
            {isEditing ? "Save Changes" : "Add Animal"}
          </Button>
        </div>

      </form>
    </div>
  );
}
