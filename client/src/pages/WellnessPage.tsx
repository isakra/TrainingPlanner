import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost } from "@/lib/api";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { Heart, Moon, Brain, Smile, Activity } from "lucide-react";
import { useState } from "react";
import type { WellnessCheckin } from "@shared/schema";

export default function WellnessPage() {
  const { toast } = useToast();

  const { data: history, isLoading } = useQuery<WellnessCheckin[]>({
    queryKey: ["/api/athlete/wellness"],
    queryFn: () => apiGet("/api/athlete/wellness"),
  });

  const submitMutation = useMutation({
    mutationFn: async (data: {
      sleep: number;
      soreness: number;
      stress: number;
      mood: number;
      note?: string;
    }) => {
      return apiPost("/api/athlete/wellness", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Wellness check-in submitted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/athlete/wellness"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit wellness check-in",
        variant: "destructive",
      });
    },
  });

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold">Wellness Check-in</h1>
        <p className="text-muted-foreground">
          {format(new Date(), "EEEE, MMMM do, yyyy")}
        </p>
      </div>

      <div className="space-y-8">
        <SubmitCheckInForm onSubmit={submitMutation.mutate} isPending={submitMutation.isPending} />
        <HistorySection history={history} isLoading={isLoading} />
      </div>
    </Layout>
  );
}

function SubmitCheckInForm({
  onSubmit,
  isPending,
}: {
  onSubmit: (data: {
    sleep: number;
    soreness: number;
    stress: number;
    mood: number;
    note?: string;
  }) => void;
  isPending: boolean;
}) {
  const [sleep, setSleep] = useState<number | null>(null);
  const [soreness, setSoreness] = useState<number | null>(null);
  const [stress, setStress] = useState<number | null>(null);
  const [mood, setMood] = useState<number | null>(null);
  const [note, setNote] = useState("");

  const handleSubmit = () => {
    if (sleep === null || soreness === null || stress === null || mood === null) {
      return;
    }

    onSubmit({
      sleep,
      soreness,
      stress,
      mood,
      note: note.trim() || undefined,
    });

    // Reset form
    setSleep(null);
    setSoreness(null);
    setStress(null);
    setMood(null);
    setNote("");
  };

  const isFormValid = sleep !== null && soreness !== null && stress !== null && mood !== null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Check-in</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sleep Rating */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Moon className="w-5 h-5 text-blue-500" />
            <label className="font-medium">Sleep Quality</label>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <Button
                key={rating}
                variant="outline"
                className={`toggle-elevate ${sleep === rating ? "toggle-elevated" : ""}`}
                onClick={() => setSleep(rating)}
                data-testid={`button-sleep-${rating}`}
              >
                {rating}
              </Button>
            ))}
          </div>
        </div>

        {/* Soreness Rating */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-5 h-5 text-orange-500" />
            <label className="font-medium">Soreness Level</label>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <Button
                key={rating}
                variant="outline"
                className={`toggle-elevate ${soreness === rating ? "toggle-elevated" : ""}`}
                onClick={() => setSoreness(rating)}
                data-testid={`button-soreness-${rating}`}
              >
                {rating}
              </Button>
            ))}
          </div>
        </div>

        {/* Stress Rating */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-5 h-5 text-purple-500" />
            <label className="font-medium">Stress Level</label>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <Button
                key={rating}
                variant="outline"
                className={`toggle-elevate ${stress === rating ? "toggle-elevated" : ""}`}
                onClick={() => setStress(rating)}
                data-testid={`button-stress-${rating}`}
              >
                {rating}
              </Button>
            ))}
          </div>
        </div>

        {/* Mood Rating */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Smile className="w-5 h-5 text-yellow-500" />
            <label className="font-medium">Mood</label>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <Button
                key={rating}
                variant="outline"
                className={`toggle-elevate ${mood === rating ? "toggle-elevated" : ""}`}
                onClick={() => setMood(rating)}
                data-testid={`button-mood-${rating}`}
              >
                {rating}
              </Button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="font-medium block mb-2">Notes (Optional)</label>
          <Textarea
            placeholder="Any additional notes about your wellness today..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            data-testid="textarea-note"
            className="resize-none"
          />
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid || isPending}
          data-testid="button-submit-checkin"
          className="w-full"
        >
          {isPending ? "Submitting..." : "Submit Check-in"}
        </Button>
      </CardContent>
    </Card>
  );
}

function HistorySection({
  history,
  isLoading,
}: {
  history?: WellnessCheckin[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div>
        <h2 className="text-xl font-display font-semibold mb-4">Check-in History</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-display font-semibold mb-4">Check-in History</h2>
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No check-ins yet. Start by submitting your first wellness check-in.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-display font-semibold mb-4">Check-in History</h2>
      <div className="space-y-3">
        {history.map((checkin, index) => (
          <CheckInCard key={checkin.id} checkin={checkin} index={index} />
        ))}
      </div>
    </div>
  );
}

function CheckInCard({ checkin, index }: { checkin: WellnessCheckin; index: number }) {
  const getMetricColor = (value: number) => {
    if (value >= 4) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (value === 3) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  };

  return (
    <Card data-testid={`card-checkin-${index}`}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Date Header */}
          <div className="flex items-center justify-between border-b pb-4">
            <h3 className="font-semibold text-foreground">
              {format(new Date(checkin.date), "MMMM d, yyyy")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {format(new Date(checkin.date), "h:mm a")}
            </p>
          </div>

          {/* Metrics Row */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-blue-500" />
              <Badge className={`${getMetricColor(checkin.sleep)} border-0`} data-testid={`badge-sleep-${index}`}>
                Sleep: {checkin.sleep}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-orange-500" />
              <Badge className={`${getMetricColor(checkin.soreness)} border-0`} data-testid={`badge-soreness-${index}`}>
                Soreness: {checkin.soreness}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-500" />
              <Badge className={`${getMetricColor(checkin.stress)} border-0`} data-testid={`badge-stress-${index}`}>
                Stress: {checkin.stress}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Smile className="w-4 h-4 text-yellow-500" />
              <Badge className={`${getMetricColor(checkin.mood)} border-0`} data-testid={`badge-mood-${index}`}>
                Mood: {checkin.mood}
              </Badge>
            </div>
          </div>

          {/* Note if present */}
          {checkin.note && (
            <div className="bg-muted/50 rounded p-3 text-sm">
              <p className="text-muted-foreground italic" data-testid={`text-note-${index}`}>
                {checkin.note}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
