import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import connectMemoryStore from "memorystore";

// ============================================================
// AUTH CONFIG — change these to your own username & password!
// ============================================================
const ADMIN_USERNAME = "ranveersingh";
const ADMIN_PASSWORD = "ilovenemo6627";

declare module "express-session" {
  interface SessionData {
    isAdmin: boolean;
  }
}

const MemoryStoreSession = connectMemoryStore(session);

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Session middleware
  app.use(session({
    secret: "fittrack-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: new MemoryStoreSession({ checkPeriod: 86400000 }),
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }, // 7 days
  }));

  // Auth middleware helper
  function requireAdmin(req: any, res: any, next: any) {
    if (req.session?.isAdmin) return next();
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Auth endpoints
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    if (username?.trim() === ADMIN_USERNAME && password?.trim() === ADMIN_PASSWORD) {
      req.session.isAdmin = true;
      return res.json({ success: true });
    }
    return res.status(401).json({ message: "Invalid username or password" });
  });

  app.post("/api/logout", (req, res) => {
    req.session.destroy(() => {});
    res.json({ success: true });
  });

  app.get("/api/me", (req, res) => {
    res.json({ isAdmin: !!req.session?.isAdmin });
  });

  // Stats endpoint (public)
  app.get(api.stats.get.path, async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ message: 'Failed to fetch stats' });
    }
  });

  // Weight Entries endpoints
  app.get(api.weightEntries.list.path, async (req, res) => {
    try {
      const params = {
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
      };
      const entries = await storage.getWeightEntries(params);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch weight entries' });
    }
  });

  app.get(api.weightEntries.get.path, async (req, res) => {
    try {
      const entry = await storage.getWeightEntry(Number(req.params.id));
      if (!entry) return res.status(404).json({ message: 'Weight entry not found' });
      res.json(entry);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch weight entry' });
    }
  });

  app.post(api.weightEntries.create.path, requireAdmin, async (req, res) => {
    try {
      const bodySchema = api.weightEntries.create.input.extend({ weight: z.coerce.number() });
      const input = bodySchema.parse(req.body);
      const entry = await storage.createWeightEntry(input);
      res.status(201).json(entry);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: 'Failed to create weight entry' });
    }
  });

  app.put(api.weightEntries.update.path, requireAdmin, async (req, res) => {
    try {
      const bodySchema = api.weightEntries.update.input.extend({ weight: z.coerce.number().optional() });
      const input = bodySchema.parse(req.body);
      const entry = await storage.updateWeightEntry(Number(req.params.id), input);
      res.json(entry);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: 'Failed to update weight entry' });
    }
  });

  app.delete(api.weightEntries.delete.path, requireAdmin, async (req, res) => {
    try {
      await storage.deleteWeightEntry(Number(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete weight entry' });
    }
  });

  // Exercises endpoints
  app.get(api.exercises.list.path, async (req, res) => {
    try {
      const exercises = await storage.getExercises();
      res.json(exercises);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch exercises' });
    }
  });

  app.post(api.exercises.create.path, requireAdmin, async (req, res) => {
    try {
      const input = api.exercises.create.input.parse(req.body);
      const exercise = await storage.createExercise(input);
      res.status(201).json(exercise);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: 'Failed to create exercise' });
    }
  });

  // Workout Entries endpoints
  app.get(api.workoutEntries.list.path, async (req, res) => {
    try {
      const params = {
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        exerciseId: req.query.exerciseId ? Number(req.query.exerciseId) : undefined,
      };
      const entries = await storage.getWorkoutEntries(params);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch workout entries' });
    }
  });

  app.get(api.workoutEntries.get.path, async (req, res) => {
    try {
      const entry = await storage.getWorkoutEntry(Number(req.params.id));
      if (!entry) return res.status(404).json({ message: 'Workout entry not found' });
      res.json(entry);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch workout entry' });
    }
  });

  app.post(api.workoutEntries.create.path, requireAdmin, async (req, res) => {
    try {
      const bodySchema = api.workoutEntries.create.input.extend({
        exerciseId: z.coerce.number(),
        sets: z.coerce.number(),
        reps: z.coerce.number(),
        weight: z.coerce.number(),
      });
      const input = bodySchema.parse(req.body);
      const entry = await storage.createWorkoutEntry(input);
      res.status(201).json(entry);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: 'Failed to create workout entry' });
    }
  });

  app.put(api.workoutEntries.update.path, requireAdmin, async (req, res) => {
    try {
      const bodySchema = api.workoutEntries.update.input.extend({
        exerciseId: z.coerce.number().optional(),
        sets: z.coerce.number().optional(),
        reps: z.coerce.number().optional(),
        weight: z.coerce.number().optional(),
      });
      const input = bodySchema.parse(req.body);
      const entry = await storage.updateWorkoutEntry(Number(req.params.id), input);
      res.json(entry);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: 'Failed to update workout entry' });
    }
  });

  app.delete(api.workoutEntries.delete.path, requireAdmin, async (req, res) => {
    try {
      await storage.deleteWorkoutEntry(Number(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete workout entry' });
    }
  });

  // Running Entries endpoints
  app.get(api.runningEntries.list.path, async (req, res) => {
    try {
      const entries = await storage.getRunningEntries();
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch running entries' });
    }
  });

  app.post(api.runningEntries.create.path, requireAdmin, async (req, res) => {
    try {
      const bodySchema = api.runningEntries.create.input.extend({
        distance: z.coerce.number(),
        duration: z.coerce.number().optional(),
      });
      const input = bodySchema.parse(req.body);
      const entry = await storage.createRunningEntry(input);
      res.status(201).json(entry);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: 'Failed to create running entry' });
    }
  });

  app.put(api.runningEntries.update.path, requireAdmin, async (req, res) => {
    try {
      const bodySchema = api.runningEntries.update.input.extend({
        distance: z.coerce.number().optional(),
        duration: z.coerce.number().optional(),
      });
      const input = bodySchema.parse(req.body);
      const entry = await storage.updateRunningEntry(Number(req.params.id), input);
      res.json(entry);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: 'Failed to update running entry' });
    }
  });

  app.delete(api.runningEntries.delete.path, requireAdmin, async (req, res) => {
    try {
      await storage.deleteRunningEntry(Number(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete running entry' });
    }
  });

  await seedDatabase();
  return httpServer;
}

async function seedDatabase() {
  try {
    const existingExercises = await storage.getExercises();
    if (existingExercises.length === 0) {
      await storage.createExercise({ name: "Bench Press", category: "chest" });
      await storage.createExercise({ name: "Squat", category: "legs" });
      await storage.createExercise({ name: "Deadlift", category: "back" });
      await storage.createExercise({ name: "Overhead Press", category: "shoulders" });
      await storage.createExercise({ name: "Barbell Row", category: "back" });
      await storage.createExercise({ name: "Pull-ups", category: "back" });
      await storage.createExercise({ name: "Dips", category: "chest" });
      await storage.createExercise({ name: "Bicep Curl", category: "arms" });
      await storage.createExercise({ name: "Tricep Extension", category: "arms" });
      await storage.createExercise({ name: "Leg Press", category: "legs" });
      console.log('Seeded exercises');
    }

    const existingWeight = await storage.getWeightEntries();
    if (existingWeight.length === 0) {
      const today = new Date();
      for (let i = 30; i >= 0; i -= 3) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const weight = (75 - (30 - i) * 0.1).toFixed(1);
        await storage.createWeightEntry({ date: dateStr, weight, notes: i === 30 ? "Starting weight" : undefined });
      }
      console.log('Seeded weight entries');
    }

    const existingWorkouts = await storage.getWorkoutEntries();
    if (existingWorkouts.length === 0) {
      const exercises = await storage.getExercises();
      const today = new Date();
      for (const day of [1, 3, 5, 8, 10, 12, 14]) {
        const date = new Date(today);
        date.setDate(date.getDate() - day);
        const dateStr = date.toISOString().split('T')[0];
        if (day % 2 === 1) {
          const bp = exercises.find(e => e.name === "Bench Press");
          const bc = exercises.find(e => e.name === "Bicep Curl");
          if (bp) await storage.createWorkoutEntry({ date: dateStr, exerciseId: bp.id, sets: 4, reps: 8, weight: (60 + day * 0.5).toFixed(1) });
          if (bc) await storage.createWorkoutEntry({ date: dateStr, exerciseId: bc.id, sets: 3, reps: 12, weight: "15" });
        } else {
          const sq = exercises.find(e => e.name === "Squat");
          const dl = exercises.find(e => e.name === "Deadlift");
          if (sq) await storage.createWorkoutEntry({ date: dateStr, exerciseId: sq.id, sets: 4, reps: 10, weight: (80 + day * 0.8).toFixed(1) });
          if (dl) await storage.createWorkoutEntry({ date: dateStr, exerciseId: dl.id, sets: 3, reps: 5, weight: (100 + day * 1.2).toFixed(1) });
        }
      }
      console.log('Seeded workout entries');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}