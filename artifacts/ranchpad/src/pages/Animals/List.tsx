import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, FileText } from "lucide-react";
import { useListAnimals, type Animal } from "@workspace/api-client-react";
import { formatAge } from "@/lib/utils";

function HealthDot({ severity }: { severity?: string | null }) {
  let colorClass = "bg-muted border-border/50";
  if (severity === "high") colorClass = "bg-destructive shadow-[0_0_8px_rgba(255,0,0,0.5)] border-transparent";
  else if (severity === "medium") colorClass = "bg-yellow-500 border-transparent";
  else if (severity === "low") colorClass = "bg-green-500 border-transparent";

  return <span className={`inline-block w-3 h-3 rounded-full border ${colorClass} shrink-0`} title={`Health Status: ${severity || 'Clear'}`} />;
}

export default function AnimalList() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("All");
  const [sexFilter, setSexFilter] = useState("All");
  const [breedFilter, setBreedFilter] = useState("All");

  // Query API with search param
  const { data: animals, isLoading } = useListAnimals({ search: search.length > 2 ? search : undefined });

  // Client-side filter
  const filteredAnimals = React.useMemo(() => {
    if (!animals) return [];
    let result = animals;
    
    if (search.length > 0 && search.length <= 2) {
      const lower = search.toLowerCase();
      result = result.filter((a: Animal) => 
        a.name.toLowerCase().includes(lower) || 
        (a.tagNumber && a.tagNumber.toLowerCase().includes(lower))
      );
    }

    if (speciesFilter !== "All") {
      result = result.filter((a: Animal) => a.species === speciesFilter);
    }
    if (sexFilter !== "All") {
      result = result.filter((a: Animal) => a.sex === sexFilter);
    }
    if (breedFilter !== "All") {
      result = result.filter((a: Animal) => a.breed === breedFilter);
    }
    return result;
  }, [animals, search, speciesFilter, sexFilter, breedFilter]);

  const uniqueSpecies: string[] = ["All", ...Array.from(new Set((animals || []).map((a: Animal) => a.species)))];
  const uniqueBreeds: string[] = ["All", ...Array.from(new Set((animals || []).map((a: Animal) => a.breed).filter(Boolean))).sort() as string[]];
  const hasActiveFilters = speciesFilter !== "All" || sexFilter !== "All" || breedFilter !== "All";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">Herd Directory</h1>
          <p className="text-muted-foreground font-medium mt-1">Manage all your animals in one place.</p>
        </div>
        <Link href="/animals/new" className="inline-flex items-center justify-center h-12 px-6 rounded-xl font-semibold bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:-translate-y-0.5 transition-transform w-full sm:w-auto">
          <Plus className="w-5 h-5 mr-2" />
          Add Animal
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-card border border-border p-3 rounded-2xl shadow-sm space-y-3">
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
              <option key={breed} value={breed}>{breed === "All" ? "Choose Breed" : breed}</option>
            ))}
          </select>
          <select
            value={sexFilter}
            onChange={e => setSexFilter(e.target.value)}
            className="h-12 px-4 rounded-xl border-none bg-muted/30 font-medium text-sm focus:outline-none focus:bg-background transition-colors w-full md:w-36"
          >
            <option value="All">Choose Sex</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Wether">Wether</option>
            <option value="Castrated">Castrated</option>
          </select>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar px-1">
          {uniqueSpecies.map(species => (
            <button
              key={species}
              onClick={() => setSpeciesFilter(species)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${
                speciesFilter === species 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {species}
            </button>
          ))}
          {hasActiveFilters && (
            <button
              onClick={() => { setSpeciesFilter("All"); setSexFilter("All"); setBreedFilter("All"); }}
              className="px-3 py-2 rounded-xl text-sm font-bold whitespace-nowrap bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-32 bg-card border border-border rounded-2xl animate-pulse" />)}
        </div>
      ) : filteredAnimals.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-3xl border border-border border-dashed">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold text-foreground">No animals found</h3>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            {search || hasActiveFilters
              ? "Try adjusting your search or filters to find what you're looking for." 
              : "Your herd is empty. Add your first animal to get started."}
          </p>
          {!search && !hasActiveFilters && (
            <Button className="mt-6" onClick={() => setLocation("/animals/new")}>Add First Animal</Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAnimals.map((animal: Animal) => (
            <Link key={animal.id} href={`/animals/${animal.id}`}>
              <Card className="hover:shadow-md hover:border-primary/50 transition-all duration-200 cursor-pointer group h-full">
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <HealthDot severity={animal.latestHealthSeverity} />
                      <div>
                        <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors leading-tight">
                          {animal.name}
                        </h3>
                        {animal.tagNumber && (
                          <span className="text-xs font-mono font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md mt-1 inline-block">
                            #{animal.tagNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-4 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="bg-secondary/50">{animal.species}</Badge>
                      <Badge variant="outline" className="border-border text-muted-foreground">{animal.sex}</Badge>
                      {animal.breed && (
                        <Badge variant="outline" className="border-border text-muted-foreground">{animal.breed}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground font-medium">
                      {animal.dateOfBirth && (
                        <span>DOB: {new Date(animal.dateOfBirth).toLocaleDateString()}</span>
                      )}
                      <span className="ml-auto">{formatAge(animal.dateOfBirth)}</span>
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
          ))}
        </div>
      )}
    </div>
  );
}
