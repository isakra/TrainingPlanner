import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus, UserMinus, Users, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiPost, apiDelete } from "@/lib/api";
import type { User } from "@shared/models/auth";

type ConnectionWithAthlete = {
  id: number;
  coachId: string;
  athleteId: string;
  createdAt: string;
  athlete: User;
};

export default function CoachAthletesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");

  const { data: connections = [], isLoading } = useQuery<ConnectionWithAthlete[]>({
    queryKey: ["/api/coach/athletes"],
  });

  const connectMutation = useMutation({
    mutationFn: () => apiPost("/api/coach/athletes/connect", { athleteEmail: email }),
    onSuccess: () => {
      toast({ title: "Connected", description: "Athlete added successfully." });
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ["/api/coach/athletes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/athletes"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: (athleteId: string) => apiDelete(`/api/coach/athletes/${athleteId}`),
    onSuccess: () => {
      toast({ title: "Disconnected", description: "Athlete removed." });
      queryClient.invalidateQueries({ queryKey: ["/api/coach/athletes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/athletes"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    connectMutation.mutate();
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">My Athletes</h1>
          <p className="text-muted-foreground mt-1">Manage your connected athletes</p>
        </div>

        <Card data-testid="card-connect-athlete">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Connect an Athlete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleConnect} className="flex items-end gap-3 flex-wrap">
              <div className="flex-1 min-w-[250px]">
                <Label htmlFor="athlete-email">Athlete Email</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="athlete-email"
                    type="email"
                    placeholder="athlete@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    data-testid="input-athlete-email"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={connectMutation.isPending || !email.trim()}
                data-testid="button-connect-athlete"
              >
                {connectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Connect
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Connected Athletes
              <Badge variant="secondary" className="ml-auto">{connections.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : connections.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground" data-testid="text-no-athletes">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No athletes connected yet.</p>
                <p className="text-sm mt-1">Use the form above to connect with athletes by their email.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {connections.map((conn) => {
                  const athlete = conn.athlete;
                  const name = `${athlete.firstName || ''} ${athlete.lastName || ''}`.trim() || athlete.email || 'Unknown';
                  const initials = athlete.firstName && athlete.lastName
                    ? `${athlete.firstName[0]}${athlete.lastName[0]}`
                    : name.substring(0, 2).toUpperCase();

                  return (
                    <div
                      key={conn.id}
                      className="flex items-center gap-3 p-3 rounded-md border flex-wrap"
                      data-testid={`athlete-row-${conn.athleteId}`}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={athlete.profileImageUrl || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate" data-testid={`text-athlete-name-${conn.athleteId}`}>{name}</p>
                        {athlete.email && (
                          <p className="text-sm text-muted-foreground truncate">{athlete.email}</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => disconnectMutation.mutate(conn.athleteId)}
                        disabled={disconnectMutation.isPending}
                        data-testid={`button-disconnect-${conn.athleteId}`}
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
    </Layout>
  );
}
