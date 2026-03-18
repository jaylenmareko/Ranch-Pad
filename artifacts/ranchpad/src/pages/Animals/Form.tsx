import React, { useEffect, useCallback, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users } from "lucide-react";
import { useCreateAnimal, useGetAnimal, useUpdateAnimal, useListAnimals, getGetAnimalQueryKey, type Animal } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

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

// ─── Form schema ──────────────────────────────────────────────────────────────
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  tagNumber: z.string().nullable().optional(),
  species: z.string().min(1, "Species is required"),
  breed: z.string().nullable().optional(),
  sex: z.string().min(1, "Sex is required"),
  dateOfBirth: z.string().nullable().optional(),
  expectedDueDate: z.string().nullable().optional(),
  // Parents — pick from herd
  sireId: z.number().nullable().optional(),
  damId: z.number().nullable().optional(),
  // Parents — custom text (when not in herd)
  sireName: z.string().nullable().optional(),
  damName: z.string().nullable().optional(),
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
function ParentField({
  label,
  idField,
  nameField,
  animals,
  idValue,
  nameValue,
  onIdChange,
  onNameChange,
}: {
  label: string;
  idField: string;
  nameField: string;
  animals: Animal[];
  idValue: number | null | undefined;
  nameValue: string | null | undefined;
  onIdChange: (v: number | null) => void;
  onNameChange: (v: string) => void;
}) {
  const mode = idValue != null ? "herd" : nameValue ? "custom" : "none";

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <select
          value={mode === "herd" ? String(idValue) : mode === "custom" ? "custom" : ""}
          onChange={e => {
            const v = e.target.value;
            if (v === "") { onIdChange(null); onNameChange(""); }
            else if (v === "custom") { onIdChange(null); onNameChange(nameValue || ""); }
            else { onIdChange(parseInt(v, 10)); onNameChange(""); }
          }}
          className={selectClass}
        >
          <option value="">Unknown / Not recorded</option>
          <option value="custom">Enter name manually…</option>
          {animals.map(a => (
            <option key={a.id} value={String(a.id)}>
              {a.name}{a.tagNumber ? ` (#${a.tagNumber})` : ""}
            </option>
          ))}
        </select>
        {chevron}
      </div>
      {mode === "custom" && (
        <Input
          placeholder={`Enter ${label.toLowerCase()} name`}
          value={nameValue || ""}
          onChange={e => onNameChange(e.target.value)}
        />
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

  const { data: animal, isLoading: loadingAnimal } = useGetAnimal(animalId, {
    query: { queryKey: getGetAnimalQueryKey(animalId), enabled: isEditing }
  });
  const { data: allAnimals } = useListAnimals();

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
    }
  });

  const selectedSpecies = form.watch("species");
  const sexOptions = SEX_OPTIONS[selectedSpecies] ?? SEX_OPTIONS.Other;

  // Guard: skip clearing parents when form.reset() fires during data load
  const skipParentReset = useRef(false);

  // When species changes, reset sex to first valid option and clear parent selections
  // (a sire/dam from a different species is no longer a valid option)
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
      });
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
      expectedDueDate: values.expectedDueDate || null,
      sireId: values.sireId ?? null,
      damId: values.damId ?? null,
      sireName: values.sireName || null,
      damName: values.damName || null,
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => window.history.back()}
        className="flex items-center text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </button>

      <div>
        <h1 className="text-3xl font-black text-foreground">{isEditing ? "Edit Animal Profile" : "Add New Animal"}</h1>
        <p className="text-muted-foreground mt-1 font-medium">Record basic information about this animal.</p>
      </div>

      <Card className="border-border shadow-xl shadow-black/5">
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

            {/* ── Basic Info ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Animal Name <span className="text-destructive">*</span></Label>
                <Input id="name" {...form.register("name")} placeholder="e.g. Bessie" />
                {form.formState.errors.name && <p className="text-sm text-destructive font-semibold">{form.formState.errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tagNumber">Tag Number</Label>
                <Input id="tagNumber" {...form.register("tagNumber")} placeholder="e.g. 104" />
              </div>

              <div className="space-y-2">
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

              <div className="space-y-2">
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

              <div className="space-y-2">
                <Label htmlFor="breed">Breed</Label>
                <Input id="breed" {...form.register("breed")} placeholder="e.g. Angus" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input id="dateOfBirth" type="date" {...form.register("dateOfBirth")} className="font-medium" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="expectedDueDate">Expected Due Date <span className="text-muted-foreground font-normal text-sm">(females only)</span></Label>
                <Input id="expectedDueDate" type="date" {...form.register("expectedDueDate")} className="font-medium" />
              </div>
            </div>

            {/* ── Parentage ── */}
            <div className="pt-2 border-t border-border/60 space-y-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Parentage</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ParentField
                  label="Sire (Father)"
                  idField="sireId"
                  nameField="sireName"
                  animals={sameSpeciesAnimals}
                  idValue={form.watch("sireId")}
                  nameValue={form.watch("sireName")}
                  onIdChange={v => form.setValue("sireId", v)}
                  onNameChange={v => form.setValue("sireName", v)}
                />
                <ParentField
                  label="Dam (Mother)"
                  idField="damId"
                  nameField="damName"
                  animals={sameSpeciesAnimals}
                  idValue={form.watch("damId")}
                  nameValue={form.watch("damName")}
                  onIdChange={v => form.setValue("damId", v)}
                  onNameChange={v => form.setValue("damName", v)}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-border flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancel</Button>
              <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
                {isEditing ? "Save Changes" : "Add Animal"}
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}
