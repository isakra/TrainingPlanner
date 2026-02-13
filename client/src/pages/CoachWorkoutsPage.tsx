import { Layout } from "@/components/Layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { useState } from "react";
import { Link } from "wouter";
import type { CustomWorkout } from "@shared/schema";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger
} from "@/components/ui/dialog";
import {
  Plus, ClipboardList, ArrowRight, Trash2, Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CoachWorkoutsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: workouts, isLoading } = useQuery<CustomWorkout[]>({
    queryKey: ["/api/custom-workouts"],
    queryFn: () => apiGet("/api/custom-workouts"),
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const createMutation = useMutation({
    mutationFn: (data: any) => apiPost("/api/custom-workouts", data),
    onSuccess: () => {
      toast({ title: "Created", description: "Workout created successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/custom-workouts"] });
      setIsCreateOpen(false);
      setNewTitle("");
      setNewDescription("");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/custom-workouts/${id}`),
    onSuccess: () => {
      toast({ title: "Deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/custom-workouts"] });
    },
  });

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    createMutation.mutate({
      title: newTitle,
      description: newDescription,
      blocks: [{ title: "Main", order: 1, exercises: [] }],
    });
  };

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-wide" data-testid="text-page-title">
            My Workouts
          </h1>
          <p className="text-muted-foreground">
            Your custom workout programs. Clone from templates or create from scratch.
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20" data-testid="button-create-workout">
              <Plus className="w-4 h-4" />
              New Workout
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>New Custom Workout</DialogTitle>
              <DialogDescription>Create a new workout program from scratch.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Workout Title</Label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Upper Body Hypertrophy"
                  data-testid="input-workout-title"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Goal of this session..."
                  data-testid="input-workout-description"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleCreate}
                disabled={createMutation.isPending || !newTitle.trim()}
                data-testid="button-submit-workout"
              >
                {createMutation.isPending ? "Creating..." : "Create Workout"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-48 bg-secondary/30 rounded-md animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(workouts || []).map(workout => (
            <Card key={workout.id} className="flex flex-col" data-testid={`card-workout-${workout.id}`}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  {workout.difficulty && (
                    <Badge variant="secondary" className="text-xs no-default-active-elevate">
                      {workout.difficulty}
                    </Badge>
                  )}
                  {workout.sourceTemplateId && (
                    <Badge variant="outline" className="text-xs no-default-active-elevate">
                      Cloned
                    </Badge>
                  )}
                </div>
                <CardTitle className="mt-2 text-lg font-display flex items-start gap-2">
                  <ClipboardList className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
                  {workout.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <p className="text-sm text-muted-foreground mb-4 flex-1 line-clamp-3">
                  {workout.description || "No description."}
                </p>
                <div className="flex gap-2 mt-auto">
                  <Link href={`/coach/workouts/${workout.id}`} className="flex-1">
                    <Button variant="secondary" className="w-full gap-2" data-testid={`button-edit-workout-${workout.id}`}>
                      Edit
                      <ArrowRight className="w-4 h-4 ml-auto" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate(workout.id);
                    }}
                    data-testid={`button-delete-workout-${workout.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {(workouts || []).length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-md">
              <ClipboardList className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No Custom Workouts Yet</h3>
              <p className="text-muted-foreground mb-6">
                Clone a template or create one from scratch.
              </p>
              <div className="flex gap-3">
                <Link href="/coach/templates">
                  <Button variant="outline">Browse Templates</Button>
                </Link>
                <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-first">
                  Create Workout
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
