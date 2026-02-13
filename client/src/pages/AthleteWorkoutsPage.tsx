import { Layout } from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { Link } from "wouter";
import type { WorkoutAssignment } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar, CheckCircle, Clock, ArrowRight, Dumbbell, User
} from "lucide-react";
import { format } from "date-fns";

type EnrichedAssignment = WorkoutAssignment & { workoutTitle: string; coachName: string };

export default function AthleteWorkoutsPage() {
  const { data: assignmentsList, isLoading } = useQuery<EnrichedAssignment[]>({
    queryKey: ["/api/athlete/workouts"],
    queryFn: () => apiGet("/api/athlete/workouts"),
  });

  const upcoming = (assignmentsList || []).filter(a => a.status === "UPCOMING");
  const completed = (assignmentsList || []).filter(a => a.status === "COMPLETED");

  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-display font-bold uppercase tracking-wide" data-testid="text-page-title">
          My Workouts
        </h1>
        <p className="text-muted-foreground">Your assigned training sessions.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="h-20 bg-secondary/30 rounded-md animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-display font-bold mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Upcoming ({upcoming.length})
            </h2>
            {upcoming.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-md">
                <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No Upcoming Workouts</h3>
                <p className="text-muted-foreground">Your coach hasn't assigned any workouts yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcoming.map(a => (
                  <Card key={a.id} className="flex flex-row items-center gap-4 p-4" data-testid={`card-assignment-${a.id}`}>
                    <div className="p-2 bg-primary/10 rounded-md">
                      <Dumbbell className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium" data-testid={`text-workout-title-${a.id}`}>{a.workoutTitle}</p>
                      <p className="text-sm text-muted-foreground">
                        <User className="w-3 h-3 inline mr-1" />
                        {a.coachName}
                        <Calendar className="w-3 h-3 inline ml-3 mr-1" />
                        {format(new Date(a.scheduledDate), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Link href={`/athlete/workouts/${a.id}`}>
                      <Button className="gap-2" data-testid={`button-start-workout-${a.id}`}>
                        Start
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-display font-bold mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Completed ({completed.length})
            </h2>
            {completed.length === 0 ? (
              <p className="text-muted-foreground text-sm">No completed workouts yet.</p>
            ) : (
              <div className="space-y-2">
                {completed.map(a => (
                  <Card key={a.id} className="flex flex-row items-center gap-4 p-4" data-testid={`card-completed-${a.id}`}>
                    <div className="p-2 bg-green-500/10 rounded-md">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{a.workoutTitle}</p>
                      <p className="text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {format(new Date(a.scheduledDate), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Link href={`/athlete/workouts/${a.id}`}>
                      <Button variant="outline" className="gap-2" data-testid={`button-view-completed-${a.id}`}>
                        View
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
