import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertAssignment } from "@shared/routes";

export function useAssignments(userId?: string, date?: string) {
  return useQuery({
    queryKey: [api.assignments.list.path, userId, date],
    queryFn: async () => {
      // Build query params
      const params = new URLSearchParams();
      if (userId) params.append("userId", userId);
      if (date) params.append("date", date);
      
      const url = `${api.assignments.list.path}?${params.toString()}`;
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch assignments");
      return api.assignments.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertAssignment) => {
      const res = await fetch(api.assignments.create.path, {
        method: api.assignments.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to assign workout");
      return api.assignments.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.assignments.list.path] });
    },
  });
}

export function useCompleteAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, completed }: { id: number; completed: boolean }) => {
      const url = buildUrl(api.assignments.complete.path, { id });
      const res = await fetch(url, {
        method: api.assignments.complete.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update assignment status");
      return api.assignments.complete.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.assignments.list.path] });
    },
  });
}
