import React, { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Initialize fetch interceptor immediately
import "@/lib/fetch-interceptor";

// Providers
import { AuthProvider } from "@/hooks/use-auth";
import { useAuth } from "@/hooks/use-auth";
import { AuthModalProvider, useAuthModal } from "@/contexts/auth-modal-context";
import { NavigationProvider, useNavigation } from "@/contexts/navigation-context";
import { RanchProvider } from "@/contexts/ranch-context";

// Components
import { Layout } from "@/components/Layout";
import { GuestFloatingCard } from "@/components/GuestFloatingCard";
import { GuestSignupPrompt } from "@/components/GuestSignupPrompt";

// Pages
import Landing from "@/pages/Landing";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import AnimalList from "@/pages/Animals/List";
import AnimalForm from "@/pages/Animals/Form";
import AnimalDetail from "@/pages/Animals/Detail";
import AlertsList from "@/pages/Alerts/List";
import Settings from "@/pages/Settings";
import AccountSettings from "@/pages/AccountSettings";
import Paywall from "@/pages/Paywall";
import Team from "@/pages/Team";
import InviteAccept from "@/pages/InviteAccept";

import type { BillingStatus } from "@/hooks/use-billing";

const queryClient = new QueryClient();

// ─── /login and /signup redirects — open modal, stay on current page ──────────

function LoginRedirect() {
  const { openLogin, openSignup } = useAuthModal();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("signup") === "1") {
      openSignup();
    } else {
      openLogin();
    }
    setLocation("/");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

function SignupRedirect() {
  const { openSignup } = useAuthModal();
  const [, setLocation] = useLocation();

  useEffect(() => {
    openSignup();
    setLocation("/");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

// ─── Subscription Guard ────────────────────────────────────────────────────────

function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, logout } = useAuth();
  const { resetNavigation } = useNavigation();
  const qc = useQueryClient();
  const verifiedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || verifiedRef.current) return;

    const params = new URLSearchParams(window.location.search);
    const isBillingSuccess = params.get("billing") === "success";
    const sessionId = params.get("session_id");

    if (!isBillingSuccess || !sessionId) return;
    verifiedRef.current = true;

    const clean = window.location.pathname;
    window.history.replaceState(null, "", clean);

    fetch("/api/billing/verify-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then((res) => res.json())
      .then(() => { qc.invalidateQueries({ queryKey: ["/api/billing/status"] }); })
      .catch(() => { qc.invalidateQueries({ queryKey: ["/api/billing/status"] }); });
  }, [isAuthenticated, qc]);

  const { data: billing, isLoading, isError } = useQuery<BillingStatus>({
    queryKey: ["/api/billing/status"],
    queryFn: async () => {
      const res = await fetch("/api/billing/status");
      if (!res.ok) throw new Error("Failed to fetch billing status");
      return res.json() as Promise<BillingStatus>;
    },
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
    retry: 1,
  });

  if (isLoading) return null;

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12 gap-4">
        <p className="text-muted-foreground font-medium text-sm text-center">
          Unable to verify your subscription status. Please check your connection and try again.
        </p>
        <div className="flex gap-3">
          <button onClick={() => window.location.reload()} className="text-sm font-semibold text-primary underline underline-offset-2">Retry</button>
          <button onClick={() => { resetNavigation(); logout(); }} className="text-sm font-semibold text-muted-foreground underline underline-offset-2">Sign out</button>
        </div>
      </div>
    );
  }

  if (!billing) return <Paywall billingStatus={null} />;
  if (!billing.hasAccess) return <Paywall billingStatus={billing} />;

  return <>{children}</>;
}

// ─── App Routes ────────────────────────────────────────────────────────────────

function DashboardRoute() {
  const { isViewer } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isViewer) setLocation("/animals");
  }, [isViewer, setLocation]);

  if (isViewer) return null;
  return <Dashboard />;
}

function AppContent() {
  const { isAuthenticated } = useAuth();
  const { hasNavigated } = useNavigation();
  const [location] = useLocation();

  if (!hasNavigated && !isAuthenticated && location === "/") {
    return <Landing />;
  }

  const routes = (
    <Switch>
      <Route path="/" component={DashboardRoute} />
      <Route path="/animals" component={AnimalList} />
      <Route path="/animals/new" component={AnimalForm} />
      <Route path="/animals/:id/edit" component={AnimalForm} />
      <Route path="/animals/:id" component={AnimalDetail} />
      <Route path="/alerts" component={AlertsList} />
      <Route path="/settings" component={Settings} />
      <Route path="/account" component={AccountSettings} />
      <Route path="/team" component={Team} />
      <Route component={NotFound} />
    </Switch>
  );

  if (isAuthenticated) {
    return <SubscriptionGuard>{routes}</SubscriptionGuard>;
  }

  return routes;
}

// ─── Router ────────────────────────────────────────────────────────────────────

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginRedirect} />
      <Route path="/signup" component={SignupRedirect} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/invite/:token" component={InviteAccept} />

      <Route path="*">
        <Layout>
          <AppContent />
        </Layout>
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
            <RanchProvider>
              <AuthModalProvider>
                <NavigationProvider>
                  <Router />
                  <GuestFloatingCard />
                  <GuestSignupPrompt />
                  <Toaster />
                </NavigationProvider>
              </AuthModalProvider>
            </RanchProvider>
          </AuthProvider>
        </WouterRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
