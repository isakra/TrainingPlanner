import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Users, Dumbbell, KeyRound } from "lucide-react";

export default function RoleSelectPage() {
  const { setRole, isSettingRole, setRoleError } = useAuth();
  const urlParams = new URLSearchParams(window.location.search);
  const urlInvite = urlParams.get("invite") || localStorage.getItem("pendingInviteCode") || "";
  const [inviteCode, setInviteCode] = useState(urlInvite);
  const [showCoachForm, setShowCoachForm] = useState(!!urlInvite);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-display font-bold uppercase tracking-wide" data-testid="text-role-title">
            Choose Your Role
          </h1>
          <p className="text-muted-foreground text-lg">
            How will you use TrainingPlanner?
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

              {!showCoachForm ? (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setShowCoachForm(true)}
                  data-testid="button-show-coach-form"
                >
                  I'm a Coach
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <KeyRound className="w-4 h-4" />
                    <span>Enter your invite code (existing coaches can skip)</span>
                  </div>
                  <Input
                    placeholder="e.g. ABC12345"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    data-testid="input-invite-code"
                  />
                  {setRoleError && (
                    <p className="text-sm text-destructive" data-testid="text-invite-error">
                      {setRoleError}
                    </p>
                  )}
                  <Button
                    className="w-full"
                    onClick={() => setRole({ role: "COACH", inviteCode })}
                    disabled={isSettingRole}
                    data-testid="button-select-coach"
                  >
                    {isSettingRole ? "Verifying..." : "Continue as Coach"}
                  </Button>
                </div>
              )}
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
                onClick={() => setRole({ role: "ATHLETE" })}
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
