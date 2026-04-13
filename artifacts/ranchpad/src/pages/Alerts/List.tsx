import React, { useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { AlertTriangle, Info, CheckCircle2, ChevronDown } from "lucide-react";
import { useListAlerts, useDismissAlert, useListAnimals, useGenerateAlerts, type Alert, type Animal } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useAuthModal } from "@/contexts/auth-modal-context";
import { EmptyHerdOverlay } from "@/components/EmptyHerdOverlay";
import { ImportModeDialog } from "@/components/ImportModeDialog";
import "./Alerts.css";

function SeverityFolder({
  label, count, accentColor, storageKey, children
}: {
  label: string; count: number; accentColor: string; storageKey: string; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(() => {
    try { return sessionStorage.getItem(storageKey) === 'true'; } catch { return false; }
  });

  const toggle = () => {
    setOpen(v => {
      const next = !v;
      try { sessionStorage.setItem(storageKey, String(next)); } catch { /* ignore */ }
      return next;
    });
  };

  return (
    <div className="alerts-sev-folder" style={{ borderLeftColor: accentColor }}>
      <button className="alerts-sev-btn" onClick={toggle}>
        <ChevronDown
          size={15}
          className="alerts-sev-chevron"
          style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}
        />
        <span className="alerts-sev-label">{label}</span>
        {!open && <span className="alerts-sev-hint">tap to expand</span>}
        <span
          className="alerts-sev-count"
          style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
        >
          {count} {count === 1 ? 'alert' : 'alerts'}
        </span>
      </button>
      {open && (
        <div className="alerts-sev-content">
          {children}
        </div>
      )}
    </div>
  );
}

function TypeFolder({
  label, count, icon, storageKey, children
}: {
  label: string; count: number; icon: React.ReactNode; storageKey: string; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(() => {
    try { return sessionStorage.getItem(storageKey) === 'true'; } catch { return false; }
  });

  const toggle = () => {
    setOpen(v => {
      const next = !v;
      try { sessionStorage.setItem(storageKey, String(next)); } catch { /* ignore */ }
      return next;
    });
  };

  return (
    <div className="alerts-type-folder">
      <button className="alerts-type-btn" onClick={toggle}>
        <span className="alerts-type-icon">{icon}</span>
        <span className="alerts-type-label">{label}</span>
        {!open && <span className="alerts-type-hint">tap to expand</span>}
        <span className="alerts-type-count">{count}</span>
        <ChevronDown
          size={13}
          className="alerts-type-chevron"
          style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}
        />
      </button>
      {open && (
        <div className="alerts-type-content">
          {children}
        </div>
      )}
    </div>
  );
}

function getAlertTypeInfo(alertKey: string | undefined): { label: string; icon: React.ReactNode } {
  if (!alertKey) return { label: "Other", icon: <Info className="w-3.5 h-3.5" /> };
  if (alertKey.startsWith("severe_health_event|")) return { label: "Severe Health Event", icon: <AlertTriangle className="w-3.5 h-3.5" /> };
  if (alertKey.startsWith("repeat_health|")) return { label: "Repeat Health Issues", icon: <AlertTriangle className="w-3.5 h-3.5" /> };
  if (alertKey.startsWith("famacha_decline|")) return { label: "Declining FAMACHA", icon: <Info className="w-3.5 h-3.5" /> };
  if (alertKey.startsWith("heat_cycle|")) return { label: "Heat Cycle Reminder", icon: <CheckCircle2 className="w-3.5 h-3.5" /> };
  return { label: "Other", icon: <Info className="w-3.5 h-3.5" /> };
}

function getAlertTypeKey(alertKey: string | undefined): string {
  if (!alertKey) return "other";
  if (alertKey.startsWith("severe_health_event|")) return "severe_health_event";
  if (alertKey.startsWith("repeat_health|")) return "repeat_health";
  if (alertKey.startsWith("famacha_decline|")) return "famacha_decline";
  if (alertKey.startsWith("heat_cycle|")) return "heat_cycle";
  return "other";
}

