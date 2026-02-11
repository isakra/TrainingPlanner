import { Layout } from "@/components/Layout";
import { useExercises, useCreateExercise } from "@/hooks/use-exercises";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertExerciseSchema } from "@shared/schema";
import { z } from "zod";
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
import { Search, Plus, PlayCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ExercisesPage() {
  const { data: exercises, isLoading } = useExercises();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { toast } = useToast();

  const filteredExercises = exercises?.filter(ex => 
    ex.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    ex.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-wide">Exercise Library</h1>
          <p className="text-muted-foreground">Browse and manage movement standards.</p>
        </div>
        
        <CreateExerciseDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search by name or category..." 
          className="pl-10 bg-card border-border/50 h-12 text-base"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-secondary/30 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExercises?.map((exercise) => (
            <Card key={exercise.id} className="group hover:border-primary/50 transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider bg-primary/10 px-2 py-1 rounded">
                    {exercise.category}
                  </span>
                </div>
                <CardTitle className="mt-2 text-xl font-display">{exercise.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                  {exercise.instructions || "No specific instructions provided."}
                </p>
                {exercise.videoUrl && (
                  <Button variant="outline" size="sm" className="w-full gap-2" asChild>
                    <a href={exercise.videoUrl} target="_blank" rel="noopener noreferrer">
                      <PlayCircle className="w-4 h-4" />
                      Watch Demo
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
          
          {filteredExercises?.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No exercises found matching "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}

function CreateExerciseDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const createMutation = useCreateExercise();
  
  const form = useForm<z.infer<typeof insertExerciseSchema>>({
    resolver: zodResolver(insertExerciseSchema),
    defaultValues: {
      name: "",
      category: "",
      instructions: "",
      videoUrl: ""
    }
  });

  const onSubmit = (data: z.infer<typeof insertExerciseSchema>) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        toast({ title: "Exercise Created", description: `${data.name} added to library.` });
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
          Add Exercise
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Exercise</DialogTitle>
          <DialogDescription>Add a movement to the global library.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input {...form.register("name")} placeholder="e.g. Back Squat" />
            {form.formState.errors.name && <span className="text-xs text-destructive">{form.formState.errors.name.message}</span>}
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Input {...form.register("category")} placeholder="e.g. Strength, Cardio" />
            {form.formState.errors.category && <span className="text-xs text-destructive">{form.formState.errors.category.message}</span>}
          </div>
          <div className="space-y-2">
            <Label>Video URL (Optional)</Label>
            <Input {...form.register("videoUrl")} placeholder="https://youtube.com/..." />
          </div>
          <div className="space-y-2">
            <Label>Instructions</Label>
            <Textarea {...form.register("instructions")} placeholder="Cues and setup details..." />
          </div>
          <Button type="submit" className="w-full mt-4" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating..." : "Create Exercise"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
