import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// Simple Strava logo SVG
function StravaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
    </svg>
  );
}

type SyncState = "idle" | "loading" | "success" | "error";

export function StravaSyncButton() {
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [connected, setConnected] = useState<boolean | null>(null);
  const [lastSynced, setLastSynced] = useState<{ synced: number; total: number } | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Check if Strava is connected on mount
  useEffect(() => {
    fetch("/api/strava/status")
      .then((r) => r.json())
      .then((data) => setConnected(data.connected))
      .catch(() => setConnected(false));
  }, []);

  // Handle ?strava=connected redirect after OAuth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stravaParam = params.get("strava");
    if (stravaParam === "connected") {
      setConnected(true);
      toast({ title: "Strava connected!", description: "You can now sync your runs." });
      // Clean up the URL
      window.history.replaceState({}, "", window.location.pathname);
    } else if (stravaParam === "denied" || stravaParam === "error") {
      toast({ title: "Strava connection failed", description: "Please try again.", variant: "destructive" });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [toast]);

  const handleConnect = () => {
    window.location.href = "/api/strava/connect";
  };

  const handleSync = async () => {
    setSyncState("loading");
    try {
      const res = await fetch("/api/strava/sync", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Sync failed");
      }

      setSyncState("success");
      setLastSynced(data);

      // Invalidate running entries query so the list refreshes
      queryClient.invalidateQueries({ queryKey: ["/api/running-entries"] });

      toast({
        title: data.synced > 0 ? `Synced ${data.synced} new run${data.synced !== 1 ? "s" : ""}!` : "Already up to date",
        description: data.synced > 0
          ? `Found ${data.total} runs on Strava, added ${data.synced} new.`
          : `All ${data.total} Strava runs are already in your log.`,
      });

      setTimeout(() => setSyncState("idle"), 3000);
    } catch (err) {
      setSyncState("error");
      toast({
        title: "Sync failed",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      });
      setTimeout(() => setSyncState("idle"), 3000);
    }
  };

  // Still checking status
  if (connected === null) {
    return (
      <Button variant="outline" disabled className="gap-2 opacity-60">
        <StravaIcon className="w-4 h-4" />
        Checking Strava...
      </Button>
    );
  }

  // Not connected yet — show Connect button
  if (!connected) {
    return (
      <Button
        variant="outline"
        onClick={handleConnect}
        className="gap-2 border-[#FC4C02] text-[#FC4C02] hover:bg-[#FC4C02] hover:text-white transition-colors"
      >
        <StravaIcon className="w-4 h-4" />
        Connect Strava
      </Button>
    );
  }

  // Connected — show Sync button
  return (
    <Button
      variant="outline"
      onClick={handleSync}
      disabled={syncState === "loading"}
      className="gap-2 border-[#FC4C02] text-[#FC4C02] hover:bg-[#FC4C02] hover:text-white transition-colors disabled:opacity-60"
    >
      <StravaIcon className={`w-4 h-4 ${syncState === "loading" ? "animate-spin" : ""}`} />
      {syncState === "loading" && "Syncing..."}
      {syncState === "success" && (lastSynced?.synced === 0 ? "Up to date ✓" : `+${lastSynced?.synced} runs synced ✓`)}
      {syncState === "error" && "Sync failed"}
      {syncState === "idle" && "Sync from Strava"}
    </Button>
  );
}