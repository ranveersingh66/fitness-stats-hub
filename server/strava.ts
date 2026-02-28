import { Router, type Request, type Response } from "express";
import { db } from "./db"; // adjust to your db import path
import { runningEntries, stravaTokens } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID!;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET!;
const STRAVA_REDIRECT_URI = process.env.STRAVA_REDIRECT_URI!; // e.g. https://yourdomain.com/api/strava/callback

// ─── Step 1: Redirect user to Strava OAuth ───────────────────────────────────
router.get("/connect", (_req: Request, res: Response) => {
  const params = new URLSearchParams({
    client_id: STRAVA_CLIENT_ID,
    redirect_uri: STRAVA_REDIRECT_URI,
    response_type: "code",
    approval_prompt: "auto",
    scope: "activity:read_all",
  });
  res.redirect(`https://www.strava.com/oauth/authorize?${params}`);
});

// ─── Step 2: Handle OAuth callback ───────────────────────────────────────────
router.get("/callback", async (req: Request, res: Response) => {
  const { code, error } = req.query;

  if (error || !code) {
    return res.redirect("/?strava=denied");
  }

  try {
    const tokenRes = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
      }),
    });

    const data = await tokenRes.json() as {
      access_token: string;
      refresh_token: string;
      expires_at: number;
      athlete: { id: number };
    };

    // Upsert — always keep only one token row
    const existing = await db.select().from(stravaTokens).limit(1);
    if (existing.length > 0) {
      await db.update(stravaTokens).set({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_at,
        athleteId: BigInt(data.athlete.id),
        updatedAt: new Date(),
      }).where(eq(stravaTokens.id, existing[0].id));
    } else {
      await db.insert(stravaTokens).values({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_at,
        athleteId: BigInt(data.athlete.id),
      });
    }

    // Redirect back to the running page after connecting
    res.redirect("/runs?strava=connected");
  } catch (err) {
    console.error("Strava OAuth error:", err);
    res.redirect("/runs?strava=error");
  }
});

// ─── Helper: refresh token if expired ────────────────────────────────────────
async function getValidAccessToken(): Promise<string | null> {
  const [token] = await db.select().from(stravaTokens).limit(1);
  if (!token) return null;

  const nowSecs = Math.floor(Date.now() / 1000);
  if (token.expiresAt > nowSecs + 60) {
    return token.accessToken; // still valid
  }

  // Refresh
  const refreshRes = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      refresh_token: token.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const refreshed = await refreshRes.json() as {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };

  await db.update(stravaTokens).set({
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token,
    expiresAt: refreshed.expires_at,
    updatedAt: new Date(),
  }).where(eq(stravaTokens.id, token.id));

  return refreshed.access_token;
}

// ─── Step 3: Sync runs from Strava ───────────────────────────────────────────
router.post("/sync", async (_req: Request, res: Response) => {
  try {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      return res.status(401).json({ error: "Not connected to Strava", connected: false });
    }

    // Fetch last 60 activities from Strava
    const activitiesRes = await fetch(
      "https://www.strava.com/api/v3/athlete/activities?per_page=60",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const activities = await activitiesRes.json() as Array<{
      id: number;
      type: string;
      sport_type: string;
      start_date_local: string;
      distance: number;      // metres
      moving_time: number;   // seconds
      name: string;
    }>;

    // Filter to runs only
    const runs = activities.filter(
      (a) => a.type === "Run" || a.sport_type === "Run"
    );

    // Get existing strava IDs to avoid duplicates
    const existing = await db.select({ stravaId: runningEntries.stravaId }).from(runningEntries);
    const existingIds = new Set(existing.map((r) => r.stravaId?.toString()));

    const toInsert = runs.filter((r) => !existingIds.has(r.id.toString()));

    if (toInsert.length > 0) {
      await db.insert(runningEntries).values(
        toInsert.map((run) => ({
          date: run.start_date_local.split("T")[0], // "YYYY-MM-DD"
          distance: (run.distance / 1000).toFixed(2), // metres → km
          duration: run.moving_time,
          notes: run.name, // Strava activity name as notes
          stravaId: BigInt(run.id),
        }))
      );
    }

    res.json({ synced: toInsert.length, total: runs.length });
  } catch (err) {
    console.error("Strava sync error:", err);
    res.status(500).json({ error: "Sync failed" });
  }
});

// ─── Check connection status ──────────────────────────────────────────────────
router.get("/status", async (_req: Request, res: Response) => {
  const [token] = await db.select().from(stravaTokens).limit(1);
  res.json({ connected: !!token });
});

export default router;