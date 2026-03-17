import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Initialize fetch interceptor immediately
import "@/lib/fetch-interceptor";

// Providers
import { AuthProvider } from "@/hooks/use-auth";

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

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      {/* Protected Routes Wrapper */}
      <Route path="*">
        <AuthGuard>
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
