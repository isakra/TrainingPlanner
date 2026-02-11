import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { useAssignments } from "@/hooks/use-assignments";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Trophy, Calendar, Dumbbell, Activity } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const today = new Date();
  const dateStr = format(today, "yyyy-MM-dd");
  
  const { data: assignments, isLoading } = useAssignments(user?.id, dateStr);

  const todaysAssignment = assignments?.[0];

  return (
    <Layout>
      <header className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">
          Welcome back, {user?.firstName}
        </h1>
        <p className="text-muted-foreground mt-2">
          {format(today, "EEEE, MMMM do, yyyy")}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Quick Stats Cards */}
        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Streak</p>
              <p className="text-2xl font-display font-bold">12 Days</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-accent/10 rounded-xl text-accent">
              <Dumbbell className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Lifted</p>
              <p className="text-2xl font-display font-bold">14,250 lbs</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-xl text-green-500">
              <Activity className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completion</p>
              <p className="text-2xl font-display font-bold">94%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Todays Workout Section */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-display font-semibold">Today's Training</h2>
            <Link href="/training">
              <Button variant="link" className="text-primary p-0">View Schedule</Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="h-48 rounded-xl bg-secondary/50 animate-pulse" />
          ) : todaysAssignment ? (
            <Card className="group overflow-hidden border-primary/20 hover:border-primary/50 transition-all duration-300">
              <div className="h-2 bg-primary w-full" />
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-display uppercase tracking-wide">
                      {todaysAssignment.workout.name}
                    </h3>
                    <p className="text-sm font-normal text-muted-foreground mt-1">
                      {todaysAssignment.workout.description || "No description provided"}
                    </p>
                  </div>
                  {todaysAssignment.completed ? (
                    <span className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-xs font-bold uppercase tracking-wide border border-green-500/20">
                      Completed
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-bold uppercase tracking-wide border border-primary/20">
                      Assigned
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/session/${todaysAssignment.id}`}>
                  <Button className="w-full mt-2 gap-2 font-semibold">
                    {todaysAssignment.completed ? "Review Session" : "Start Workout"}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <div className="p-4 bg-secondary rounded-full mb-4">
                  <Calendar className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg">Rest Day</h3>
                <p className="text-muted-foreground mt-1 mb-4">
                  No workouts assigned for today.
                </p>
                <Link href="/workouts">
                  <Button variant="outline">Browse Workouts</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Quick Actions / Feed */}
        <section>
           <h2 className="text-xl font-display font-semibold mb-4">Quick Actions</h2>
           <div className="grid grid-cols-2 gap-4">
             <Link href="/workouts">
                <div className="bg-card p-6 rounded-xl border border-border/50 hover:border-primary/50 hover:bg-secondary/50 transition-all cursor-pointer group">
                  <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg w-fit group-hover:scale-110 transition-transform">
                     <ClipboardList className="w-6 h-6" />
                  </div>
                  <h3 className="mt-4 font-semibold group-hover:text-primary transition-colors">Templates</h3>
                  <p className="text-xs text-muted-foreground mt-1">Manage workout plans</p>
                </div>
             </Link>
             
             <Link href="/exercises">
                <div className="bg-card p-6 rounded-xl border border-border/50 hover:border-primary/50 hover:bg-secondary/50 transition-all cursor-pointer group">
                  <div className="p-3 bg-orange-500/10 text-orange-500 rounded-lg w-fit group-hover:scale-110 transition-transform">
                     <Dumbbell className="w-6 h-6" />
                  </div>
                  <h3 className="mt-4 font-semibold group-hover:text-primary transition-colors">Exercises</h3>
                  <p className="text-xs text-muted-foreground mt-1">Browse library</p>
                </div>
             </Link>
           </div>
        </section>
      </div>
    </Layout>
  );
}

import { ClipboardList } from "lucide-react";
