import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Dumbbell, 
  Calendar, 
  Activity, 
  LogOut, 
  ClipboardList,
  Trophy,
  Users,
  Send,
  MessageSquare,
  UsersRound,
  Repeat,
  Heart,
  ArrowLeftRight,
  KeyRound,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout, isCoach, isAthlete, clearRole } = useAuth();

  const coachItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/" },
    { label: "Templates", icon: Trophy, href: "/coach/templates" },
    { label: "My Workouts", icon: ClipboardList, href: "/coach/workouts" },
    { label: "My Athletes", icon: Users, href: "/coach/athletes" },
    { label: "Groups", icon: UsersRound, href: "/coach/groups" },
    { label: "Assignments", icon: Send, href: "/coach/assignments" },
    { label: "Recurring", icon: Repeat, href: "/coach/recurring" },
    { label: "Invites", icon: KeyRound, href: "/coach/invites" },
    { label: "Messages", icon: MessageSquare, href: "/messages" },
    { label: "Exercises", icon: Dumbbell, href: "/exercises" },
  ];

  const athleteItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/" },
    { label: "My Workouts", icon: Calendar, href: "/athlete/workouts" },
    { label: "My Groups", icon: UsersRound, href: "/athlete/groups" },
    { label: "Wellness", icon: Heart, href: "/athlete/wellness" },
    { label: "My PRs", icon: Trophy, href: "/athlete/prs" },
    { label: "Messages", icon: MessageSquare, href: "/messages" },
    { label: "Exercises", icon: Dumbbell, href: "/exercises" },
  ];

  const navItems = isCoach ? coachItems : isAthlete ? athleteItems : [
    { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  ];

  const initials = user?.firstName && user?.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.email?.substring(0, 2).toUpperCase() || "U";

  return (
    <div className="h-screen w-64 bg-card border-r border-border flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b border-border/50">
        <h1 className="text-2xl font-display font-bold text-primary tracking-wider italic" data-testid="text-app-name">
          TRAINING<span className="text-foreground">PLANNER</span>
        </h1>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto" data-testid="nav-sidebar">
        {navItems.map((item) => {
          const isActive = item.href === "/" ? location === "/" : location.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 cursor-pointer group",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 font-medium"
                    : "text-muted-foreground hover-elevate"
                )}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "stroke-[2.5px]" : "stroke-2")} />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-border/50 bg-secondary/20">
        <div className="flex items-center gap-3 mb-4 px-2">
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate text-foreground" data-testid="text-user-name">
              {user?.firstName} {user?.lastName}
            </p>
            <div className="flex items-center gap-2">
              {user?.role && (
                <Badge variant="outline" className="text-xs no-default-active-elevate" data-testid="badge-role">
                  {user.role}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <button
            onClick={() => clearRole()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-muted-foreground bg-muted/50 hover-elevate transition-all duration-200"
            data-testid="button-switch-role"
          >
            <ArrowLeftRight className="w-4 h-4" />
            Switch Role
          </button>
          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-destructive bg-destructive/10 hover-elevate transition-all duration-200"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
