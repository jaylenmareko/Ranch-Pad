import React, { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useCreateAnimal, useGetAnimal, useUpdateAnimal, getGetAnimalQueryKey, type Animal } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  tagNumber: z.string().nullable().optional(),
  species: z.string().min(1, "Species is required"),
  breed: z.string().nullable().optional(),
  sex: z.string().min(1, "Sex is required"),
  dateOfBirth: z.string().nullable().optional(),
  expectedDueDate: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

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


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      tagNumber: "",
      species: "Cattle",
      breed: "",
      sex: "Female",
      dateOfBirth: "",
      expectedDueDate: "",
    }
  });

  useEffect(() => {
    if (animal && isEditing) {
      form.reset({
        name: animal.name,
        tagNumber: animal.tagNumber || "",
        species: animal.species,
        breed: animal.breed || "",
        sex: animal.sex,
        dateOfBirth: animal.dateOfBirth ? animal.dateOfBirth.split('T')[0] : "",
        expectedDueDate: animal.expectedDueDate ? animal.expectedDueDate.split('T')[0] : "",
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
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
                  <select 
                    id="species"
                    {...form.register("species")}
                    className="flex h-12 w-full appearance-none rounded-xl border-2 border-border bg-background px-4 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 transition-all font-medium"
                  >
                    {["Cattle", "Goat", "Sheep", "Pig", "Horse", "Other"].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                    <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sex">Sex <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <select 
                    id="sex"
                    {...form.register("sex")}
                    className="flex h-12 w-full appearance-none rounded-xl border-2 border-border bg-background px-4 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 transition-all font-medium"
                  >
                    {["Female", "Male", "Wether", "Castrated"].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                    <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
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

              <div className="space-y-2">
                <Label htmlFor="expectedDueDate">Expected Due Date <span className="text-muted-foreground font-normal text-sm">(females only)</span></Label>
                <Input id="expectedDueDate" type="date" {...form.register("expectedDueDate")} className="font-medium" />
              </div>

            </div>

            <div className="pt-6 border-t border-border flex justify-end gap-3">
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
