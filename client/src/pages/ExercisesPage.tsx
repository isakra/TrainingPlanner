import { Layout } from "@/components/Layout";
import { useExercises, useCreateExercise } from "@/hooks/use-exercises";
import { useState, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Search, Plus, PlayCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PAGE_SIZE = 30;

export default function ExercisesPage() {
  const { data: exercises, isLoading } = useExercises();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [page, setPage] = useState(0);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const categories = useMemo(() => {
    if (!exercises) return ["All"];
    const cats = [...new Set(exercises.map(ex => ex.category))].sort();
    return ["All", ...cats];
  }, [exercises]);

  const filteredExercises = useMemo(() => {
    if (!exercises) return [];
    return exercises.filter(ex => {
      const matchesSearch = searchTerm === "" ||
        ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ex.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ex.instructions && ex.instructions.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === "All" || ex.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [exercises, searchTerm, selectedCategory]);

  const totalPages = Math.ceil((filteredExercises?.length || 0) / PAGE_SIZE);
  const pagedExercises = filteredExercises.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setPage(0);
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setPage(0);
  };

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-wide" data-testid="text-page-title">Exercise Library</h1>
          <p className="text-muted-foreground" data-testid="text-exercise-count">
            {isLoading ? "Loading..." : `${filteredExercises.length} exercises`}
            {selectedCategory !== "All" && ` in ${selectedCategory}`}
          </p>
        </div>
        
        <CreateExerciseDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search exercises by name, category, or instructions..." 
          className="pl-10 bg-card border-border/50 h-12 text-base"
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          data-testid="input-search-exercises"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <Badge
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            className="cursor-pointer select-none toggle-elevate"
            onClick={() => handleCategoryChange(cat)}
            data-testid={`badge-category-${cat.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {cat}
            {cat !== "All" && exercises && (
              <span className="ml-1 opacity-70">
                ({exercises.filter(ex => ex.category === cat).length})
              </span>
            )}
          </Badge>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 bg-secondary/30 rounded-md animate-pulse" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pagedExercises.map((exercise) => (
              <Card key={exercise.id} data-testid={`card-exercise-${exercise.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <Badge variant="secondary" className="text-xs no-default-active-elevate">
                      {exercise.category}
                    </Badge>
                  </div>
                  <CardTitle className="mt-2 text-lg font-display">{exercise.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                    {exercise.instructions || "No specific instructions provided."}
                  </p>
                  {exercise.videoUrl && (
                    <Button variant="outline" size="sm" className="w-full gap-2" asChild>
                      <a href={exercise.videoUrl} target="_blank" rel="noopener noreferrer" data-testid={`link-video-${exercise.id}`}>
                        <PlayCircle className="w-4 h-4" />
                        Watch Demo
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
            
            {filteredExercises.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground" data-testid="text-no-results">
                No exercises found matching "{searchTerm}"
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                data-testid="button-prev-page"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground" data-testid="text-page-info">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                data-testid="button-next-page"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </>
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
        <Button className="gap-2 shadow-lg shadow-primary/20" data-testid="button-add-exercise">
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
            <Input {...form.register("name")} placeholder="e.g. Back Squat" data-testid="input-exercise-name" />
            {form.formState.errors.name && <span className="text-xs text-destructive">{form.formState.errors.name.message}</span>}
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Input {...form.register("category")} placeholder="e.g. Strength, Cardio" data-testid="input-exercise-category" />
            {form.formState.errors.category && <span className="text-xs text-destructive">{form.formState.errors.category.message}</span>}
          </div>
          <div className="space-y-2">
            <Label>Video URL (Optional)</Label>
            <Input {...form.register("videoUrl")} placeholder="https://youtube.com/..." data-testid="input-exercise-video" />
          </div>
          <div className="space-y-2">
            <Label>Instructions</Label>
            <Textarea {...form.register("instructions")} placeholder="Cues and setup details..." data-testid="input-exercise-instructions" />
          </div>
          <Button type="submit" className="w-full mt-4" disabled={createMutation.isPending} data-testid="button-create-exercise">
            {createMutation.isPending ? "Creating..." : "Create Exercise"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
