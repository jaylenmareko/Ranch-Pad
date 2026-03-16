import React, { useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, AlertTriangle, CloudRain, Droplets, Wind, ChevronRight, X } from "lucide-react";
import { useListAnimals, useListAlerts, useGetWeather, useDismissAlert, useGenerateAlerts } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { data: animals, isLoading: animalsLoading } = useListAnimals();
  const { data: alerts, isLoading: alertsLoading } = useListAlerts();
  const { data: weather, isLoading: weatherLoading } = useGetWeather({ query: { retry: false } });
  
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

  const activeAlerts = alerts?.filter(a => !a.isDismissed) || [];
  
  // Sort alerts: high > medium > low
  const sortedAlerts = [...activeAlerts].sort((a, b) => {
    const weights = { high: 3, medium: 2, low: 1 };
    return weights[b.severity as keyof typeof weights] - weights[a.severity as keyof typeof weights];
  }).slice(0, 5); // top 5

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
                {Object.entries(speciesCounts).slice(0,3).map(([species, count]) => (
                  <Card key={species} className="border-none shadow-md shadow-black/5">
                    <CardContent className="p-5">
                      <p className="text-sm font-semibold text-muted-foreground mb-1">{species}s</p>
                      <p className="text-3xl font-bold font-display text-foreground">{count}</p>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>

          {/* Weather Widget */}
          <Card className="overflow-hidden border-none shadow-lg shadow-black/5 relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center gap-2">
                <CloudRain className="w-5 h-5 text-primary" /> Ranch Weather
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
              )}
            </CardContent>
          </Card>

        </div>

        {/* Right Column: Alerts */}
        <div className="lg:col-span-1">
          <Card className="h-full flex flex-col border-accent/20 shadow-lg shadow-accent/5">
            <CardHeader className="border-b border-border/50 bg-accent/5 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2 text-accent">
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
                    <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
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
                          alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground leading-tight">
                          {alert.animalName ? <Link href={`/animals/${alert.animalId}`} className="text-primary hover:underline">{alert.animalName}</Link> : null}
                          {alert.animalName ? ' - ' : ''}
                          {alert.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1.5 font-medium uppercase tracking-wider">{alert.alertType.replace('_', ' ')}</p>
                      </div>
                      <button 
                        onClick={() => dismissMutation.mutate({ alertId: alert.id })}
                        className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-full transition-all shrink-0 self-start"
                        title="Dismiss alert"
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
        </div>
      </div>
    </div>
  );
}

function CheckCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
