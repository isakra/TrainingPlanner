import { Layout } from "@/components/Layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import type { PrescriptionJson } from "@shared/schema";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, CheckCircle, Dumbbell, Loader2, Save
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SetEntry {
  exerciseName: string;
  setNumber: number;
  reps: number | null;
  weight: string | null;
  timeSeconds: number | null;
  distanceMeters: number | null;
  rpe: number | null;
  notes: string | null;
}

export default function AthleteWorkoutSessionPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["/api/athlete/workouts", assignmentId],
    queryFn: () => apiGet(`/api/athlete/workouts/${assignmentId}`),
    enabled: !!assignmentId,
  });

  const [setEntries, setSetEntries] = useState<SetEntry[]>([]);
  const [overallNotes, setOverallNotes] = useState("");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (data && !initialized) {
      const workout = data.workout;
      if (!workout) return;

      if (data.log && data.log.sets && data.log.sets.length > 0) {
        setSetEntries(data.log.sets.map((s: any) => ({
          exerciseName: s.exerciseName,
          setNumber: s.setNumber,
          reps: s.reps,
          weight: s.weight,
          timeSeconds: s.timeSeconds,
          distanceMeters: s.distanceMeters,
          rpe: s.rpe,
          notes: s.notes,
        })));
        setOverallNotes(data.log.overallNotes || "");
      } else {
        const entries: SetEntry[] = [];
        const blocks = workout.blocks || [];
        for (const block of blocks) {
          for (const ex of block.exercises) {
            const rx = ex.prescriptionJson as PrescriptionJson | null;
            const numSets = rx?.sets || 3;
            for (let s = 1; s <= numSets; s++) {
              entries.push({
                exerciseName: ex.name,
                setNumber: s,
                reps: null,
                weight: null,
                timeSeconds: null,
                distanceMeters: null,
                rpe: null,
                notes: null,
              });
            }
          }
        }
        setSetEntries(entries);
      }
      setInitialized(true);
    }
  }, [data, initialized]);

  const saveMutation = useMutation({
    mutationFn: () => apiPost(`/api/athlete/workouts/${assignmentId}/log`, {
      overallNotes,
      sets: setEntries,
    }),
    onSuccess: () => {
      toast({ title: "Saved", description: "Progress saved." });
      queryClient.invalidateQueries({ queryKey: ["/api/athlete/workouts", assignmentId] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      await apiPost(`/api/athlete/workouts/${assignmentId}/log`, {
        overallNotes,
        sets: setEntries,
      });
      return apiPost(`/api/athlete/workouts/${assignmentId}/complete`);
    },
    onSuccess: () => {
      toast({ title: "Workout Complete!", description: "Great work!" });
      queryClient.invalidateQueries({ queryKey: ["/api/athlete/workouts"] });
      navigate("/athlete/workouts");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateSetEntry = (index: number, field: keyof SetEntry, value: any) => {
    const updated = [...setEntries];
    (updated[index] as any)[field] = value;
    setSetEntries(updated);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const assignment = data?.assignment;
  const workout = data?.workout;
  const isCompleted = assignment?.status === "COMPLETED";

  if (!workout) {
    return (
      <Layout>
        <p className="text-muted-foreground">Workout not found.</p>
      </Layout>
    );
  }

  const exerciseNames = [...new Set(setEntries.map(s => s.exerciseName))];

  return (
    <Layout>
      <div className="flex items-center gap-4 mb-2">
        <Button variant="outline" size="icon" onClick={() => navigate("/athlete/workouts")} data-testid="button-back">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold uppercase tracking-wide" data-testid="text-workout-title">
            {workout.title}
          </h1>
          {isCompleted && <Badge variant="default" className="bg-green-600 no-default-active-elevate mt-1">Completed</Badge>}
        </div>
        {!isCompleted && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              data-testid="button-save-progress"
            >
              <Save className="w-4 h-4" />
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
            <Button
              className="gap-2"
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
              data-testid="button-complete-workout"
            >
              <CheckCircle className="w-4 h-4" />
              {completeMutation.isPending ? "Completing..." : "Complete"}
            </Button>
          </div>
        )}
      </div>

      {workout.description && (
        <p className="text-sm text-muted-foreground">{workout.description}</p>
      )}

      <div className="space-y-6">
        {exerciseNames.map(exName => {
          const setsForExercise = setEntries
            .map((s, i) => ({ ...s, originalIndex: i }))
            .filter(s => s.exerciseName === exName);

          const block = (workout.blocks || []).find((b: any) =>
            b.exercises.some((e: any) => e.name === exName)
          );
          const exerciseData = block?.exercises.find((e: any) => e.name === exName);
          const rx = exerciseData?.prescriptionJson as PrescriptionJson | null;

          return (
            <Card key={exName} data-testid={`card-exercise-${exName.replace(/\s+/g, '-').toLowerCase()}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-primary" />
                  {exName}
                </CardTitle>
                {rx && (
                  <p className="text-xs text-muted-foreground">
                    Target: {rx.sets && `${rx.sets} sets`}{rx.reps && ` x ${rx.reps}`}{rx.weight && ` @ ${rx.weight}`}
                  </p>
                )}
                {exerciseData?.notes && (
                  <p className="text-xs text-muted-foreground">{exerciseData.notes}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="grid grid-cols-[auto_1fr_1fr_80px] gap-2 text-xs font-medium text-muted-foreground">
                    <span className="w-12">Set</span>
                    <span>Reps</span>
                    <span>Weight</span>
                    <span>RPE</span>
                  </div>
                  {setsForExercise.map(set => (
                    <div key={set.originalIndex} className="grid grid-cols-[auto_1fr_1fr_80px] gap-2 items-center" data-testid={`set-row-${set.originalIndex}`}>
                      <span className="text-sm font-medium w-12 text-center text-muted-foreground">
                        {set.setNumber}
                      </span>
                      <Input
                        type="number"
                        placeholder="Reps"
                        value={set.reps ?? ""}
                        onChange={(e) => updateSetEntry(set.originalIndex, "reps", e.target.value ? Number(e.target.value) : null)}
                        disabled={isCompleted}
                        data-testid={`input-reps-${set.originalIndex}`}
                      />
                      <Input
                        placeholder="Weight"
                        value={set.weight ?? ""}
                        onChange={(e) => updateSetEntry(set.originalIndex, "weight", e.target.value || null)}
                        disabled={isCompleted}
                        data-testid={`input-weight-${set.originalIndex}`}
                      />
                      <Input
                        type="number"
                        placeholder="RPE"
                        min={1}
                        max={10}
                        value={set.rpe ?? ""}
                        onChange={(e) => updateSetEntry(set.originalIndex, "rpe", e.target.value ? Number(e.target.value) : null)}
                        disabled={isCompleted}
                        data-testid={`input-rpe-${set.originalIndex}`}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="space-y-2">
        <Label>Overall Notes</Label>
        <Textarea
          value={overallNotes}
          onChange={(e) => setOverallNotes(e.target.value)}
          placeholder="How did the workout feel?"
          disabled={isCompleted}
          data-testid="input-overall-notes"
        />
      </div>
    </Layout>
  );
}
