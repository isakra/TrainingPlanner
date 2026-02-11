import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertWorkout, type InsertWorkoutExercise } from "@shared/routes";

export function useWorkouts() {
  return useQuery({
    queryKey: [api.workouts.list.path],
    queryFn: async () => {
      const res = await fetch(api.workouts.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch workouts");
      return api.workouts.list.responses[200].parse(await res.json());
    },
  });
}

export function useWorkout(id: number) {
  return useQuery({
    queryKey: [api.workouts.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.workouts.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch workout");
      return api.workouts.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertWorkout) => {
      const res = await fetch(api.workouts.create.path, {
        method: api.workouts.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create workout");
      return api.workouts.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.workouts.list.path] });
    },
  });
}

export function useAddWorkoutExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workoutId, ...data }: InsertWorkoutExercise) => {
      const url = buildUrl(api.workouts.addExercise.path, { id: workoutId });
      // Remove workoutId from body as it's in the URL
      const res = await fetch(url, {
        method: api.workouts.addExercise.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add exercise to workout");
      return api.workouts.addExercise.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.workouts.get.path, variables.workoutId] });
    },
  });
}
