import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription
} from "@/components/ui/dialog";
import { Loader2, Plus, Users, ChevronRight, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiPost, apiDelete } from "@/lib/api";

type GroupWithCount = {
  id: number;
  coachId: string;
  name: string;
  description: string | null;
  createdAt: string;
  memberCount: number;
};

export default function CoachGroupsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { data: groupsList = [], isLoading } = useQuery<GroupWithCount[]>({
    queryKey: ["/api/coach/groups"],
  });

  const createMutation = useMutation({
    mutationFn: () => apiPost("/api/coach/groups", { name, description: description || undefined }),
    onSuccess: () => {
      toast({ title: "Group Created", description: `"${name}" has been created.` });
      setShowCreate(false);
      setName("");
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["/api/coach/groups"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/coach/groups/${id}`),
    onSuccess: () => {
      toast({ title: "Deleted", description: "Group has been deleted." });
      queryClient.invalidateQueries({ queryKey: ["/api/coach/groups"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate();
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Groups</h1>
            <p className="text-muted-foreground mt-1">Organize athletes into teams and squads</p>
          </div>

          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg shadow-primary/20" data-testid="button-create-group">
                <Plus className="w-4 h-4" />
                New Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Group</DialogTitle>
                <DialogDescription>Create a new team or squad to organize your athletes.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="group-name">Group Name</Label>
                  <Input
                    id="group-name"
                    placeholder="e.g. U16 Football"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    data-testid="input-group-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="group-desc">Description (optional)</Label>
                  <Input
                    id="group-desc"
                    placeholder="e.g. Under-16 football squad"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    data-testid="input-group-description"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createMutation.isPending || !name.trim()}
                  data-testid="button-submit-create-group"
                >
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create Group
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : groupsList.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground" data-testid="text-no-groups">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">No groups yet</p>
                <p className="text-sm mt-1">Create a group to organize your athletes into teams.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {groupsList.map((group) => (
              <Card
                key={group.id}
                className="cursor-pointer hover-elevate"
                onClick={() => setLocation(`/coach/groups/${group.id}`)}
                data-testid={`card-group-${group.id}`}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate" data-testid={`text-group-name-${group.id}`}>{group.name}</p>
                    {group.description && (
                      <p className="text-sm text-muted-foreground truncate">{group.description}</p>
                    )}
                  </div>
                  <Badge variant="secondary" className="no-default-active-elevate">
                    {group.memberCount} {group.memberCount === 1 ? "athlete" : "athletes"}
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(group.id); }}
                    data-testid={`button-delete-group-${group.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
