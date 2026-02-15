import { Layout } from "@/components/Layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { useState } from "react";
import type { RecurringAssignment, WorkoutTemplate, CustomWorkout, User, GroupWithMemberCount } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Repeat, Plus, Trash2, Calendar, Users, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CoachRecurringPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [sourceType, setSourceType] = useState<"TEMPLATE" | "CUSTOM">("TEMPLATE");
  const [sourceId, setSourceId] = useState<string>("");
  const [assignMode, setAssignMode] = useState<"athletes" | "group">("athletes");
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [frequency, setFrequency] = useState<string>("weekly");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: recurringList, isLoading } = useQuery<RecurringAssignment[]>({
    queryKey: ["/api/coach/recurring-assignments"],
    queryFn: () => apiGet("/api/coach/recurring-assignments"),
  });

  const { data: athletes } = useQuery<User[]>({
    queryKey: ["/api/athletes"],
    queryFn: () => apiGet("/api/athletes"),
  });

  const { data: templates } = useQuery<WorkoutTemplate[]>({
    queryKey: ["/api/templates"],
    queryFn: () => apiGet("/api/templates"),
  });

  const { data: customWorkouts } = useQuery<CustomWorkout[]>({
    queryKey: ["/api/custom-workouts"],
    queryFn: () => apiGet("/api/custom-workouts"),
  });

  const { data: coachGroups } = useQuery<GroupWithMemberCount[]>({
    queryKey: ["/api/coach/groups"],
    queryFn: () => apiGet("/api/coach/groups"),
  });

  const createMutation = useMutation({
    mutationFn: () => {
      const payload: any = {
        sourceType,
        sourceId: Number(sourceId),
        frequency,
        daysOfWeek,
        startDate,
        endDate,
      };
      if (assignMode === "group") {
        payload.groupId = Number(selectedGroupId);
      } else {
        payload.athleteIds = selectedAthletes;
      }
      return apiPost("/api/coach/recurring-assignments", payload);
    },
    onSuccess: () => {
      toast({ title: "Created", description: "Recurring assignment created successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/coach/recurring-assignments"] });
      resetForm();
      setIsCreateOpen(false);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/coach/recurring-assignments/${id}`),
    onSuccess: () => {
      toast({ title: "Stopped", description: "Recurring assignment has been stopped." });
      queryClient.invalidateQueries({ queryKey: ["/api/coach/recurring-assignments"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setSourceType("TEMPLATE");
    setSourceId("");
    setAssignMode("athletes");
    setSelectedAthletes([]);
    setSelectedGroupId("");
    setFrequency("weekly");
    setDaysOfWeek([]);
    setStartDate("");
    setEndDate("");
  };

  const toggleAthlete = (id: string) => {
    setSelectedAthletes(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const toggleDay = (day: number) => {
    setDaysOfWeek(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  const resolveWorkoutName = (rec: RecurringAssignment): string => {
    if (rec.sourceType === "TEMPLATE") {
      const t = (templates || []).find(t => t.id === rec.sourceId);
      return t?.title || `Template #${rec.sourceId}`;
    }
    const w = (customWorkouts || []).find(w => w.id === rec.sourceId);
    return w?.title || `Workout #${rec.sourceId}`;
  };

  const formatDays = (days: number[] | null): string => {
    if (!days || days.length === 0) return "No days";
    return days.map(d => DAY_LABELS[d]).join(", ");
  };

  const workoutOptions = sourceType === "TEMPLATE"
    ? (templates || []).map(t => ({ id: String(t.id), label: t.title }))
    : (customWorkouts || []).map(w => ({ id: String(w.id), label: w.title }));

  const canSubmit = sourceId && startDate && endDate && daysOfWeek.length > 0 &&
    (assignMode === "athletes" ? selectedAthletes.length > 0 : !!selectedGroupId);

  const activeRecurrings = (recurringList || []).filter(r => r.active);
  const stoppedRecurrings = (recurringList || []).filter(r => !r.active);

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-wide" data-testid="text-page-title">
            Recurring Assignments
          </h1>
          <p className="text-muted-foreground">Schedule workouts to repeat automatically.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20" data-testid="button-create-recurring">
              <Plus className="w-4 h-4" />
              Create Recurring
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Recurring Assignment</DialogTitle>
              <DialogDescription>Set up a workout to repeat on a schedule.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Source</Label>
                <Select value={sourceType} onValueChange={(v) => { setSourceType(v as any); setSourceId(""); }}>
                  <SelectTrigger data-testid="select-source-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TEMPLATE">Template</SelectItem>
                    <SelectItem value="CUSTOM">My Workout</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Workout</Label>
                <Select value={sourceId} onValueChange={setSourceId}>
                  <SelectTrigger data-testid="select-workout">
                    <SelectValue placeholder="Select a workout" />
                  </SelectTrigger>
                  <SelectContent>
                    {workoutOptions.map(w => (
                      <SelectItem key={w.id} value={w.id}>{w.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Assign To</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={assignMode === "athletes" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAssignMode("athletes")}
                    data-testid="button-mode-athletes"
                  >
                    <Users className="w-4 h-4" />
                    Individual Athletes
                  </Button>
                  <Button
                    type="button"
                    variant={assignMode === "group" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAssignMode("group")}
                    data-testid="button-mode-group"
                  >
                    <Users className="w-4 h-4" />
                    Group
                  </Button>
                </div>
              </div>

              {assignMode === "group" ? (
                <div className="space-y-2">
                  <Label>Group</Label>
                  <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                    <SelectTrigger data-testid="select-assign-group">
                      <SelectValue placeholder="Select a group" />
                    </SelectTrigger>
                    <SelectContent>
                      {(coachGroups || []).filter(g => g.memberCount > 0).map(g => (
                        <SelectItem key={g.id} value={String(g.id)}>
                          {g.name} ({g.memberCount} athletes)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(coachGroups || []).filter(g => g.memberCount > 0).length === 0 && (
                    <p className="text-sm text-muted-foreground">No groups with members. Create a group and add athletes first.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Athletes ({selectedAthletes.length} selected)</Label>
                  {(athletes || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No athletes registered yet.</p>
                  ) : (
                    <div className="space-y-1 max-h-40 overflow-y-auto border rounded-md p-2">
                      {(athletes || []).map(a => (
                        <div
                          key={a.id}
                          className={`flex items-center gap-2 p-2 rounded-md cursor-pointer ${
                            selectedAthletes.includes(a.id) ? "bg-primary/10 border border-primary/30" : "hover-elevate"
                          }`}
                          onClick={() => toggleAthlete(a.id)}
                          data-testid={`athlete-option-${a.id}`}
                        >
                          <div className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center ${
                            selectedAthletes.includes(a.id) ? "bg-primary border-primary" : "border-muted-foreground"
                          }`}>
                            {selectedAthletes.includes(a.id) && (
                              <CheckCircle className="w-3 h-3 text-primary-foreground" />
                            )}
                          </div>
                          <span className="text-sm">
                            {a.firstName} {a.lastName}
                            {a.email && <span className="text-muted-foreground ml-1">({a.email})</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger data-testid="select-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="2x_per_week">2x per week</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Days of Week</Label>
                <div className="flex flex-wrap gap-2">
                  {DAY_LABELS.map((label, idx) => (
                    <Button
                      key={idx}
                      type="button"
                      variant={daysOfWeek.includes(idx) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleDay(idx)}
                      data-testid={`button-day-${idx}`}
                      className="toggle-elevate"
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    data-testid="input-start-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    data-testid="input-end-date"
                  />
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !canSubmit}
                data-testid="button-submit-recurring"
              >
                {createMutation.isPending ? "Creating..." : "Create Recurring Assignment"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse p-4">
              <div className="h-4 bg-muted rounded w-1/3 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-display font-bold mb-3 flex items-center gap-2">
              <Repeat className="w-5 h-5 text-primary" />
              Active ({activeRecurrings.length})
            </h2>
            {activeRecurrings.length === 0 ? (
              <p className="text-muted-foreground text-sm">No active recurring assignments.</p>
            ) : (
              <div className="space-y-2">
                {activeRecurrings.map(r => (
                  <Card key={r.id} className="flex flex-row items-center gap-4 p-4" data-testid={`card-recurring-${r.id}`}>
                    <div className="flex-1">
                      <p className="font-medium" data-testid={`text-workout-name-${r.id}`}>{resolveWorkoutName(r)}</p>
                      <p className="text-sm text-muted-foreground">
                        <Repeat className="w-3 h-3 inline mr-1" />
                        {r.frequency === "2x_per_week" ? "2x per week" : "Weekly"} &middot; {formatDays(r.daysOfWeek)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {format(new Date(r.startDate), "MMM d, yyyy")} &ndash; {format(new Date(r.endDate), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Badge variant="default" className="bg-green-600 no-default-active-elevate" data-testid={`badge-status-${r.id}`}>Active</Badge>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => deleteMutation.mutate(r.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-stop-${r.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {stoppedRecurrings.length > 0 && (
            <div>
              <h2 className="text-xl font-display font-bold mb-3 flex items-center gap-2 text-muted-foreground">
                Stopped ({stoppedRecurrings.length})
              </h2>
              <div className="space-y-2">
                {stoppedRecurrings.map(r => (
                  <Card key={r.id} className="flex flex-row items-center gap-4 p-4 opacity-60" data-testid={`card-recurring-${r.id}`}>
                    <div className="flex-1">
                      <p className="font-medium" data-testid={`text-workout-name-${r.id}`}>{resolveWorkoutName(r)}</p>
                      <p className="text-sm text-muted-foreground">
                        <Repeat className="w-3 h-3 inline mr-1" />
                        {r.frequency === "2x_per_week" ? "2x per week" : "Weekly"} &middot; {formatDays(r.daysOfWeek)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {format(new Date(r.startDate), "MMM d, yyyy")} &ndash; {format(new Date(r.endDate), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Badge variant="secondary" className="no-default-active-elevate" data-testid={`badge-status-${r.id}`}>Stopped</Badge>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
