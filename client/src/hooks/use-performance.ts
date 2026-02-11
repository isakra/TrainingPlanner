import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertPerformanceLog } from "@shared/routes";

export function usePerformanceHistory(exerciseId: number) {
  return useQuery({
    queryKey: [api.performance.history.path, exerciseId],
    queryFn: async () => {
      const url = buildUrl(api.performance.history.path, { exerciseId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch performance history");
      return api.performance.history.responses[200].parse(await res.json());
    },
    enabled: !!exerciseId,
  });
}

export function useLogPerformance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertPerformanceLog) => {
      const res = await fetch(api.performance.log.path, {
        method: api.performance.log.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to log performance");
      return api.performance.log.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: [api.performance.history.path, variables.exerciseId] 
      });
    },
  });
}
