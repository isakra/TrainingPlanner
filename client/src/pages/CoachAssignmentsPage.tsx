import { Layout } from "@/components/Layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import type { WorkoutTemplate, CustomWorkout, User, WorkoutAssignment, GroupWithMemberCount } from "@shared/schema";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
import {
  Plus, Calendar, CheckCircle, Clock, Users, Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type EnrichedAssignment = WorkoutAssignment & { athleteName: string; workoutTitle: string };

export default function CoachAssignmentsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: assignmentsList, isLoading } = useQuery<EnrichedAssignment[]>({
    queryKey: ["/api/coach/assignments"],
    queryFn: () => apiGet("/api/coach/assignments"),
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

  const searchStr = useSearch();
  const urlParams = new URLSearchParams(searchStr);
  const preselectedGroupId = urlParams.get("groupId");

  const [isAssignOpen, setIsAssignOpen] = useState(!!preselectedGroupId);
  const [assignMode, setAssignMode] = useState<"athletes" | "group">(preselectedGroupId ? "group" : "athletes");
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(preselectedGroupId || "");
  const [sourceType, setSourceType] = useState<"TEMPLATE" | "CUSTOM">("TEMPLATE");
  const [sourceId, setSourceId] = useState<string>("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [viewLogId, setViewLogId] = useState<number | null>(null);

  const { data: logDetail } = useQuery({
    queryKey: ["/api/coach/assignments", viewLogId, "log"],
    queryFn: () => apiGet(`/api/coach/assignments/${viewLogId}/log`),
    enabled: !!viewLogId,
  });

  const assignMutation = useMutation({
    mutationFn: () => {
      const payload: any = {
        sourceType,
        sourceId: Number(sourceId),
        scheduledDate,
      };
      if (assignMode === "group") {
        payload.groupId = Number(selectedGroupId);
      } else {
        payload.athleteIds = selectedAthletes;
      }
      return apiPost("/api/coach/assignments", payload);
    },
    onSuccess: () => {
      toast({ title: "Assigned", description: assignMode === "group" ? "Workout assigned to all group members." : "Workout assigned to athlete(s)." });
      queryClient.invalidateQueries({ queryKey: ["/api/coach/assignments"] });
      setIsAssignOpen(false);
      setSelectedAthletes([]);
      setSelectedGroupId("");
      setSourceId("");
      setScheduledDate("");
      setAssignMode("athletes");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const toggleAthlete = (id: string) => {
    setSelectedAthletes(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const upcomingAssignments = (assignmentsList || []).filter(a => a.status === "UPCOMING");
  const completedAssignments = (assignmentsList || []).filter(a => a.status === "COMPLETED");

  const workoutOptions = sourceType === "TEMPLATE"
    ? (templates || []).map(t => ({ id: String(t.id), label: t.title }))
    : (customWorkouts || []).map(w => ({ id: String(w.id), label: w.title }));

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-wide" data-testid="text-page-title">
            Assignments
          </h1>
          <p className="text-muted-foreground">Assign workouts to athletes and track completion.</p>
        </div>

        <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20" data-testid="button-assign">
              <Plus className="w-4 h-4" />
              Assign Workout
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Assign Workout</DialogTitle>
              <DialogDescription>Choose a workout and assign it to one or more athletes.</DialogDescription>
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
                <Label>Scheduled Date</Label>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  data-testid="input-scheduled-date"
                />
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

              <Button
                className="w-full"
                onClick={() => assignMutation.mutate()}
                disabled={assignMutation.isPending || !sourceId || !scheduledDate || (assignMode === "athletes" ? selectedAthletes.length === 0 : !selectedGroupId)}
                data-testid="button-submit-assign"
              >
                {assignMutation.isPending ? "Assigning..." : assignMode === "group" ? "Assign to Group" : "Assign Workout"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-display font-bold mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Upcoming ({upcomingAssignments.length})
          </h2>
          {upcomingAssignments.length === 0 ? (
            <p className="text-muted-foreground text-sm">No upcoming assignments.</p>
          ) : (
            <div className="space-y-2">
              {upcomingAssignments.map(a => (
                <Card key={a.id} className="flex flex-row items-center gap-4 p-4" data-testid={`card-assignment-${a.id}`}>
                  <div className="flex-1">
                    <p className="font-medium">{a.workoutTitle}</p>
                    <p className="text-sm text-muted-foreground">
                      <Users className="w-3 h-3 inline mr-1" />
                      {a.athleteName}
                      <Calendar className="w-3 h-3 inline ml-3 mr-1" />
                      {format(new Date(a.scheduledDate), "MMM d, yyyy")}
                    </p>
                  </div>
                  <Badge variant="secondary" className="no-default-active-elevate">Upcoming</Badge>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-display font-bold mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Completed ({completedAssignments.length})
          </h2>
          {completedAssignments.length === 0 ? (
            <p className="text-muted-foreground text-sm">No completed assignments yet.</p>
          ) : (
            <div className="space-y-2">
              {completedAssignments.map(a => (
                <Card key={a.id} className="flex flex-row items-center gap-4 p-4" data-testid={`card-assignment-${a.id}`}>
                  <div className="flex-1">
                    <p className="font-medium">{a.workoutTitle}</p>
                    <p className="text-sm text-muted-foreground">
                      <Users className="w-3 h-3 inline mr-1" />
                      {a.athleteName}
                      <Calendar className="w-3 h-3 inline ml-3 mr-1" />
                      {format(new Date(a.scheduledDate), "MMM d, yyyy")}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setViewLogId(a.id)}
                    data-testid={`button-view-log-${a.id}`}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Badge variant="default" className="bg-green-600 no-default-active-elevate">Completed</Badge>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!viewLogId} onOpenChange={(open) => !open && setViewLogId(null)}>
        <DialogContent className="max-w-lg max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Workout Log</DialogTitle>
            <DialogDescription>Athlete's logged results for this workout.</DialogDescription>
          </DialogHeader>
          {logDetail ? (
            <div className="space-y-3">
              {logDetail.overallNotes && (
                <p className="text-sm bg-secondary/30 p-3 rounded-md">{logDetail.overallNotes}</p>
              )}
              {(logDetail.sets || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No set data logged.</p>
              ) : (
                <div className="space-y-2">
                  {logDetail.sets.map((s: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-md bg-secondary/30 text-sm">
                      <span className="font-medium flex-1">{s.exerciseName}</span>
                      <span className="text-muted-foreground">Set {s.setNumber}</span>
                      {s.reps && <span>{s.reps} reps</span>}
                      {s.weight && <span>@ {s.weight}</span>}
                      {s.rpe && <span>RPE {s.rpe}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No log available.</p>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
