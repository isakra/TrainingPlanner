import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiGet } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Trophy, Dumbbell } from "lucide-react";
import type { PersonalRecord } from "@shared/schema";

export default function AthletePRsPage() {
  const { data: prs, isLoading } = useQuery<PersonalRecord[]>({
    queryKey: ["/api/athlete/prs"],
    queryFn: () => apiGet("/api/athlete/prs"),
  });

  return (
    <Layout>
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-display font-bold">My Personal Records</h1>
        </div>
        <p className="text-muted-foreground mt-2">
          Track and view your best lifts, times, and achievements
        </p>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : !prs || prs.length === 0 ? (
        <EmptyState />
      ) : (
        <PRsByExercise prs={prs} />
      )}
    </Layout>
  );
}

function PRsByExercise({ prs }: { prs: PersonalRecord[] }) {
  const grouped = prs.reduce(
    (acc, pr) => {
      if (!acc[pr.exerciseName]) {
        acc[pr.exerciseName] = [];
      }
      acc[pr.exerciseName].push(pr);
      return acc;
    },
    {} as Record<string, PersonalRecord[]>
  );

  return (
    <div className="grid gap-6">
      {Object.entries(grouped).map(([exerciseName, records]) => (
        <Card key={exerciseName} data-testid={`card-exercise-${exerciseName}`}>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-primary" />
              <CardTitle>{exerciseName}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {records.map((record) => (
                <PREntry
                  key={record.id}
                  record={record}
                  exerciseName={exerciseName}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PREntry({
  record,
  exerciseName,
}: {
  record: PersonalRecord;
  exerciseName: string;
}) {
  const getBadgeVariant = (type: string) => {
    switch (type) {
      case "weight":
        return "default";
      case "estimated_1rm":
        return "secondary";
      case "fastest_time":
        return "outline";
      default:
        return "default";
    }
  };

  const getBadgeLabel = (type: string) => {
    switch (type) {
      case "weight":
        return "Best Weight";
      case "estimated_1rm":
        return "Est. 1RM";
      case "fastest_time":
        return "Best Time";
      default:
        return type;
    }
  };

  const getValueDisplay = (type: string, value: string, reps?: number | null) => {
    if (type === "fastest_time") {
      return `${value}s`;
    }
    if (type === "weight" || type === "estimated_1rm") {
      return `${value} kg`;
    }
    return value;
  };

  const typeColors = {
    weight: "#3b82f6",
    estimated_1rm: "#a855f7",
    fastest_time: "#10b981",
  };

  const badgeColor =
    typeColors[record.type as keyof typeof typeColors] || "#6b7280";

  return (
    <div
      className="flex items-start justify-between p-4 bg-muted/50 rounded-md gap-4 flex-wrap"
      data-testid={`item-pr-${record.id}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <Badge variant={getBadgeVariant(record.type)} data-testid={`badge-type-${record.id}`}>
            {getBadgeLabel(record.type)}
          </Badge>
        </div>
        <p className="text-lg font-semibold text-foreground" data-testid={`text-value-${record.id}`}>
          {getValueDisplay(record.type, record.value, record.reps)}
        </p>
        {record.reps && (
          <p className="text-sm text-muted-foreground" data-testid={`text-reps-${record.id}`}>
            {record.reps} {record.reps === 1 ? "rep" : "reps"}
          </p>
        )}
      </div>
      <div className="text-right">
        <p className="text-sm text-muted-foreground" data-testid={`text-date-${record.id}`}>
          {format(new Date(record.date), "MMM d, yyyy")}
        </p>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-6">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-4">
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2].map((j) => (
                <div key={j} className="flex justify-between items-start">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-4 w-28" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <Card data-testid="empty-state">
      <CardContent className="p-12 text-center">
        <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No Personal Records Yet
        </h3>
        <p className="text-muted-foreground">
          Complete workouts to start tracking your personal records. Your best lifts, times, and achievements will appear here.
        </p>
      </CardContent>
    </Card>
  );
}
