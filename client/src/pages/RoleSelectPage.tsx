import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, Dumbbell } from "lucide-react";

export default function RoleSelectPage() {
  const { setRole, isSettingRole } = useAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-display font-bold uppercase tracking-wide" data-testid="text-role-title">
            Choose Your Role
          </h1>
          <p className="text-muted-foreground text-lg">
            How will you use TrainingPlaner?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="cursor-pointer hover-elevate" data-testid="card-role-coach">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto p-4 bg-primary/10 rounded-md w-fit mb-2">
                <Users className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-2xl font-display">Coach</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Create workout programs, assign them to athletes, and track their progress.
              </p>
              <Button
                className="w-full"
                onClick={() => setRole("COACH")}
                disabled={isSettingRole}
                data-testid="button-select-coach"
              >
                {isSettingRole ? "Setting up..." : "I'm a Coach"}
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover-elevate" data-testid="card-role-athlete">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto p-4 bg-primary/10 rounded-md w-fit mb-2">
                <Dumbbell className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-2xl font-display">Athlete</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                View assigned workouts, log your results, and track your performance.
              </p>
              <Button
                className="w-full"
                onClick={() => setRole("ATHLETE")}
                disabled={isSettingRole}
                data-testid="button-select-athlete"
              >
                {isSettingRole ? "Setting up..." : "I'm an Athlete"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
