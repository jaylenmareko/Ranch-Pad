import React, { useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { AlertTriangle, Info, CheckCircle2, ChevronDown } from "lucide-react";
import { useListAlerts, useDismissAlert, useListAnimals, useGenerateAlerts, type Alert, type Animal } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useAuthModal } from "@/contexts/auth-modal-context";
import { EmptyHerdOverlay } from "@/components/EmptyHerdOverlay";
import { ImportModeDialog } from "@/components/ImportModeDialog";

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
    <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-sm" style={{ borderLeft: `4px solid ${accentColor}` }}>
      <button
        onClick={toggle}
        className="relative w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/3 transition-colors text-left"
      >
        <ChevronDown
          className="w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200"
          style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}
        />
        <span className="font-bold text-sm text-foreground">{label}</span>
        <span className="flex-1" />
        {!open && (
          <span className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground/40 pointer-events-none">
            tap to open
          </span>
        )}
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
        >
          {count} {count === 1 ? 'alert' : 'alerts'}
        </span>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2 border-t border-border/50 pt-3">
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
    <div className="rounded-xl border border-border/60 bg-background/30 overflow-hidden">
      <button
        onClick={toggle}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/3 transition-colors text-left"
      >
        <span className="text-muted-foreground shrink-0">{icon}</span>
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <span className="flex-1 text-center text-xs text-muted-foreground/40 pointer-events-none">
          {!open ? "tap to open" : ""}
        </span>
        <span className="text-xs text-muted-foreground font-medium">{count}</span>
        <ChevronDown
          className="w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform duration-200"
          style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}
        />
      </button>
      {open && (
        <div className="px-2.5 pb-2.5 space-y-2 border-t border-border/40 pt-2.5">
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
      <div className="space-y-6">
        <h1 className="text-xl font-black text-foreground whitespace-nowrap">Alerts</h1>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-5">
            <AlertTriangle className="w-10 h-10 text-primary/50" />
          </div>
          <h2 className="font-bold text-xl text-foreground mb-2">Herd health alerts</h2>
          <p className="text-muted-foreground text-sm max-w-xs mb-8 leading-relaxed">
            Sign up to get automatic alerts when medications are coming due, FAMACHA scores are declining, or animals have repeat health events.
          </p>
          <div className="flex gap-3">
            <button onClick={openSignup} className="inline-flex items-center justify-center h-9 px-5 rounded-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              Create Free Account
            </button>
            <button onClick={openLogin} className="inline-flex items-center justify-center h-9 px-5 rounded-lg font-medium border border-border text-foreground hover:bg-muted transition-colors">
              Log In
            </button>
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
      <div
        className="rounded-xl border-2 border-border bg-card overflow-hidden transition-colors cursor-pointer hover:border-border/80 hover:bg-card/80 active:scale-[0.99]"
        onClick={() => setExpanded(v => !v)}
      >
        {/* Top: animal + date */}
        <div className="px-3 pt-3 pb-2 flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {animalLabel ? (
              <p className="text-xs font-bold text-primary truncate mb-0.5">{animalLabel}</p>
            ) : null}
            <p className="text-xs text-muted-foreground leading-relaxed">
              {expanded ? alert.message : firstSentence}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-xs text-muted-foreground/50 whitespace-nowrap">
              {format(new Date(alert.generatedAt), "MMM d")}
            </span>
            {hasMoreContent && (
              <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground/50 transition-transform duration-150 ${expanded ? "rotate-180" : ""}`} />
            )}
          </div>
        </div>

        {/* Action bar — always visible */}
        <div className="px-3 pb-2.5 flex items-center justify-between gap-2">
          {alert.animalId ? (
            <button
              onClick={e => { e.stopPropagation(); navigate(`/animals/${alert.animalId}?from=alerts`); }}
              className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
            >
              View Animal →
            </button>
          ) : <span />}
          <button
            onClick={e => { e.stopPropagation(); dismissMutation.mutate({ alertId: alert.id }); }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground bg-muted hover:bg-accent px-2.5 py-1 rounded-lg transition-colors"
          >
            <CheckCircle2 className="w-3 h-3" /> Mark Resolved
          </button>
        </div>
      </div>
    );
  };

  const hasNoAnimals = !animalsLoading && animals !== undefined && animals.length === 0;

  return (
    <div className="space-y-5 max-w-lg mx-auto pb-20">
      <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />
      <ImportModeDialog
        open={modeDialogOpen}
        onOpenChange={setModeDialogOpen}
        onAdd={() => pendingFile && doImport(pendingFile, false)}
        onReplace={() => pendingFile && doImport(pendingFile, true)}
      />
      {hasNoAnimals ? (
        <EmptyHerdOverlay
          onImportClick={() => fileInputRef.current?.click()}
          role={role ?? undefined}
        />
      ) : (
        <>
          <h1 className="text-2xl font-black font-display text-foreground">Alerts</h1>

          {importError && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">{importError}</p>
          )}

          {isLoading || animalsLoading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-24 bg-card rounded-2xl animate-pulse" />)}
            </div>
          ) : (() => {
              const ALL_TYPES: { key: string; label: string; icon: React.ReactNode }[] = [
                { key: "severe_health_event", label: "Severe Health Events", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
                { key: "repeat_health",        label: "Repeat Health Issues",  icon: <AlertTriangle className="w-3.5 h-3.5" /> },
                { key: "famacha_decline",      label: "Declining FAMACHA",     icon: <Info className="w-3.5 h-3.5" /> },
                { key: "heat_cycle",           label: "Heat Cycle Reminders",  icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
              ];

              const high   = recordAlerts.filter(a => a.severity === 'critical' || a.severity === 'high');
              const medium = recordAlerts.filter(a => a.severity === 'moderate' || a.severity === 'medium');
              const low    = recordAlerts.filter(a => a.severity !== 'critical' && a.severity !== 'high' && a.severity !== 'moderate' && a.severity !== 'medium');

              function renderTypes(alerts: typeof recordAlerts, severityKey: string) {
                return ALL_TYPES.map(({ key: typeKey, label, icon }) => {
                  const items = alerts.filter(a => getAlertTypeKey(a.alertKey ?? undefined) === typeKey);
                  return (
                    <TypeFolder
                      key={typeKey}
                      label={label}
                      count={items.length}
                      icon={icon}
                      storageKey={`alert-type-${severityKey}-${typeKey}`}
                    >
                      {items.length === 0
                        ? <p className="text-xs text-muted-foreground px-1 py-1">No active alerts of this type.</p>
                        : items.map(a => <AlertRow key={a.id} alert={a} />)
                      }
                    </TypeFolder>
                  );
                });
              }

              const severities = [
                { label: "High",   alerts: high,   color: "#ef4444", key: "high"   },
                { label: "Medium", alerts: medium, color: "#eab308", key: "medium" },
                { label: "Low",    alerts: low,    color: "#22c55e", key: "low"    },
              ];

              return (
                <div className="space-y-3">
                  {severities.map(({ label, alerts, color, key }) => (
                    <SeverityFolder key={key} label={label} count={alerts.length} accentColor={color} storageKey={`alert-folder-${key}`}>
                      {renderTypes(alerts, key)}
                    </SeverityFolder>
                  ))}
                </div>
              );
            })()}
        </>
      )}
    </div>
  );
}
