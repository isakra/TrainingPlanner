import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { Exercise, InsertExercise } from "@shared/schema";

export function useExercises() {
  return useQuery<Exercise[]>({
    queryKey: [api.exercises.list.path],
    queryFn: async () => {
      const res = await fetch(api.exercises.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch exercises");
      return res.json();
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
      return res.json() as Promise<Exercise>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.exercises.list.path] });
    },
  });
}
