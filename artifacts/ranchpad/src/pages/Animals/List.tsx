import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, FileText, ChevronDown, ChevronRight } from "lucide-react";
import { useListAnimals, type Animal } from "@workspace/api-client-react";
import { formatAge } from "@/lib/utils";

const SPECIES_ICONS: Record<string, string> = {
  Cattle: "🐄",
  Sheep: "🐑",
  Goat: "🐐",
  Goats: "🐐",
  Pig: "🐷",
  Pigs: "🐷",
  Horse: "🐴",
  Horses: "🐴",
  Chicken: "🐔",
  Chickens: "🐔",
  Duck: "🦆",
  Ducks: "🦆",
  Turkey: "🦃",
  Turkeys: "🦃",
  Llama: "🦙",
  Llamas: "🦙",
  Alpaca: "🦙",
  Alpacas: "🦙",
  Rabbit: "🐰",
  Rabbits: "🐰",
};

function speciesIcon(species: string): string {
  return SPECIES_ICONS[species] ?? "🐾";
}

function HealthDot({ severity }: { severity?: string | null }) {
  let colorClass = "bg-muted border-border/50";
  if (severity === "high") colorClass = "bg-destructive shadow-[0_0_8px_rgba(255,0,0,0.5)] border-transparent";
  else if (severity === "medium") colorClass = "bg-yellow-500 border-transparent";
  else if (severity === "low") colorClass = "bg-green-500 border-transparent";
  return <span className={`inline-block w-2.5 h-2.5 rounded-full border ${colorClass} shrink-0`} title={`Health: ${severity || "Clear"}`} />;
}

