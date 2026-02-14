import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Loader2, ArrowRight } from "lucide-react";

export default function AuthPage() {
  const { user, isLoading } = useAuth();

  const urlParams = new URLSearchParams(window.location.search);
  const inviteParam = urlParams.get("invite");
  if (inviteParam) {
    localStorage.setItem("pendingInviteCode", inviteParam);
  }

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background text-primary">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Panel - Hero */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-secondary overflow-hidden">
        {/* Unsplash Image - Sprinter on track */}
        <img 
          src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop"
          alt="Athlete training" 
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        
        <div className="relative z-10 flex flex-col justify-end p-16 w-full">
          <h1 className="text-6xl font-display font-bold text-white mb-6 uppercase tracking-tighter leading-none">
            Forge Your <br/>
            <span className="text-primary">Legacy</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-lg mb-8">
            The elite platform for strength and conditioning. Plan workouts, track progress, and crush your limits.
          </p>
          <div className="flex gap-4">
            <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
              <span className="font-bold text-white block">10k+</span>
              <span className="text-sm text-gray-400">Athletes</span>
            </div>
            <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
              <span className="font-bold text-white block">500+</span>
              <span className="text-sm text-gray-400">Coaches</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Action */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 relative">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-display font-bold text-foreground uppercase tracking-wide">
              Welcome to <span className="text-primary">TrainingPlanner</span>
            </h2>
            <p className="text-muted-foreground">
              Sign in to access your training dashboard
            </p>
          </div>

          <div className="bg-card p-8 rounded-2xl border border-border/50 shadow-2xl shadow-black/20">
            <Button 
              className="w-full h-14 text-lg font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-primary/25"
              onClick={() => window.location.href = "/api/login"}
            >
              Get Started
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>Powered by Replit Auth</p>
              <p className="mt-2 text-xs opacity-50">Secure • Fast • Reliable</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
