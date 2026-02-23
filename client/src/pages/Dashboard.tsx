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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="glass-card hover-elevate border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Bench Press PR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display font-bold text-primary">{stats?.prs?.benchPress || 0} <span className="text-lg font-sans text-muted-foreground">kg</span></div>
            <p className="text-xs text-muted-foreground mt-1">All-time best</p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-elevate border-secondary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Squat PR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display font-bold text-secondary">{stats?.prs?.squat || 0} <span className="text-lg font-sans text-muted-foreground">kg</span></div>
            <p className="text-xs text-muted-foreground mt-1">All-time best</p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-elevate border-accent/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Deadlift PR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display font-bold text-accent">{stats?.prs?.deadlift || 0} <span className="text-lg font-sans text-muted-foreground">kg</span></div>
            <p className="text-xs text-muted-foreground mt-1">All-time best</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
