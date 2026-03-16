import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation } from 'wouter';
import { useCreateAnimal, useUpdateAnimal, useGetAnimal, useListAnimals, getListAnimalsQueryKey, getGetAnimalQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Input, Select, Field, Card } from '@/components/ui';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

const animalSchema = z.object({
  name: z.string().min(1, "Name is required"),
  tagNumber: z.string().optional(),
  species: z.string().min(1, "Species is required"),
  breed: z.string().optional(),
  sex: z.string().min(1, "Sex is required"),
  dateOfBirth: z.string().optional(),
  damId: z.coerce.number().optional().nullable(),
  sireId: z.coerce.number().optional().nullable(),
});

type AnimalFormValues = z.infer<typeof animalSchema>;

export default function AnimalForm({ params }: { params?: { id?: string } }) {
  const isEdit = !!params?.id;
  const animalId = Number(params?.id);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Fetch lists for Dam/Sire dropdowns
  const { data: allAnimals = [] } = useListAnimals();
  const females = allAnimals.filter(a => a.sex === 'Female' && a.id !== animalId);
  const males = allAnimals.filter(a => ['Male', 'Wether', 'Castrated'].includes(a.sex) && a.id !== animalId);

  const { data: animalToEdit } = useGetAnimal(animalId, {
    query: { enabled: isEdit }
  });

  const form = useForm<AnimalFormValues>({
    resolver: zodResolver(animalSchema),
    defaultValues: {
      name: '', tagNumber: '', species: 'Cattle', breed: '', sex: 'Female', dateOfBirth: '', damId: null, sireId: null
    }
  });

  useEffect(() => {
    if (isEdit && animalToEdit) {
      form.reset({
        name: animalToEdit.name,
        tagNumber: animalToEdit.tagNumber || '',
        species: animalToEdit.species,
        breed: animalToEdit.breed || '',
        sex: animalToEdit.sex,
        dateOfBirth: animalToEdit.dateOfBirth ? animalToEdit.dateOfBirth.split('T')[0] : '',
        damId: animalToEdit.damId,
        sireId: animalToEdit.sireId,
      });
    }
  }, [animalToEdit, isEdit, form]);

  const { mutate: create, isPending: isCreating } = useCreateAnimal({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAnimalsQueryKey() });
        setLocation('/animals');
      }
    }
  });

  const { mutate: update, isPending: isUpdating } = useUpdateAnimal({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAnimalsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAnimalQueryKey(animalId) });
        setLocation(`/animals/${animalId}`);
      }
    }
  });

  const onSubmit = (data: AnimalFormValues) => {
    const payload = {
      ...data,
      tagNumber: data.tagNumber || null,
      breed: data.breed || null,
      dateOfBirth: data.dateOfBirth || null,
      damId: data.damId || null,
      sireId: data.sireId || null,
    };
    if (isEdit) {
      update({ animalId, data: payload });
    } else {
      create({ data: payload });
    }
  };

  const isPending = isCreating || isUpdating;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="-ml-2">
          <Link href={isEdit ? `/animals/${animalId}` : '/animals'}>
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <h1 className="text-3xl font-display font-bold">{isEdit ? 'Edit Animal' : 'Add New Animal'}</h1>
      </div>

      <Card className="p-6 md:p-8">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          <div className="space-y-5">
            <h3 className="text-lg font-bold border-b pb-2">Basic Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Name / Identifier *" error={form.formState.errors.name}>
                <Input placeholder="e.g. Bessie or 001" {...form.register('name')} />
              </Field>
              <Field label="Tag Number" error={form.formState.errors.tagNumber}>
                <Input placeholder="Ear tag number" {...form.register('tagNumber')} />
              </Field>
              
              <Field label="Species *" error={form.formState.errors.species}>
                <Select {...form.register('species')}>
                  <option value="Cattle">Cattle</option>
                  <option value="Goat">Goat</option>
                  <option value="Sheep">Sheep</option>
                  <option value="Pig">Pig</option>
                  <option value="Horse">Horse</option>
                  <option value="Other">Other</option>
                </Select>
              </Field>
              
              <Field label="Sex *" error={form.formState.errors.sex}>
                <Select {...form.register('sex')}>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Wether">Wether</option>
                  <option value="Castrated">Castrated</option>
                </Select>
              </Field>

              <Field label="Breed" error={form.formState.errors.breed}>
                <Input placeholder="e.g. Angus" {...form.register('breed')} />
              </Field>

              <Field label="Date of Birth" error={form.formState.errors.dateOfBirth}>
                <Input type="date" {...form.register('dateOfBirth')} />
              </Field>
            </div>
          </div>

          <div className="space-y-5">
            <h3 className="text-lg font-bold border-b pb-2">Lineage</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Dam (Mother)" error={form.formState.errors.damId}>
                <Select {...form.register('damId')}>
                  <option value="">Unknown</option>
                  {females.map(f => (
                    <option key={f.id} value={f.id}>{f.name} {f.tagNumber ? `(#${f.tagNumber})` : ''}</option>
                  ))}
                </Select>
              </Field>
              
              <Field label="Sire (Father)" error={form.formState.errors.sireId}>
                <Select {...form.register('sireId')}>
                  <option value="">Unknown</option>
                  {males.map(m => (
                    <option key={m.id} value={m.id}>{m.name} {m.tagNumber ? `(#${m.tagNumber})` : ''}</option>
                  ))}
                </Select>
              </Field>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" asChild>
              <Link href={isEdit ? `/animals/${animalId}` : '/animals'}>Cancel</Link>
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Animal'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
