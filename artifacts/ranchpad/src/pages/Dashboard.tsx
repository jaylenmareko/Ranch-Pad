import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, AlertTriangle, CloudLightning, X, Pill, Baby, Calendar, Stethoscope, Users, CheckCircle2, Upload, Loader2, XCircle, CheckCircle, Lock, Droplets, Wind, RefreshCw, ScanLine, ChevronDown } from "lucide-react";
import { useListAnimals, useListAlerts, useGetWeather, useDismissAlert, useGenerateAlerts, getGetWeatherQueryKey, useGetUpcoming, getGetUpcomingQueryKey, type Animal } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, differenceInDays, parseISO, addDays } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useAuthModal } from "@/contexts/auth-modal-context";
import { useRanch } from "@/contexts/ranch-context";
import { formatDate, formatDateTime } from "@/lib/utils";
import { EmptyHerdOverlay } from "@/components/EmptyHerdOverlay";



const INVARIANT_PLURAL = new Set(["Cattle", "Sheep", "Bison", "Deer"]);
function pluralizeSpecies(species: string) {
  return INVARIANT_PLURAL.has(species) ? species : `${species}s`;
}

// ─── Guest Dashboard ──────────────────────────────────────────────────────────


// ─── Weather Alert Row ────────────────────────────────────────────────────────

