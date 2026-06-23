import { useEffect } from "react";
  import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
  import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
  import { Toaster } from "@/components/ui/toaster";
  import { TooltipProvider } from "@/components/ui/tooltip";
  import NotFound from "@/pages/not-found";
  import { Layout } from "@/components/Layout";
  import Landing from "@/pages/Landing";
  import Dashboard from "@/pages/Dashboard";
  import LeadList from "@/pages/LeadList";
  import AddLead from "@/pages/AddLead";
  import LeadDetail from "@/pages/LeadDetail";
  import Login from "@/pages/Login";
  import Signup from "@/pages/Signup";
  import ForgotPassword from "@/pages/ForgotPassword";
  import { DevDateProvider } from "@/contexts/DevDateContext";
  import { LeadsProvider } from "@/contexts/LeadsContext";
  import { ViewProvider } from "@/contexts/ViewContext";
  import { OnboardingProvider } from "@/contexts/OnboardingContext";
  import { AuthProvider, useAuth } from "@/contexts/AuthContext";
  import { useOnboarding } from "@/contexts/OnboardingContext";

  const queryClient = new QueryClient();

  /** Redirects to /login unless the user is authenticated or in demo mode. */
  function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const { isDemoMode } = useOnboarding();
    const [, navigate] = useLocation();

    useEffect(() => {
      if (!isLoading && !user && !isDemoMode) {
        navigate("/login");
      }
    }, [user, isLoading, isDemoMode, navigate]);

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <span className="text-sm text-muted-foreground">Loading…</span>
        </div>
      );
    }

    if (!user && !isDemoMode) return null;

    return <Layout>{children}</Layout>;
  }

  function Router() {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/dashboard">
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        </Route>
        <Route path="/leads">
          <ProtectedRoute><LeadList /></ProtectedRoute>
        </Route>
        <Route path="/leads/new">
          <ProtectedRoute><AddLead /></ProtectedRoute>
        </Route>
        <Route path="/leads/:id">
          {() => <ProtectedRoute><LeadDetail /></ProtectedRoute>}
        </Route>
        <Route component={NotFound} />
      </Switch>
    );
  }

  function App() {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <OnboardingProvider>
              <LeadsProvider>
                <DevDateProvider>
                  <ViewProvider>
                    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                      <Router />
                      <Toaster />
                    </WouterRouter>
                  </ViewProvider>
                </DevDateProvider>
              </LeadsProvider>
            </OnboardingProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  export default App;
  