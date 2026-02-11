import { Layout } from "@/components/Layout";
import { useWorkout, useAddWorkoutExercise } from "@/hooks/use-workouts";
import { useExercises } from "@/hooks/use-exercises";
import { useCreateAssignment } from "@/hooks/use-assignments";
import { useAuth } from "@/hooks/use-auth";
import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWorkoutExerciseSchema, insertAssignmentSchema } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Calendar, Dumbbell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function WorkoutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const workoutId = parseInt(id);
  const { data: workout, isLoading } = useWorkout(workoutId);
  const [isAddExOpen, setIsAddExOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);

  if (isLoading) return <Layout><div className="animate-pulse">Loading...</div></Layout>;
  if (!workout) return <Layout><div>Workout not found</div></Layout>;

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <Link href="/workouts" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Templates
          </Link>
          
          <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
            <div>
              <h1 className="text-4xl font-display font-bold uppercase tracking-wide text-foreground">
                {workout.name}
              </h1>
              <p className="text-lg text-muted-foreground mt-2 max-w-2xl">
                {workout.description}
              </p>
            </div>
            <div className="flex gap-2">
              <AssignWorkoutDialog 
                open={isAssignOpen} 
                onOpenChange={setIsAssignOpen} 
                workoutId={workoutId} 
                workoutName={workout.name}
              />
              <AddExerciseDialog 
                open={isAddExOpen} 
                onOpenChange={setIsAddExOpen} 
                workoutId={workoutId} 
              />
            </div>
          </div>
        </div>

        {/* Exercise List */}
        <div className="space-y-4">
          <h2 className="text-xl font-display font-semibold uppercase tracking-wider text-muted-foreground">
            Exercises ({workout.exercises?.length || 0})
          </h2>
          
          <div className="grid gap-4">
            {workout.exercises?.sort((a,b) => a.order - b.order).map((item, index) => (
              <div 
                key={item.id} 
                className="flex items-center gap-4 p-6 bg-card rounded-xl border border-border/50 hover:border-primary/30 transition-colors shadow-sm"
              >
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-secondary text-lg font-display font-bold text-muted-foreground">
                  {index + 1}
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-display font-bold">{item.exercise.name}</h3>
                  <div className="flex gap-2 text-sm text-muted-foreground mt-1">
                    <Badge variant="outline" className="text-xs uppercase bg-secondary/20">{item.exercise.category}</Badge>
                    {item.notes && <span>• {item.notes}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 text-center bg-background/50 p-3 rounded-lg border border-border/50">
                  <div>
                    <span className="block text-xs uppercase text-muted-foreground font-semibold">Sets</span>
                    <span className="font-display text-xl font-bold text-primary">{item.sets}</span>
                  </div>
                  <div>
                    <span className="block text-xs uppercase text-muted-foreground font-semibold">Reps</span>
                    <span className="font-display text-xl font-bold text-primary">{item.reps}</span>
                  </div>
                  <div>
                    <span className="block text-xs uppercase text-muted-foreground font-semibold">Weight</span>
                    <span className="font-display text-xl font-bold text-primary">{item.weight || "-"}</span>
                  </div>
                </div>
              </div>
            ))}

            {(!workout.exercises || workout.exercises.length === 0) && (
              <div className="text-center py-12 bg-secondary/10 border-2 border-dashed border-border rounded-xl">
                <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">This workout has no exercises yet.</p>
                <Button variant="link" onClick={() => setIsAddExOpen(true)}>Add your first exercise</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function AddExerciseDialog({ open, onOpenChange, workoutId }: { open: boolean, onOpenChange: (b: boolean) => void, workoutId: number }) {
  const { data: exercises } = useExercises();
  const mutation = useAddWorkoutExercise();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof insertWorkoutExerciseSchema>>({
    resolver: zodResolver(insertWorkoutExerciseSchema.omit({ workoutId: true })),
    defaultValues: {
      exerciseId: 0,
      order: 1,
      sets: 3,
      reps: "10",
      weight: "",
      notes: ""
    }
  });

  const onSubmit = (data: any) => {
    mutation.mutate({ ...data, workoutId }, {
      onSuccess: () => {
        toast({ title: "Exercise Added", description: "Successfully added to workout." });
        onOpenChange(false);
        form.reset();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="w-4 h-4" /> Add Exercise
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Exercise</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Select Exercise</Label>
            <Select onValueChange={(val) => form.setValue("exerciseId", parseInt(val))}>
              <SelectTrigger>
                <SelectValue placeholder="Choose exercise..." />
              </SelectTrigger>
              <SelectContent>
                {exercises?.map(ex => (
                  <SelectItem key={ex.id} value={ex.id.toString()}>
                    {ex.name} <span className="text-muted-foreground text-xs ml-2">({ex.category})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.exerciseId && <span className="text-destructive text-xs">Required</span>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label>Sets</Label>
                <Input type="number" {...form.register("sets", { valueAsNumber: true })} />
             </div>
             <div className="space-y-2">
                <Label>Order in Workout</Label>
                <Input type="number" {...form.register("order", { valueAsNumber: true })} />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label>Reps (e.g. "8-12")</Label>
                <Input {...form.register("reps")} />
             </div>
             <div className="space-y-2">
                <Label>Weight/Intensity (Optional)</Label>
                <Input {...form.register("weight")} placeholder="e.g. 75%" />
             </div>
          </div>

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Input {...form.register("notes")} placeholder="Tempo, rest times, cues..." />
          </div>

          <Button type="submit" className="w-full mt-4" disabled={mutation.isPending}>
            {mutation.isPending ? "Adding..." : "Add to Workout"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AssignWorkoutDialog({ open, onOpenChange, workoutId, workoutName }: { open: boolean, onOpenChange: (b: boolean) => void, workoutId: number, workoutName: string }) {
  const { user } = useAuth(); // In real app, fetch list of athletes. Here self-assign.
  const mutation = useCreateAssignment();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const handleAssign = () => {
    if (!user?.id) return;
    
    mutation.mutate({
      workoutId,
      userId: user.id, // Self-assign for MVP
      assignedDate: new Date(date).toISOString(), // Use selected date
    }, {
      onSuccess: () => {
        toast({ title: "Workout Assigned", description: `Assigned ${workoutName} to yourself for ${date}.` });
        onOpenChange(false);
        setLocation("/training");
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-lg shadow-primary/20">
          <Calendar className="w-4 h-4" /> Assign
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Workout</DialogTitle>
          <DialogDescription>Assign <strong>{workoutName}</strong> to an athlete.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Athlete</Label>
            <Select disabled defaultValue="self">
              <SelectTrigger>
                <SelectValue placeholder="Select athlete" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="self">Me (Current User)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">MVP: Only self-assignment enabled.</p>
          </div>
          
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <Button onClick={handleAssign} className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Assigning..." : "Confirm Assignment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
