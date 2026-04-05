import React, { useRef, useState } from "react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info, CheckCircle2, PawPrint, ChevronDown, Cloud } from "lucide-react";
import { useListAlerts, useDismissAlert, useListAnimals, useGenerateAlerts, type Alert, type Animal } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDate } from "@/lib/utils";
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
  const recordAlerts = activeAlerts.filter(a => a.alertType !== 'weather_forecast');
  const weatherAlerts = activeAlerts.filter(a => a.alertType === 'weather_forecast');

  const getSeverityIcon = (sev: string) => {
    if (sev === 'critical') return <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />;
    if (sev === 'high') return <AlertTriangle className="w-5 h-5 text-destructive" />;
    if (sev === 'moderate' || sev === 'medium') return <Info className="w-5 h-5 text-yellow-500" />;
    return <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />;
  };

  const getSeverityColor = (sev: string) => {
    if (sev === 'critical') return "bg-red-600/15 border-red-600/25 text-red-700 dark:text-red-400";
    if (sev === 'high') return "bg-destructive/10 border-destructive/20 text-destructive";
    if (sev === 'moderate' || sev === 'medium') return "bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400";
    return "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400";
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
        <h1 className="text-xl font-black text-foreground whitespace-nowrap">Action Center</h1>
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

    const severityLabel = getSeverityLabel(alert.severity);
    const animalLabel = buildAnimalLabel(alert);
    const firstSentence = getFirstSentence(alert.message);
    const hasMoreContent = alert.message.length > firstSentence.length;

    return (
      <div className={`rounded-2xl border transition-all ${getSeverityColor(alert.severity)}`}>
        <div className="p-4 md:p-5">
          <div className="flex items-start gap-4">
            <div className="shrink-0 mt-0.5 bg-background rounded-full p-2 shadow-sm border border-border/50">
              {getSeverityIcon(alert.severity)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm md:text-base leading-snug text-foreground">
                <span className="font-bold uppercase tracking-wide mr-1.5">{severityLabel}</span>
                {animalLabel ? (
                  <>
                    <span className="opacity-60 mr-1.5">—</span>
                    {alert.animalId ? (
                      <Link href={`/animals/${alert.animalId}`} className="hover:underline mr-1">
                        {animalLabel}
                      </Link>
                    ) : (
                      <span className="mr-1">{animalLabel}</span>
                    )}
                    <span className="opacity-60 mr-1.5">:</span>
                  </>
                ) : null}
                <span className="font-medium opacity-90">{firstSentence}</span>
                {!expanded && hasMoreContent && (
                  <button
                    onClick={() => setExpanded(true)}
                    className="inline-flex items-center gap-0.5 ml-1.5 text-xs font-semibold opacity-60 hover:opacity-100 transition-opacity whitespace-nowrap"
                  >
                    See details <ChevronDown className="w-3 h-3" />
                  </button>
                )}
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 bg-background/50 hover:bg-background border-transparent shadow-none min-h-[40px] hidden md:flex"
                onClick={() => dismissMutation.mutate({ alertId: alert.id })}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Resolved
              </Button>
              {hasMoreContent && (
                <button
                  onClick={() => setExpanded(v => !v)}
                  className={`p-1.5 rounded-lg hover:bg-background/50 transition-all ${expanded ? 'opacity-80' : 'opacity-50 hover:opacity-80'}`}
                  aria-label={expanded ? "Collapse details" : "Expand details"}
                >
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>
          </div>
          <div className="mt-3 md:hidden">
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-background/50 hover:bg-background border-transparent shadow-none min-h-[44px]"
              onClick={() => dismissMutation.mutate({ alertId: alert.id })}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Resolved
            </Button>
          </div>
        </div>

        <div
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{ maxHeight: expanded ? '600px' : '0px', opacity: expanded ? 1 : 0 }}
        >
          <div className="px-4 md:px-5 pb-4 md:pb-5 pt-0 border-t border-current/10">
            <div className="pt-3 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider opacity-60">
                  {alert.alertType.replace(/_/g, ' ')}
                </span>
                <span className="text-xs opacity-40">•</span>
                <span className="text-xs opacity-60">{formatDate(alert.generatedAt)}</span>
                <Badge variant="outline" className={`text-[10px] font-bold uppercase px-1.5 py-0 leading-4 border ${
                  alert.severity === 'critical' ? 'border-red-500/40 text-red-600 dark:text-red-400 bg-red-500/10' :
                  alert.severity === 'high' ? 'border-destructive/40 text-destructive bg-destructive/10' :
                  (alert.severity === 'moderate' || alert.severity === 'medium') ? 'border-yellow-500/40 text-yellow-600 dark:text-yellow-400 bg-yellow-500/10' :
                  'border-green-500/40 text-green-600 dark:text-green-400 bg-green-500/10'
                }`}>
                  {getSeverityLabel(alert.severity)}
                </Badge>
              </div>
              <p className="text-sm md:text-base leading-relaxed text-foreground/90 whitespace-pre-line">
                {alert.message}
              </p>
              <div className="pt-1 hidden md:block">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-background/50 hover:bg-background border-transparent shadow-none"
                  onClick={() => dismissMutation.mutate({ alertId: alert.id })}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Resolved
                </Button>
              </div>
            </div>
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
            <h1 className="text-xl font-black text-foreground whitespace-nowrap">Action Center</h1>
          </div>

          {importError && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">{importError}</p>
          )}

          {isLoading || animalsLoading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-24 bg-card rounded-2xl animate-pulse" />)}
            </div>
          ) : recordAlerts.length === 0 && weatherAlerts.length === 0 ? (
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
            <>
              {recordAlerts.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-display font-bold text-xl flex items-center gap-2">
                    <PawPrint className="w-5 h-5 text-accent" /> Herd Health &amp; Tasks
                  </h3>
                  <div className="grid gap-3">
                    {recordAlerts.map(a => <AlertRow key={a.id} alert={a} />)}
                  </div>
                </div>
              )}
              {weatherAlerts.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-display font-bold text-xl flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-accent" /> Weather Forecast Risks
                  </h3>
                  <div className="grid gap-3">
                    {weatherAlerts.map(a => <AlertRow key={a.id} alert={a} />)}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
