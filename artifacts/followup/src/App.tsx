import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { Layout } from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import LeadList from "@/pages/LeadList";
import AddLead from "@/pages/AddLead";
import LeadDetail from "@/pages/LeadDetail";
import { DevDateProvider } from "@/contexts/DevDateContext";
import { LeadsProvider } from "@/contexts/LeadsContext";
import { ViewProvider } from "@/contexts/ViewContext";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/leads" component={LeadList} />
        <Route path="/leads/new" component={AddLead} />
        <Route path="/leads/:id" component={LeadDetail} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
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
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
