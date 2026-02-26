import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Dumbbell, Plus, Trash2, Activity } from "lucide-react";
import { insertWorkoutEntrySchema } from "@shared/schema";
import { useWorkoutEntries, useCreateWorkoutEntry, useDeleteWorkoutEntry } from "@/hooks/use-workouts";
import { useExercises } from "@/hooks/use-exercises";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";

const formSchema = insertWorkoutEntrySchema.extend({
  date: z.string(),
  exerciseId: z.coerce.number().min(1, "Please select an exercise"),
  sets: z.coerce.number().min(1, "Must be at least 1"),
  reps: z.coerce.number().min(1, "Must be at least 1"),
  weight: z.coerce.number().min(0, "Cannot be negative"),
});

export default function WorkoutLog() {
  const { data: workouts, isLoading: isLoadingWorkouts } = useWorkoutEntries();
  const { data: exercises, isLoading: isLoadingExercises } = useExercises();
  const createMutation = useCreateWorkoutEntry();
  const deleteMutation = useDeleteWorkoutEntry();
  const { isAdmin } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      exerciseId: 0,
      sets: 3,
      reps: 10,
      weight: 0,
      notes: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createMutation.mutate({
      ...values,
      weight: values.weight.toString(), // coerce to string for decimal
    }, {
      onSuccess: () => form.reset({ ...form.getValues(), notes: "", weight: 0, sets: 3, reps: 10 })
    });
  };

  // Group workouts by date for better display
  const groupedWorkouts = workouts?.reduce((acc, workout) => {
    const dateStr = workout.date.toString();
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(workout);
    return acc;
  }, {} as Record<string, typeof workouts>) || {};

  const sortedDates = Object.keys(groupedWorkouts).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground">Workout Log</h1>
          <p className="text-muted-foreground mt-1 text-lg">Track your sets, reps, and volume.</p>
        </div>
        <Button asChild variant="outline" className="rounded-xl border-primary/20 hover:bg-primary/5 text-primary">
          <Link href="/exercises">Manage Exercises</Link>
        </Button>
      </div>

      <div className={`grid grid-cols-1 gap-8 ${isAdmin ? "lg:grid-cols-12" : ""}`}>
        <Card className={`glass-card h-fit sticky top-24 ${isAdmin ? "lg:col-span-4" : "hidden"}`}>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-secondary" /> Log Set
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="bg-background/50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="exerciseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exercise</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ? field.value.toString() : ""}>
                        <FormControl>
                          <SelectTrigger className="bg-background/50">
                            <SelectValue placeholder="Select exercise" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {exercises?.map((ex) => (
                            <SelectItem key={ex.id} value={ex.id.toString()}>{ex.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-3">
                  <FormField
                    control={form.control}
                    name="sets"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sets</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="bg-background/50 text-center font-semibold" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="reps"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reps</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="bg-background/50 text-center font-semibold" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>kg</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.5" {...field} className="bg-background/50 text-center font-semibold text-primary" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Form notes, feeling, etc." {...field} value={field.value || ''} className="resize-none bg-background/50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full font-semibold rounded-xl bg-gradient-to-r from-secondary to-secondary/80 text-white shadow-lg shadow-secondary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                  disabled={createMutation.isPending || isLoadingExercises}
                >
                  {createMutation.isPending ? "Saving..." : "Log Workout"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className={isAdmin ? "lg:col-span-8 space-y-6" : "space-y-6"}>
          {isLoadingWorkouts ? (
             <div className="space-y-4 animate-pulse">
               {[1,2].map(i => <div key={i} className="h-48 bg-muted rounded-2xl"></div>)}
             </div>
          ) : sortedDates.length === 0 ? (
            <Card className="glass-card border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Activity className="w-16 h-16 text-muted mb-4 opacity-50" />
                <p className="text-lg font-medium text-foreground">No workouts recorded yet.</p>
                <p>Select an exercise and log your first set on the left!</p>
              </CardContent>
            </Card>
          ) : (
            sortedDates.map(date => (
              <Card key={date} className="glass-card overflow-hidden">
                <div className="bg-muted/30 px-6 py-3 border-b border-border/50">
                  <h3 className="font-display font-bold text-lg text-foreground">
                    {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                  </h3>
                </div>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/50">
                    {groupedWorkouts[date].map(workout => (
                      <div key={workout.id} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-background/50 transition-colors group">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-semibold uppercase tracking-wider">
                              {workout.exerciseCategory}
                            </span>
                            <h4 className="font-semibold text-lg">{workout.exerciseName}</h4>
                          </div>
                          {workout.notes && <p className="text-sm text-muted-foreground mt-1">{workout.notes}</p>}
                        </div>
                        
                        <div className="flex items-center gap-6 self-start sm:self-auto">
                          <div className="flex items-center gap-3 bg-muted/40 rounded-lg px-4 py-2 border border-border/50">
                            <div className="text-center">
                              <span className="block text-xs text-muted-foreground font-medium uppercase">Sets</span>
                              <span className="font-display font-bold text-lg">{workout.sets}</span>
                            </div>
                            <span className="text-muted-foreground">×</span>
                            <div className="text-center">
                              <span className="block text-xs text-muted-foreground font-medium uppercase">Reps</span>
                              <span className="font-display font-bold text-lg">{workout.reps}</span>
                            </div>
                            <span className="text-muted-foreground">@</span>
                            <div className="text-center min-w-[60px]">
                              <span className="block text-xs text-muted-foreground font-medium uppercase">Weight</span>
                              <span className="font-display font-bold text-lg text-primary">{workout.weight} <span className="text-sm">kg</span></span>
                            </div>
                          </div>
                          
                          {isAdmin && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                            onClick={() => {
                              if(confirm('Delete this workout entry?')) deleteMutation.mutate(workout.id);
                            }}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}