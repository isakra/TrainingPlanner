import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/models/auth";

async function fetchUser(): Promise<User | null> {
  const response = await fetch("/api/auth/user", {
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function logout(): Promise<void> {
  window.location.href = "/api/logout";
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
    },
  });

  const setRoleMutation = useMutation({
    mutationFn: async ({ role, inviteCode }: { role: "COACH" | "ATHLETE"; inviteCode?: string }) => {
      const res = await fetch("/api/me/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, inviteCode }),
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: "Failed to set role" }));
        throw new Error(body.message || "Failed to set role");
      }
      return res.json();
    },
    onSuccess: () => {
      localStorage.removeItem("pendingInviteCode");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  const clearRoleMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/me/role/clear", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to clear role");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isCoach: user?.role === "COACH",
    isAthlete: user?.role === "ATHLETE",
    hasRole: !!user?.role,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    setRole: setRoleMutation.mutate,
    isSettingRole: setRoleMutation.isPending,
    setRoleError: setRoleMutation.error?.message || null,
    clearRole: clearRoleMutation.mutate,
    isClearingRole: clearRoleMutation.isPending,
  };
}
