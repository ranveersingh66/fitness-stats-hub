import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type WeightEntryInput, type WeightEntryUpdateInput } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useWeightEntries() {
  return useQuery({
    queryKey: [api.weightEntries.list.path],
    queryFn: async () => {
      const res = await fetch(api.weightEntries.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch weight entries");
      const data = await res.json();
      return api.weightEntries.list.responses[200].parse(data);
    },
  });
}

export function useCreateWeightEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: WeightEntryInput) => {
      const res = await fetch(api.weightEntries.create.path, {
        method: api.weightEntries.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create weight entry");
      const json = await res.json();
      return api.weightEntries.create.responses[201].parse(json);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.weightEntries.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
      toast({ title: "Success", description: "Weight entry added." });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });
}

export function useDeleteWeightEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.weightEntries.delete.path, { id });
      const res = await fetch(url, {
        method: api.weightEntries.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete weight entry");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.weightEntries.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
      toast({ title: "Deleted", description: "Weight entry removed." });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });
}
