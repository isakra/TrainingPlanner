import { Layout } from "@/components/Layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { useState, useMemo } from "react";
import { Link } from "wouter";
import type { WorkoutTemplate, WorkoutTemplateWithBlocks } from "@shared/schema";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import {
  Search, Trophy, Copy, ArrowRight, Clock, Dumbbell, Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CoachTemplatesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: templates, isLoading } = useQuery<WorkoutTemplate[]>({
    queryKey: ["/api/templates"],
    queryFn: () => apiGet("/api/templates"),
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);

  const { data: templateDetail, isLoading: isLoadingDetail } = useQuery<WorkoutTemplateWithBlocks>({
    queryKey: ["/api/templates", selectedTemplate],
    queryFn: () => apiGet(`/api/templates/${selectedTemplate}`),
    enabled: !!selectedTemplate,
  });

  const cloneMutation = useMutation({
    mutationFn: (templateId: number) => apiPost(`/api/templates/${templateId}/clone`),
    onSuccess: () => {
      toast({ title: "Cloned!", description: "Template copied to your custom workouts." });
      queryClient.invalidateQueries({ queryKey: ["/api/custom-workouts"] });
      setSelectedTemplate(null);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const difficulties = useMemo(() => {
    const set = new Set((templates || []).map(t => t.difficulty).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [templates]);

  const tags = useMemo(() => {
    const set = new Set((templates || []).flatMap(t => t.tags || []).filter(Boolean));
    return Array.from(set).sort();
  }, [templates]);

  const filtered = useMemo(() => {
    return (templates || []).filter(t => {
      const matchesDifficulty = selectedDifficulty === "All" || t.difficulty === selectedDifficulty;
      const matchesSearch = searchTerm === "" ||
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesDifficulty && matchesSearch;
    });
  }, [templates, selectedDifficulty, searchTerm]);

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-wide" data-testid="text-page-title">
            Template Library
          </h1>
          <p className="text-muted-foreground">Browse and clone pre-made workout programs.</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          className="pl-10 bg-card border-border/50"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          data-testid="input-search-templates"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground mr-1">Difficulty:</span>
        {difficulties.map(d => (
          <Badge
            key={d}
            variant={selectedDifficulty === d ? "default" : "outline"}
            className="cursor-pointer select-none toggle-elevate"
            onClick={() => setSelectedDifficulty(d)}
            data-testid={`badge-difficulty-${d.toLowerCase()}`}
          >
            {d}
          </Badge>
        ))}
      </div>

      <p className="text-sm text-muted-foreground" data-testid="text-template-count">
        {filtered.length} template{filtered.length !== 1 ? "s" : ""} found
      </p>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-48 bg-secondary/30 rounded-md animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(template => (
            <Card
              key={template.id}
              className="flex flex-col cursor-pointer hover-elevate"
              onClick={() => setSelectedTemplate(template.id)}
              data-testid={`card-template-${template.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  {template.difficulty && (
                    <Badge variant="secondary" className="text-xs no-default-active-elevate">
                      {template.difficulty}
                    </Badge>
                  )}
                  {(template.tags || []).slice(0, 2).map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs no-default-active-elevate">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <CardTitle className="mt-2 text-lg font-display flex items-start gap-2">
                  <Trophy className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
                  {template.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {template.description}
                </p>
                {template.estimatedDuration && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {template.estimatedDuration} min
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground" data-testid="text-no-templates">
              No templates match your search.
            </div>
          )}
        </div>
      )}

      <Dialog open={!!selectedTemplate} onOpenChange={(open) => !open && setSelectedTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {isLoadingDetail ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : templateDetail ? (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {templateDetail.difficulty && (
                    <Badge variant="secondary" className="no-default-active-elevate">{templateDetail.difficulty}</Badge>
                  )}
                  {(templateDetail.tags || []).map(tag => (
                    <Badge key={tag} variant="outline" className="no-default-active-elevate">{tag}</Badge>
                  ))}
                </div>
                <DialogTitle className="text-2xl font-display" data-testid="text-template-detail-title">
                  {templateDetail.title}
                </DialogTitle>
                <DialogDescription>{templateDetail.description}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {templateDetail.blocks.map(block => (
                  <div key={block.id} className="space-y-2">
                    <h3 className="font-semibold text-sm uppercase tracking-wide text-primary">
                      {block.title}
                    </h3>
                    <div className="space-y-1">
                      {block.exercises.map(ex => {
                        const rx = ex.prescriptionJson as any;
                        return (
                          <div key={ex.id} className="flex items-start gap-3 p-2 rounded-md bg-secondary/30">
                            <Dumbbell className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1">
                              <span className="font-medium text-sm">{ex.name}</span>
                              {rx && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  {rx.sets && `${rx.sets} sets`}
                                  {rx.reps && ` x ${rx.reps}`}
                                  {rx.weight && ` @ ${rx.weight}`}
                                </span>
                              )}
                              {ex.notes && (
                                <p className="text-xs text-muted-foreground mt-0.5">{ex.notes}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  className="flex-1 gap-2"
                  onClick={() => cloneMutation.mutate(templateDetail.id)}
                  disabled={cloneMutation.isPending}
                  data-testid="button-clone-template"
                >
                  <Copy className="w-4 h-4" />
                  {cloneMutation.isPending ? "Cloning..." : "Clone to My Workouts"}
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
