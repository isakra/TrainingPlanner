import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertExercise } from "@shared/routes";

export function useExercises() {
  return useQuery({
    queryKey: [api.exercises.list.path],
    queryFn: async () => {
      const res = await fetch(api.exercises.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch exercises");
      return api.exercises.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertExercise) => {
      const res = await fetch(api.exercises.create.path, {
        method: api.exercises.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create exercise");
      return api.exercises.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.exercises.list.path] });
    },
  });
}
