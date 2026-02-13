import { Layout } from "@/components/Layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPut } from "@/lib/api";
import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import type { CustomWorkoutWithBlocks, Exercise, PrescriptionJson } from "@shared/schema";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Trash2, Save, ArrowLeft, GripVertical, Dumbbell, Loader2, Search
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";

interface BlockState {
  title: string;
  order: number;
  exercises: ExerciseState[];
}

interface ExerciseState {
  name: string;
  exerciseId: number | null;
  order: number;
  sets?: number;
  reps?: string;
  weight?: string;
  notes?: string;
}

export default function CoachWorkoutEditPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: workout, isLoading } = useQuery<CustomWorkoutWithBlocks>({
    queryKey: ["/api/custom-workouts", id],
    queryFn: () => apiGet(`/api/custom-workouts/${id}`),
    enabled: !!id,
  });

  const { data: exerciseLibrary } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
    queryFn: () => apiGet("/api/exercises"),
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [blocks, setBlocks] = useState<BlockState[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState<{ blockIndex: number } | null>(null);
  const [exerciseSearch, setExerciseSearch] = useState("");

  useEffect(() => {
    if (workout) {
      setTitle(workout.title);
      setDescription(workout.description || "");
      setBlocks(workout.blocks.map(b => ({
        title: b.title,
        order: b.order,
        exercises: b.exercises.map(e => {
          const rx = e.prescriptionJson as PrescriptionJson | null;
          return {
            name: e.name,
            exerciseId: e.exerciseId,
            order: e.order,
            sets: rx?.sets,
            reps: rx?.reps,
            weight: rx?.weight,
            notes: e.notes || undefined,
          };
        }),
      })));
    }
  }, [workout]);

  const saveMutation = useMutation({
    mutationFn: () => apiPut(`/api/custom-workouts/${id}`, {
      title,
      description,
      blocks: blocks.map((b, bi) => ({
        title: b.title,
        order: bi + 1,
        exercises: b.exercises.map((e, ei) => ({
          name: e.name,
          exerciseId: e.exerciseId,
          order: ei + 1,
          prescriptionJson: {
            sets: e.sets,
            reps: e.reps,
            weight: e.weight,
          },
          notes: e.notes,
        })),
      })),
    }),
    onSuccess: () => {
      toast({ title: "Saved", description: "Workout updated." });
      queryClient.invalidateQueries({ queryKey: ["/api/custom-workouts", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/custom-workouts"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const addBlock = () => {
    setBlocks([...blocks, { title: "New Block", order: blocks.length + 1, exercises: [] }]);
  };

  const removeBlock = (index: number) => {
    setBlocks(blocks.filter((_, i) => i !== index));
  };

  const addExerciseToBlock = (blockIndex: number, exercise: Exercise) => {
    const updated = [...blocks];
    updated[blockIndex].exercises.push({
      name: exercise.name,
      exerciseId: exercise.id,
      order: updated[blockIndex].exercises.length + 1,
      sets: 3,
      reps: "10",
    });
    setBlocks(updated);
    setShowExercisePicker(null);
    setExerciseSearch("");
  };

  const removeExercise = (blockIndex: number, exerciseIndex: number) => {
    const updated = [...blocks];
    updated[blockIndex].exercises = updated[blockIndex].exercises.filter((_, i) => i !== exerciseIndex);
    setBlocks(updated);
  };

  const updateExercise = (blockIndex: number, exerciseIndex: number, field: keyof ExerciseState, value: any) => {
    const updated = [...blocks];
    (updated[blockIndex].exercises[exerciseIndex] as any)[field] = value;
    setBlocks(updated);
  };

  const filteredExercises = (exerciseLibrary || []).filter(e =>
    exerciseSearch === "" || e.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
    e.category.toLowerCase().includes(exerciseSearch.toLowerCase())
  ).slice(0, 50);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex items-center gap-4 mb-2">
        <Button variant="outline" size="icon" onClick={() => navigate("/coach/workouts")} data-testid="button-back">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold uppercase tracking-wide" data-testid="text-page-title">
            Edit Workout
          </h1>
        </div>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="gap-2"
          data-testid="button-save"
        >
          <Save className="w-4 h-4" />
          {saveMutation.isPending ? "Saving..." : "Save"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} data-testid="input-title" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} data-testid="input-description" />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {blocks.map((block, bi) => (
            <Card key={bi} data-testid={`card-block-${bi}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
                <Input
                  value={block.title}
                  onChange={(e) => {
                    const updated = [...blocks];
                    updated[bi].title = e.target.value;
                    setBlocks(updated);
                  }}
                  className="text-lg font-semibold bg-transparent border-none focus-visible:ring-1 px-0"
                  data-testid={`input-block-title-${bi}`}
                />
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowExercisePicker({ blockIndex: bi })}
                    data-testid={`button-add-exercise-${bi}`}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeBlock(bi)}
                    data-testid={`button-remove-block-${bi}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {block.exercises.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No exercises yet. Click + to add.
                  </p>
                ) : (
                  block.exercises.map((ex, ei) => (
                    <div key={ei} className="flex items-center gap-2 p-2 rounded-md bg-secondary/30" data-testid={`exercise-row-${bi}-${ei}`}>
                      <Dumbbell className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm font-medium flex-1 truncate">{ex.name}</span>
                      <Input
                        className="w-16 text-center"
                        placeholder="Sets"
                        value={ex.sets || ""}
                        onChange={(e) => updateExercise(bi, ei, "sets", Number(e.target.value) || undefined)}
                        data-testid={`input-sets-${bi}-${ei}`}
                      />
                      <span className="text-xs text-muted-foreground">x</span>
                      <Input
                        className="w-20 text-center"
                        placeholder="Reps"
                        value={ex.reps || ""}
                        onChange={(e) => updateExercise(bi, ei, "reps", e.target.value)}
                        data-testid={`input-reps-${bi}-${ei}`}
                      />
                      <Input
                        className="w-24"
                        placeholder="Weight"
                        value={ex.weight || ""}
                        onChange={(e) => updateExercise(bi, ei, "weight", e.target.value)}
                        data-testid={`input-weight-${bi}-${ei}`}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => removeExercise(bi, ei)}
                        data-testid={`button-remove-exercise-${bi}-${ei}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" className="w-full gap-2" onClick={addBlock} data-testid="button-add-block">
            <Plus className="w-4 h-4" />
            Add Block
          </Button>
        </div>
      </div>

      <Dialog open={!!showExercisePicker} onOpenChange={(open) => !open && setShowExercisePicker(null)}>
        <DialogContent className="max-w-lg max-h-[70vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Exercise</DialogTitle>
            <DialogDescription>Search and select an exercise from the library.</DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search exercises..."
              className="pl-10"
              value={exerciseSearch}
              onChange={(e) => setExerciseSearch(e.target.value)}
              data-testid="input-exercise-search"
            />
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 max-h-[40vh]">
            {filteredExercises.map(ex => (
              <div
                key={ex.id}
                className="flex items-center gap-3 p-2 rounded-md cursor-pointer hover-elevate"
                onClick={() => showExercisePicker && addExerciseToBlock(showExercisePicker.blockIndex, ex)}
                data-testid={`exercise-option-${ex.id}`}
              >
                <Dumbbell className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <span className="text-sm font-medium">{ex.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{ex.category}</span>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
