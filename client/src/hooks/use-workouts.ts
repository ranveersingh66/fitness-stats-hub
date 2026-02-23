import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type WorkoutEntryInput, type WorkoutEntryUpdateInput } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useWorkoutEntries() {
  return useQuery({
    queryKey: [api.workoutEntries.list.path],
    queryFn: async () => {
      const res = await fetch(api.workoutEntries.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch workout entries");
      const data = await res.json();
      return api.workoutEntries.list.responses[200].parse(data);
    },
  });
}

export function useCreateWorkoutEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: WorkoutEntryInput) => {
      const res = await fetch(api.workoutEntries.create.path, {
        method: api.workoutEntries.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to log workout");
      const json = await res.json();
      return api.workoutEntries.create.responses[201].parse(json);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.workoutEntries.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
      toast({ title: "Workout Logged", description: "Great job!" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });
}

export function useDeleteWorkoutEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.workoutEntries.delete.path, { id });
      const res = await fetch(url, {
        method: api.workoutEntries.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete workout entry");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.workoutEntries.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
      toast({ title: "Deleted", description: "Workout entry removed." });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });
}
