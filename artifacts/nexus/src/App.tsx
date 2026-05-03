import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/Sidebar";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Agents from "@/pages/Agents";
import Chains from "@/pages/Chains";
import Partnerships from "@/pages/Partnerships";
import Ecosystem from "@/pages/Ecosystem";
import Connect from "@/pages/Connect";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-64 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-chart-3/5 rounded-full blur-3xl translate-y-1/2" />
      </div>
      <Sidebar />
      <main className="flex-1 overflow-y-auto relative">
        {children}
      </main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <AppLayout><Dashboard /></AppLayout>} />
      <Route path="/agents" component={() => <AppLayout><Agents /></AppLayout>} />
      <Route path="/chains" component={() => <AppLayout><Chains /></AppLayout>} />
      <Route path="/partnerships" component={() => <AppLayout><Partnerships /></AppLayout>} />
      <Route path="/ecosystem" component={() => <AppLayout><Ecosystem /></AppLayout>} />
      <Route path="/connect" component={() => <AppLayout><Connect /></AppLayout>} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