function WeatherAlertRow({ alert, onDismiss }: {
  alert: { id: number; severity: string; summary?: string | null; message: string; alertType: string; generatedAt: string; animalId?: number | null; animalName?: string | null };
  onDismiss: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const dotColor = alert.severity === 'critical'
    ? 'bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.6)]'
    : alert.severity === 'high'
      ? 'bg-destructive shadow-[0_0_10px_rgba(255,0,0,0.5)]'
      : alert.severity === 'moderate' || alert.severity === 'medium'
        ? 'bg-yellow-500'
        : 'bg-green-500';
  const getFirstSentence = (msg: string) => msg.match(/^(.+?[.!?])(?:\s|$)/)?.[1] ?? msg;
  const collapsedText = alert.summary ?? getFirstSentence(alert.message);
  const hasDetail = !!(alert.summary || alert.message.length > collapsedText.length);

  return (
    <div className="border-b border-border/50 last:border-b-0">
      <div
        className="p-4 md:p-5 flex gap-4 hover:bg-muted/30 transition-colors group cursor-pointer"
        onClick={() => hasDetail && setExpanded(v => !v)}
      >
        <div className="mt-1.5 shrink-0"><div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} /></div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-snug">{collapsedText}</p>
          {!expanded && hasDetail && (
            <span className="text-xs font-semibold text-primary/70 mt-1 inline-flex items-center gap-0.5">
              See details <ChevronDown className="w-3 h-3" />
            </span>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-1">
          <button
            onClick={e => { e.stopPropagation(); onDismiss(alert.id); }}
            className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-2.5 min-w-[44px] min-h-[44px] text-muted-foreground hover:bg-muted hover:text-foreground rounded-full transition-all flex items-center justify-center"
            aria-label="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: expanded ? '400px' : '0px', opacity: expanded ? 1 : 0 }}
      >
        <div className="px-4 md:px-5 pb-4 pt-0 border-t border-border/40 ml-6 md:ml-7">
          <div className="pt-3 space-y-2">
            <p className="text-sm leading-relaxed text-foreground/85 whitespace-pre-line">{alert.message}</p>
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {alert.alertType.replace(/_/g, ' ')}
              </span>
              <span className="text-[10px] text-muted-foreground/50">•</span>
              <span className="text-[10px] text-muted-foreground">{formatDateTime(alert.generatedAt)}</span>
              <button
                onClick={() => onDismiss(alert.id)}
                className="ml-auto text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Auth Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  return <AuthDashboard />;
}

function AuthDashboard() {
  const { role } = useAuth();
  const { activeRanch } = useRanch();
  const queryClient = useQueryClient();
  const { data: animals, isLoading: animalsLoading } = useListAnimals();
  const { data: cullAnimals } = useQuery<Animal[]>({
    queryKey: ["/api/animals", { cull: true }],
    queryFn: async () => {
      const res = await fetch("/api/animals?cull=true");
      if (!res.ok) throw new Error("Failed to load cull animals");
      return res.json();
    },
  });
  const { data: alerts, isLoading: alertsLoading, refetch: refetchAlerts } = useListAlerts();
  const { data: weather, isLoading: weatherLoading, refetch: refetchWeather, isFetching: weatherFetching } = useGetWeather({ query: { queryKey: getGetWeatherQueryKey(), retry: false } });
  const { data: upcoming, isLoading: upcomingLoading } = useGetUpcoming();

  const generateMutation = useGenerateAlerts({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
        refetchAlerts();
      }
    }
  });

  const dismissMutation = useDismissAlert({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/alerts"] })
    }
  });

  const [resolvingMedIds, setResolvingMedIds] = useState<Set<number>>(new Set());

  const markMedResolved = async (med: { id: number; animalId: number; medicationName: string }) => {
    setResolvingMedIds(prev => new Set(prev).add(med.id));
    try {
      await fetch(`/api/animals/${med.animalId}/medications/${med.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicationName: med.medicationName,
          dateGiven: format(new Date(), "yyyy-MM-dd"),
          nextDueDate: null,
        }),
      });
      queryClient.invalidateQueries({ queryKey: getGetUpcomingQueryKey() });
    } finally {
      setResolvingMedIds(prev => { const s = new Set(prev); s.delete(med.id); return s; });
    }
  };

  const speciesCounts = React.useMemo(() => {
    if (!animals) return {};
    return animals.reduce((acc, animal) => {
      acc[animal.species] = (acc[animal.species] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [animals]);

  const avgAgeMonths = React.useMemo(() => {
    if (!animals || animals.length === 0) return null;
    const now = new Date();
    const totalMonths = animals.reduce((sum, a) => {
      if (!a.dateOfBirth) return sum;
      const dob = new Date(a.dateOfBirth);
      return sum + (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
    }, 0);
    const counted = animals.filter(a => a.dateOfBirth).length;
    return counted > 0 ? Math.round(totalMonths / counted) : null;
  }, [animals]);

  const femaleCount = React.useMemo(() => animals?.filter(a => a.sex === "Female").length ?? 0, [animals]);
  const maleCount = React.useMemo(() => animals?.filter(a => a.sex === "Male").length ?? 0, [animals]);

  const activeAlerts = alerts?.filter(a => !a.isDismissed) || [];
  const weatherAlerts = activeAlerts.filter(a => a.alertType === 'weather_forecast');
  const sortedWeatherAlerts = [...weatherAlerts].sort((a, b) => {
    const weights: Record<string, number> = { critical: 4, high: 3, moderate: 2, medium: 2, low: 1 };
    return (weights[b.severity] ?? 0) - (weights[a.severity] ?? 0);
  });

  const totalAnimals = animals?.length ?? 0;
  // Stat tile links to Action Center which only shows non-weather alerts — count must match
  const activeAlertCount = activeAlerts.filter(a => a.alertType !== 'weather_forecast').length;
  const overdueMedsCount = upcoming?.overdueMedsCount ?? 0;
  const dueSoonCount = upcoming?.dueSoonCount ?? 0;

  const hasNoAnimals = !animalsLoading && animals !== undefined && animals.length === 0 && Array.isArray(cullAnimals) && cullAnimals.length === 0;

  return (
    <div className="space-y-5 max-w-lg mx-auto pb-20">
      {hasNoAnimals ? (
        <EmptyHerdOverlay role={role ?? undefined} />
      ) : (
      <>

      {/* Greeting */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-foreground">{activeRanch?.name ?? "Dashboard"}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{format(new Date(), "EEEE, MMMM d")}</p>
        </div>
      </div>

      {/* Disease Risk This Week */}
      <div className="rounded-2xl border-2 border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CloudLightning className="w-4 h-4 text-primary shrink-0" />
            <h3 className="font-bold text-sm text-foreground">
              Disease Risk &middot; {format(new Date(), "MMM d")}–{
                weather?.forecast?.length
                  ? format(parseISO(weather.forecast[weather.forecast.length - 1].date), "MMM d")
                  : format(addDays(new Date(), 4), "MMM d")
              }
            </h3>
            {weatherAlerts.length > 0 && (
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive">{weatherAlerts.length}</span>
            )}
          </div>
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-semibold bg-muted border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3 h-3 ${generateMutation.isPending ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Weather strip */}
        {!weatherLoading && weather && (
          <div className="px-4 py-2 bg-muted/20 border-b border-border/40 flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
            <img src={`https://openweathermap.org/img/wn/${weather.current.icon}.png`} alt="" className="w-5 h-5 opacity-70" />
            <span className="font-bold text-foreground">{Math.round(weather.current.temp)}°F</span>
            <span className="capitalize">{weather.current.description}</span>
            <span className="opacity-40">·</span>
            <span className="flex items-center gap-1"><Droplets className="w-3 h-3" />{weather.current.humidity}%</span>
            <span className="flex items-center gap-1"><Wind className="w-3 h-3" />{Math.round(weather.current.windSpeed)} mph</span>
          </div>
        )}

        {alertsLoading ? (
          <div className="p-4 space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-muted animate-pulse rounded-xl" />)}</div>
        ) : sortedWeatherAlerts.length === 0 ? (
          <div className="flex flex-col">
            <div className="flex flex-col items-center justify-center py-5 text-center px-4 gap-1">
              <CheckCircle2 className="w-7 h-7 text-green-500/50 mb-0.5" />
              <p className="font-bold text-sm text-foreground">All clear</p>
              <p className="text-xs text-muted-foreground">No active weather alerts for your herd.</p>
            </div>
            <div className="border-t border-dashed border-border/50 mx-4" />
            <div className="mx-4 mb-3 mt-3 px-3 py-1.5 rounded-lg bg-muted/60 border border-border/60 flex items-center gap-2">
              <span className="text-sm font-black text-muted-foreground uppercase tracking-widest">Example Alert</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="divide-y divide-border/40 opacity-40 pointer-events-none select-none">
              {[
                { color: "bg-red-600", text: "#114 — FAMACHA score declined 3→4→5 over 6 weeks. Barber pole worm burden likely critical with 2.1\" of rain this week." },
              ].map((ex, i) => (
                <div key={i} className="p-4 flex gap-3">
                  <div className="mt-1.5 shrink-0"><div className={`w-2.5 h-2.5 rounded-full ${ex.color}`} /></div>
                  <p className="text-sm text-foreground leading-snug">{ex.text}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            {sortedWeatherAlerts.map(alert => (
              <WeatherAlertRow
                key={alert.id}
                alert={alert}
                onDismiss={(id) => dismissMutation.mutate({ alertId: id })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Upcoming */}
      <div className="rounded-2xl border-2 border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-primary shrink-0" />
          <h3 className="font-bold text-sm text-foreground">Upcoming</h3>
        </div>

        {upcomingLoading ? (
          <div className="p-4 space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded-xl" />)}</div>
        ) : (!upcoming || (upcoming.medications.length === 0 && upcoming.pregnancies.length === 0)) ? (
          <div className="flex flex-col items-center justify-center p-7 text-center gap-1">
            <CheckCircle2 className="w-7 h-7 text-green-500/50 mb-0.5" />
            <p className="font-bold text-sm text-foreground">All clear</p>
            <p className="text-xs text-muted-foreground">No medications or births due soon.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {upcoming.medications.length > 0 && (
              <div className="p-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5" /> Medications
                </p>
                <div className="space-y-2.5">
                  {upcoming.medications.map(med => {
                    const daysUntil = differenceInDays(parseISO(med.nextDueDate), new Date());
                    const isResolving = resolvingMedIds.has(med.id);
                    return (
                      <div key={med.id} className="flex items-center gap-2">
                        <Link href={`/animals/${med.animalId}`} className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {med.animalName}{med.animalSubLabel ? <span className="font-normal text-muted-foreground ml-1">{med.animalSubLabel}</span> : null}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{med.medicationName}</p>
                        </Link>
                        <span className={`text-xs font-bold shrink-0 px-2 py-0.5 rounded-full ${med.isOverdue ? "bg-destructive/10 text-destructive" : "bg-yellow-500/10 text-yellow-400"}`}>
                          {med.isOverdue ? `${Math.abs(daysUntil)}d overdue` : daysUntil === 0 ? "Today" : `${daysUntil}d`}
                        </span>
                        {role !== "viewer" && (
                          <button
                            onClick={() => markMedResolved(med)}
                            disabled={isResolving}
                            className="shrink-0 inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-semibold bg-muted border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50"
                          >
                            {isResolving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                            {isResolving ? "…" : "Done"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {upcoming.pregnancies.length > 0 && (
              <div className="p-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Baby className="w-3.5 h-3.5" /> Expected Births
                </p>
                <div className="space-y-2">
                  {upcoming.pregnancies.map(preg => {
                    const daysUntil = differenceInDays(parseISO(preg.expectedDueDate), new Date());
                    return (
                      <Link key={preg.animalId} href={`/animals/${preg.animalId}`} className="flex items-center justify-between gap-2 hover:bg-muted/40 rounded-lg px-2 py-1 -mx-2 transition-colors">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {preg.animalName}{preg.animalSubLabel ? <span className="font-normal text-muted-foreground ml-1">{preg.animalSubLabel}</span> : null}
                          </p>
                          <p className="text-xs text-muted-foreground">{preg.species}</p>
                        </div>
                        <span className={`text-xs font-bold shrink-0 px-2 py-0.5 rounded-full ${daysUntil < 0 ? "bg-destructive/10 text-destructive" : daysUntil <= 7 ? "bg-yellow-500/10 text-yellow-400" : "bg-blue-500/10 text-blue-400"}`}>
                          {daysUntil < 0 ? "Overdue" : daysUntil === 0 ? "Today" : `${daysUntil}d`}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>


      </>
      )}
    </div>
  );
}

