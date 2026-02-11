import { Layout } from "@/components/Layout";
import { useWorkouts, useCreateWorkout } from "@/hooks/use-workouts";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWorkoutSchema } from "@shared/schema";
import { z } from "zod";
import { Link } from "wouter";
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Plus, ArrowRight, ClipboardList } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function WorkoutsPage() {
  const { data: workouts, isLoading } = useWorkouts();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-wide">Workout Templates</h1>
          <p className="text-muted-foreground">Create and manage training sessions.</p>
        </div>
        
        <CreateWorkoutDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-40 bg-secondary/30 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workouts?.map((workout) => (
            <Card key={workout.id} className="group hover:border-primary/50 transition-all duration-300 flex flex-col">
              <div className="h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader>
                <CardTitle className="flex items-start gap-3">
                  <div className="mt-1 p-2 bg-secondary rounded-md text-primary">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <span className="font-display text-xl uppercase tracking-wide">{workout.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <p className="text-sm text-muted-foreground mb-6 flex-1">
                  {workout.description || "No description provided."}
                </p>
                
                <div className="flex gap-3 mt-auto">
                   <Link href={`/workouts/${workout.id}`} className="w-full">
                    <Button variant="secondary" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      Edit / Details
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                   </Link>
                </div>
              </CardContent>
            </Card>
          ))}

          {workouts?.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-xl">
              <ClipboardList className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No Templates Yet</h3>
              <p className="text-muted-foreground mb-6">Create your first workout template to get started.</p>
              <Button onClick={() => setIsCreateOpen(true)}>Create Template</Button>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}

function CreateWorkoutDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const createMutation = useCreateWorkout();
  
  const form = useForm<z.infer<typeof insertWorkoutSchema>>({
    resolver: zodResolver(insertWorkoutSchema),
    defaultValues: {
      name: "",
      description: "",
      coachId: user?.id || "" // Will be overwritten by backend usually, but good to have
    }
  });

  const onSubmit = (data: z.infer<typeof insertWorkoutSchema>) => {
    // Ensure coachId is set
    if (!user?.id) return;
    
    createMutation.mutate({ ...data, coachId: user.id }, {
      onSuccess: () => {
        toast({ title: "Template Created", description: `${data.name} is ready.` });
        form.reset();
        onOpenChange(false);
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" />
          Create Template
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Workout Template</DialogTitle>
          <DialogDescription>Define the structure of a training session.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Workout Name</Label>
            <Input {...form.register("name")} placeholder="e.g. Upper Body Hypertrophy" />
            {form.formState.errors.name && <span className="text-xs text-destructive">{form.formState.errors.name.message}</span>}
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea {...form.register("description")} placeholder="Goal of this session..." />
          </div>
          <Button type="submit" className="w-full mt-4" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating..." : "Create Template"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
