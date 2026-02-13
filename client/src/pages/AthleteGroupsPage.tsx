import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users } from "lucide-react";

type GroupWithCount = {
  id: number;
  coachId: string;
  name: string;
  description: string | null;
  createdAt: string;
  memberCount: number;
};

export default function AthleteGroupsPage() {
  const { data: groupsList = [], isLoading } = useQuery<GroupWithCount[]>({
    queryKey: ["/api/athlete/groups"],
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">My Groups</h1>
          <p className="text-muted-foreground mt-1">Teams and squads you belong to</p>
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
                <p className="text-sm mt-1">Your coach will add you to groups when ready.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {groupsList.map((group) => (
              <Card key={group.id} data-testid={`card-group-${group.id}`}>
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
                    {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
