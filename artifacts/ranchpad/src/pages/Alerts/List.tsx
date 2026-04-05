import React, { useRef, useState } from "react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info, CheckCircle2, PawPrint, ChevronDown } from "lucide-react";
import { useListAlerts, useDismissAlert, useListAnimals, useGenerateAlerts, type Alert, type Animal } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDate } from "@/lib/utils";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useAuthModal } from "@/contexts/auth-modal-context";
import { EmptyHerdOverlay } from "@/components/EmptyHerdOverlay";
import { ScanPhotoDialog } from "@/components/ScanPhotoDialog";
import { ImportModeDialog } from "@/components/ImportModeDialog";

export default function AlertsList() {
  const { isAuthenticated, role } = useAuth();
  const { openLogin, openSignup } = useAuthModal();
  const queryClient = useQueryClient();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanOpen, setScanOpen] = useState(false);
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
  const DASHBOARD_ONLY_PREFIXES = ['overdue_med_', 'due_soon_med_', 'calving_soon_', 'calving_due_'];
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

  const buildAnimalLabel = (alert: Alert): string | null => {
    if (!alert.animalName) return null;
    const parts: string[] = [];
    if (alert.animalTagNumber) parts.push(`#${alert.animalTagNumber}`);
    if (alert.animalSpecies) parts.push(alert.animalSpecies);
    return parts.length > 0 ? `${alert.animalName} (${parts.join(", ")})` : alert.animalName;
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

    const accent = getSeverityAccent(alert.severity);
    const severityLabel = getSeverityLabel(alert.severity);
    const animalLabel = buildAnimalLabel(alert);
    const firstSentence = getFirstSentence(alert.message);
    const hasMoreContent = alert.message.length > firstSentence.length;

    return (
      <div
        className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden"
        style={{ borderLeft: `4px solid ${accent.border}` }}
      >
        {/* Header row */}
        <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Severity badge */}
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${accent.badge}`}>
              <span className={accent.icon}>{getSeverityIcon(alert.severity)}</span>
              {severityLabel}
            </span>
            {/* Animal chip */}
            {animalLabel && (
              alert.animalId ? (
                <Link
                  href={`/animals/${alert.animalId}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-muted border border-border text-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  {animalLabel}
                </Link>
              ) : (
                <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-muted border border-border text-foreground">
                  {animalLabel}
                </span>
              )
            )}
          </div>
          {/* Timestamp */}
          <span className="text-xs text-muted-foreground/60 shrink-0 mt-0.5 whitespace-nowrap">
            {format(new Date(alert.generatedAt), "MMM d · h:mm a")}
          </span>
        </div>

        {/* Message */}
        <div className="px-4 pb-4">
          <p className="text-sm md:text-[15px] text-foreground/85 leading-relaxed">
            {expanded ? alert.message : firstSentence}
          </p>

          {/* Action bar */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
            <div>
              {hasMoreContent && (
                <button
                  onClick={() => setExpanded(v => !v)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  {expanded ? "Collapse" : "See details"}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>
            <button
              onClick={() => dismissMutation.mutate({ alertId: alert.id })}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold bg-muted border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Mark Resolved
            </button>
          </div>
        </div>
      </div>
    );
  };

  const hasNoAnimals = !animalsLoading && animals !== undefined && animals.length === 0;

  return (
    <div className="space-y-8">
      <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />
      <ImportModeDialog
        open={modeDialogOpen}
        onOpenChange={setModeDialogOpen}
        onAdd={() => pendingFile && doImport(pendingFile, false)}
        onReplace={() => pendingFile && doImport(pendingFile, true)}
      />
      <ScanPhotoDialog open={scanOpen} onOpenChange={setScanOpen} />

      {hasNoAnimals ? (
        <EmptyHerdOverlay
          onScan={() => setScanOpen(true)}
          onImportClick={() => fileInputRef.current?.click()}
          role={role ?? undefined}
        />
      ) : (
        <>
          <div>
            <h1 className="text-xl font-black text-foreground whitespace-nowrap">Alerts</h1>
          </div>

          {importError && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">{importError}</p>
          )}

          {isLoading || animalsLoading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-24 bg-card rounded-2xl animate-pulse" />)}
            </div>
          ) : recordAlerts.length === 0 ? (
            <div className="text-center py-24 bg-card rounded-3xl border border-border">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-2xl font-display font-bold text-foreground">You're all caught up!</h3>
              <p className="text-muted-foreground mt-2 max-w-sm mx-auto font-medium">
                No active alerts or pending tasks for your herd.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-display font-bold text-xl flex items-center gap-2">
                <PawPrint className="w-5 h-5 text-accent" /> Herd Health &amp; Tasks
              </h3>
              <div className="grid gap-3">
                {recordAlerts.map(a => <AlertRow key={a.id} alert={a} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
