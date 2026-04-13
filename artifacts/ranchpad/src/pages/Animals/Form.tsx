import React, { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input, Label } from "@/components/ui/input";
import { ArrowLeft, Users, Search, X, Check, Loader2 } from "lucide-react";
import "./Form.css";
import { useCreateAnimal, useGetAnimal, useUpdateAnimal, useListAnimals, getGetAnimalQueryKey, type Animal } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

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
  name: z.string().nullable().optional(),
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

  return (
    <div className="form-field">
      <label className="form-label">{label}</label>

      <div className="form-parent-modes">
        <button type="button" onClick={() => selectMode("unknown")} className={`form-parent-mode-btn${mode === "unknown" ? " active" : ""}`}>Unknown</button>
        <button type="button" onClick={() => selectMode("manual")} className={`form-parent-mode-btn${mode === "manual" ? " active" : ""}`}>Enter Name</button>
        <button type="button" onClick={() => selectMode("herd")} className={`form-parent-mode-btn${mode === "herd" ? " active" : ""}`}>From Herd</button>
      </div>

      {mode === "manual" && (
        <input
          className="form-input"
          placeholder={`Enter ${label.toLowerCase()} name`}
          value={nameValue || ""}
          onChange={e => onNameChange(e.target.value)}
        />
      )}

      {mode === "herd" && (
        <div className="form-herd-browser">
          {selectedAnimal ? (
            <div className="form-herd-selected">
              <Check size={15} color="#2D6A4F" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="form-herd-name">{selectedAnimal.name}</div>
                {selectedAnimal.tagNumber && <div className="form-herd-tag">#{selectedAnimal.tagNumber}</div>}
              </div>
              <button type="button" className="form-herd-clear" onClick={() => { onIdChange(null); setSearch(""); }}>
                <X size={15} />
              </button>
            </div>
          ) : (
            <>
              <div className="form-herd-search-row">
                <Search size={14} color="#8FA393" style={{ flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Search by name or tag…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="form-herd-search"
                />
              </div>
              <ul className="form-herd-list">
                {filtered.length === 0 ? (
                  <li className="form-herd-empty">
                    {animals.length === 0 ? "No other animals in herd yet." : "No matches found."}
                  </li>
                ) : (
                  filtered.map(a => (
                    <li key={a.id}>
                      <button type="button" className="form-herd-item" onClick={() => { onIdChange(a.id); setSearch(""); }}>
                        <span className="form-herd-name">{a.name}</span>
                        {a.tagNumber && <span className="form-herd-tag">#{a.tagNumber}</span>}
                        {a.breed && <span className="form-herd-breed">{a.breed}</span>}
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
        <p className="form-parent-unknown-hint">Not recorded — parentage will be left blank.</p>
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
    return <div className="animal-form-loading">Loading…</div>;
  }

  // Filter herd animals excluding this animal itself (when editing)
  const herdAnimals = (allAnimals ?? []).filter(a => !isEditing || a.id !== animalId);
  // Parent options: only same-species animals
  const sameSpeciesAnimals = herdAnimals.filter(a => a.species === selectedSpecies);

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="animal-form-page">

      <div className="animal-form-header">
        <button className="animal-form-back" onClick={() => window.history.back()} aria-label="Back">
          <ArrowLeft size={17} />
        </button>
        <span className="animal-form-title">{isEditing ? "Edit Animal" : "Add Animal"}</span>
      </div>

      <div className="animal-form-body">
        <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: "contents" }}>

          {/* ── Identity ── */}
          <div className="form-section">
            <div className="form-section-label">Identity</div>
            <div className="form-section-inner">
              <div className="form-field">
                <label className="form-label" htmlFor="tagNumber">Tag Number</label>
                <input id="tagNumber" className="form-input" {...form.register("tagNumber")} placeholder="e.g. 104" />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="name">Name <span className="form-label-opt">(optional)</span></label>
                <input id="name" className="form-input" {...form.register("name")} placeholder="e.g. Bessie" />
              </div>
            </div>
          </div>

          {/* ── Animal Type ── */}
          <div className="form-section">
            <div className="form-section-label">Animal Type</div>
            <div className="form-section-inner">
              <div className="form-field">
                <label className="form-label" htmlFor="species">Species <span className="form-label-req">*</span></label>
                <div className="form-select-wrap">
                  <select id="species" className="form-select" {...form.register("species")}>
                    {["Cattle", "Goat", "Sheep", "Pig", "Horse", "Other"].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <svg className="form-select-chevron" width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="sex">Sex <span className="form-label-req">*</span></label>
                <div className="form-select-wrap">
                  <select id="sex" className="form-select" {...form.register("sex")}>
                    {sexOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <svg className="form-select-chevron" width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="breed">Breed <span className="form-label-opt">(optional)</span></label>
                <input id="breed" className="form-input" {...form.register("breed")} placeholder="e.g. Angus, Hereford" />
              </div>
            </div>
          </div>

          {/* ── Details ── */}
          <div className="form-section">
            <div className="form-section-label">Details</div>
            <div className="form-section-inner">
              <div className="form-field">
                <label className="form-label" htmlFor="dateOfBirth">Date of Birth <span className="form-label-opt">(optional)</span></label>
                <input id="dateOfBirth" type="date" className="form-input" {...form.register("dateOfBirth")} />
              </div>
              {isFemale && (
                <div className="form-field">
                  <label className="form-label">Breeding Status</label>
                  <div className="form-toggle-group">
                    {(["unknown", "open", "bred"] as const).map(val => (
                      <button key={val} type="button" onClick={() => setBreedingStatus(val)}
                        className={`form-toggle-btn${breedingStatus === val ? " active" : ""}`}>
                        {val.charAt(0).toUpperCase() + val.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {showDueDate && (
                <div className="form-field">
                  <label className="form-label" htmlFor="expectedDueDate">Expected Due Date</label>
                  <input id="expectedDueDate" type="date" className="form-input" {...form.register("expectedDueDate")} />
                </div>
              )}
            </div>
          </div>

          {/* ── Location ── */}
          {isAuthenticated && (
            <div className="form-section">
              <div className="form-section-label">Location <span style={{ fontWeight: 400, textTransform: "none", color: "#A8BAB2", fontSize: 10 }}>(optional)</span></div>
              <div className="form-section-inner">
                <div className="form-field">
                  <label className="form-label" htmlFor="locationId">Pasture / Location</label>
                  <div className="form-select-wrap">
                    <select
                      id="locationId"
                      className="form-select"
                      value={form.watch("locationId") ?? ""}
                      onChange={e => form.setValue("locationId", e.target.value ? parseInt(e.target.value, 10) : null)}
                    >
                      <option value="">— No location —</option>
                      {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                    </select>
                    <svg className="form-select-chevron" width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {locations.length === 0 && (
                    <p className="form-no-pastures">
                      No pastures yet. Add them in <a href="/settings">Ranch Settings</a>.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Parentage ── */}
          <div className="form-section">
            {showParentage ? (
              <>
                <div className="form-section-header">
                  <span className="form-section-label" style={{ padding: 0 }}>Parentage</span>
                  <button
                    type="button"
                    className="form-section-remove"
                    onClick={() => {
                      setShowParentage(false);
                      form.setValue("sireId", null);
                      form.setValue("sireName", "");
                      form.setValue("damId", null);
                      form.setValue("damName", "");
                    }}
                  >
                    Remove
                  </button>
                </div>
                <div className="form-section-inner">
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
              <button type="button" className="form-parentage-trigger" onClick={() => setShowParentage(true)}>
                <Users size={15} />
                Add parentage info
                <span className="form-parentage-opt">(optional)</span>
              </button>
            )}
          </div>

          {/* ── Actions ── */}
          <div className="form-actions">
            <button type="button" className="form-btn-cancel" onClick={() => window.history.back()}>Cancel</button>
            <button type="submit" className="form-btn-submit" disabled={isPending}>
              {isPending && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
              {isEditing ? "Save Changes" : "Add Animal"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
