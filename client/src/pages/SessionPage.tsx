import { Layout } from "@/components/Layout";
import { useWorkout } from "@/hooks/use-workouts"; // We need assignment actually, but backend structure is tricky.
// In a real app, GET /assignments/:id would return the workout data nested.
// For this MVP, I'll rely on the assignment list to get the workout ID, then fetch workout details.
// This is slightly inefficient but robust given the current constraints.

import { useAssignments, useCompleteAssignment } from "@/hooks/use-assignments";
import { useLogPerformance } from "@/hooks/use-performance";
import { useAuth } from "@/hooks/use-auth";
import { useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPerformanceLogSchema } from "@shared/schema";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Check, Save, ArrowLeft, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const assignmentId = parseInt(id);
  const { user } = useAuth();
  const { data: assignments } = useAssignments(user?.id);
  
  // Find specific assignment from list
  const assignment = assignments?.find(a => a.id === assignmentId);
  
  // Fetch workout details if we have assignment
  const { data: workout, isLoading } = useWorkout(assignment?.workoutId || 0);

  const completeMutation = useCompleteAssignment();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  if (isLoading || !assignment) return <Layout><div className="animate-pulse">Loading Session...</div></Layout>;
  if (!workout) return <Layout><div>Workout details not found</div></Layout>;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto pb-20">
        <div className="mb-6 flex items-start gap-4">
           <Button variant="ghost" onClick={() => setLocation("/training")}>
              <ArrowLeft className="w-5 h-5" />
           </Button>
           <div>
              <h1 className="text-3xl font-display font-bold uppercase text-primary">
                 {workout.name}
              </h1>
              <p className="text-muted-foreground">{workout.description}</p>
           </div>
        </div>

        <div className="space-y-6">
           {workout.exercises?.sort((a,b) => a.order - b.order).map((exerciseItem) => (
             <ExerciseLogger 
               key={exerciseItem.id} 
               workoutExercise={exerciseItem} 
               userId={user?.id || ""} 
             />
           ))}
        </div>

        {/* Floating Action Bar */}
        <div className="fixed bottom-0 left-0 md:left-64 right-0 p-4 bg-background/80 backdrop-blur border-t border-border flex justify-end gap-4">
           {assignment.completed ? (
              <Button disabled className="bg-green-600/20 text-green-500 border border-green-600/50">
                 <Check className="w-4 h-4 mr-2" /> Workout Completed
              </Button>
           ) : (
              <Button 
                size="lg" 
                className="shadow-xl shadow-primary/20 hover:scale-105 transition-transform font-bold text-lg"
                onClick={() => {
                  completeMutation.mutate({ id: assignmentId, completed: true }, {
                    onSuccess: () => {
                      toast({ 
                        title: "WORKOUT COMPLETE!", 
                        description: "Great job. Session marked as done.", 
                        duration: 5000 
                      });
                      setLocation("/training");
                    }
                  })
                }}
              >
                Finish Workout
              </Button>
           )}
        </div>
      </div>
    </Layout>
  );
}

function ExerciseLogger({ workoutExercise, userId }: { workoutExercise: any, userId: string }) {
  const logMutation = useLogPerformance();
  const { toast } = useToast();
  const [isLogged, setIsLogged] = useState(false);

  // Pre-fill sets/reps from prescription
  const form = useForm({
    defaultValues: {
       weight: "",
       reps: workoutExercise.reps || "",
       sets: workoutExercise.sets || 0,
    }
  });

  const onSubmit = (data: any) => {
    logMutation.mutate({
      userId,
      exerciseId: workoutExercise.exerciseId,
      workoutExerciseId: workoutExercise.id,
      weightLifted: parseInt(data.weight) || 0,
      repsCompleted: parseInt(data.reps) || 0,
      setsCompleted: parseInt(data.sets) || 0,
      notes: ""
    }, {
      onSuccess: () => {
        setIsLogged(true);
        toast({ title: "Logged", description: `Saved result for ${workoutExercise.exercise.name}` });
      }
    });
  };

  return (
    <Card className={`border border-border/50 ${isLogged ? "bg-secondary/10 border-green-500/30" : "bg-card"}`}>
      <CardHeader className="pb-2">
         <div className="flex justify-between items-start">
            <h3 className="text-xl font-display font-bold">{workoutExercise.exercise.name}</h3>
            {isLogged && <Check className="text-green-500 w-6 h-6" />}
         </div>
         <div className="text-sm text-muted-foreground flex gap-4">
            <span className="font-mono text-primary">{workoutExercise.sets} Sets</span>
            <span className="font-mono text-primary">x {workoutExercise.reps} Reps</span>
            {workoutExercise.weight && <span className="font-mono text-muted-foreground">@ {workoutExercise.weight}</span>}
         </div>
         {workoutExercise.notes && <p className="text-xs italic text-muted-foreground mt-1">{workoutExercise.notes}</p>}
      </CardHeader>
      <CardContent>
         <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-end gap-4">
            <div className="flex-1 space-y-1">
               <label className="text-xs font-semibold text-muted-foreground uppercase">Weight (lbs)</label>
               <Input type="number" {...form.register("weight")} placeholder="e.g. 135" className="bg-background" />
            </div>
            <div className="w-24 space-y-1">
               <label className="text-xs font-semibold text-muted-foreground uppercase">Reps</label>
               <Input type="number" {...form.register("reps")} className="bg-background" />
            </div>
             <div className="w-20 space-y-1">
               <label className="text-xs font-semibold text-muted-foreground uppercase">Sets</label>
               <Input type="number" {...form.register("sets")} className="bg-background" />
            </div>
            <Button size="icon" type="submit" variant={isLogged ? "secondary" : "default"} disabled={logMutation.isPending}>
               <Save className="w-4 h-4" />
            </Button>
         </form>
      </CardContent>
    </Card>
  );
}
