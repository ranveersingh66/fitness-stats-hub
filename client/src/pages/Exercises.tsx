import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { List, Plus } from "lucide-react";
import { insertExerciseSchema } from "@shared/schema";
import { useExercises, useCreateExercise } from "@/hooks/use-exercises";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORIES = ["chest", "back", "legs", "shoulders", "arms", "core", "cardio", "full body"];

const formSchema = insertExerciseSchema;

export default function Exercises() {
  const { data: exercises, isLoading } = useExercises();
  const createMutation = useCreateExercise();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createMutation.mutate(values, {
      onSuccess: () => form.reset()
    });
  };

  // Group exercises by category
  const groupedExercises = exercises?.reduce((acc, ex) => {
    if (!acc[ex.category]) acc[ex.category] = [];
    acc[ex.category].push(ex);
    return acc;
  }, {} as Record<string, typeof exercises>) || {};

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground">Exercise Library</h1>
        <p className="text-muted-foreground mt-1 text-lg">Manage the exercises available for your workouts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="glass-card lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Plus className="w-5 h-5 text-accent" /> New Exercise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exercise Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Barbell Bench Press" {...field} className="bg-background/50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background/50 capitalize">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full font-semibold rounded-xl bg-gradient-to-r from-accent to-accent/80 text-white shadow-lg shadow-accent/25 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Adding..." : "Add Exercise"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
              {[1,2,3,4].map(i => <div key={i} className="h-32 bg-muted rounded-xl"></div>)}
            </div>
          ) : Object.keys(groupedExercises).length === 0 ? (
            <Card className="glass-card border-dashed">
               <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                 <List className="w-16 h-16 text-muted mb-4 opacity-50" />
                 <p className="text-lg font-medium text-foreground">No exercises found.</p>
                 <p>Add some exercises to start building your library.</p>
               </CardContent>
             </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {Object.entries(groupedExercises).sort().map(([category, exs]) => (
                <Card key={category} className="glass-card overflow-hidden border-t-4 border-t-accent">
                  <CardHeader className="bg-muted/10 pb-4">
                    <CardTitle className="font-display capitalize text-lg flex justify-between items-center">
                      {category}
                      <span className="text-xs bg-background px-2 py-1 rounded-full text-muted-foreground border">{exs.length}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <ul className="space-y-2">
                      {exs.sort((a,b) => a.name.localeCompare(b.name)).map(ex => (
                        <li key={ex.id} className="flex items-center gap-2 text-sm font-medium">
                          <div className="w-1.5 h-1.5 rounded-full bg-accent/50" />
                          {ex.name}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