export default function AlertsList() {
  const { isAuthenticated, role } = useAuth();
  const { openLogin, openSignup } = useAuthModal();
  const queryClient = useQueryClient();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [modeDialogOpen, setModeDialogOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const { data: alerts, isLoading } = useListAlerts({ query: { enabled: isAuthenticated } });
  const { data: animals, isLoading: animalsLoading } = useListAnimals({ query: { enabled: isAuthenticated } });
  const { data: cullAnimals } = useQuery<Animal[]>({
    queryKey: ["/api/animals", { cull: true }],
    queryFn: async () => {
      const res = await fetch("/api/animals?cull=true");
      if (!res.ok) throw new Error("Failed to load cull animals");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const generateMutation = useGenerateAlerts({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/alerts"] })
    }
  });

  const dismissMutation = useDismissAlert({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/alerts"] })
    }
  });

  async function doImport(file: File, replace: boolean) {
    setImporting(true);
    setModeDialogOpen(false);
    setPendingFile(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const url = replace ? "/api/animals/import-csv?replace=true" : "/api/animals/import-csv";
      const res = await fetch(url, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setImportError(data.message ?? "Import failed. Please check your file and try again.");
      } else {
        queryClient.refetchQueries({ queryKey: ["/api/animals"] });
        generateMutation.mutate();
      }
    } catch {
      setImportError("Something went wrong connecting to the server. Please try again.");
    } finally {
      setImporting(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setImportError(null);
    const isCSV = file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv" || file.type === "application/csv";
    if (!isCSV) { setImportError("Please upload a CSV file."); return; }
    if (file.size === 0) { setImportError("This file appears to be empty. Please fill in the template and try again."); return; }
    const hasAnimals = animals && (animals as Animal[]).length > 0;
    if (hasAnimals) {
      setPendingFile(file);
      setModeDialogOpen(true);
    } else {
      doImport(file, false);
    }
  }

  const activeAlerts = alerts?.filter(a => !a.isDismissed) || [];
  const DASHBOARD_ONLY_PREFIXES = ['overdue_med|', 'due_soon_med|', 'calving_soon|', 'calving_due|'];
  const recordAlerts = activeAlerts.filter(a =>
    a.alertType !== 'weather_forecast' &&
    !DASHBOARD_ONLY_PREFIXES.some(prefix => a.alertKey?.startsWith(prefix))
  );

  const getSeverityIcon = (sev: string) => {
    if (sev === 'critical') return <AlertTriangle className="w-3.5 h-3.5" />;
    if (sev === 'high') return <AlertTriangle className="w-3.5 h-3.5" />;
    if (sev === 'moderate' || sev === 'medium') return <Info className="w-3.5 h-3.5" />;
    return <CheckCircle2 className="w-3.5 h-3.5" />;
  };

  const getSeverityColor = (sev: string) => {
    if (sev === 'critical') return "bg-red-600/15 border-red-600/25 text-red-700 dark:text-red-400";
    if (sev === 'high') return "bg-destructive/10 border-destructive/20 text-destructive";
    if (sev === 'moderate' || sev === 'medium') return "bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400";
    return "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400";
  };

  const getSeverityAccent = (sev: string) => {
    if (sev === 'critical') return { border: '#ef4444', badge: 'bg-red-500/15 text-red-500 dark:text-red-400', icon: 'text-red-500 dark:text-red-400' };
    if (sev === 'high') return { border: '#f97316', badge: 'bg-orange-500/15 text-orange-600 dark:text-orange-400', icon: 'text-orange-500 dark:text-orange-400' };
    if (sev === 'moderate' || sev === 'medium') return { border: '#eab308', badge: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400', icon: 'text-yellow-500 dark:text-yellow-400' };
    return { border: '#22c55e', badge: 'bg-green-500/15 text-green-600 dark:text-green-400', icon: 'text-green-500 dark:text-green-400' };
  };

  const getSeverityLabel = (sev: string) => sev.charAt(0).toUpperCase() + sev.slice(1);

  const getFirstSentence = (msg: string): string => {
    const match = msg.match(/^(.+?[.!?])(?:\s|$)/);
    return match ? match[1] : msg;
  };

  const extractNameFromMessage = (msg: string): string | null => {
    // Record alert messages start with the animal name followed by a keyword
    const match = msg.match(/^([\w]+(?:\s+[\w]+)?)(?:\s+(?:had|has|may|is)|'s\s|\s+\()/);
    return match ? match[1] : null;
  };

  const buildAnimalLabel = (alert: Alert): string | null => {
    if (!alert.animalId) return null;
    if (alert.animalTagNumber) {
      const suffix = alert.animalSpecies ? ` · ${alert.animalSpecies}` : "";
      return `#${alert.animalTagNumber}${suffix}`;
    }
    if (alert.animalName) {
      const suffix = alert.animalSpecies ? ` · ${alert.animalSpecies}` : "";
      return `${alert.animalName}${suffix}`;
    }
    return null;
  };

  // Guest users see a sign-up prompt
  if (!isAuthenticated) {
    return (
      <div className="alerts-page">
        <div className="alerts-header">
          <span className="alerts-header-title">Alerts</span>
        </div>
        <div className="alerts-guest">
          <div className="alerts-guest-icon">
            <AlertTriangle size={32} style={{ color: "#1A3628", opacity: 0.4 }} />
          </div>
          <div className="alerts-guest-title">Herd health alerts</div>
          <p className="alerts-guest-desc">
            Sign up to get automatic alerts when medications are coming due, FAMACHA scores are declining, or animals have repeat health events.
          </p>
          <div className="alerts-guest-btns">
            <button className="alerts-guest-primary" onClick={openSignup}>Create Free Account</button>
            <button className="alerts-guest-secondary" onClick={openLogin}>Log In</button>
          </div>
        </div>
      </div>
    );
  }

  const AlertRow = ({ alert }: { alert: Alert }) => {
    const [expanded, setExpanded] = useState(false);
    const [, navigate] = useLocation();

    const animalLabel = buildAnimalLabel(alert);
    const firstSentence = getFirstSentence(alert.message);
    const hasMoreContent = alert.message.length > firstSentence.length;

    return (
      <div className="alerts-alert-row" onClick={() => setExpanded(v => !v)}>
        <div className="alerts-alert-top">
          <div className="alerts-alert-info">
            {animalLabel && <div className="alerts-alert-animal">{animalLabel}</div>}
            <div className="alerts-alert-message">
              {expanded ? alert.message : firstSentence}
            </div>
          </div>
          <div className="alerts-alert-meta">
            <span className="alerts-alert-date">
              <span style={{ display: "block" }}>{format(new Date(alert.generatedAt), "MMM d, yyyy")}</span>
              <span style={{ display: "block" }}>{format(new Date(alert.generatedAt), "h:mm a")}</span>
            </span>
            {hasMoreContent && (
              <ChevronDown
                size={13}
                className="alerts-alert-chevron"
                style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
              />
            )}
          </div>
        </div>
        <div className="alerts-alert-actions">
          {alert.animalId ? (
            <button
              className="alerts-view-btn"
              onClick={e => { e.stopPropagation(); navigate(`/animals/${alert.animalId}?from=alerts`); }}
            >
              View Animal →
            </button>
          ) : <span />}
          <button
            className="alerts-dismiss-btn"
            onClick={e => { e.stopPropagation(); dismissMutation.mutate({ alertId: alert.id }); }}
          >
            <CheckCircle2 size={11} /> Mark Resolved
          </button>
        </div>
      </div>
    );
  };

  const hasNoAnimals = !animalsLoading && animals !== undefined && animals.length === 0 && Array.isArray(cullAnimals) && cullAnimals.length === 0;

  const ALL_TYPES: { key: string; label: string; icon: React.ReactNode }[] = [
    { key: "severe_health_event", label: "Severe Health Events", icon: <AlertTriangle size={13} /> },
    { key: "repeat_health",        label: "Repeat Health Issues",  icon: <AlertTriangle size={13} /> },
    { key: "famacha_decline",      label: "Declining FAMACHA",     icon: <Info size={13} /> },
    { key: "heat_cycle",           label: "Heat Cycle Reminders",  icon: <CheckCircle2 size={13} /> },
  ];

  const high   = recordAlerts.filter(a => a.severity === 'critical' || a.severity === 'high');
  const medium = recordAlerts.filter(a => a.severity === 'moderate' || a.severity === 'medium');
  const low    = recordAlerts.filter(a => a.severity !== 'critical' && a.severity !== 'high' && a.severity !== 'moderate' && a.severity !== 'medium');

  function renderTypes(alerts: typeof recordAlerts, severityKey: string) {
    return ALL_TYPES.map(({ key: typeKey, label, icon }) => {
      const items = alerts.filter(a => getAlertTypeKey(a.alertKey ?? undefined) === typeKey);
      return (
        <TypeFolder key={typeKey} label={label} count={items.length} icon={icon} storageKey={`alert-type-${severityKey}-${typeKey}`}>
          {items.length === 0
            ? <p className="alerts-type-empty">No active alerts of this type.</p>
            : items.map(a => <AlertRow key={a.id} alert={a} />)
          }
        </TypeFolder>
      );
    });
  }

  const severities = [
    { label: "High",   alerts: high,   color: "#ef4444", key: "high"   },
    { label: "Medium", alerts: medium, color: "#C97D20", key: "medium" },
    { label: "Low",    alerts: low,    color: "#2D6A4F", key: "low"    },
  ];

  return (
    <div className="alerts-page">
      <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />
      <ImportModeDialog
        open={modeDialogOpen}
        onOpenChange={setModeDialogOpen}
        onAdd={() => pendingFile && doImport(pendingFile, false)}
        onReplace={() => pendingFile && doImport(pendingFile, true)}
      />
      {hasNoAnimals ? (
        <EmptyHerdOverlay role={role ?? undefined} />
      ) : (
        <>
          <div className="alerts-header">
            <span className="alerts-header-title">Alerts</span>
          </div>

          <div className="alerts-body">
            {importError && <p className="alerts-error">{importError}</p>}

            {isLoading || animalsLoading ? (
              <>
                {[1,2,3].map(i => <div key={i} className="alerts-skeleton" style={{ height: 64 }} />)}
              </>
            ) : (
              <>
                {severities.map(({ label, alerts, color, key }) => (
                  <SeverityFolder key={key} label={label} count={alerts.length} accentColor={color} storageKey={`alert-folder-${key}`}>
                    {renderTypes(alerts, key)}
                  </SeverityFolder>
                ))}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
