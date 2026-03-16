import { useState } from 'react';
import { Link } from 'wouter';
import { useListAnimals } from '@workspace/api-client-react';
import { differenceInMonths, differenceInYears, parseISO } from 'date-fns';
import { Button, Input, Select, Card } from '@/components/ui';
import { Plus, Search, FilterX } from 'lucide-react';
import { cn } from '@/lib/utils';

export function formatAge(dob?: string | null) {
  if (!dob) return "Unknown age";
  const birth = parseISO(dob);
  const years = differenceInYears(new Date(), birth);
  const months = differenceInMonths(new Date(), birth) % 12;
  if (years === 0) return `${months} mo`;
  if (months === 0) return `${years} yr`;
  return `${years} yr ${months} mo`;
}

export function HealthDot({ severity }: { severity?: string | null }) {
  const colors = {
    high: "bg-destructive shadow-[0_0_6px_rgba(220,38,38,0.6)]",
    medium: "bg-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.6)]",
    low: "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]",
  };
  const bg = severity ? colors[severity as keyof typeof colors] || "bg-muted-foreground" : "bg-muted-foreground";
  return <div className={cn("w-3 h-3 rounded-full border border-white/50 shrink-0", bg)} title={`Health: ${severity || 'normal'}`} />;
}

export default function Animals() {
  const [search, setSearch] = useState("");
  const [species, setSpecies] = useState("");
  const [sex, setSex] = useState("");

  const { data: animals = [], isLoading } = useListAnimals({
    search: search || undefined,
    species: species || undefined,
    sex: sex || undefined
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl md:text-4xl font-display font-bold">Herd Registry</h1>
        <Button asChild>
          <Link href="/animals/new" className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Animal
          </Link>
        </Button>
      </div>

      <Card className="p-4 md:p-6 bg-card/50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input 
              placeholder="Search by name or tag..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="pl-10"
            />
          </div>
          <Select value={species} onChange={(e) => setSpecies(e.target.value)}>
            <option value="">All Species</option>
            <option value="Cattle">Cattle</option>
            <option value="Goat">Goat</option>
            <option value="Sheep">Sheep</option>
            <option value="Pig">Pig</option>
            <option value="Horse">Horse</option>
            <option value="Other">Other</option>
          </Select>
          <Select value={sex} onChange={(e) => setSex(e.target.value)}>
            <option value="">All Sexes</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Wether">Wether</option>
            <option value="Castrated">Castrated</option>
          </Select>
        </div>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-secondary/50 rounded-2xl animate-pulse" />)}
        </div>
      ) : animals.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-border">
          <FilterX className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-bold">No animals found</h3>
          <p className="text-muted-foreground mt-1">Try adjusting your filters or add a new animal.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {animals.map((animal) => (
            <Link key={animal.id} href={`/animals/${animal.id}`}>
              <Card className="hover:border-primary/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer h-full border-border/80">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{animal.name}</h3>
                      <p className="text-sm font-medium text-muted-foreground">{animal.tagNumber || 'No Tag'}</p>
                    </div>
                    <HealthDot severity={animal.latestHealthSeverity} />
                  </div>
                  <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">Species</p>
                      <p className="font-semibold">{animal.species}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">Sex</p>
                      <p className="font-semibold">{animal.sex}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">Age / Breed</p>
                      <p className="font-semibold">{formatAge(animal.dateOfBirth)} • {animal.breed || 'Mixed'}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
