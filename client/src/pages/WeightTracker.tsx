import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Trash2, Plus, Scale } from "lucide-react";
import { insertWeightEntrySchema } from "@shared/schema";
import { useWeightEntries, useCreateWeightEntry, useDeleteWeightEntry } from "@/hooks/use-weight";
import { useAuth } from "@/hooks/use-auth";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const formSchema = insertWeightEntrySchema.extend({
  date: z.string(),
  weight: z.coerce.number().min(1, "Weight must be greater than 0"),
});

export default function WeightTracker() {
  const { data: entries, isLoading } = useWeightEntries();
  const createMutation = useCreateWeightEntry();
  const deleteMutation = useDeleteWeightEntry();
  const { isAdmin } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      weight: 0,
      notes: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createMutation.mutate({ ...values, weight: values.weight.toString() }, {
      onSuccess: () => form.reset({ ...form.getValues(), notes: "", weight: 0 })
    });
  };

  const chartData = entries
    ?.slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(e => ({ date: format(new Date(e.date), 'MMM d'), weight: Number(e.weight) })) || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground">Weight Tracker</h1>
        <p className="text-muted-foreground mt-1 text-lg">Monitor your progress over time.</p>
      </div>

      <Card className="glass-card overflow-hidden">
        <CardHeader>
          <CardTitle className="font-display">Weight Trend</CardTitle>
          <CardDescription>Your weight history visualized</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full mt-4">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">Loading chart...</div>
            ) : chartData.length < 2 ? (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">Need at least 2 entries to show trend.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} dy={10} />
                  <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} dx={-10} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))' }} />
                  <Area type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" activeDot={{ r: 6, strokeWidth: 0, fill: 'hsl(var(--primary))' }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <div className={`grid grid-cols-1 gap-8 ${isAdmin ? 'lg:grid-cols-3' : ''}`}>
        {isAdmin && (
          <Card className="glass-card lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" /> Log Weight
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="date" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl><Input type="date" {...field} className="bg-background/50" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="weight" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (kg)</FormLabel>
                      <FormControl><Input type="number" step="0.1" placeholder="e.g. 75.5" {...field} className="bg-background/50" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl><Textarea placeholder="How did you feel?" {...field} value={field.value || ''} className="resize-none bg-background/50" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full font-semibold rounded-xl" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Saving..." : "Save Entry"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        <Card className={`glass-card ${isAdmin ? 'lg:col-span-2' : ''}`}>
          <CardHeader>
            <CardTitle className="font-display">History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3 animate-pulse">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded-xl"></div>)}</div>
            ) : !entries?.length ? (
              <div className="text-center py-12 text-muted-foreground">
                <Scale className="w-12 h-12 mx-auto text-muted mb-4" />
                No weight entries found.
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {entries.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-border/50 hover:border-primary/30 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center font-display font-bold text-primary text-lg">
                        {entry.weight}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{format(new Date(entry.date), 'MMMM d, yyyy')}</p>
                        {entry.notes && <p className="text-sm text-muted-foreground truncate max-w-[200px] md:max-w-md">{entry.notes}</p>}
                      </div>
                    </div>
                    {isAdmin && (
                      <Button variant="ghost" size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => { if (confirm('Delete this entry?')) deleteMutation.mutate(entry.id); }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}