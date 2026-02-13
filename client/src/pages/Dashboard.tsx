import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  ArrowRight, Trophy, Calendar, Dumbbell, ClipboardList, Send, Users
} from "lucide-react";
import type { WorkoutTemplate, CustomWorkout, WorkoutAssignment } from "@shared/schema";

export default function Dashboard() {
  const { user, isCoach, isAthlete } = useAuth();

  return (
    <Layout>
      <header className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground" data-testid="text-welcome">
          Welcome back, {user?.firstName}
        </h1>
        <p className="text-muted-foreground mt-2">
          {format(new Date(), "EEEE, MMMM do, yyyy")}
        </p>
      </header>

      {isCoach ? <CoachDashboard /> : isAthlete ? <AthleteDashboard /> : null}
    </Layout>
  );
}

function CoachDashboard() {
  const { data: templates } = useQuery<WorkoutTemplate[]>({
    queryKey: ["/api/templates"],
    queryFn: () => apiGet("/api/templates"),
  });

  const { data: customWorkouts } = useQuery<CustomWorkout[]>({
    queryKey: ["/api/custom-workouts"],
    queryFn: () => apiGet("/api/custom-workouts"),
  });

  const { data: assignmentsList } = useQuery<any[]>({
    queryKey: ["/api/coach/assignments"],
    queryFn: () => apiGet("/api/coach/assignments"),
  });

  const { data: athletes } = useQuery<any[]>({
    queryKey: ["/api/athletes"],
    queryFn: () => apiGet("/api/athletes"),
  });

  const upcomingCount = (assignmentsList || []).filter(a => a.status === "UPCOMING").length;
  const completedCount = (assignmentsList || []).filter(a => a.status === "COMPLETED").length;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-md text-primary">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Templates</p>
              <p className="text-2xl font-display font-bold" data-testid="stat-templates">{templates?.length || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-md text-blue-500">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">My Workouts</p>
              <p className="text-2xl font-display font-bold" data-testid="stat-workouts">{customWorkouts?.length || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 rounded-md text-orange-500">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Assigned</p>
              <p className="text-2xl font-display font-bold" data-testid="stat-assigned">{upcomingCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-md text-green-500">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Athletes</p>
              <p className="text-2xl font-display font-bold" data-testid="stat-athletes">{athletes?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/coach/templates">
          <Card className="hover-elevate cursor-pointer">
            <CardContent className="p-6 text-center">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="font-semibold">Browse Templates</p>
              <p className="text-xs text-muted-foreground mt-1">Find programs</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/coach/workouts">
          <Card className="hover-elevate cursor-pointer">
            <CardContent className="p-6 text-center">
              <ClipboardList className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="font-semibold">My Workouts</p>
              <p className="text-xs text-muted-foreground mt-1">Create & edit</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/coach/assignments">
          <Card className="hover-elevate cursor-pointer">
            <CardContent className="p-6 text-center">
              <Send className="w-8 h-8 mx-auto mb-2 text-orange-500" />
              <p className="font-semibold">Assign</p>
              <p className="text-xs text-muted-foreground mt-1">Send to athletes</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/exercises">
          <Card className="hover-elevate cursor-pointer">
            <CardContent className="p-6 text-center">
              <Dumbbell className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="font-semibold">Exercises</p>
              <p className="text-xs text-muted-foreground mt-1">Browse library</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </>
  );
}

function AthleteDashboard() {
  const { data: assignmentsList } = useQuery<any[]>({
    queryKey: ["/api/athlete/workouts"],
    queryFn: () => apiGet("/api/athlete/workouts"),
  });

  const upcoming = (assignmentsList || []).filter((a: any) => a.status === "UPCOMING");
  const completed = (assignmentsList || []).filter((a: any) => a.status === "COMPLETED");

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-md text-primary">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Upcoming</p>
              <p className="text-2xl font-display font-bold" data-testid="stat-upcoming">{upcoming.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-md text-green-500">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-display font-bold" data-testid="stat-completed">{completed.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 rounded-md text-orange-500">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Workouts</p>
              <p className="text-2xl font-display font-bold" data-testid="stat-total">{(assignmentsList || []).length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-display font-semibold">Next Workout</h2>
          <Card className="border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="text-xl font-display font-bold">{upcoming[0].workoutTitle}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(new Date(upcoming[0].scheduledDate), "EEEE, MMMM do")}
                    {" · "}Coach: {upcoming[0].coachName}
                  </p>
                </div>
                <Link href={`/athlete/workouts/${upcoming[0].id}`}>
                  <Button className="gap-2" data-testid="button-start-next">
                    Start Workout
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <Link href="/athlete/workouts">
          <Card className="hover-elevate cursor-pointer">
            <CardContent className="p-6 text-center">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="font-semibold">My Workouts</p>
              <p className="text-xs text-muted-foreground mt-1">View all assigned workouts</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/exercises">
          <Card className="hover-elevate cursor-pointer">
            <CardContent className="p-6 text-center">
              <Dumbbell className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="font-semibold">Exercises</p>
              <p className="text-xs text-muted-foreground mt-1">Browse exercise library</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </>
  );
}
