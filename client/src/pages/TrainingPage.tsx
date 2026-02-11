import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { useAssignments } from "@/hooks/use-assignments";
import { format, isToday, parseISO } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { Link } from "wouter";

export default function TrainingPage() {
  const { user } = useAuth();
  const { data: assignments, isLoading } = useAssignments(user?.id);

  // Group assignments by status (completed vs pending)
  const pending = assignments?.filter(a => !a.completed).sort((a,b) => new Date(a.assignedDate).getTime() - new Date(b.assignedDate).getTime()) || [];
  const completed = assignments?.filter(a => a.completed).sort((a,b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime()) || [];

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold uppercase tracking-wide">My Training</h1>
        <p className="text-muted-foreground">Your assigned sessions and history.</p>
      </div>

      <div className="space-y-8">
        {/* Up Next Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
             <Clock className="w-5 h-5 text-primary" />
             <h2 className="text-xl font-display font-semibold uppercase">Up Next</h2>
          </div>
          
          {isLoading ? (
            <div className="h-32 bg-secondary/30 rounded-xl animate-pulse" />
          ) : pending.length > 0 ? (
            <div className="grid gap-4">
              {pending.map((assignment) => {
                const date = parseISO(assignment.assignedDate.toString());
                const isForToday = isToday(date);
                
                return (
                  <Card key={assignment.id} className={`border-l-4 ${isForToday ? 'border-l-primary' : 'border-l-muted'} hover:shadow-lg transition-shadow`}>
                    <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={isForToday ? "default" : "secondary"}>
                             {format(date, "MMM dd, yyyy")}
                          </Badge>
                          {isForToday && <span className="text-xs font-bold text-primary animate-pulse">TODAY</span>}
                        </div>
                        <h3 className="text-2xl font-display font-bold">{assignment.workout.name}</h3>
                        <p className="text-muted-foreground">{assignment.workout.description}</p>
                      </div>
                      
                      <Link href={`/session/${assignment.id}`}>
                        <Button size="lg" className="shrink-0 gap-2 shadow-md">
                          Start Workout <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center border border-dashed border-border rounded-xl bg-secondary/5">
              <p className="text-muted-foreground">No upcoming workouts assigned.</p>
              <Link href="/workouts">
                 <Button variant="link">Go assign one to yourself</Button>
              </Link>
            </div>
          )}
        </section>

        {/* History Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
             <CheckCircle2 className="w-5 h-5 text-green-500" />
             <h2 className="text-xl font-display font-semibold uppercase">Completed History</h2>
          </div>

          <div className="grid gap-4">
            {completed.map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between p-4 bg-card rounded-lg border border-border/50 opacity-75 hover:opacity-100 transition-opacity">
                 <div>
                    <h4 className="font-semibold">{assignment.workout.name}</h4>
                    <p className="text-sm text-muted-foreground">{format(parseISO(assignment.assignedDate.toString()), "MMMM do, yyyy")}</p>
                 </div>
                 <Link href={`/session/${assignment.id}`}>
                   <Button variant="outline" size="sm">View Log</Button>
                 </Link>
              </div>
            ))}
            
            {completed.length === 0 && (
               <p className="text-sm text-muted-foreground italic">No completed workouts yet.</p>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}
