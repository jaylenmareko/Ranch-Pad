import React from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CloudLightning, Info, CheckCircle2, RefreshCw, PawPrint } from "lucide-react";
import { useListAlerts, useDismissAlert, useGenerateAlerts, type Alert } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

export default function AlertsList() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { data: alerts, isLoading } = useListAlerts({ query: { enabled: isAuthenticated } });
  
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

  const activeAlerts = alerts?.filter(a => !a.isDismissed) || [];
  
  const weatherAlerts = activeAlerts.filter(a => a.alertType === 'weather_forecast');
  const recordAlerts = activeAlerts.filter(a => a.alertType !== 'weather_forecast');

  const getSeverityIcon = (sev: string) => {
    if (sev === 'high') return <AlertTriangle className="w-5 h-5 text-destructive" />;
    if (sev === 'medium') return <Info className="w-5 h-5 text-yellow-500" />;
    return <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />;
  };

  const getSeverityColor = (sev: string) => {
    if (sev === 'high') return "bg-destructive/10 border-destructive/20 text-destructive";
    if (sev === 'medium') return "bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400";
    return "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400";
  };

  // Guest users see an empty state with a sign-up prompt
  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl sm:text-4xl font-black text-foreground">Alerts</h1>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-5">
            <AlertTriangle className="w-10 h-10 text-primary/50" />
          </div>
          <h2 className="font-bold text-xl text-foreground mb-2">Weather &amp; health alerts</h2>
          <p className="text-muted-foreground text-sm max-w-xs mb-8 leading-relaxed">
            Sign up to get automatic alerts when local weather conditions increase disease risk for your herd, or when medications are coming due.
          </p>
          <div className="flex gap-3">
            <Link href="/login?signup=1" className="inline-flex items-center justify-center h-11 px-6 rounded-xl font-semibold bg-primary text-primary-foreground hover:-translate-y-0.5 transition-transform shadow-md shadow-primary/20">
              Create Free Account
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center h-11 px-6 rounded-xl font-medium border border-border text-foreground hover:bg-muted transition-colors">
              Log In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const AlertRow = ({ alert }: { alert: Alert }) => (
    <div className={`p-4 md:p-5 flex flex-col md:flex-row gap-4 md:items-center rounded-2xl border transition-all ${getSeverityColor(alert.severity)}`}>
      <div className="flex-1 flex gap-4">
        <div className="shrink-0 mt-1 md:mt-0 bg-background rounded-full p-2 h-max shadow-sm border border-border/50">
          {alert.alertType === 'weather_forecast' ? <CloudLightning className="w-5 h-5 text-primary" /> : getSeverityIcon(alert.severity)}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-bold text-xs uppercase tracking-wider opacity-80">{alert.alertType.replace('_', ' ')}</span>
            <span className="text-xs opacity-60">•</span>
            <span className="text-xs opacity-80">{formatDate(alert.generatedAt)}</span>
          </div>
          <p className="font-bold text-base md:text-lg leading-snug">
            {alert.animalName ? (
               <Link href={`/animals/${alert.animalId}`} className="hover:underline text-foreground mr-1">{alert.animalName}:</Link>
            ) : null}
            <span className="text-foreground/90 font-medium ml-1">{alert.message}</span>
          </p>
        </div>
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        className="shrink-0 bg-background/50 hover:bg-background border-transparent shadow-none w-full md:w-auto min-h-[44px]"
        onClick={() => dismissMutation.mutate({ alertId: alert.id })}
      >
        <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Resolved
      </Button>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">Action Center</h1>
          <p className="text-muted-foreground font-medium mt-1">AI-powered insights and urgent tasks.</p>
        </div>
        <Button 
          variant="secondary" 
          onClick={() => generateMutation.mutate()}
          isLoading={generateMutation.isPending}
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Run Analysis
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-card rounded-2xl animate-pulse" />)}
        </div>
      ) : activeAlerts.length === 0 ? (
        <div className="text-center py-24 bg-card rounded-3xl border border-border">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-2xl font-display font-bold text-foreground">You're all caught up!</h3>
          <p className="text-muted-foreground mt-2 max-w-sm mx-auto font-medium">
            There are no active alerts or pending tasks for your herd.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {weatherAlerts.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-display font-bold text-xl flex items-center gap-2">
                <CloudLightning className="w-5 h-5 text-primary" /> Weather Alerts
              </h3>
              <div className="grid gap-3">
                {weatherAlerts.map(a => <AlertRow key={a.id} alert={a} />)}
              </div>
            </div>
          )}

          {recordAlerts.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-display font-bold text-xl flex items-center gap-2">
                <PawPrint className="w-5 h-5 text-accent" /> Herd Health & Tasks
              </h3>
              <div className="grid gap-3">
                {recordAlerts.map(a => <AlertRow key={a.id} alert={a} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
