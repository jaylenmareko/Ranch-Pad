import React, { useState } from "react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Input, Label, Textarea } from "@/components/ui/input";
import { ArrowLeft, Edit2, Activity, Pill, AlertTriangle, Trash2, Plus } from "lucide-react";
import { 
  useGetAnimal, useDeleteAnimal, 
  useListMedications, useCreateMedication, useDeleteMedication, useUpdateMedication,
  useListHealthEvents, useCreateHealthEvent, useDeleteHealthEvent, useUpdateHealthEvent,
  useListFamachaScores, useCreateFamachaScore, useDeleteFamachaScore, useUpdateFamachaScore,
  type AnimalDetail, type HealthEvent, type MedicationRecord, type FamachaScore
} from "@workspace/api-client-react";
import { formatAge, formatDate } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

export default function AnimalDetail() {
  const params = useParams();
  const animalId = parseInt(params.id || "0", 10);
  const [activeTab, setActiveTab] = useState<"health" | "meds" | "famacha">("health");
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
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as "health" | "meds" | "famacha")}
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
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editSev, setEditSev] = useState<"low"|"medium"|"high">("low");

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

  const updateMutation = useUpdateHealthEvent({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/api/animals/${animalId}/health-events`] });
        queryClient.invalidateQueries({ queryKey: [`/api/animals/${animalId}`] });
        setEditingEventId(null);
        toast({ title: "Event updated" });
      }
    }
  });

  const deleteMutation = useDeleteHealthEvent({
    mutation: { onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/animals/${animalId}/health-events`] });
      queryClient.invalidateQueries({ queryKey: [`/api/animals/${animalId}`] });
    }}
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

      <Dialog open={editingEventId !== null} onOpenChange={(open) => { if (!open) setEditingEventId(null); }} title="Edit Health Event">
        <form onSubmit={e => { e.preventDefault(); if (editingEventId) updateMutation.mutate({ animalId, healthEventId: editingEventId, data: { description: editDesc, eventDate: editDate, severity: editSev } }); }} className="space-y-4">
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" required value={editDate} onChange={e => setEditDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Severity</Label>
            <select value={editSev} onChange={e => setEditSev(e.target.value as "low" | "medium" | "high")} className="flex h-12 w-full rounded-xl border-2 border-border bg-background px-4 py-2 font-medium">
              <option value="low">Low (Routine)</option>
              <option value="medium">Medium (Requires watching)</option>
              <option value="high">High (Urgent/Vet needed)</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea required value={editDesc} onChange={e => setEditDesc(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" isLoading={updateMutation.isPending}>Update Event</Button>
        </form>
      </Dialog>

      {isLoading ? <div className="animate-pulse bg-card h-32 rounded-xl" /> : 
       events?.length === 0 ? <p className="text-muted-foreground p-8 text-center bg-card rounded-xl border border-dashed">No health events recorded.</p> : (
        <div className="grid gap-3">
          {events?.sort((a: HealthEvent, b: HealthEvent) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()).map((ev: HealthEvent) => (
            <Card key={ev.id} className="border-l-4 overflow-hidden shadow-sm group" style={{ borderLeftColor: ev.severity === 'high' ? 'var(--color-destructive)' : ev.severity === 'medium' ? '#eab308' : '#22c55e' }}>
              <CardContent className="p-4 flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-foreground">{formatDate(ev.eventDate)}</span>
                    <Badge variant="outline" className="text-[10px] py-0">{ev.severity.toUpperCase()}</Badge>
                  </div>
                  <p className="text-foreground">{ev.description}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={() => { setEditingEventId(ev.id); setEditDesc(ev.description); setEditDate(ev.eventDate); setEditSev(ev.severity as "low"|"medium"|"high"); }} className="p-2 text-muted-foreground hover:text-primary rounded-full hover:bg-muted">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => { if(confirm("Delete this event?")) deleteMutation.mutate({ animalId, healthEventId: ev.id }) }} className="p-2 text-muted-foreground hover:text-destructive rounded-full hover:bg-muted">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
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
  const [editingMedId, setEditingMedId] = useState<number | null>(null);
  
  // form state
  const [name, setName] = useState("");
  const [dose, setDosage] = useState("");
  const [date, setDate] = useState("");
  const [nextDate, setNextDate] = useState("");

  // edit form state
  const [editName, setEditName] = useState("");
  const [editDose, setEditDose] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editNextDate, setEditNextDate] = useState("");

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

  const updateMutation = useUpdateMedication({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/api/animals/${animalId}/medications`] });
        setEditingMedId(null);
        toast({ title: "Medication updated" });
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

      <Dialog open={editingMedId !== null} onOpenChange={(open) => { if (!open) setEditingMedId(null); }} title="Edit Medication">
        <form onSubmit={e => { e.preventDefault(); if (editingMedId) updateMutation.mutate({ animalId, medicationId: editingMedId, data: { medicationName: editName, dosage: editDose, dateGiven: editDate, nextDueDate: editNextDate || null } }); }} className="space-y-4">
          <div className="space-y-2">
            <Label>Medication Name</Label>
            <Input required value={editName} onChange={e => setEditName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Dosage</Label>
            <Input value={editDose} onChange={e => setEditDose(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date Given</Label>
              <Input type="date" required value={editDate} onChange={e => setEditDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Next Due</Label>
              <Input type="date" value={editNextDate} onChange={e => setEditNextDate(e.target.value)} />
            </div>
          </div>
          <Button type="submit" className="w-full" isLoading={updateMutation.isPending}>Update Record</Button>
        </form>
      </Dialog>

      {isLoading ? <div className="animate-pulse bg-card h-32 rounded-xl" /> : 
       meds?.length === 0 ? <p className="text-muted-foreground p-8 text-center bg-card rounded-xl border border-dashed">No medications recorded.</p> : (
        <div className="grid gap-3">
          {meds?.sort((a: MedicationRecord, b: MedicationRecord) => new Date(b.dateGiven).getTime() - new Date(a.dateGiven).getTime()).map((med: MedicationRecord) => (
            <Card key={med.id} className="shadow-sm group">
              <CardContent className="p-4 flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-primary text-lg">{med.medicationName}</h4>
                    {med.dosage && <Badge variant="secondary">{med.dosage}</Badge>}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium mt-1 flex gap-4">
                    <span>Given: {formatDate(med.dateGiven)}</span>
                    {med.nextDueDate && <span className="text-accent">Due: {formatDate(med.nextDueDate)}</span>}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={() => { setEditingMedId(med.id); setEditName(med.medicationName); setEditDose(med.dosage || ""); setEditDate(med.dateGiven); setEditNextDate(med.nextDueDate || ""); }} className="p-2 text-muted-foreground hover:text-primary rounded-full hover:bg-muted">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => { if(confirm("Delete?")) deleteMutation.mutate({ animalId, medicationId: med.id }) }} className="p-2 text-muted-foreground hover:text-destructive rounded-full hover:bg-muted">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editScore, setEditScore] = useState(3);
  const [editDate, setEditDate] = useState("");

  const createMutation = useCreateFamachaScore({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/api/animals/${animalId}/famacha`] });
        setIsAddOpen(false); setDate("");
        toast({ title: "Score saved" });
      }
    }
  });

  const updateMutation = useUpdateFamachaScore({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/api/animals/${animalId}/famacha`] });
        setEditingId(null);
        toast({ title: "Score updated" });
      }
    }
  });

  const deleteFamachaMutation = useDeleteFamachaScore({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/api/animals/${animalId}/famacha`] });
        toast({ title: "Score deleted" });
      }
    }
  });

  const chartData = [...(scores || [])]
    .sort((a: FamachaScore, b: FamachaScore) => new Date(a.recordedDate).getTime() - new Date(b.recordedDate).getTime())
    .map((s: FamachaScore) => {
      const d = new Date(s.recordedDate + "T12:00:00");
      return { date: `${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}`, score: s.score };
    });

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
                  className={`flex-1 h-14 rounded-xl font-black text-xl ${
                    score === num ? 'ring-4 ring-offset-2 ring-primary shadow-lg' : 'opacity-60 hover:opacity-100'
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

      <Dialog open={editingId !== null} onOpenChange={(open) => { if (!open) setEditingId(null); }} title="Edit FAMACHA Score">
        <form onSubmit={e => { e.preventDefault(); if (editingId) updateMutation.mutate({ animalId, famachaId: editingId, data: { score: editScore, recordedDate: editDate } }); }} className="space-y-6">
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" required value={editDate} onChange={e => setEditDate(e.target.value)} />
          </div>
          <div className="space-y-4">
            <Label>Score (1-5)</Label>
            <div className="flex justify-between gap-2">
              {[1,2,3,4,5].map(num => (
                <button key={num} type="button" onClick={() => setEditScore(num)}
                  className={`flex-1 h-14 rounded-xl font-black text-xl ${editScore === num ? 'ring-4 ring-offset-2 ring-primary scale-110 shadow-lg' : 'opacity-60 hover:opacity-100'}`}
                  style={{ backgroundColor: num === 1 ? '#ef4444' : num === 2 ? '#f87171' : num === 3 ? '#fca5a5' : num === 4 ? '#fecaca' : '#fee2e2', color: num <= 2 ? 'white' : '#7f1d1d' }}
                >{num}</button>
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full" isLoading={updateMutation.isPending}>Update Score</Button>
        </form>
      </Dialog>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {scores?.sort((a: FamachaScore, b: FamachaScore) => new Date(b.recordedDate).getTime() - new Date(a.recordedDate).getTime()).map((s: FamachaScore) => (
          <Card key={s.id} className="text-center shadow-sm group relative">
            <CardContent className="p-4">
              <div className="text-3xl font-black mb-1" style={{ color: s.score >= 4 ? 'var(--color-destructive)' : s.score === 3 ? '#eab308' : 'var(--color-primary)' }}>
                {s.score}
              </div>
              <div className="text-xs font-bold text-muted-foreground">{formatDate(s.recordedDate)}</div>
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-all flex gap-0.5">
                <button
                  onClick={() => { setEditingId(s.id); setEditScore(s.score); setEditDate(s.recordedDate); }}
                  className="p-1 rounded-full hover:bg-muted"
                  title="Edit score"
                >
                  <Edit2 className="w-3 h-3 text-muted-foreground" />
                </button>
                <button
                  onClick={() => { if(confirm("Delete this FAMACHA score?")) deleteFamachaMutation.mutate({ animalId, famachaId: s.id }); }}
                  className="p-1 rounded-full hover:bg-muted"
                  title="Delete score"
                >
                  <Trash2 className="w-3 h-3 text-destructive/70" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


