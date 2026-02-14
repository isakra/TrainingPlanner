import { Layout } from "@/components/Layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KeyRound, Plus, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useState } from "react";

interface InviteCode {
  id: number;
  code: string;
  createdBy: string;
  usedBy: string | null;
  usedAt: string | null;
  createdAt: string;
}

export default function CoachInvitesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { data: invites = [], isLoading } = useQuery<InviteCode[]>({
    queryKey: ["/api/coach/invite-codes"],
    queryFn: () => apiGet("/api/coach/invite-codes"),
  });

  const createMutation = useMutation({
    mutationFn: () => apiPost("/api/coach/invite-codes"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coach/invite-codes"] });
      toast({ title: "Invite code created" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to create invite", description: err.message, variant: "destructive" });
    },
  });

  const copyCode = (invite: InviteCode) => {
    const url = `${window.location.origin}/auth?invite=${invite.code}`;
    navigator.clipboard.writeText(url);
    setCopiedId(invite.id);
    toast({ title: "Invite link copied to clipboard" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold" data-testid="text-invites-title">Coach Invites</h1>
            <p className="text-muted-foreground mt-1">Generate invite links to let others join as coaches</p>
          </div>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            data-testid="button-create-invite"
          >
            <Plus className="w-4 h-4 mr-2" />
            {createMutation.isPending ? "Creating..." : "Generate Invite"}
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i}><CardContent className="p-4 h-16 animate-pulse bg-muted/20" /></Card>
            ))}
          </div>
        ) : invites.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <KeyRound className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No invite codes yet. Generate one to share with another coach.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {invites.map((invite) => (
              <Card key={invite.id} data-testid={`card-invite-${invite.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="font-mono text-lg font-bold tracking-wider" data-testid={`text-invite-code-${invite.id}`}>
                        {invite.code}
                      </div>
                      {invite.usedBy ? (
                        <Badge variant="secondary" data-testid={`badge-invite-used-${invite.id}`}>
                          Used
                        </Badge>
                      ) : (
                        <Badge variant="default" data-testid={`badge-invite-available-${invite.id}`}>
                          Available
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(invite.createdAt), "MMM d, yyyy")}
                      </span>
                      {!invite.usedBy && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyCode(invite)}
                          data-testid={`button-copy-invite-${invite.id}`}
                        >
                          {copiedId === invite.id ? (
                            <><Check className="w-4 h-4 mr-1" /> Copied</>
                          ) : (
                            <><Copy className="w-4 h-4 mr-1" /> Copy Link</>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
