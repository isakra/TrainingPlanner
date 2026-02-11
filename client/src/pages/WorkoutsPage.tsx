import { Layout } from "@/components/Layout";
import { useWorkouts, useCreateWorkout } from "@/hooks/use-workouts";
import { useAuth } from "@/hooks/use-auth";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWorkoutSchema, type Workout } from "@shared/schema";
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
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  ArrowRight,
  ClipboardList,
  Trophy,
  Dumbbell,
  Search,
  Star,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function parseWorkoutMeta(description: string | null) {
  if (!description) return { level: "", sport: "", text: "" };
  const levelMatch = description.match(/^\[([^\]]+)\]/);
  const sportMatch = description.match(/^\[[^\]]+\]\s*\[([^\]]+)\]/);
  const level = levelMatch ? levelMatch[1] : "";
  const sport = sportMatch ? sportMatch[1] : "";
  const text = description.replace(/^\[[^\]]+\]\s*\[[^\]]+\]\s*/, "");
  return { level, sport, text };
}

export default function WorkoutsPage() {
  const { data: workouts, isLoading } = useWorkouts();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"premade" | "my">("premade");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [selectedSport, setSelectedSport] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const premadeWorkouts = useMemo(
    () => (workouts || []).filter(w => w.coachId === "system"),
    [workouts]
  );

  const myWorkouts = useMemo(
    () => (workouts || []).filter(w => w.coachId !== "system"),
    [workouts]
  );

  const levels = useMemo(() => {
    const set = new Set(premadeWorkouts.map(w => parseWorkoutMeta(w.description).level).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [premadeWorkouts]);

  const sports = useMemo(() => {
    const set = new Set(premadeWorkouts.map(w => parseWorkoutMeta(w.description).sport).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [premadeWorkouts]);

  const filteredPremade = useMemo(() => {
    return premadeWorkouts.filter(w => {
      const meta = parseWorkoutMeta(w.description);
      const matchesLevel = selectedLevel === "All" || meta.level === selectedLevel;
      const matchesSport = selectedSport === "All" || meta.sport === selectedSport;
      const matchesSearch = searchTerm === "" ||
        w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        meta.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        meta.sport.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesLevel && matchesSport && matchesSearch;
    });
  }, [premadeWorkouts, selectedLevel, selectedSport, searchTerm]);

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-wide" data-testid="text-page-title">
            Workout Templates
          </h1>
          <p className="text-muted-foreground">
            Browse pre-made programs or create your own.
          </p>
        </div>
        <CreateWorkoutDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      </div>

      <div className="flex gap-2">
        <Button
          variant={activeTab === "premade" ? "default" : "outline"}
          onClick={() => setActiveTab("premade")}
          className="gap-2"
          data-testid="button-tab-premade"
        >
          <Star className="w-4 h-4" />
          Pre-Made Programs ({premadeWorkouts.length})
        </Button>
        <Button
          variant={activeTab === "my" ? "default" : "outline"}
          onClick={() => setActiveTab("my")}
          className="gap-2"
          data-testid="button-tab-my"
        >
          <ClipboardList className="w-4 h-4" />
          My Workouts ({myWorkouts.length})
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-48 bg-secondary/30 rounded-md animate-pulse" />
          ))}
        </div>
      ) : activeTab === "premade" ? (
        <PremadeSection
          workouts={filteredPremade}
          levels={levels}
          sports={sports}
          selectedLevel={selectedLevel}
          selectedSport={selectedSport}
          searchTerm={searchTerm}
          onLevelChange={(l) => { setSelectedLevel(l); }}
          onSportChange={(s) => { setSelectedSport(s); }}
          onSearchChange={setSearchTerm}
        />
      ) : (
        <MyWorkoutsSection
          workouts={myWorkouts}
          onCreateClick={() => setIsCreateOpen(true)}
        />
      )}
    </Layout>
  );
}

