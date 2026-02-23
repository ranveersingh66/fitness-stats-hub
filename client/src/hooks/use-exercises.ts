import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ExerciseInput } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useExercises() {
  return useQuery({
    queryKey: [api.exercises.list.path],
    queryFn: async () => {
      const res = await fetch(api.exercises.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch exercises");
      const data = await res.json();
      return api.exercises.list.responses[200].parse(data);
    },
  });
}

export function useCreateExercise() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: ExerciseInput) => {
      const res = await fetch(api.exercises.create.path, {
        method: api.exercises.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create exercise");
      const json = await res.json();
      return api.exercises.create.responses[201].parse(json);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.exercises.list.path] });
      toast({ title: "Success", description: "Exercise added to library." });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });
}