function AnimalCard({ animal }: { animal: Animal }) {
  return (
    <Link href={`/animals/${animal.id}`}>
      <Card className="hover:shadow-md hover:border-primary/40 transition-all duration-200 cursor-pointer group h-full">
        <CardContent className="p-4 flex flex-col h-full">
          <div className="flex items-start gap-2.5 mb-3">
            <HealthDot severity={animal.latestHealthSeverity} />
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors leading-tight truncate">
                {animal.name}
              </h3>
              {animal.tagNumber && (
                <span className="text-xs font-mono font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded mt-0.5 inline-block">
                  #{animal.tagNumber}
                </span>
              )}
            </div>
          </div>
          <div className="mt-auto space-y-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="outline" className="border-border text-muted-foreground text-xs py-0">{animal.sex}</Badge>
              {animal.breed && (
                <Badge variant="outline" className="border-border text-muted-foreground text-xs py-0">{animal.breed}</Badge>
              )}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              {animal.dateOfBirth ? (
                <span>{new Date(animal.dateOfBirth).toLocaleDateString()}</span>
              ) : <span />}
              <span>{formatAge(animal.dateOfBirth)}</span>
            </div>
            {animal.sex === "Female" && animal.expectedDueDate && (
              <p className="text-xs font-semibold text-pink-600 dark:text-pink-400">
                Due: {new Date(animal.expectedDueDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function SpeciesFolder({
  species,
  animals,
  defaultOpen = true,
}: {
  species: string;
  animals: Animal[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const highCount = animals.filter(a => a.latestHealthSeverity === "high").length;
  const medCount = animals.filter(a => a.latestHealthSeverity === "medium").length;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Folder header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-3.5 bg-muted/40 hover:bg-muted/70 transition-colors border-b border-border/50"
      >
        <span className="text-2xl leading-none">{speciesIcon(species)}</span>
        <span className="font-black text-lg text-foreground font-display flex-1 text-left">{species}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
            {animals.length} {animals.length === 1 ? "animal" : "animals"}
          </span>
          {highCount > 0 && (
            <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
              {highCount} urgent
            </span>
          )}
          {medCount > 0 && highCount === 0 && (
            <span className="text-xs font-bold text-yellow-600 bg-yellow-500/10 px-2 py-0.5 rounded-full">
              {medCount} watch
            </span>
          )}
          {open
            ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
            : <ChevronRight className="w-4 h-4 text-muted-foreground" />
          }
        </div>
      </button>

      {/* Animals grid */}
      {open && (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {animals.map(animal => (
            <AnimalCard key={animal.id} animal={animal} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AnimalList() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [sexFilter, setSexFilter] = useState("All");
  const [breedFilter, setBreedFilter] = useState("All");

  const { data: animals, isLoading } = useListAnimals({ search: search.length > 2 ? search : undefined });

  const filteredAnimals = React.useMemo(() => {
    if (!animals) return [];
    let result = animals as Animal[];

    if (search.length > 0 && search.length <= 2) {
      const lower = search.toLowerCase();
      result = result.filter(a =>
        a.name.toLowerCase().includes(lower) ||
        (a.tagNumber && a.tagNumber.toLowerCase().includes(lower))
      );
    }
    if (sexFilter !== "All") result = result.filter(a => a.sex === sexFilter);
    if (breedFilter !== "All") result = result.filter(a => a.breed === breedFilter);

    return result;
  }, [animals, search, sexFilter, breedFilter]);

  const uniqueBreeds: string[] = ["All", ...Array.from(new Set((animals || []).map((a: Animal) => a.breed).filter(Boolean))).sort() as string[]];
  const hasActiveFilters = sexFilter !== "All" || breedFilter !== "All";

  const grouped = React.useMemo(() => {
    const map: Record<string, Animal[]> = {};
    for (const animal of filteredAnimals) {
      if (!map[animal.species]) map[animal.species] = [];
      map[animal.species].push(animal);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredAnimals]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">Herd Directory</h1>
          <p className="text-muted-foreground font-medium mt-1">
            {isLoading ? "Loading…" : `${(animals || []).length} animals across ${grouped.length} ${grouped.length === 1 ? "group" : "groups"}`}
          </p>
        </div>
        <Link href="/animals/new" className="inline-flex items-center justify-center h-12 px-6 rounded-xl font-semibold bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:-translate-y-0.5 transition-transform w-full sm:w-auto">
          <Plus className="w-5 h-5 mr-2" />
          Add Animal
        </Link>
      </div>

      {/* Filter bar */}
      <div className="bg-card border border-border p-3 rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by name or tag..."
              className="pl-12 border-none bg-muted/30 focus-visible:bg-background"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            value={breedFilter}
            onChange={e => setBreedFilter(e.target.value)}
            className="h-12 px-4 rounded-xl border-none bg-muted/30 font-medium text-sm focus:outline-none focus:bg-background transition-colors w-full md:w-48"
          >
            {uniqueBreeds.map(breed => (
              <option key={breed} value={breed}>{breed === "All" ? "All Breeds" : breed}</option>
            ))}
          </select>
          <select
            value={sexFilter}
            onChange={e => setSexFilter(e.target.value)}
            className="h-12 px-4 rounded-xl border-none bg-muted/30 font-medium text-sm focus:outline-none focus:bg-background transition-colors w-full md:w-36"
          >
            <option value="All">All Sexes</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Wether">Wether</option>
            <option value="Castrated">Castrated</option>
          </select>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={() => { setSexFilter("All"); setBreedFilter("All"); }} className="shrink-0 text-destructive hover:text-destructive">
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="h-14 bg-muted/40 animate-pulse" />
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[1, 2, 3].map(j => <div key={j} className="h-28 bg-muted rounded-xl animate-pulse" />)}
              </div>
            </div>
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-3xl border border-border border-dashed">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold text-foreground">No animals found</h3>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            {search || hasActiveFilters
              ? "Try adjusting your search or filters."
              : "Your herd is empty. Add your first animal to get started."}
          </p>
          {!search && !hasActiveFilters && (
            <Button className="mt-6" onClick={() => setLocation("/animals/new")}>Add First Animal</Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([species, speciesAnimals]) => (
            <SpeciesFolder
              key={species}
              species={species}
              animals={speciesAnimals}
              defaultOpen
            />
          ))}
        </div>
      )}
    </div>
  );
}
