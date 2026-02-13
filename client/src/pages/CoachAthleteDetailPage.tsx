import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiGet } from "@/lib/api";
import { format } from "date-fns";
import { ArrowLeft, Dumbbell, Trophy, Heart, Activity, Search, Calendar } from "lucide-react";

type Tab = "workouts" | "exercise-history" | "prs" | "wellness";

type AthleteDetail = {
  athlete: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    profileImageUrl?: string;
  };
  recentAssignments: Array<{
    id: number;
    workoutTitle: string;
    scheduledDate: string;
    status: string;
  }>;
  latestWellness: {
    sleep: number;
    soreness: number;
    stress: number;
    mood: number;
    date: string;
  } | null;
  prs: Array<{
    id: number;
    exerciseName: string;
    type: string;
    value: number;
    reps?: number;
    date: string;
  }>;
};

type SetLog = {
  id: number;
  exerciseName: string;
  setNumber: number;
  reps?: number;
  weight?: number;
  rpe?: number;
  time?: number;
  distance?: number;
};

type WellnessCheckin = {
  id: number;
  date: string;
  sleep: number;
  soreness: number;
  stress: number;
  mood: number;
};

type PersonalRecord = {
  id: number;
  exerciseName: string;
  type: string;
  value: number;
  reps?: number;
  date: string;
};

function wellnessColor(score: number): string {
  if (score >= 4) return "bg-green-500/15 text-green-700 dark:text-green-400";
  if (score === 3) return "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400";
  return "bg-red-500/15 text-red-700 dark:text-red-400";
}

function prTypeLabel(type: string): string {
  if (type === "weight") return "Best Weight";
  if (type === "estimated_1rm") return "Est. 1RM";
  if (type === "fastest_time") return "Best Time";
  return type;
}

