import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Stats endpoint
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
      console.error('Error fetching weight entries:', error);
      res.status(500).json({ message: 'Failed to fetch weight entries' });
    }
  });

  app.get(api.weightEntries.get.path, async (req, res) => {
    try {
      const entry = await storage.getWeightEntry(Number(req.params.id));
      if (!entry) {
        return res.status(404).json({ message: 'Weight entry not found' });
      }
      res.json(entry);
    } catch (error) {
      console.error('Error fetching weight entry:', error);
      res.status(500).json({ message: 'Failed to fetch weight entry' });
    }
  });

  app.post(api.weightEntries.create.path, async (req, res) => {
    try {
      const bodySchema = api.weightEntries.create.input.extend({
        weight: z.coerce.number(),
      });
      const input = bodySchema.parse(req.body);
      const entry = await storage.createWeightEntry(input);
      res.status(201).json(entry);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error('Error creating weight entry:', err);
      res.status(500).json({ message: 'Failed to create weight entry' });
    }
  });

  app.put(api.weightEntries.update.path, async (req, res) => {
    try {
      const bodySchema = api.weightEntries.update.input.extend({
        weight: z.coerce.number().optional(),
      });
      const input = bodySchema.parse(req.body);
      const entry = await storage.updateWeightEntry(Number(req.params.id), input);
      res.json(entry);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error('Error updating weight entry:', err);
      res.status(500).json({ message: 'Failed to update weight entry' });
    }
  });

  app.delete(api.weightEntries.delete.path, async (req, res) => {
    try {
      await storage.deleteWeightEntry(Number(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting weight entry:', error);
      res.status(500).json({ message: 'Failed to delete weight entry' });
    }
  });

  // Exercises endpoints
  app.get(api.exercises.list.path, async (req, res) => {
    try {
      const exercises = await storage.getExercises();
      res.json(exercises);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      res.status(500).json({ message: 'Failed to fetch exercises' });
    }
  });

  app.post(api.exercises.create.path, async (req, res) => {
    try {
      const input = api.exercises.create.input.parse(req.body);
      const exercise = await storage.createExercise(input);
      res.status(201).json(exercise);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error('Error creating exercise:', err);
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
      console.error('Error fetching workout entries:', error);
      res.status(500).json({ message: 'Failed to fetch workout entries' });
    }
  });

  app.get(api.workoutEntries.get.path, async (req, res) => {
    try {
      const entry = await storage.getWorkoutEntry(Number(req.params.id));
      if (!entry) {
        return res.status(404).json({ message: 'Workout entry not found' });
      }
      res.json(entry);
    } catch (error) {
      console.error('Error fetching workout entry:', error);
      res.status(500).json({ message: 'Failed to fetch workout entry' });
    }
  });

  app.post(api.workoutEntries.create.path, async (req, res) => {
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
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error('Error creating workout entry:', err);
      res.status(500).json({ message: 'Failed to create workout entry' });
    }
  });

  app.put(api.workoutEntries.update.path, async (req, res) => {
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
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error('Error updating workout entry:', err);
      res.status(500).json({ message: 'Failed to update workout entry' });
    }
  });

  app.delete(api.workoutEntries.delete.path, async (req, res) => {
    try {
      await storage.deleteWorkoutEntry(Number(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting workout entry:', error);
      res.status(500).json({ message: 'Failed to delete workout entry' });
    }
  });

  // Seed database with example data
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  try {
    const existingExercises = await storage.getExercises();
    
    if (existingExercises.length === 0) {
      // Add common exercises
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
      
      // Add weight entries over past 30 days
      for (let i = 30; i >= 0; i -= 3) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Simulate gradual weight loss
        const weight = (75 - (30 - i) * 0.1).toFixed(1);
        
        await storage.createWeightEntry({
          date: dateStr,
          weight: weight,
          notes: i === 30 ? "Starting weight" : undefined,
        });
      }
      
      console.log('Seeded weight entries');
    }

    const existingWorkouts = await storage.getWorkoutEntries();
    
    if (existingWorkouts.length === 0) {
      const exercises = await storage.getExercises();
      const today = new Date();
      
      // Add workout entries over past 2 weeks
      const workoutDays = [1, 3, 5, 8, 10, 12, 14];
      
      for (const day of workoutDays) {
        const date = new Date(today);
        date.setDate(date.getDate() - day);
        const dateStr = date.toISOString().split('T')[0];
        
        // Alternate between upper and lower body
        const isUpperBody = day % 2 === 1;
        
        if (isUpperBody) {
          // Chest and arms
          const benchPress = exercises.find(e => e.name === "Bench Press");
          const dips = exercises.find(e => e.name === "Dips");
          const bicepCurl = exercises.find(e => e.name === "Bicep Curl");
          
          if (benchPress) {
            await storage.createWorkoutEntry({
              date: dateStr,
              exerciseId: benchPress.id,
              sets: 4,
              reps: 8,
              weight: (60 + day * 0.5).toFixed(1),
            });
          }
          
          if (dips) {
            await storage.createWorkoutEntry({
              date: dateStr,
              exerciseId: dips.id,
              sets: 3,
              reps: 10,
              weight: "0",
            });
          }
          
          if (bicepCurl) {
            await storage.createWorkoutEntry({
              date: dateStr,
              exerciseId: bicepCurl.id,
              sets: 3,
              reps: 12,
              weight: "15",
            });
          }
        } else {
          // Legs and back
          const squat = exercises.find(e => e.name === "Squat");
          const deadlift = exercises.find(e => e.name === "Deadlift");
          
          if (squat) {
            await storage.createWorkoutEntry({
              date: dateStr,
              exerciseId: squat.id,
              sets: 4,
              reps: 10,
              weight: (80 + day * 0.8).toFixed(1),
            });
          }
          
          if (deadlift) {
            await storage.createWorkoutEntry({
              date: dateStr,
              exerciseId: deadlift.id,
              sets: 3,
              reps: 5,
              weight: (100 + day * 1.2).toFixed(1),
            });
          }
        }
      }
      
      console.log('Seeded workout entries');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}
