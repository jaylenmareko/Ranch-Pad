import React, { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Check, Link2, UserMinus, Shield, Eye, Users, ClipboardList, CheckCircle, XCircle, ChevronDown, X, Trash2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Member {
  userId: number;
  role: string;
  joinedAt: string;
  name: string;
  email: string;
}

interface Invite {
  id: number;
  token: string;
  role: string;
  expiresAt: string;
}

interface DeleteRequest {
  id: number;
  resourceType: string;
  resourceId: number;
  resourceName: string;
  status: string;
  createdAt: string;
  requesterName: string;
  requesterEmail: string;
}

interface AnimalItem {
  id: number;
  name: string;
  tagNumber: string | null;
  species: string;
}

interface ViewerWithAssignments {
  userId: number;
  name: string;
  email: string;
  assignments: Array<{ id: number; animalId: number }>;
}

// ─── Role Helpers ─────────────────────────────────────────────────────────────

function roleLabel(role: string): string {
  if (role === "owner") return "Owner";
  if (role === "ranch_hand" || role === "member") return "Ranch Hand";
  if (role === "viewer") return "Viewer";
  return role;
}

function RoleBadge({ role }: { role: string }) {
  const label = roleLabel(role);
  const classMap: Record<string, string> = {
    Owner: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "Ranch Hand": "bg-blue-500/10 text-blue-400 border-blue-500/20",
    Viewer: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${classMap[label] ?? "bg-muted text-muted-foreground"}`}>
      {label}
    </span>
  );
}

function resourceTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    animal: "Animal",
    health_event: "Health Event",
    medication: "Medication",
    field_note: "Field Note",
    famacha: "FAMACHA Score",
  };
  return labels[type] ?? type;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Team() {
  const { refreshRole } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  // Fetch team data
  const { data: teamData, refetch: refetchTeam } = useQuery<{ members: Member[]; invites: Invite[] }>({
    queryKey: ["/api/team/members"],
    queryFn: async () => {
      const res = await fetch("/api/team/members");
      if (!res.ok) throw new Error("Failed to load team");
      return res.json();
    },
  });

  // Fetch delete requests
  const { data: deleteRequests = [], refetch: refetchRequests } = useQuery<DeleteRequest[]>({
    queryKey: ["/api/team/delete-requests"],
    queryFn: async () => {
      const res = await fetch("/api/team/delete-requests");
      if (!res.ok) throw new Error("Failed to load delete requests");
      return res.json();
    },
  });

  // Fetch animals + assignments for viewer assignment section
  const { data: animalAssignmentData, refetch: refetchAssignments } = useQuery<{ viewers: ViewerWithAssignments[]; assignments: Array<{ id: number; animalId: number; viewerUserId: number }> }>({
    queryKey: ["/api/team/animal-assignments"],
    queryFn: async () => {
      const res = await fetch("/api/team/animal-assignments");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: allAnimals = [] } = useQuery<AnimalItem[]>({
    queryKey: ["/api/animals"],
    queryFn: async () => {
      const res = await fetch("/api/animals");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  // ── Invite generation ──────────────────────────────────────────────────────

  const [inviteRole, setInviteRole] = useState<"ranch_hand" | "viewer">("ranch_hand");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateInvite = async () => {
    setGenerating(true);
    setInviteUrl(null);
    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.message, variant: "destructive" });
        return;
      }
      setInviteUrl(data.url);
      refetchTeam();
    } finally {
      setGenerating(false);
    }
  };

  const copyInviteUrl = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const revokeInvite = async (id: number) => {
    if (!confirm("Revoke this invite link? Anyone with the link won't be able to use it.")) return;
    const res = await fetch(`/api/team/invite/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Invite revoked" });
      refetchTeam();
    } else {
      toast({ title: "Failed to revoke invite", variant: "destructive" });
    }
  };

  // ── Member actions ─────────────────────────────────────────────────────────

  const changeRole = async (userId: number, role: string) => {
    const res = await fetch(`/api/team/members/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      toast({ title: "Role updated" });
      refetchTeam();
      refetchAssignments();
    } else {
      const d = await res.json();
      toast({ title: "Error", description: d.message, variant: "destructive" });
    }
  };

  const removeMember = async (userId: number, name: string) => {
    if (!confirm(`Remove ${name} from the ranch?`)) return;
    const res = await fetch(`/api/team/members/${userId}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: `${name} removed` });
      refetchTeam();
      refetchAssignments();
    } else {
      const d = await res.json();
      toast({ title: "Error", description: d.message, variant: "destructive" });
    }
  };

  // ── Delete request actions ─────────────────────────────────────────────────

  const resolveRequest = async (id: number, action: "approve" | "deny") => {
    const res = await fetch(`/api/team/delete-requests/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      toast({ title: action === "approve" ? "Deletion approved" : "Request denied" });
      refetchRequests();
      refreshRole();
      qc.invalidateQueries({ queryKey: ["/api/animals"] });
    } else {
      const d = await res.json();
      toast({ title: "Error", description: d.message, variant: "destructive" });
    }
  };

  // ── Animal assignment actions ──────────────────────────────────────────────

  const assignAnimal = async (viewerUserId: number, animalId: number) => {
    const res = await fetch("/api/team/animal-assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ viewerUserId, animalId }),
    });
    if (res.ok) {
      refetchAssignments();
    } else {
      const d = await res.json();
      toast({ title: "Error", description: d.message, variant: "destructive" });
    }
  };

  const removeAssignment = async (id: number) => {
    await fetch(`/api/team/animal-assignments/${id}`, { method: "DELETE" });
    refetchAssignments();
  };

  const bulkAssignAnimals = async (viewerUserId: number, animalIds: number[]) => {
    const res = await fetch("/api/team/animal-assignments/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ viewerUserId, animalIds }),
    });
    if (res.ok) {
      refetchAssignments();
    } else {
      const d = await res.json();
      toast({ title: "Error", description: d.message, variant: "destructive" });
    }
  };

  // ── Computed ───────────────────────────────────────────────────────────────

  const members = teamData?.members ?? [];
  const pendingInvites = teamData?.invites ?? [];
  const pendingRequests = deleteRequests.filter(r => r.status === "pending");

  const viewers = animalAssignmentData?.viewers ?? [];
  const assignments = animalAssignmentData?.assignments ?? [];

  const viewersWithAssignments: ViewerWithAssignments[] = viewers.map(v => ({
    ...v,
    assignments: assignments.filter(a => a.viewerUserId === v.userId),
  }));

  const [inviteOpen, setInviteOpen] = useState(false);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 max-w-lg mx-auto pb-20">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-display text-foreground">Team</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage who has access to your ranch</p>
        </div>
        <button
          onClick={() => { setInviteOpen(v => !v); setInviteUrl(null); }}
          className={`shrink-0 flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-semibold transition-colors border ${
            inviteOpen
              ? "bg-muted border-border text-muted-foreground"
              : "bg-primary border-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          <Link2 className="w-3.5 h-3.5" />
          {inviteOpen ? "Cancel" : "Invite"}
        </button>
      </div>

      {/* ── Invite Panel (slide-in when open) ─────────────────────────────── */}
      {inviteOpen && (
        <Card className="border border-border bg-card">
          <CardContent className="pt-5 space-y-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select a role</p>
            <div className="flex gap-2">
              <RoleToggleButton
                active={inviteRole === "ranch_hand"}
                icon={<Shield className="w-3.5 h-3.5" />}
                label="Ranch Hand"
                description="Can add and edit records"
                onClick={() => { setInviteRole("ranch_hand"); setInviteUrl(null); }}
              />
              <RoleToggleButton
                active={inviteRole === "viewer"}
                icon={<Eye className="w-3.5 h-3.5" />}
                label="Viewer"
                description="Read-only, assigned animals only"
                onClick={() => { setInviteRole("viewer"); setInviteUrl(null); }}
              />
            </div>

            <button
              onClick={generateInvite}
              disabled={generating}
              className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {generating ? "Generating…" : "Generate Invite Link"}
            </button>

            {inviteUrl && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border border-border">
                <p className="flex-1 text-xs font-mono text-foreground truncate">{inviteUrl}</p>
                <button
                  onClick={copyInviteUrl}
                  className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                  title="Copy link"
                >
                  {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Links expire in 24 hours and can only be used once.
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Deletion Requests (shown prominently if any) ───────────────────── */}
      {pendingRequests.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-500/20">
            <ClipboardList className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-sm font-bold text-foreground flex-1">Deletion Requests</span>
            <span className="text-xs font-bold bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full">
              {pendingRequests.length}
            </span>
          </div>
          <div className="divide-y divide-amber-500/10">
            {pendingRequests.map(req => (
              <div key={req.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{req.resourceName}</p>
                  <p className="text-xs text-muted-foreground">
                    {resourceTypeLabel(req.resourceType)} · {req.requesterName}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => resolveRequest(req.id, "approve")}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Approve
                  </button>
                  <button
                    onClick={() => resolveRequest(req.id, "deny")}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Members + Pending Invites ──────────────────────────────────────── */}
      <Card className="border border-border bg-card overflow-hidden">
        {/* Members */}
        {members.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <Users className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No team members yet.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Use the Invite button above to add someone.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {members.map(m => (
              <div key={m.userId} className="flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors">
                {/* Avatar initial */}
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-muted-foreground">{m.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{m.name}</p>
                </div>
                {m.role !== "owner" && (
                  <RoleSelect current={m.role} onChange={role => changeRole(m.userId, role)} />
                )}
                <div className="flex items-center gap-1 shrink-0">
                  {m.role === "owner" && <RoleBadge role={m.role} />}
                  {m.role !== "owner" && (
                    <button
                      onClick={() => removeMember(m.userId, m.name)}
                      className="text-xs font-semibold text-destructive hover:text-destructive/80 px-2 py-1 rounded-lg hover:bg-destructive/10 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pending Invites — inline below members */}
        {pendingInvites.length > 0 && (
          <div className="border-t border-border">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/30">
              <Link2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex-1">Pending Invites</span>
              <span className="text-xs text-muted-foreground">{pendingInvites.length}</span>
            </div>
            <div className="divide-y divide-border">
              {pendingInvites.map(inv => (
                <PendingInviteRow
                  key={inv.id}
                  invite={inv}
                  onRevoke={() => revokeInvite(inv.id)}
                />
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* ── Viewer Animal Access ───────────────────────────────────────────── */}
      {viewersWithAssignments.length > 0 && (
        <Card className="border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3.5 border-b border-border">
            <Eye className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm font-bold text-foreground flex-1">Viewer Animal Access</span>
          </div>
          <div className="p-4 space-y-4">
            <p className="text-xs text-muted-foreground">
              Viewers only see animals assigned to them.
            </p>
            {viewersWithAssignments.map(viewer => (
              <ViewerAssignmentRow
                key={viewer.userId}
                viewer={viewer}
                allAnimals={allAnimals}
                onAssign={(animalId) => assignAnimal(viewer.userId, animalId)}
                onRemove={removeAssignment}
                onBulkAssign={(animalIds) => bulkAssignAnimals(viewer.userId, animalIds)}
              />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PendingInviteRow({ invite, onRevoke }: { invite: Invite; onRevoke: () => void }) {
  const [copied, setCopied] = useState(false);
  const origin = window.location.origin;
  const url = `${origin}/invite/${invite.token}`;

  const copy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-3 px-6 py-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="text-xs font-mono text-foreground">{invite.token}</p>
          <button onClick={copy} className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors" title="Copy link">
            {copied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Expires {new Date(invite.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
      </div>
      <RoleBadge role={invite.role} />
      <button
        onClick={onRevoke}
        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        title="Revoke invite"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

function RoleSelect({ current, onChange }: { current: string; onChange: (role: string) => void }) {
  return (
    <select
      value={current === "member" ? "ranch_hand" : current}
      onChange={e => onChange(e.target.value)}
      className="text-xs rounded-lg border border-border bg-background text-foreground px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
    >
      <option value="ranch_hand">Ranch Hand</option>
      <option value="viewer">Viewer</option>
    </select>
  );
}

function RoleToggleButton({
  active, icon, label, description, onClick
}: {
  active: boolean; icon: React.ReactNode; label: string; description: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-start gap-2 p-3 rounded-xl border text-left transition-colors ${
        active
          ? "border-primary/40 bg-primary/5 text-foreground"
          : "border-border bg-background text-muted-foreground hover:bg-white/5"
      }`}
    >
      <span className={`mt-0.5 ${active ? "text-primary" : ""}`}>{icon}</span>
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs mt-0.5 opacity-70">{description}</p>
      </div>
    </button>
  );
}

function ViewerAssignmentRow({
  viewer, allAnimals, onAssign, onRemove, onBulkAssign,
}: {
  viewer: ViewerWithAssignments;
  allAnimals: AnimalItem[];
  onAssign: (animalId: number) => void;
  onRemove: (id: number) => void;
  onBulkAssign: (animalIds: number[]) => Promise<void>;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [assigning, setAssigning] = useState(false);

  const assignedIds = new Set(viewer.assignments.map(a => a.animalId));
  const unassigned = allAnimals.filter(a => !assignedIds.has(a.id));

  const toggleAnimal = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(unassigned.map(a => a.id)));
  const clearAll = () => setSelected(new Set());

  const allSelected = unassigned.length > 0 && selected.size === unassigned.length;

  const handleConfirm = async () => {
    if (selected.size === 0) return;
    setAssigning(true);
    await onBulkAssign(Array.from(selected));
    setSelected(new Set());
    setPickerOpen(false);
    setAssigning(false);
  };

  return (
    <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{viewer.name}</p>
        </div>
        <span className="text-xs text-muted-foreground">{viewer.assignments.length} assigned</span>
      </div>

      {viewer.assignments.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {viewer.assignments.map(a => {
            const animal = allAnimals.find(x => x.id === a.animalId);
            return (
              <span
                key={a.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
              >
                {animal?.name ?? `#${a.animalId}`}
                <button
                  onClick={() => onRemove(a.id)}
                  className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
                  title="Remove"
                >
                  <XCircle className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {unassigned.length > 0 && (
        <>
          {!pickerOpen ? (
            <button
              onClick={() => { setPickerOpen(true); setSelected(new Set()); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
            >
              <ChevronDown className="w-3.5 h-3.5" />
              Click to Assign Animals
            </button>
          ) : (
            <div className="rounded-lg border border-border bg-background overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
                <span className="text-xs font-semibold text-foreground">Select animals to assign</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={allSelected ? clearAll : selectAll}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    {allSelected ? "Deselect All" : "Select All"}
                  </button>
                  <button
                    onClick={() => { setPickerOpen(false); setSelected(new Set()); }}
                    className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
                    title="Close"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto divide-y divide-border/50">
                {unassigned.map(a => (
                  <label
                    key={a.id}
                    className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(a.id)}
                      onChange={() => toggleAnimal(a.id)}
                      className="w-3.5 h-3.5 rounded accent-primary cursor-pointer"
                    />
                    <span className="text-xs text-foreground font-medium flex-1">
                      {a.name}
                      {a.tagNumber && <span className="text-muted-foreground"> #{a.tagNumber}</span>}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">{a.species}</span>
                  </label>
                ))}
              </div>

              <div className="px-3 py-2 border-t border-border">
                <button
                  onClick={handleConfirm}
                  disabled={selected.size === 0 || assigning}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {assigning
                    ? "Assigning…"
                    : selected.size === 0
                    ? "Select animals above"
                    : `Assign ${selected.size} animal${selected.size !== 1 ? "s" : ""}`}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
