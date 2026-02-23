import { useStats } from "@/hooks/use-stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Dumbbell, Scale, TrendingDown, TrendingUp } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: stats, isLoading } = useStats();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted rounded-2xl"></div>)}
        </div>
      </div>
    );
  }

  const weightChangeIsDown = stats?.weightChange && stats.weightChange < 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground">Overview</h1>
        <p className="text-muted-foreground mt-1 text-lg">Your fitness journey at a glance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Weight</CardTitle>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Scale className="w-5 h-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">{stats?.currentWeight || '--'} <span className="text-lg text-muted-foreground font-sans">kg</span></div>
            {stats?.weightChange !== undefined && stats.weightChange !== 0 && (
              <p className="text-sm flex items-center mt-2 font-medium">
                {weightChangeIsDown ? (
                  <span className="text-emerald-500 flex items-center"><TrendingDown className="w-4 h-4 mr-1" /> {Math.abs(stats.weightChange)} kg</span>
                ) : (
                  <span className="text-rose-500 flex items-center"><TrendingUp className="w-4 h-4 mr-1" /> +{stats.weightChange} kg</span>
                )}
                <span className="text-muted-foreground ml-2">from start</span>
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Workouts</CardTitle>
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-secondary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">{stats?.totalWorkouts || 0}</div>
            <p className="text-sm text-muted-foreground mt-2 font-medium">Lifetime sessions</p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Weight Entries</CardTitle>
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">{stats?.totalWeightEntries || 0}</div>
            <p className="text-sm text-muted-foreground mt-2 font-medium">Logs recorded</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-display text-xl">Recent Workouts</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recentWorkouts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No workouts logged yet.</div>
            ) : (
              <div className="space-y-4">
                {stats?.recentWorkouts.map((workout) => (
                  <div key={workout.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                        <Dumbbell className="w-5 h-5 text-secondary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{workout.exerciseName}</p>
                        <p className="text-sm text-muted-foreground">{format(new Date(workout.date), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{workout.sets} <span className="text-muted-foreground font-normal">sets</span> x {workout.reps} <span className="text-muted-foreground font-normal">reps</span></p>
                      <p className="text-sm font-medium text-primary">{workout.weight} kg</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-display text-xl">Recent Weight Logs</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recentWeightEntries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No weight entries yet.</div>
            ) : (
              <div className="space-y-4">
                {stats?.recentWeightEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Scale className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{entry.weight} kg</p>
                        <p className="text-sm text-muted-foreground">{format(new Date(entry.date), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                    {entry.notes && (
                      <div className="text-sm text-muted-foreground italic max-w-[150px] truncate">
                        "{entry.notes}"
                      </div>
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
