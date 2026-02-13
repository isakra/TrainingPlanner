import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/AuthPage";
import RoleSelectPage from "@/pages/RoleSelectPage";
import Dashboard from "@/pages/Dashboard";
import ExercisesPage from "@/pages/ExercisesPage";
import CoachTemplatesPage from "@/pages/CoachTemplatesPage";
import CoachWorkoutsPage from "@/pages/CoachWorkoutsPage";
import CoachWorkoutEditPage from "@/pages/CoachWorkoutEditPage";
import CoachAssignmentsPage from "@/pages/CoachAssignmentsPage";
import CoachAthletesPage from "@/pages/CoachAthletesPage";
import AthleteWorkoutsPage from "@/pages/AthleteWorkoutsPage";
import AthleteWorkoutSessionPage from "@/pages/AthleteWorkoutSessionPage";
import MessagesPage from "@/pages/MessagesPage";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ component: Component, requiredRole }: { component: React.ComponentType; requiredRole?: "COACH" | "ATHLETE" }) {
  const { user, isLoading, hasRole, isCoach, isAthlete } = useAuth();

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

  if (!hasRole) {
    return <RoleSelectPage />;
  }

  if (requiredRole === "COACH" && !isCoach) {
    return <NotFound />;
  }

  if (requiredRole === "ATHLETE" && !isAthlete) {
    return <NotFound />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/auth" component={AuthPage} />
      
      <Route path="/exercises" component={() => <ProtectedRoute component={ExercisesPage} />} />
      
      {/* Coach Routes */}
      <Route path="/coach/templates" component={() => <ProtectedRoute component={CoachTemplatesPage} requiredRole="COACH" />} />
      <Route path="/coach/workouts" component={() => <ProtectedRoute component={CoachWorkoutsPage} requiredRole="COACH" />} />
      <Route path="/coach/workouts/:id" component={() => <ProtectedRoute component={CoachWorkoutEditPage} requiredRole="COACH" />} />
      <Route path="/coach/athletes" component={() => <ProtectedRoute component={CoachAthletesPage} requiredRole="COACH" />} />
      <Route path="/coach/assignments" component={() => <ProtectedRoute component={CoachAssignmentsPage} requiredRole="COACH" />} />
      
      {/* Athlete Routes */}
      <Route path="/athlete/workouts" component={() => <ProtectedRoute component={AthleteWorkoutsPage} requiredRole="ATHLETE" />} />
      <Route path="/athlete/workouts/:assignmentId" component={() => <ProtectedRoute component={AthleteWorkoutSessionPage} requiredRole="ATHLETE" />} />

      {/* Shared Routes */}
      <Route path="/messages" component={() => <ProtectedRoute component={MessagesPage} />} />

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
