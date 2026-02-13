import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Loader2, ArrowLeft, UserPlus, UserMinus, Users, Send, MessageSquare, Pencil
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useParams } from "wouter";
import { apiPost, apiPut, apiDelete } from "@/lib/api";
import type { User } from "@shared/models/auth";

type GroupMemberWithAthlete = {
  id: number;
  groupId: number;
  athleteId: string;
  addedAt: string;
  athlete: User;
};

type GroupWithMembers = {
  id: number;
  coachId: string;
  name: string;
  description: string | null;
  createdAt: string;
  members: GroupMemberWithAthlete[];
};

type ConnectionWithAthlete = {
  id: number;
  coachId: string;
  athleteId: string;
  createdAt: string;
  athlete: User;
};

export default function CoachGroupDetailPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const groupId = Number(params.id);

  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedAthleteId, setSelectedAthleteId] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const { data: group, isLoading } = useQuery<GroupWithMembers>({
    queryKey: ["/api/coach/groups", groupId],
  });

  const { data: connections = [] } = useQuery<ConnectionWithAthlete[]>({
    queryKey: ["/api/coach/athletes"],
  });

  const memberAthleteIds = new Set(group?.members.map(m => m.athleteId) || []);
  const availableAthletes = connections
    .map(c => c.athlete)
    .filter(a => !memberAthleteIds.has(a.id));

  const addMemberMutation = useMutation({
    mutationFn: () => apiPost(`/api/coach/groups/${groupId}/members`, { athleteId: selectedAthleteId }),
    onSuccess: () => {
      toast({ title: "Added", description: "Athlete added to the group." });
      setShowAddMember(false);
      setSelectedAthleteId("");
      queryClient.invalidateQueries({ queryKey: ["/api/coach/groups", groupId] });
      queryClient.invalidateQueries({ queryKey: ["/api/coach/groups"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (athleteId: string) => apiDelete(`/api/coach/groups/${groupId}/members/${athleteId}`),
    onSuccess: () => {
      toast({ title: "Removed", description: "Athlete removed from the group." });
      queryClient.invalidateQueries({ queryKey: ["/api/coach/groups", groupId] });
      queryClient.invalidateQueries({ queryKey: ["/api/coach/groups"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => apiPut(`/api/coach/groups/${groupId}`, { name: editName, description: editDesc || undefined }),
    onSuccess: () => {
      toast({ title: "Updated", description: "Group details updated." });
      setShowEdit(false);
      queryClient.invalidateQueries({ queryKey: ["/api/coach/groups", groupId] });
      queryClient.invalidateQueries({ queryKey: ["/api/coach/groups"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const groupChatMutation = useMutation({
    mutationFn: () => apiPost("/api/messages/conversations", { groupId }),
    onSuccess: (data: any) => {
      setLocation(`/messages?conv=${data.id}`);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const openEditDialog = () => {
    if (group) {
      setEditName(group.name);
      setEditDesc(group.description || "");
      setShowEdit(true);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (!group) {
    return (
      <Layout>
        <div className="text-center py-12 text-muted-foreground">Group not found.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button size="icon" variant="ghost" onClick={() => setLocation("/coach/groups")} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold tracking-tight truncate" data-testid="text-group-name">{group.name}</h1>
            {group.description && <p className="text-muted-foreground mt-0.5">{group.description}</p>}
          </div>
          <Button size="icon" variant="ghost" onClick={openEditDialog} data-testid="button-edit-group">
            <Pencil className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setLocation(`/coach/assignments?groupId=${groupId}`)}
            data-testid="button-assign-to-group"
          >
            <Send className="w-4 h-4" />
            Assign Workout to Group
          </Button>
          <Button
            variant="outline"
            onClick={() => groupChatMutation.mutate()}
            disabled={groupChatMutation.isPending || group.members.length === 0}
            data-testid="button-group-chat"
          >
            <MessageSquare className="w-4 h-4" />
            {groupChatMutation.isPending ? "Creating..." : "Open Group Chat"}
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Members
              <Badge variant="secondary" className="ml-1 no-default-active-elevate">{group.members.length}</Badge>
            </CardTitle>

            <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-add-member">
                  <UserPlus className="w-4 h-4" />
                  Add Athlete
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Athlete to Group</DialogTitle>
                  <DialogDescription>Select a connected athlete to add to "{group.name}".</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  {availableAthletes.length === 0 ? (
                    <p className="text-sm text-muted-foreground" data-testid="text-no-available-athletes">
                      All connected athletes are already in this group, or you have no connected athletes.
                    </p>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label>Athlete</Label>
                        <Select value={selectedAthleteId} onValueChange={setSelectedAthleteId}>
                          <SelectTrigger data-testid="select-add-athlete">
                            <SelectValue placeholder="Choose an athlete" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableAthletes.map((a) => {
                              const aName = `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.email || 'Unknown';
                              return (
                                <SelectItem key={a.id} value={a.id}>{aName}</SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => addMemberMutation.mutate()}
                        disabled={!selectedAthleteId || addMemberMutation.isPending}
                        data-testid="button-submit-add-member"
                      >
                        {addMemberMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                        Add to Group
                      </Button>
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {group.members.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground" data-testid="text-no-members">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No members in this group yet.</p>
                <p className="text-sm mt-1">Add connected athletes to this group.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {group.members.map((member) => {
                  const athlete = member.athlete;
                  const name = `${athlete.firstName || ''} ${athlete.lastName || ''}`.trim() || athlete.email || 'Unknown';
                  const initials = athlete.firstName && athlete.lastName
                    ? `${athlete.firstName[0]}${athlete.lastName[0]}`
                    : name.substring(0, 2).toUpperCase();

                  return (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 rounded-md border flex-wrap"
                      data-testid={`member-row-${member.athleteId}`}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={athlete.profileImageUrl || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{name}</p>
                        {athlete.email && (
                          <p className="text-sm text-muted-foreground truncate">{athlete.email}</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeMemberMutation.mutate(member.athleteId)}
                        disabled={removeMemberMutation.isPending}
                        data-testid={`button-remove-member-${member.athleteId}`}
                      >
                        <UserMinus className="w-4 h-4" />
                        Remove
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>Update group name and description.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(); }} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="edit-group-name">Group Name</Label>
              <Input
                id="edit-group-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                data-testid="input-edit-group-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-group-desc">Description</Label>
              <Input
                id="edit-group-desc"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                data-testid="input-edit-group-description"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={updateMutation.isPending || !editName.trim()}
              data-testid="button-submit-edit-group"
            >
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
