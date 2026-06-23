import { Switch, Route, Router as WouterRouter } from "wouter";
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
import { DevDateProvider } from "@/contexts/DevDateContext";
import { LeadsProvider } from "@/contexts/LeadsContext";
import { ViewProvider } from "@/contexts/ViewContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/dashboard">
        <Layout>
          <Dashboard />
        </Layout>
      </Route>
      <Route path="/leads">
        <Layout>
          <LeadList />
        </Layout>
      </Route>
      <Route path="/leads/new">
        <Layout>
          <AddLead />
        </Layout>
      </Route>
      <Route path="/leads/:id">
        {() => <Layout><LeadDetail /></Layout>}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <OnboardingProvider>
          <LeadsProvider>
            <DevDateProvider>
              <ViewProvider>
                <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                  <Router />
                </WouterRouter>
                <Toaster />
              </ViewProvider>
            </DevDateProvider>
          </LeadsProvider>
        </OnboardingProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
