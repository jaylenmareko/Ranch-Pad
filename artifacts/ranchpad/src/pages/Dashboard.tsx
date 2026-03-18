import React, { useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, AlertTriangle, CloudRain, Droplets, Wind, ChevronRight, X, Pill, Baby, Calendar, RefreshCw, Stethoscope, Users, CheckCircle2 } from "lucide-react";
import { useListAnimals, useListAlerts, useGetWeather, useDismissAlert, useGenerateAlerts, getGetWeatherQueryKey, useGetUpcoming } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format, differenceInDays, parseISO } from "date-fns";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { data: animals, isLoading: animalsLoading } = useListAnimals();
  const { data: alerts, isLoading: alertsLoading } = useListAlerts();
  const { data: weather, isLoading: weatherLoading, refetch: refetchWeather, isFetching: weatherFetching } = useGetWeather({ query: { queryKey: getGetWeatherQueryKey(), retry: false } });
  const { data: upcoming, isLoading: upcomingLoading } = useGetUpcoming();
  
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

  // Background sync for alerts on load
  useEffect(() => {
    generateMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculate species counts
  const speciesCounts = React.useMemo(() => {
    if (!animals) return {};
    return animals.reduce((acc, animal) => {
      acc[animal.species] = (acc[animal.species] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [animals]);

  // Fallback stats to fill empty card slots when fewer than 3 species
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
  
  // Sort alerts: high > medium > low
  const sortedAlerts = [...activeAlerts].sort((a, b) => {
    const weights = { high: 3, medium: 2, low: 1 };
    return weights[b.severity as keyof typeof weights] - weights[a.severity as keyof typeof weights];
  }).slice(0, 5); // top 5

  const totalAnimals = animals?.length ?? 0;
  const activeAlertCount = activeAlerts.length;
  const overdueMedsCount = upcoming?.overdueMedsCount ?? 0;
  const dueSoonCount = upcoming?.dueSoonCount ?? 0;

  return (
    <div className="space-y-8">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1 font-medium">{format(new Date(), "EEEE, MMMM do, yyyy")}</p>
        </div>
        <Link href="/animals/new" className="inline-flex items-center justify-center h-12 px-6 rounded-xl font-semibold bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:-translate-y-0.5 transition-transform w-full sm:w-auto">
          <PlusCircle className="w-5 h-5 mr-2" />
          Add Animal
        </Link>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link href="/animals">
          <div className="group cursor-pointer bg-card rounded-2xl border border-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Animals</p>
              <p className="text-3xl font-black font-display text-primary leading-none mt-0.5">{animalsLoading ? "—" : totalAnimals}</p>
            </div>
          </div>
        </Link>

        <Link href="/alerts">
          <div className={`group cursor-pointer rounded-2xl border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-5 flex items-center gap-4 ${activeAlertCount > 0 ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800" : "bg-card border-border"}`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${activeAlertCount > 0 ? "bg-red-100 dark:bg-red-900/50" : "bg-muted"}`}>
              <AlertTriangle className={`w-5 h-5 ${activeAlertCount > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`} />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Alerts</p>
              <p className={`text-3xl font-black font-display leading-none mt-0.5 ${activeAlertCount > 0 ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>{alertsLoading ? "—" : activeAlertCount}</p>
            </div>
          </div>
        </Link>

        <Link href="/animals">
          <div className={`group cursor-pointer rounded-2xl border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-5 flex items-center gap-4 ${overdueMedsCount > 0 ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" : "bg-card border-border"}`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${overdueMedsCount > 0 ? "bg-amber-100 dark:bg-amber-900/50" : "bg-muted"}`}>
              <Pill className={`w-5 h-5 ${overdueMedsCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`} />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Overdue Meds</p>
              <p className={`text-3xl font-black font-display leading-none mt-0.5 ${overdueMedsCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>{upcomingLoading ? "—" : overdueMedsCount}</p>
            </div>
          </div>
        </Link>

        <Link href="/animals">
          <div className={`group cursor-pointer rounded-2xl border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-5 flex items-center gap-4 ${dueSoonCount > 0 ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800" : "bg-card border-border"}`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${dueSoonCount > 0 ? "bg-blue-100 dark:bg-blue-900/50" : "bg-muted"}`}>
              <Calendar className={`w-5 h-5 ${dueSoonCount > 0 ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`} />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Due Soon</p>
              <p className={`text-3xl font-black font-display leading-none mt-0.5 ${dueSoonCount > 0 ? "text-blue-600 dark:text-blue-400" : "text-foreground"}`}>{upcomingLoading ? "—" : dueSoonCount}</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Stats & Weather */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {animalsLoading ? (
              Array(4).fill(0).map((_, i) => <div key={i} className="h-28 bg-muted animate-pulse rounded-2xl" />)
            ) : (
              <>
                <Card className="bg-gradient-to-br from-card to-card/50 border-none shadow-md shadow-black/5">
                  <CardContent className="p-5">
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Total Herd</p>
                    <p className="text-4xl font-black font-display text-primary">{animals?.length || 0}</p>
                  </CardContent>
                </Card>
                {(() => {
                  const speciesCards = Object.entries(speciesCounts).slice(0, 3).map(([species, count]) => (
                    <Card key={species} className="border-none shadow-md shadow-black/5">
                      <CardContent className="p-5">
                        <p className="text-sm font-semibold text-muted-foreground mb-1">{species}s</p>
                        <p className="text-3xl font-bold font-display text-foreground">{count}</p>
                      </CardContent>
                    </Card>
                  ));
                  const fallbacks = [
                    <Card key="female" className="border-none shadow-md shadow-black/5">
                      <CardContent className="p-5">
                        <p className="text-sm font-semibold text-muted-foreground mb-1">Female</p>
                        <p className="text-3xl font-bold font-display text-foreground">{femaleCount}</p>
                      </CardContent>
                    </Card>,
                    <Card key="male" className="border-none shadow-md shadow-black/5">
                      <CardContent className="p-5">
                        <p className="text-sm font-semibold text-muted-foreground mb-1">Male</p>
                        <p className="text-3xl font-bold font-display text-foreground">{maleCount}</p>
                      </CardContent>
                    </Card>,
                    avgAgeMonths !== null ? (
                      <Card key="age" className="border-none shadow-md shadow-black/5">
                        <CardContent className="p-5">
                          <p className="text-sm font-semibold text-muted-foreground mb-1">Avg Age</p>
                          <p className="text-3xl font-bold font-display text-foreground">{avgAgeMonths}<span className="text-base font-medium text-muted-foreground ml-1">mo</span></p>
                        </CardContent>
                      </Card>
                    ) : null,
                  ].filter(Boolean);
                  const combined = [...speciesCards, ...fallbacks.slice(0, 3 - speciesCards.length)];
                  return combined;
                })()}
              </>
            )}
          </div>

          {/* Weather Widget */}
          <Card className="overflow-hidden shadow-lg shadow-blue-500/10 relative border-blue-200 dark:border-blue-900 bg-blue-200 dark:bg-blue-900/50">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

            <CardHeader className="pb-2 border-b border-blue-100 dark:border-blue-900">
              <CardTitle className="text-xl flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <CloudRain className="w-5 h-5" /> Ranch Weather
                <button
                  onClick={() => refetchWeather()}
                  disabled={weatherFetching}
                  className="ml-auto p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/50 text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors disabled:opacity-50"
                  title="Refresh weather"
                  aria-label="Refresh weather"
                >
                  <RefreshCw className={`w-4 h-4 ${weatherFetching ? "animate-spin" : ""}`} />
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weatherLoading ? (
                <div className="h-32 flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
              ) : !weather ? (
                <div className="py-6 text-center text-muted-foreground bg-muted/30 rounded-xl">
                  <p>Weather data not available.</p>
                  <p className="text-sm mt-1">Check your ranch profile location settings.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="flex items-center gap-6">
                      <img 
                        src={`https://openweathermap.org/img/wn/${weather.current.icon}@4x.png`} 
                        alt="Weather icon"
                        className="w-24 h-24 drop-shadow-md"
                      />
                      <div>
                        <div className="text-5xl font-black font-display text-foreground">{Math.round(weather.current.temp)}°</div>
                        <p className="text-lg font-medium text-muted-foreground capitalize">{weather.current.description}</p>
                      </div>
                    </div>
                    
                    <div className="h-px w-full md:w-px md:h-16 bg-border/50" />
                    
                    <div className="flex gap-6 w-full justify-around md:justify-start">
                      <div className="text-center">
                        <Droplets className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                        <p className="text-sm font-bold text-foreground">{weather.current.humidity}%</p>
                        <p className="text-xs text-muted-foreground">Humidity</p>
                      </div>
                      <div className="text-center">
                        <Wind className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                        <p className="text-sm font-bold text-foreground">{Math.round(weather.current.windSpeed)} mph</p>
                        <p className="text-xs text-muted-foreground">Wind</p>
                      </div>
                    </div>
                  </div>

                  {weather.forecast && weather.forecast.length > 0 && (
                    <>
                      <div className="h-px bg-border/40" />
                      <div className="grid grid-cols-3 gap-3">
                        {weather.forecast.slice(0, 3).map((day) => (
                          <div key={day.date} className="text-center bg-muted/30 rounded-xl p-3">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">
                              {new Date(day.date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                            </p>
                            <img 
                              src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`}
                              alt={day.description}
                              className="w-10 h-10 mx-auto"
                            />
                            <p className="text-xs font-medium capitalize text-muted-foreground mb-1">{day.description}</p>
                            <p className="text-sm font-black text-foreground">
                              {Math.round(day.tempHigh)}° / {Math.round(day.tempLow)}°
                            </p>
                            <div className="flex justify-center gap-2 mt-1">
                              <span className="text-xs text-blue-400">{day.humidity}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Right Column: Alerts + Upcoming */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="flex flex-col border-red-200 dark:border-red-900 shadow-lg shadow-red-500/10 bg-red-200 dark:bg-red-900/50">
            <CardHeader className="border-b border-red-100 dark:border-red-900 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                  Action Needed
                </CardTitle>
                <Badge variant="outline" className="bg-card font-bold">{activeAlerts.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 flex flex-col">
              {alertsLoading ? (
                <div className="p-6 space-y-4">
                  {[1,2,3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)}
                </div>
              ) : sortedAlerts.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-bold text-lg text-foreground">All clear!</h3>
                  <p className="text-muted-foreground text-sm mt-1">Your herd is looking good. No active alerts right now.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50 overflow-y-auto max-h-[400px]">
                  {sortedAlerts.map(alert => (
                    <div key={alert.id} className="p-5 flex gap-4 hover:bg-muted/30 transition-colors group">
                      <div className="mt-0.5">
                        <div className={`w-3 h-3 rounded-full ${
                          alert.severity === 'high' ? 'bg-destructive shadow-[0_0_10px_rgba(255,0,0,0.5)]' :
                          alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground leading-tight">
                          {alert.animalName ? <Link href={`/animals/${alert.animalId}`} className="text-primary hover:underline">{alert.animalName}</Link> : null}
                          {alert.animalName ? ' - ' : ''}
                          {alert.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1.5 font-medium uppercase tracking-wider">{alert.alertType.replace(/_/g, ' ')}</p>
                      </div>
                      <button
                        onClick={() => dismissMutation.mutate({ alertId: alert.id })}
                        className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-2.5 min-w-[44px] min-h-[44px] text-muted-foreground hover:bg-muted hover:text-foreground rounded-full transition-all shrink-0 self-start flex items-center justify-center"
                        title="Dismiss alert"
                        aria-label="Dismiss alert"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {activeAlerts.length > 5 && (
                <div className="p-4 border-t border-border/50 bg-muted/10 text-center">
                  <Link href="/alerts" className="text-sm font-bold text-primary hover:underline flex items-center justify-center">
                    View all {activeAlerts.length} alerts <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Panel */}
          <Card className="flex flex-col border-blue-200 dark:border-blue-900 shadow-lg shadow-blue-500/10 bg-blue-50 dark:bg-blue-900/20">
            <CardHeader className="border-b border-blue-100 dark:border-blue-900 pb-4">
              <CardTitle className="text-xl flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Stethoscope className="w-5 h-5" />
                Upcoming
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex flex-col">
              {upcomingLoading ? (
                <div className="p-6 space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded-xl" />)}
                </div>
              ) : (!upcoming || (upcoming.medications.length === 0 && upcoming.pregnancies.length === 0)) ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-7 h-7 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-bold text-base text-foreground">All clear!</h3>
                  <p className="text-muted-foreground text-sm mt-1">No medications or births due soon.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {upcoming.medications.length > 0 && (
                    <div className="p-4">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Pill className="w-3.5 h-3.5" /> Medications
                      </p>
                      <div className="space-y-2">
                        {upcoming.medications.map(med => {
                          const daysUntil = differenceInDays(parseISO(med.nextDueDate), new Date());
                          return (
                            <Link key={med.id} href={`/animals/${med.animalId}`} className="flex items-start justify-between gap-2 group hover:bg-blue-100/50 dark:hover:bg-blue-900/30 rounded-lg p-1.5 -mx-1.5 transition-colors">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate group-hover:text-blue-700 dark:group-hover:text-blue-300">{med.animalName}</p>
                                <p className="text-xs text-muted-foreground truncate">{med.medicationName}</p>
                              </div>
                              <span className={`text-xs font-bold shrink-0 px-2 py-0.5 rounded-full ${
                                med.isOverdue
                                  ? "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400"
                                  : "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400"
                              }`}>
                                {med.isOverdue ? `${Math.abs(daysUntil)}d overdue` : daysUntil === 0 ? "Today" : `${daysUntil}d`}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {upcoming.pregnancies.length > 0 && (
                    <div className="p-4">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Baby className="w-3.5 h-3.5" /> Expected Births
                      </p>
                      <div className="space-y-2">
                        {upcoming.pregnancies.map(preg => {
                          const daysUntil = differenceInDays(parseISO(preg.expectedDueDate), new Date());
                          return (
                            <Link key={preg.animalId} href={`/animals/${preg.animalId}`} className="flex items-start justify-between gap-2 group hover:bg-blue-100/50 dark:hover:bg-blue-900/30 rounded-lg p-1.5 -mx-1.5 transition-colors">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate group-hover:text-blue-700 dark:group-hover:text-blue-300">{preg.animalName}</p>
                                <p className="text-xs text-muted-foreground">{preg.species}</p>
                              </div>
                              <span className="text-xs font-bold shrink-0 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400">
                                {daysUntil === 0 ? "Today" : `${daysUntil}d`}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

