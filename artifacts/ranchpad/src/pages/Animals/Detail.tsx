import React, { useState } from "react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Input, Label, Textarea } from "@/components/ui/input";
import { ArrowLeft, Edit2, Activity, Pill, FileText, AlertTriangle, Trash2, Plus } from "lucide-react";
import { 
  useGetAnimal, useDeleteAnimal, 
  useListMedications, useCreateMedication, useDeleteMedication,
  useListHealthEvents, useCreateHealthEvent, useDeleteHealthEvent,
  useListFamachaScores, useCreateFamachaScore, useDeleteFamachaScore,
  useListFieldNotes, useCreateFieldNote, useDeleteFieldNote,
  type AnimalDetail, type AnimalRef, type HealthEvent, type MedicationRecord, type FamachaScore, type FieldNote
} from "@workspace/api-client-react";
import { formatAge } from "./List";
import { formatDate } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

export default function AnimalDetail() {
  const params = useParams();
  const animalId = parseInt(params.id || "0", 10);
  const [activeTab, setActiveTab] = useState<"health" | "meds" | "famacha" | "notes" | "lineage">("health");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: animal, isLoading } = useGetAnimal(animalId);
  const deleteMutation = useDeleteAnimal({
    mutation: {
      onSuccess: () => {
        toast({ title: "Animal deleted" });
        window.location.href = "/animals";
      }
    }
  });

  if (isLoading) {
    return <div className="p-12 text-center text-muted-foreground animate-pulse font-bold">Loading profile...</div>;
  }

  if (!animal) {
    return <div className="p-12 text-center text-muted-foreground font-bold text-xl">Animal not found</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link href="/animals" className="flex items-center text-sm font-bold text-muted-foreground hover:text-foreground transition-colors self-start">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Herd
        </Link>
        <div className="flex items-center gap-3">
          <Link href={`/animals/${animal.id}/edit`}>
            <Button variant="outline" size="sm" className="bg-card"><Edit2 className="w-4 h-4 mr-2" /> Edit Profile</Button>
          </Link>
          <Button variant="destructive" size="sm" onClick={() => {
            if(confirm("Are you sure you want to delete this animal? All history will be lost.")) {
              deleteMutation.mutate({ animalId });
            }
          }}><Trash2 className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Header Card */}
      <Card className="border-none shadow-xl shadow-black/5 bg-gradient-to-br from-card to-card/50 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <CardContent className="p-6 sm:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center relative z-10">
          <div className="w-24 h-24 rounded-3xl bg-secondary flex items-center justify-center border-4 border-background shadow-md shrink-0">
            <span className="text-4xl font-display font-black text-secondary-foreground opacity-50">{animal.species[0]}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-3xl sm:text-4xl font-black font-display text-foreground leading-none">{animal.name}</h1>
              {animal.tagNumber && (
                <Badge variant="outline" className="text-sm border-border bg-background shadow-sm px-3 py-1">#{animal.tagNumber}</Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-muted-foreground">
              <span className="flex items-center gap-1.5"><Badge className="bg-primary/10 text-primary hover:bg-primary/20">{animal.species}</Badge></span>
              <span className="flex items-center gap-1.5">{animal.breed || 'Unknown Breed'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-border" />
              <span>{animal.sex}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-border" />
              <span>{formatAge(animal.dateOfBirth)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex overflow-x-auto hide-scrollbar border-b border-border/60 pb-px gap-2 sm:gap-6">
        {[
          { id: "health", label: "Health Events", icon: Activity },
          { id: "meds", label: "Medications", icon: Pill },
          { id: "famacha", label: "FAMACHA", icon: AlertTriangle },
          { id: "notes", label: "Field Notes", icon: FileText },
          { id: "lineage", label: "Lineage & Offspring", icon: null },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as "health" | "meds" | "famacha" | "notes" | "lineage")}
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

      {/* Tab Content */}
      <div className="animate-in fade-in duration-300 min-h-[400px]">
        {activeTab === "health" && <HealthTab animalId={animalId} />}
        {activeTab === "meds" && <MedsTab animalId={animalId} />}
        {activeTab === "famacha" && <FamachaTab animalId={animalId} />}
        {activeTab === "notes" && <NotesTab animalId={animalId} />}
        {activeTab === "lineage" && <LineageTab animal={animal} />}
      </div>
    </div>
  );
}

// Sub-components for Tabs

function HealthTab({ animalId }: { animalId: number }) {
  const { data: events, isLoading } = useListHealthEvents(animalId);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState("");
  const [sev, setSev] = useState<"low"|"medium"|"high">("low");

  const createMutation = useCreateHealthEvent({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/api/animals/${animalId}/health-events`] });
        queryClient.invalidateQueries({ queryKey: [`/api/animals/${animalId}`] });
        setIsAddOpen(false);
        setDesc("");
        toast({ title: "Event recorded" });
      }
    }
  });

  const deleteMutation = useDeleteHealthEvent({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/animals/${animalId}/health-events`] }) }
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-display font-bold text-xl">Health History</h3>
        <Button size="sm" onClick={() => setIsAddOpen(true)}><Plus className="w-4 h-4 mr-1"/> Log Event</Button>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen} title="Log Health Event">
        <form onSubmit={e => { e.preventDefault(); createMutation.mutate({ animalId, data: { description: desc, eventDate: date, severity: sev } }); }} className="space-y-4">
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
          <Button type="submit" className="w-full" isLoading={createMutation.isPending}>Save Event</Button>
        </form>
      </Dialog>

      {isLoading ? <div className="animate-pulse bg-card h-32 rounded-xl" /> : 
       events?.length === 0 ? <p className="text-muted-foreground p-8 text-center bg-card rounded-xl border border-dashed">No health events recorded.</p> : (
        <div className="grid gap-3">
          {events?.sort((a: HealthEvent, b: HealthEvent) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()).map((ev: HealthEvent) => (
            <Card key={ev.id} className="border-l-4 overflow-hidden shadow-sm" style={{ borderLeftColor: ev.severity === 'high' ? 'var(--color-destructive)' : ev.severity === 'medium' ? '#eab308' : '#22c55e' }}>
              <CardContent className="p-4 flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-foreground">{formatDate(ev.eventDate)}</span>
                    <Badge variant="outline" className="text-[10px] py-0">{ev.severity.toUpperCase()}</Badge>
                  </div>
                  <p className="text-foreground">{ev.description}</p>
                </div>
                <button onClick={() => { if(confirm("Delete this event?")) deleteMutation.mutate({ animalId, healthEventId: ev.id }) }} className="text-muted-foreground hover:text-destructive p-2">
                  <Trash2 className="w-4 h-4" />
                </button>
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
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  // form state
  const [name, setName] = useState("");
  const [dose, setDosage] = useState("");
  const [date, setDate] = useState("");
  const [nextDate, setNextDate] = useState("");

  const createMutation = useCreateMedication({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/api/animals/${animalId}/medications`] });
        setIsAddOpen(false);
        setName(""); setDosage(""); setDate(""); setNextDate("");
        toast({ title: "Medication recorded" });
      }
    }
  });

  const deleteMutation = useDeleteMedication({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/animals/${animalId}/medications`] }) }
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-display font-bold text-xl">Medication Records</h3>
        <Button size="sm" onClick={() => setIsAddOpen(true)}><Plus className="w-4 h-4 mr-1"/> Log Med</Button>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen} title="Record Medication">
        <form onSubmit={e => { e.preventDefault(); createMutation.mutate({ animalId, data: { medicationName: name, dosage: dose, dateGiven: date, nextDueDate: nextDate || null } }); }} className="space-y-4">
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
          <Button type="submit" className="w-full" isLoading={createMutation.isPending}>Save Record</Button>
        </form>
      </Dialog>

      {isLoading ? <div className="animate-pulse bg-card h-32 rounded-xl" /> : 
       meds?.length === 0 ? <p className="text-muted-foreground p-8 text-center bg-card rounded-xl border border-dashed">No medications recorded.</p> : (
        <div className="grid gap-3">
          {meds?.sort((a: MedicationRecord, b: MedicationRecord) => new Date(b.dateGiven).getTime() - new Date(a.dateGiven).getTime()).map((med: MedicationRecord) => (
            <Card key={med.id} className="shadow-sm">
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-primary text-lg">{med.medicationName}</h4>
                    {med.dosage && <Badge variant="secondary">{med.dosage}</Badge>}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium mt-1 flex gap-4">
                    <span>Given: {formatDate(med.dateGiven)}</span>
                    {med.nextDueDate && <span className="text-accent">Due: {formatDate(med.nextDueDate)}</span>}
                  </div>
                </div>
                <button onClick={() => { if(confirm("Delete?")) deleteMutation.mutate({ animalId, medicationId: med.id }) }} className="text-muted-foreground hover:text-destructive p-2">
                  <Trash2 className="w-4 h-4" />
                </button>
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
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [score, setScore] = useState(3);
  const [date, setDate] = useState("");

  const createMutation = useCreateFamachaScore({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/api/animals/${animalId}/famacha`] });
        setIsAddOpen(false); setDate("");
        toast({ title: "Score saved" });
      }
    }
  });

  const chartData = [...(scores || [])]
    .sort((a: FamachaScore, b: FamachaScore) => new Date(a.recordedDate).getTime() - new Date(b.recordedDate).getTime())
    .map((s: FamachaScore) => ({ date: new Date(s.recordedDate).toLocaleDateString(undefined, {month:'short', day:'numeric'}), score: s.score }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-display font-bold text-xl">FAMACHA Eye Scores</h3>
          <p className="text-sm text-muted-foreground">Monitor anemia/parasite load (1=Optimal, 5=Fatal)</p>
        </div>
        <Button size="sm" onClick={() => setIsAddOpen(true)}><Plus className="w-4 h-4 mr-1"/> Log Score</Button>
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
                    backgroundColor: num === 1 ? '#ef4444' : num === 2 ? '#f87171' : num === 3 ? '#fca5a5' : num === 4 ? '#fecaca' : '#fee2e2',
                    color: num <= 2 ? 'white' : '#7f1d1d'
                  }}
                >{num}</button>
              ))}
            </div>
            <p className="text-xs text-center text-muted-foreground font-bold">1 = Deep Red (Good) <span className="mx-2">|</span> 5 = White (Danger)</p>
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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {scores?.sort((a: FamachaScore, b: FamachaScore) => new Date(b.recordedDate).getTime() - new Date(a.recordedDate).getTime()).map((s: FamachaScore) => (
          <Card key={s.id} className="text-center shadow-sm">
            <CardContent className="p-4">
              <div className="text-3xl font-black mb-1" style={{ color: s.score >= 4 ? 'var(--color-destructive)' : s.score === 3 ? '#eab308' : 'var(--color-primary)' }}>
                {s.score}
              </div>
              <div className="text-xs font-bold text-muted-foreground">{formatDate(s.recordedDate)}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function NotesTab({ animalId }: { animalId: number }) {
  const { data: notes, isLoading } = useListFieldNotes(animalId);
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  
  const createMutation = useCreateFieldNote({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/api/animals/${animalId}/notes`] });
        setNote("");
      }
    }
  });

  return (
    <div className="space-y-6">
      <form onSubmit={e => { e.preventDefault(); createMutation.mutate({ animalId, data: { noteText: note } }); }} className="flex gap-3">
        <Textarea 
          placeholder="Add a quick field observation..." 
          className="min-h-[60px] h-[60px] flex-1" 
          value={note} onChange={e => setNote(e.target.value)} required 
        />
        <Button type="submit" className="h-[60px]" disabled={createMutation.isPending}>Add</Button>
      </form>

      <div className="space-y-3">
        {notes?.sort((a: FieldNote, b: FieldNote) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((n: FieldNote) => (
          <div key={n.id} className="bg-card border border-border p-4 rounded-xl shadow-sm">
            <p className="text-foreground whitespace-pre-wrap leading-relaxed">{n.noteText}</p>
            <p className="text-xs font-bold text-muted-foreground mt-3 uppercase tracking-wide">{formatDate(n.createdAt)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LineageTab({ animal }: { animal: AnimalDetail }) {
  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <h3 className="font-display font-bold text-xl mb-4">Parents</h3>
        <div className="space-y-3">
          {animal.dam ? (
             <Link href={`/animals/${animal.dam.id}`}>
               <Card className="hover:border-primary transition-colors cursor-pointer bg-pink-50/50 dark:bg-pink-900/10">
                 <CardContent className="p-4">
                   <p className="text-xs font-bold text-pink-600 dark:text-pink-400 mb-1 uppercase tracking-wide">Dam (Mother)</p>
                   <p className="font-bold text-lg">{animal.dam.name} {animal.dam.tagNumber && <span className="text-muted-foreground ml-1 text-sm font-normal">#{animal.dam.tagNumber}</span>}</p>
                 </CardContent>
               </Card>
             </Link>
          ) : <div className="p-4 bg-muted/50 rounded-xl border border-dashed border-border text-muted-foreground text-sm font-bold">Unknown Dam</div>}
          
          {animal.sire ? (
             <Link href={`/animals/${animal.sire.id}`}>
               <Card className="hover:border-primary transition-colors cursor-pointer bg-blue-50/50 dark:bg-blue-900/10">
                 <CardContent className="p-4">
                   <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-wide">Sire (Father)</p>
                   <p className="font-bold text-lg">{animal.sire.name} {animal.sire.tagNumber && <span className="text-muted-foreground ml-1 text-sm font-normal">#{animal.sire.tagNumber}</span>}</p>
                 </CardContent>
               </Card>
             </Link>
          ) : <div className="p-4 bg-muted/50 rounded-xl border border-dashed border-border text-muted-foreground text-sm font-bold">Unknown Sire</div>}
        </div>
      </div>

      <div>
        <h3 className="font-display font-bold text-xl mb-4">Offspring ({animal.babies?.length || 0})</h3>
        {animal.babies?.length > 0 ? (
          <div className="space-y-3">
            {animal.babies.map((b: AnimalRef) => (
              <Link key={b.id} href={`/animals/${b.id}`}>
                <Card className="hover:border-primary transition-colors cursor-pointer shadow-sm">
                  <CardContent className="p-4 flex justify-between items-center">
                    <p className="font-bold">{b.name}</p>
                    {b.tagNumber && <Badge variant="secondary">#{b.tagNumber}</Badge>}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground italic">No recorded offspring.</p>
        )}
      </div>
    </div>
  );
}
