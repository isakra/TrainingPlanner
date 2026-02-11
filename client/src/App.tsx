import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import ExercisesPage from "@/pages/ExercisesPage";
import WorkoutsPage from "@/pages/WorkoutsPage";
import WorkoutDetailPage from "@/pages/WorkoutDetailPage";
import TrainingPage from "@/pages/TrainingPage";
import SessionPage from "@/pages/SessionPage";
import PerformancePage from "@/pages/PerformancePage";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/auth" component={AuthPage} />
      
      <Route path="/exercises" component={() => <ProtectedRoute component={ExercisesPage} />} />
      <Route path="/workouts" component={() => <ProtectedRoute component={WorkoutsPage} />} />
      <Route path="/workouts/:id" component={() => <ProtectedRoute component={WorkoutDetailPage} />} />
      
      <Route path="/training" component={() => <ProtectedRoute component={TrainingPage} />} />
      <Route path="/session/:id" component={() => <ProtectedRoute component={SessionPage} />} />
      
      <Route path="/performance" component={() => <ProtectedRoute component={PerformancePage} />} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
