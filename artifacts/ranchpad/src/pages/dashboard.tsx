import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useListAlerts, useGenerateAlerts, useGetWeather, useListAnimals, useDismissAlert, getListAlertsQueryKey } from '@workspace/api-client-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';
import { AlertTriangle, Droplets, Wind, Thermometer, X, Plus } from 'lucide-react';
import { Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';

export default function Dashboard() {
  const { ranch } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: alerts = [] } = useListAlerts();
  const { data: weather } = useGetWeather();
  const { data: animals = [] } = useListAnimals();
  const { mutate: dismiss } = useDismissAlert({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey() })
    }
  });

  // Trigger alert generation on mount
  const { mutate: generateAlerts } = useGenerateAlerts({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey() })
    }
  });
  
  useEffect(() => {
    generateAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeAlerts = alerts.filter(a => !a.isDismissed).sort((a, b) => {
    const scores = { high: 3, medium: 2, low: 1 };
    return scores[b.severity as keyof typeof scores] - scores[a.severity as keyof typeof scores];
  });

  // Calculate species distribution
  const speciesCounts = animals.reduce((acc, animal) => {
    acc[animal.species] = (acc[animal.species] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-lg">Welcome to {ranch?.name}</p>
        </div>
        <Button asChild>
          <Link href="/animals/new" className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Animal
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Alerts & Stats */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-accent" />
                Active Alerts
              </CardTitle>
              <Badge variant="secondary">{activeAlerts.length} total</Badge>
            </CardHeader>
            <CardContent>
              {activeAlerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground bg-secondary/30 rounded-xl">
                  <p>All clear! Your herd is looking good.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeAlerts.map(alert => (
                    <div key={alert.id} className="flex items-start justify-between p-4 rounded-xl border border-border bg-background shadow-sm hover:shadow-md transition-all">
                      <div className="flex gap-4">
                        <div className="mt-0.5">
                          {alert.severity === 'high' && <div className="w-3 h-3 rounded-full bg-destructive shadow-[0_0_8px_rgba(255,0,0,0.5)]" />}
                          {alert.severity === 'medium' && <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]" />}
                          {alert.severity === 'low' && <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {alert.animalName ? `${alert.animalName}: ` : ''}{alert.alertType}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                        </div>
                      </div>
                      <button onClick={() => dismiss({ alertId: alert.id })} className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-secondary transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Herd Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {Object.entries(speciesCounts).length === 0 && (
                  <p className="text-muted-foreground col-span-full">No animals added yet.</p>
                )}
                {Object.entries(speciesCounts).map(([species, count]) => (
                  <div key={species} className="bg-secondary/50 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-display font-bold text-primary">{count}</span>
                    <span className="text-sm font-medium text-muted-foreground mt-1">{species}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Weather */}
        <div className="space-y-6">
          <Card className="overflow-hidden bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-transparent">
            <CardHeader>
              <CardTitle className="text-xl text-primary-foreground">Ranch Weather</CardTitle>
            </CardHeader>
            <CardContent>
              {weather ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-5xl font-display font-bold">{Math.round(weather.current.temp)}°</div>
                      <p className="text-primary-foreground/80 mt-1 capitalize">{weather.current.description}</p>
                    </div>
                    <img 
                      src={`https://openweathermap.org/img/wn/${weather.current.icon}@4x.png`} 
                      alt="Weather icon"
                      className="w-24 h-24 drop-shadow-lg"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 bg-black/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-primary-foreground/90">
                      <Droplets className="w-4 h-4" />
                      <span className="text-sm font-medium">{weather.current.humidity}% Hum</span>
                    </div>
                    <div className="flex items-center gap-2 text-primary-foreground/90">
                      <Wind className="w-4 h-4" />
                      <span className="text-sm font-medium">{Math.round(weather.current.windSpeed)} mph</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/20">
                    <p className="text-sm font-semibold mb-3 text-primary-foreground/90">3-Day Forecast</p>
                    <div className="space-y-3">
                      {weather.forecast.slice(0, 3).map((day, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-sm font-medium w-12">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                          <img src={`https://openweathermap.org/img/wn/${day.icon}.png`} alt="icon" className="w-8 h-8" />
                          <div className="flex items-center gap-2 text-sm w-24 justify-end">
                            <span className="font-bold">{Math.round(day.tempHigh)}°</span>
                            <span className="opacity-70">{Math.round(day.tempLow)}°</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-primary-foreground/80">
                  <Thermometer className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Weather data unavailable. Please update ranch location in settings.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