export default function CoachAthleteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("workouts");
  const [exerciseSearch, setExerciseSearch] = useState("");

  const { data, isLoading, error } = useQuery<AthleteDetail>({
    queryKey: ["/api/coach/athletes", id],
    queryFn: () => apiGet(`/api/coach/athletes/${id}`),
    enabled: !!id,
  });

  const { data: exerciseHistory = [], isFetching: isExerciseFetching } = useQuery<SetLog[]>({
    queryKey: ["/api/coach/athletes", id, "exercise-history", exerciseSearch],
    queryFn: () => apiGet(`/api/coach/athletes/${id}/exercise-history?name=${encodeURIComponent(exerciseSearch)}`),
    enabled: !!id && activeTab === "exercise-history" && exerciseSearch.trim().length > 0,
  });

  const { data: wellnessHistory = [], isLoading: isWellnessLoading } = useQuery<WellnessCheckin[]>({
    queryKey: ["/api/coach/athletes", id, "wellness"],
    queryFn: () => apiGet(`/api/coach/athletes/${id}/wellness`),
    enabled: !!id && activeTab === "wellness",
  });

  const { data: allPrs = [], isLoading: isPrsLoading } = useQuery<PersonalRecord[]>({
    queryKey: ["/api/coach/athletes", id, "prs"],
    queryFn: () => apiGet(`/api/coach/athletes/${id}/prs`),
    enabled: !!id && activeTab === "prs",
  });

  if (error) {
    toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
  }

  const athlete = data?.athlete;
  const name = athlete
    ? `${athlete.firstName || ""} ${athlete.lastName || ""}`.trim() || athlete.email || "Unknown"
    : "";
  const initials = athlete?.firstName && athlete?.lastName
    ? `${athlete.firstName[0]}${athlete.lastName[0]}`
    : name.substring(0, 2).toUpperCase();

  const tabs: { key: Tab; label: string; icon: typeof Dumbbell }[] = [
    { key: "workouts", label: "Recent Workouts", icon: Dumbbell },
    { key: "exercise-history", label: "Exercise History", icon: Activity },
    { key: "prs", label: "PRs", icon: Trophy },
    { key: "wellness", label: "Wellness", icon: Heart },
  ];

  const prsGrouped = allPrs.reduce<Record<string, PersonalRecord[]>>((acc, pr) => {
    if (!acc[pr.exerciseName]) acc[pr.exerciseName] = [];
    acc[pr.exerciseName].push(pr);
    return acc;
  }, {});

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4 flex-wrap">
          <Link href="/coach/athletes">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          {isLoading ? (
            <div className="h-10 w-48 rounded-md bg-muted animate-pulse" />
          ) : (
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12" data-testid="avatar-athlete">
                <AvatarImage src={athlete?.profileImageUrl || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold tracking-tight" data-testid="text-athlete-name">{name}</h1>
                {athlete?.email && (
                  <p className="text-sm text-muted-foreground" data-testid="text-athlete-email">{athlete.email}</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap" data-testid="tab-buttons">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <Button
                key={tab.key}
                variant="ghost"
                size="sm"
                className={`toggle-elevate ${isActive ? "toggle-elevated" : ""}`}
                onClick={() => setActiveTab(tab.key)}
                data-testid={`tab-${tab.key}`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </Button>
            );
          })}
        </div>

        {activeTab === "workouts" && (
          <div className="space-y-3" data-testid="section-workouts">
            {isLoading ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>
            ) : !data?.recentAssignments?.length ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground" data-testid="text-no-workouts">No recent workouts found.</CardContent></Card>
            ) : (
              data.recentAssignments.map((a) => (
                <Card key={a.id} data-testid={`workout-row-${a.id}`}>
                  <CardContent className="flex items-center gap-3 py-4 flex-wrap">
                    <Dumbbell className="w-5 h-5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate" data-testid={`text-workout-title-${a.id}`}>{a.workoutTitle}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(a.scheduledDate), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Badge
                      variant={a.status === "COMPLETED" ? "default" : "secondary"}
                      data-testid={`badge-status-${a.id}`}
                    >
                      {a.status}
                    </Badge>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === "exercise-history" && (
          <div className="space-y-4" data-testid="section-exercise-history">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search exercise name..."
                value={exerciseSearch}
                onChange={(e) => setExerciseSearch(e.target.value)}
                className="pl-10"
                data-testid="input-exercise-search"
              />
            </div>
            {exerciseSearch.trim().length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground" data-testid="text-search-prompt">Enter an exercise name to view history.</CardContent></Card>
            ) : isExerciseFetching ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>
            ) : exerciseHistory.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground" data-testid="text-no-exercise-history">No results found.</CardContent></Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm" data-testid="table-exercise-history">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium">Exercise</th>
                          <th className="text-left p-3 font-medium">Set #</th>
                          <th className="text-left p-3 font-medium">Reps</th>
                          <th className="text-left p-3 font-medium">Weight</th>
                          <th className="text-left p-3 font-medium">RPE</th>
                          <th className="text-left p-3 font-medium">Time</th>
                          <th className="text-left p-3 font-medium">Distance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exerciseHistory.map((log, idx) => (
                          <tr key={log.id || idx} className="border-b last:border-b-0" data-testid={`exercise-row-${idx}`}>
                            <td className="p-3">{log.exerciseName}</td>
                            <td className="p-3">{log.setNumber}</td>
                            <td className="p-3">{log.reps ?? "-"}</td>
                            <td className="p-3">{log.weight ?? "-"}</td>
                            <td className="p-3">{log.rpe ?? "-"}</td>
                            <td className="p-3">{log.time ?? "-"}</td>
                            <td className="p-3">{log.distance ?? "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === "prs" && (
          <div className="space-y-4" data-testid="section-prs">
            {isPrsLoading ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>
            ) : Object.keys(prsGrouped).length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground" data-testid="text-no-prs">No personal records found.</CardContent></Card>
            ) : (
              Object.entries(prsGrouped).map(([exerciseName, records]) => (
                <Card key={exerciseName} data-testid={`pr-group-${exerciseName}`}>
                  <CardContent className="py-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-muted-foreground" />
                      <h3 className="font-semibold" data-testid={`text-pr-exercise-${exerciseName}`}>{exerciseName}</h3>
                    </div>
                    <div className="space-y-2">
                      {records.map((pr) => (
                        <div
                          key={pr.id}
                          className="flex items-center gap-2 text-sm flex-wrap"
                          data-testid={`pr-row-${pr.id}`}
                        >
                          <Badge variant="secondary" data-testid={`badge-pr-type-${pr.id}`}>
                            {prTypeLabel(pr.type)}
                          </Badge>
                          <span className="font-medium" data-testid={`text-pr-value-${pr.id}`}>{pr.value}</span>
                          {pr.reps != null && (
                            <span className="text-muted-foreground">x {pr.reps} reps</span>
                          )}
                          <span className="text-muted-foreground ml-auto flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(pr.date), "MMM d, yyyy")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === "wellness" && (
          <div className="space-y-4" data-testid="section-wellness">
            {data?.latestWellness && (
              <Card data-testid="card-latest-wellness">
                <CardContent className="py-4">
                  <h3 className="font-semibold mb-3">Latest Check-in</h3>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-muted-foreground">Sleep</span>
                      <Badge className={`no-default-hover-elevate no-default-active-elevate ${wellnessColor(data.latestWellness.sleep)}`} data-testid="badge-latest-sleep">
                        {data.latestWellness.sleep}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-muted-foreground">Soreness</span>
                      <Badge className={`no-default-hover-elevate no-default-active-elevate ${wellnessColor(data.latestWellness.soreness)}`} data-testid="badge-latest-soreness">
                        {data.latestWellness.soreness}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-muted-foreground">Stress</span>
                      <Badge className={`no-default-hover-elevate no-default-active-elevate ${wellnessColor(data.latestWellness.stress)}`} data-testid="badge-latest-stress">
                        {data.latestWellness.stress}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-muted-foreground">Mood</span>
                      <Badge className={`no-default-hover-elevate no-default-active-elevate ${wellnessColor(data.latestWellness.mood)}`} data-testid="badge-latest-mood">
                        {data.latestWellness.mood}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {isWellnessLoading ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>
            ) : wellnessHistory.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground" data-testid="text-no-wellness">No wellness data found.</CardContent></Card>
            ) : (
              <div className="space-y-2">
                {wellnessHistory.map((w) => (
                  <Card key={w.id} data-testid={`wellness-row-${w.id}`}>
                    <CardContent className="flex items-center gap-3 py-3 flex-wrap">
                      <span className="text-sm font-medium min-w-[100px]" data-testid={`text-wellness-date-${w.id}`}>
                        {format(new Date(w.date), "MMM d, yyyy")}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">Sleep</span>
                        <Badge className={`no-default-hover-elevate no-default-active-elevate ${wellnessColor(w.sleep)}`} data-testid={`badge-sleep-${w.id}`}>
                          {w.sleep}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">Soreness</span>
                        <Badge className={`no-default-hover-elevate no-default-active-elevate ${wellnessColor(w.soreness)}`} data-testid={`badge-soreness-${w.id}`}>
                          {w.soreness}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">Stress</span>
                        <Badge className={`no-default-hover-elevate no-default-active-elevate ${wellnessColor(w.stress)}`} data-testid={`badge-stress-${w.id}`}>
                          {w.stress}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">Mood</span>
                        <Badge className={`no-default-hover-elevate no-default-active-elevate ${wellnessColor(w.mood)}`} data-testid={`badge-mood-${w.id}`}>
                          {w.mood}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
