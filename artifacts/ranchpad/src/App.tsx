import React from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Initialize fetch interceptor immediately
import "@/lib/fetch-interceptor";

// Providers
import { AuthProvider } from "@/hooks/use-auth";
import { useAuth } from "@/hooks/use-auth";

// Components
import { Layout, AuthGuard } from "@/components/Layout";

// Pages
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import AnimalList from "@/pages/Animals/List";
import AnimalForm from "@/pages/Animals/Form";
import AnimalDetail from "@/pages/Animals/Detail";
import AlertsList from "@/pages/Alerts/List";
import Settings from "@/pages/Settings";
import Paywall from "@/pages/Paywall";

import type { BillingStatus } from "@/hooks/use-billing";

const queryClient = new QueryClient();

// ─── Subscription Guard ────────────────────────────────────────────────────────

function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  const { data: billing, isLoading } = useQuery<BillingStatus>({
    queryKey: ["/api/billing/status"],
    queryFn: async () => {
      const res = await fetch("/api/billing/status");
      if (!res.ok) throw new Error("Failed to fetch billing status");
      return res.json() as Promise<BillingStatus>;
    },
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
    retry: false,
  });

  // While loading billing status show a brief spinner (covered by AuthGuard's own loader)
  if (isLoading) return null;

  // No billing data at all (e.g. Stripe not configured) → allow access
  if (!billing) return <>{children}</>;

  // No access → show full-screen paywall
  if (!billing.hasAccess) {
    return <Paywall billingStatus={billing} />;
  }

  return <>{children}</>;
}

// ─── Router ────────────────────────────────────────────────────────────────────

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      {/* Protected Routes Wrapper */}
      <Route path="*">
        <AuthGuard>
          <SubscriptionGuard>
            <Layout>
              <Switch>
                <Route path="/" component={Dashboard} />
                <Route path="/animals" component={AnimalList} />
                <Route path="/animals/new" component={AnimalForm} />
                <Route path="/animals/:id/edit" component={AnimalForm} />
                <Route path="/animals/:id" component={AnimalDetail} />
                <Route path="/alerts" component={AlertsList} />
                <Route path="/settings" component={Settings} />
                <Route component={NotFound} />
              </Switch>
            </Layout>
          </SubscriptionGuard>
        </AuthGuard>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
            <Toaster />
          </AuthProvider>
        </WouterRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
