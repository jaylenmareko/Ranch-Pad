import React, { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check, Link2, UserMinus, Shield, Eye, Users, ClipboardList, CheckCircle, XCircle, ChevronDown, X, Trash2 } from "lucide-react";
import "./Team.css";

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
  const key = role === "member" ? "ranch_hand" : role;
  return (
    <span className={`team-role-badge team-role-badge--${key}`}>
      {roleLabel(role)}
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
    <div className="team-page">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="team-header">
        <div>
          <div className="team-header-title">Team</div>
          <div className="team-header-sub">Manage who has access to your ranch</div>
        </div>
        <button
          onClick={() => { setInviteOpen(v => !v); setInviteUrl(null); }}
          className={inviteOpen ? "team-cancel-btn" : "team-invite-btn"}
        >
          <Link2 size={14} />
          {inviteOpen ? "Cancel" : "Invite"}
        </button>
      </div>

      <div className="team-body">

        {/* ── Invite Panel ──────────────────────────────────────────────── */}
        {inviteOpen && (
          <div className="team-invite-panel">
            <div className="team-invite-role-label">Select a role</div>

            <div className="team-role-toggles">
              <button
                className={`team-role-toggle${inviteRole === "ranch_hand" ? " team-role-toggle--active" : ""}`}
                onClick={() => { setInviteRole("ranch_hand"); setInviteUrl(null); }}
              >
                <Shield size={14} className="team-role-toggle-icon" />
                <div>
                  <div className="team-role-toggle-label">Ranch Hand</div>
                  <div className="team-role-toggle-desc">Can add and edit records</div>
                </div>
              </button>
              <button
                className={`team-role-toggle${inviteRole === "viewer" ? " team-role-toggle--active" : ""}`}
                onClick={() => { setInviteRole("viewer"); setInviteUrl(null); }}
              >
                <Eye size={14} className="team-role-toggle-icon" />
                <div>
                  <div className="team-role-toggle-label">Viewer</div>
                  <div className="team-role-toggle-desc">Read-only, assigned animals only</div>
                </div>
              </button>
            </div>

            <button
              onClick={generateInvite}
              disabled={generating}
              className="team-generate-btn"
            >
              {generating ? "Generating…" : "Generate Invite Link"}
            </button>

            {inviteUrl && (
              <div className="team-invite-url-row">
                <span className="team-invite-url-text">{inviteUrl}</span>
                <button onClick={copyInviteUrl} className="team-copy-btn" title="Copy link">
                  {copied ? <Check size={16} color="#2D6A4F" /> : <Copy size={16} />}
                </button>
              </div>
            )}

            <p className="team-invite-expire-note">
              Links expire in 24 hours and can only be used once.
            </p>
          </div>
        )}

        {/* ── Deletion Requests ─────────────────────────────────────────── */}
        {pendingRequests.length > 0 && (
          <div className="team-delete-requests">
            <div className="team-delete-requests-header">
              <ClipboardList size={15} color="#C97D20" style={{ flexShrink: 0 }} />
              <span className="team-delete-requests-label">Deletion Requests</span>
              <span className="team-delete-count-badge">{pendingRequests.length}</span>
            </div>
            {pendingRequests.map(req => (
              <div key={req.id} className="team-delete-row">
                <div className="team-delete-row-body">
                  <div className="team-delete-resource-name">{req.resourceName}</div>
                  <div className="team-delete-resource-sub">
                    {resourceTypeLabel(req.resourceType)} · {req.requesterName}
                  </div>
                </div>
                <div className="team-delete-actions">
                  <button className="team-approve-btn" onClick={() => resolveRequest(req.id, "approve")}>
                    <CheckCircle size={13} /> Approve
                  </button>
                  <button className="team-deny-btn" onClick={() => resolveRequest(req.id, "deny")}>
                    <XCircle size={13} /> Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Members + Pending Invites ──────────────────────────────────── */}
        <div className="team-card">
          <div className="team-card-header">
            <Users size={14} color="#5A7A6A" style={{ flexShrink: 0 }} />
            <span className="team-card-header-label">Members</span>
            <span className="team-card-header-count">{members.length}</span>
          </div>

          {members.length === 0 ? (
            <div className="team-empty">
              <div className="team-empty-icon">👥</div>
              <div className="team-empty-text">No team members yet.</div>
              <div className="team-empty-sub">Use the Invite button above to add someone.</div>
            </div>
          ) : (
            <ul className="team-member-list">
              {members.map(m => (
                <li key={m.userId} className="team-member-row">
                  <div className="team-member-avatar">
                    <span className="team-member-avatar-initial">{m.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="team-member-name">{m.name}</span>
                  {m.role !== "owner" && (
                    <RoleSelect current={m.role} onChange={role => changeRole(m.userId, role)} />
                  )}
                  {m.role === "owner"
                    ? <RoleBadge role={m.role} />
                    : (
                      <button className="team-remove-btn" onClick={() => removeMember(m.userId, m.name)}>
                        Remove
                      </button>
                    )
                  }
                </li>
              ))}
            </ul>
          )}

          {/* Pending Invites — inline below members */}
          {pendingInvites.length > 0 && (
            <>
              <div className="team-pending-header">
                <Link2 size={13} color="#8FA393" style={{ flexShrink: 0 }} />
                <span className="team-card-header-label">Pending Invites</span>
                <span className="team-card-header-count">{pendingInvites.length}</span>
              </div>
              {pendingInvites.map(inv => (
                <PendingInviteRow
                  key={inv.id}
                  invite={inv}
                  onRevoke={() => revokeInvite(inv.id)}
                />
              ))}
            </>
          )}
        </div>

        {/* ── Viewer Animal Access ───────────────────────────────────────── */}
        {viewersWithAssignments.length > 0 && (
          <div className="team-card">
            <div className="team-card-header">
              <Eye size={14} color="#5A7A6A" style={{ flexShrink: 0 }} />
              <span className="team-card-header-label">Viewer Animal Access</span>
            </div>
            <div className="team-viewer-list">
              <p className="team-viewer-note">Viewers only see animals assigned to them.</p>
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
          </div>
        )}

      </div>
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
    <div className="team-invite-row">
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="team-invite-token">{invite.token}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
          <div className="team-invite-expire">
            Expires {new Date(invite.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ·{" "}
            {new Date(invite.expiresAt).toLocaleDateString([], { month: "short", day: "numeric" })}
          </div>
          <button
            onClick={copy}
            className={`team-invite-copy-btn${copied ? " team-invite-copy-btn--copied" : ""}`}
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
      <RoleBadge role={invite.role} />
      <button onClick={onRevoke} className="team-revoke-btn" title="Revoke invite">
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function RoleSelect({ current, onChange }: { current: string; onChange: (role: string) => void }) {
  return (
    <select
      value={current === "member" ? "ranch_hand" : current}
      onChange={e => onChange(e.target.value)}
      className="team-role-select"
    >
      <option value="ranch_hand">Ranch Hand</option>
      <option value="viewer">Viewer</option>
    </select>
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
    <div className="team-viewer-row">
      <div className="team-viewer-row-top">
        <span className="team-viewer-name">{viewer.name}</span>
        <span className="team-viewer-count">{viewer.assignments.length} assigned</span>
      </div>

      {viewer.assignments.length > 0 && (
        <div className="team-animal-tags">
          {viewer.assignments.map(a => {
            const animal = allAnimals.find(x => x.id === a.animalId);
            return (
              <span key={a.id} className="team-animal-tag">
                {animal?.name ?? `#${a.animalId}`}
                <button
                  onClick={() => onRemove(a.id)}
                  className="team-animal-tag-remove"
                  title="Remove"
                >
                  <XCircle size={12} />
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
              className="team-assign-open-btn"
            >
              <ChevronDown size={13} />
              Assign Animals
            </button>
          ) : (
            <div className="team-animal-picker">
              <div className="team-picker-header">
                <span className="team-picker-header-label">Select animals to assign</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button className="team-picker-select-all" onClick={allSelected ? clearAll : selectAll}>
                    {allSelected ? "Deselect All" : "Select All"}
                  </button>
                  <button
                    className="team-picker-close"
                    onClick={() => { setPickerOpen(false); setSelected(new Set()); }}
                    title="Close"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              <ul className="team-picker-list">
                {unassigned.map(a => (
                  <li key={a.id}>
                    <label className="team-picker-item">
                      <input
                        type="checkbox"
                        checked={selected.has(a.id)}
                        onChange={() => toggleAnimal(a.id)}
                        style={{ width: 14, height: 14, accentColor: "#1A3628", cursor: "pointer", flexShrink: 0 }}
                      />
                      <span className="team-picker-item-name">
                        {a.name}
                        {a.tagNumber && <span className="team-picker-item-tag"> #{a.tagNumber}</span>}
                      </span>
                      <span className="team-picker-item-tag" style={{ textTransform: "capitalize" }}>{a.species}</span>
                    </label>
                  </li>
                ))}
              </ul>

              <div className="team-picker-footer">
                <button
                  onClick={handleConfirm}
                  disabled={selected.size === 0 || assigning}
                  className="team-picker-confirm-btn"
                >
                  {assigning
                    ? "Assigning…"
                    : selected.size === 0
                    ? "Select animals above"
                    : `Assign ${selected.size} animal${selected.size !== 1 ? "s" : ""}`}
                </button>
                <button
                  onClick={() => { setPickerOpen(false); setSelected(new Set()); }}
                  className="team-picker-cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
