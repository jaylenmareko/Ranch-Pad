import React, { useState } from "react";
import { Link } from "wouter";
import { CloudLightning, X, Pill, Baby, Stethoscope, CheckCircle2, Loader2, RefreshCw, ChevronDown, ArrowDown } from "lucide-react";
import { useListAnimals, useListAlerts, useGetWeather, useDismissAlert, useGenerateAlerts, getGetWeatherQueryKey, useGetUpcoming, getGetUpcomingQueryKey, type Animal } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
// Animal type used for cull query typing
import { format, differenceInDays, parseISO, addDays } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useAuthModal } from "@/contexts/auth-modal-context";
import { useRanch } from "@/contexts/ranch-context";
import { formatDate, formatDateTime } from "@/lib/utils";
import { EmptyHerdOverlay } from "@/components/EmptyHerdOverlay";
import "./Dashboard.css";

const INVARIANT_PLURAL = new Set(["Cattle", "Sheep", "Bison", "Deer"]);
function pluralizeSpecies(species: string) {
  return INVARIANT_PLURAL.has(species) ? species : `${species}s`;
}

// ─── Weather Alert Row ────────────────────────────────────────────────────────

function WeatherAlertRow({ alert, onDismiss }: {
  alert: { id: number; severity: string; summary?: string | null; message: string; alertType: string; generatedAt: string; animalId?: number | null; animalName?: string | null };
  onDismiss: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const dotClass = alert.severity === "critical" ? "critical"
    : alert.severity === "high" ? "high"
    : alert.severity === "moderate" || alert.severity === "medium" ? "moderate"
    : "low";
  const getFirstSentence = (msg: string) => msg.match(/^(.+?[.!?])(?:\s|$)/)?.[1] ?? msg;
  const collapsedText = alert.summary ?? getFirstSentence(alert.message);
  const hasDetail = !!(alert.summary || alert.message.length > collapsedText.length);

  return (
    <div className="dash-alert-row" onClick={() => hasDetail && setExpanded(v => !v)}>
      <div className={`dash-alert-dot ${dotClass}`} />
      <div className="dash-alert-row-text">
        <div className="dash-alert-row-msg">{collapsedText}</div>
        {!expanded && hasDetail && (
          <span className="dash-alert-row-expand">
            See details <ChevronDown style={{ width: 11, height: 11 }} />
          </span>
        )}
        <div
          className="dash-alert-row-detail"
          style={{ maxHeight: expanded ? "400px" : "0px", opacity: expanded ? 1 : 0 }}
        >
          <div className="dash-alert-row-detail-inner">
            <p style={{ marginBottom: 8, whiteSpace: "pre-line" }}>{alert.message}</p>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#8A9A93", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                {alert.alertType.replace(/_/g, " ")}
              </span>
              <span style={{ fontSize: 9, color: "#8A9A93" }}>·</span>
              <span style={{ fontSize: 10, color: "#8A9A93" }}>{formatDateTime(alert.generatedAt)}</span>
              <button
                onClick={e => { e.stopPropagation(); onDismiss(alert.id); }}
                style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: "#8A9A93", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
              >
                <CheckCircle2 style={{ width: 13, height: 13 }} /> Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
      <button
        className="dash-dismiss-btn"
        onClick={e => { e.stopPropagation(); onDismiss(alert.id); }}
        aria-label="Dismiss alert"
      >
        <X style={{ width: 14, height: 14 }} />
      </button>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

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
  const { data: weather, isLoading: weatherLoading } = useGetWeather({ query: { queryKey: getGetWeatherQueryKey(), retry: false } });
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

  const activeAlerts = alerts?.filter(a => !a.isDismissed) || [];
  const weatherAlerts = activeAlerts.filter(a => a.alertType === "weather_forecast");
  const sortedWeatherAlerts = [...weatherAlerts].sort((a, b) => {
    const weights: Record<string, number> = { critical: 4, high: 3, moderate: 2, medium: 2, low: 1 };
    return (weights[b.severity] ?? 0) - (weights[a.severity] ?? 0);
  });

  const activeAlertCount = activeAlerts.filter(a => a.alertType !== "weather_forecast").length;

  const hasNoAnimals = !animalsLoading && animals !== undefined && animals.length === 0 && Array.isArray(cullAnimals) && cullAnimals.length === 0;

  return (
    <div className="dash-page">
      {hasNoAnimals ? (
        <div style={{ padding: 16 }}>
          <EmptyHerdOverlay role={role ?? undefined} />
        </div>
      ) : (
        <>
          {/* ── Header ── */}
          <div className="dash-header">
            <div className="dash-header-top">
              <div>
                <div className="dash-greeting">{format(new Date(), "EEEE, MMMM d")}</div>
                <div className="dash-ranch-name">{activeRanch?.name ?? "Dashboard"}</div>
              </div>
            </div>

            {/* Weather strip */}
            {!weatherLoading && weather && (
              <div className="dash-weather-strip">
                <img
                  src={`https://openweathermap.org/img/wn/${weather.current.icon}.png`}
                  alt=""
                  style={{ width: 32, height: 32 }}
                />
                <span className="dash-weather-temp">{Math.round(weather.current.temp)}°F</span>
                <span className="dash-weather-desc">{weather.current.description}</span>
                <div className="dash-weather-details">
                  <div className="dash-weather-detail">
                    <span className="dash-weather-detail-label">Humidity</span>
                    <span className="dash-weather-detail-val">{weather.current.humidity}%</span>
                  </div>
                  <div className="dash-weather-detail">
                    <span className="dash-weather-detail-label">Wind</span>
                    <span className="dash-weather-detail-val">{Math.round(weather.current.windSpeed)} mph</span>
                  </div>
                </div>
              </div>
            )}
            {/* Spacer so header blends into cream bg */}
            <div style={{ height: 14 }} />
          </div>

          {/* ── Disease Risk / Weather Alerts ── */}
          <div className="dash-section">
            <div className="dash-section-header">
              <div className="dash-section-title">
                <CloudLightning style={{ width: 14, height: 14 }} />
                Disease Risk · {format(new Date(), "MMM d")}–{
                  weather?.forecast?.length
                    ? format(parseISO(weather.forecast[weather.forecast.length - 1].date), "MMM d")
                    : format(addDays(new Date(), 4), "MMM d")
                }
                {weatherAlerts.length > 0 && (
                  <span className="dash-section-count">{weatherAlerts.length}</span>
                )}
              </div>
              <button
                className="dash-refresh-btn"
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
              >
                <RefreshCw style={{ width: 11, height: 11, ...(generateMutation.isPending ? { animation: "spin 1s linear infinite" } : {}) }} />
                Refresh
              </button>
            </div>

            <div className="dash-section-body">
              {alertsLoading ? (
                <>
                  <div className="dash-skeleton" />
                  <div className="dash-skeleton" />
                </>
              ) : sortedWeatherAlerts.length === 0 ? (
                <>
                  <div className="dash-empty">
                    <div className="dash-empty-icon">✅</div>
                    <div className="dash-empty-title">All clear</div>
                    <div className="dash-empty-sub">No active weather alerts for your herd.</div>
                  </div>
                  <div style={{ borderTop: "1px dashed #D5E2D8", margin: "0 14px" }} />
                  <div className="dash-example-label">
                    <ArrowDown style={{ width: 12, height: 12 }} />
                    Example Alert
                  </div>
                  <div style={{ opacity: 0.4, pointerEvents: "none" }}>
                    <div className="dash-alert-row">
                      <div className="dash-alert-dot critical" />
                      <div className="dash-alert-row-text">
                        <div className="dash-alert-row-msg">
                          #114 — FAMACHA score declined 3→4→5 over 6 weeks. Barber pole worm burden likely critical with 2.1" of rain this week.
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                sortedWeatherAlerts.map(alert => (
                  <WeatherAlertRow
                    key={alert.id}
                    alert={alert}
                    onDismiss={(id) => dismissMutation.mutate({ alertId: id })}
                  />
                ))
              )}
            </div>
          </div>

          {/* ── Upcoming ── */}
          <div className="dash-section">
            <div className="dash-section-header">
              <div className="dash-section-title">
                <Stethoscope style={{ width: 14, height: 14 }} />
                Upcoming
              </div>
            </div>
            <div className="dash-section-body">
              {upcomingLoading ? (
                <>
                  <div className="dash-skeleton" />
                  <div className="dash-skeleton" />
                </>
              ) : (!upcoming || (upcoming.medications.length === 0 && upcoming.pregnancies.length === 0)) ? (
                <div className="dash-empty">
                  <div className="dash-empty-icon">✅</div>
                  <div className="dash-empty-title">All clear</div>
                  <div className="dash-empty-sub">No medications or births due soon.</div>
                </div>
              ) : (
                <>
                  {upcoming.medications.length > 0 && (
                    <>
                      <div className="dash-sub-section-label">
                        <Pill style={{ width: 12, height: 12 }} />
                        Medications
                      </div>
                      {upcoming.medications.map(med => {
                        const daysUntil = differenceInDays(parseISO(med.nextDueDate), new Date());
                        const isResolving = resolvingMedIds.has(med.id);
                        const badgeClass = med.isOverdue ? "overdue" : daysUntil === 0 ? "today" : "soon";
                        const badgeText = med.isOverdue ? `${Math.abs(daysUntil)}d overdue` : daysUntil === 0 ? "Today" : `${daysUntil}d`;
                        return (
                          <div key={med.id} className="dash-up-row">
                            <Link href={`/animals/${med.animalId}`} style={{ flex: 1, minWidth: 0, textDecoration: "none" }}>
                              <div className="dash-up-name">
                                {med.animalName}
                                {med.animalSubLabel && <span className="dash-up-sub"> {med.animalSubLabel}</span>}
                              </div>
                              <div className="dash-animal-meta">{med.medicationName}</div>
                            </Link>
                            <span className={`dash-up-badge ${badgeClass}`}>{badgeText}</span>
                            {role !== "viewer" && (
                              <button
                                className="dash-done-btn"
                                onClick={() => markMedResolved(med)}
                                disabled={isResolving}
                              >
                                {isResolving
                                  ? <Loader2 style={{ width: 11, height: 11, animation: "spin 1s linear infinite" }} />
                                  : <CheckCircle2 style={{ width: 11, height: 11 }} />
                                }
                                {isResolving ? "…" : "Done"}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </>
                  )}
                  {upcoming.pregnancies.length > 0 && (
                    <>
                      <div className="dash-sub-section-label" style={{ borderTop: upcoming.medications.length > 0 ? "1px solid #EAF0EC" : undefined, paddingTop: 10 }}>
                        <Baby style={{ width: 12, height: 12 }} />
                        Expected Births
                      </div>
                      {upcoming.pregnancies.map(preg => {
                        const daysUntil = differenceInDays(parseISO(preg.expectedDueDate), new Date());
                        const badgeClass = daysUntil < 0 ? "overdue" : daysUntil === 0 ? "today" : daysUntil <= 7 ? "soon" : "future";
                        const badgeText = daysUntil < 0 ? "Overdue" : daysUntil === 0 ? "Today" : `${daysUntil}d`;
                        return (
                          <Link key={preg.animalId} href={`/animals/${preg.animalId}`} className="dash-up-row">
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="dash-up-name">
                                {preg.animalName}
                                {preg.animalSubLabel && <span className="dash-up-sub"> {preg.animalSubLabel}</span>}
                              </div>
                              <div className="dash-animal-meta">{preg.species}</div>
                            </div>
                            <span className={`dash-up-badge ${badgeClass}`}>{badgeText}</span>
                          </Link>
                        );
                      })}
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── Quick Links — owner only ── */}
          {role === "owner" && (
            <div className="dash-section" style={{ margin: "14px 16px 0" }}>
              <div className="dash-section-header">
                <span className="dash-section-title">Quick Links</span>
              </div>
              <Link href="/team" className="dash-quick-link">
                <div className="dash-quick-link-icon">👥</div>
                <div className="dash-quick-link-body">
                  <div className="dash-quick-link-title">Team</div>
                  <div className="dash-quick-link-sub">Manage ranch members</div>
                </div>
                <span className="dash-quick-link-chevron">›</span>
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