function PremadeSection({
  workouts,
  levels,
  sports,
  selectedLevel,
  selectedSport,
  searchTerm,
  onLevelChange,
  onSportChange,
  onSearchChange,
}: {
  workouts: Workout[];
  levels: string[];
  sports: string[];
  selectedLevel: string;
  selectedSport: string;
  searchTerm: string;
  onLevelChange: (l: string) => void;
  onSportChange: (s: string) => void;
  onSearchChange: (s: string) => void;
}) {
  return (
    <>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search programs..."
          className="pl-10 bg-card border-border/50 h-12 text-base"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          data-testid="input-search-premade"
        />
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground mr-1">Level:</span>
          {levels.map(level => (
            <Badge
              key={level}
              variant={selectedLevel === level ? "default" : "outline"}
              className="cursor-pointer select-none toggle-elevate"
              onClick={() => onLevelChange(level)}
              data-testid={`badge-level-${level.toLowerCase()}`}
            >
              {level}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground mr-1">Sport:</span>
          {sports.map(sport => (
            <Badge
              key={sport}
              variant={selectedSport === sport ? "default" : "outline"}
              className="cursor-pointer select-none toggle-elevate"
              onClick={() => onSportChange(sport)}
              data-testid={`badge-sport-${sport.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {sport}
            </Badge>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground" data-testid="text-premade-count">
        {workouts.length} program{workouts.length !== 1 ? "s" : ""} found
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workouts.map((workout) => {
          const meta = parseWorkoutMeta(workout.description);
          return (
            <Card key={workout.id} className="flex flex-col" data-testid={`card-premade-${workout.id}`}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="text-xs no-default-active-elevate">
                    {meta.level}
                  </Badge>
                  <Badge variant="outline" className="text-xs no-default-active-elevate">
                    {meta.sport}
                  </Badge>
                </div>
                <CardTitle className="mt-2 text-lg font-display flex items-start gap-2">
                  <Trophy className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
                  {workout.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <p className="text-sm text-muted-foreground mb-4 flex-1 line-clamp-3">
                  {meta.text}
                </p>
                <Link href={`/workouts/${workout.id}`} className="w-full">
                  <Button variant="secondary" className="w-full gap-2" data-testid={`button-view-premade-${workout.id}`}>
                    <Dumbbell className="w-4 h-4" />
                    View Program
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}

        {workouts.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground" data-testid="text-no-premade-results">
            No programs match your filters.
          </div>
        )}
      </div>
    </>
  );
}

function MyWorkoutsSection({
  workouts,
  onCreateClick,
}: {
  workouts: Workout[];
  onCreateClick: () => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {workouts.map((workout) => (
        <Card key={workout.id} className="flex flex-col" data-testid={`card-workout-${workout.id}`}>
          <CardHeader>
            <CardTitle className="flex items-start gap-3">
              <div className="mt-1 p-2 bg-secondary rounded-md text-primary">
                <ClipboardList className="w-5 h-5" />
              </div>
              <span className="font-display text-xl uppercase tracking-wide">{workout.name}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <p className="text-sm text-muted-foreground mb-4 flex-1">
              {workout.description || "No description provided."}
            </p>
            <Link href={`/workouts/${workout.id}`} className="w-full">
              <Button variant="secondary" className="w-full gap-2" data-testid={`button-view-workout-${workout.id}`}>
                Edit / Details
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}

      {workouts.length === 0 && (
        <div className="col-span-full flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-md">
          <ClipboardList className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No Templates Yet</h3>
          <p className="text-muted-foreground mb-6">Create your first workout template to get started.</p>
          <Button onClick={onCreateClick} data-testid="button-create-first">Create Template</Button>
        </div>
      )}
    </div>
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
      coachId: user?.id || ""
    }
  });

  const onSubmit = (data: z.infer<typeof insertWorkoutSchema>) => {
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
        <Button className="gap-2 shadow-lg shadow-primary/20" data-testid="button-create-workout">
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
            <Input {...form.register("name")} placeholder="e.g. Upper Body Hypertrophy" data-testid="input-workout-name" />
            {form.formState.errors.name && <span className="text-xs text-destructive">{form.formState.errors.name.message}</span>}
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea {...form.register("description")} placeholder="Goal of this session..." data-testid="input-workout-description" />
          </div>
          <Button type="submit" className="w-full mt-4" disabled={createMutation.isPending} data-testid="button-submit-workout">
            {createMutation.isPending ? "Creating..." : "Create Template"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
