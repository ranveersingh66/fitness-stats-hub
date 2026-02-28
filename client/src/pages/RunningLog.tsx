import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns";
import { Footprints, Plus, Trash2, Timer, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { StravaSyncButton } from "@/components/StravaSyncButton";

interface RunningEntry {
  id: number;
  date: string;
  distance: string;
  duration: number | null;
  notes: string | null;
  createdAt: string | null;
}

async function fetchRunningEntries(): Promise<RunningEntry[]> {
  const res = await fetch("/api/running-entries");
  if (!res.ok) throw new Error("Failed to fetch running entries");
  return res.json();
}

function getWeeklyData(entries: RunningEntry[]) {
  const weeks: { week: string; distance: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
    const label = format(weekStart, "MMM d");
    const distance = entries
      .filter((e) => {
        const d = new Date(e.date);
        return d >= weekStart && d <= weekEnd;
      })
      .reduce((sum, e) => sum + parseFloat(e.distance), 0);
    weeks.push({ week: label, distance: parseFloat(distance.toFixed(2)) });
  }
  return weeks;
}

export default function RunningLog() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: format(new Date(), "yyyy-MM-dd"), distance: "", duration: "", notes: "" });

  const { data: entries = [], isLoading } = useQuery({ queryKey: ["running-entries"], queryFn: fetchRunningEntries });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch("/api/running-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: data.date, distance: data.distance, duration: data.duration || undefined, notes: data.notes || undefined }),
      });
      if (!res.ok) throw new Error("Failed to create entry");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["running-entries"] });
      setOpen(false);
      setForm({ date: format(new Date(), "yyyy-MM-dd"), distance: "", duration: "", notes: "" });
      toast({ title: "Run logged!" });
    },
    onError: () => toast({ title: "Error", description: "Failed to log run", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/running-entries/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["running-entries"] });
      toast({ title: "Entry deleted" });
    },
  });

  const weeklyData = getWeeklyData(entries);
  const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const thisWeekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const thisWeekTotal = entries
    .filter((e) => { const d = new Date(e.date); return d >= thisWeekStart && d <= thisWeekEnd; })
    .reduce((sum, e) => sum + parseFloat(e.distance), 0);
  const totalDistance = entries.reduce((sum, e) => sum + parseFloat(e.distance), 0);
  const longestRun = entries.length > 0 ? Math.max(...entries.map((e) => parseFloat(e.distance))) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Running Log</h1>
          <p className="text-muted-foreground">Track your weekly mileage</p>
        </div>
        <div className="flex items-center gap-2">
          <StravaSyncButton />
          {isAdmin && <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" /> Log Run</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Log a Run</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <Label>Date</Label>
                  <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Distance (km)</Label>
                  <Input type="number" step="0.01" placeholder="e.g. 5.5" value={form.distance} onChange={(e) => setForm({ ...form, distance: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Duration (minutes, optional)</Label>
                  <Input type="number" placeholder="e.g. 30" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Notes (optional)</Label>
                  <Input placeholder="How did it go?" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <Button className="w-full" onClick={() => createMutation.mutate(form)} disabled={!form.date || !form.distance}>
                  Save Run
                </Button>
              </div>
            </DialogContent>
          </Dialog>}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Footprints className="w-4 h-4" /> This Week</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{thisWeekTotal.toFixed(1)} <span className="text-lg font-normal text-muted-foreground">km</span></p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Total Distance</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{totalDistance.toFixed(1)} <span className="text-lg font-normal text-muted-foreground">km</span></p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Timer className="w-4 h-4" /> Longest Run</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{longestRun.toFixed(1)} <span className="text-lg font-normal text-muted-foreground">km</span></p></CardContent>
        </Card>
      </div>

      {/* Weekly chart */}
      <Card>
        <CardHeader><CardTitle>Weekly Mileage (last 8 weeks)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} unit=" km" />
              <Tooltip formatter={(v: number) => [`${v} km`, "Distance"]} />
              <Bar dataKey="distance" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Log table */}
      <Card>
        <CardHeader><CardTitle>All Runs</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : entries.length === 0 ? (
            <p className="text-muted-foreground text-sm">No runs logged yet. Click "Log Run" to get started!</p>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground w-24">{format(new Date(entry.date), "MMM d, yyyy")}</div>
                    <div className="font-semibold">{parseFloat(entry.distance).toFixed(2)} km</div>
                    {entry.duration && <div className="text-sm text-muted-foreground flex items-center gap-1"><Timer className="w-3 h-3" />{entry.duration} min</div>}
                    {entry.notes && <div className="text-sm text-muted-foreground hidden sm:block">{entry.notes}</div>}
                  </div>
                  {isAdmin && <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(entry.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}