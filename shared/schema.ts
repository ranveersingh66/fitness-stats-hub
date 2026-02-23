import { pgTable, serial, text, decimal, date, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===
export const weightEntries = pgTable("weight_entries", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  weight: decimal("weight", { precision: 5, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // e.g., "chest", "back", "legs", "shoulders", "arms"
});

export const workoutEntries = pgTable("workout_entries", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  exerciseId: integer("exercise_id").notNull().references(() => exercises.id),
  sets: integer("sets").notNull(),
  reps: integer("reps").notNull(),
  weight: decimal("weight", { precision: 6, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === BASE SCHEMAS ===
export const insertWeightEntrySchema = createInsertSchema(weightEntries).omit({ 
  id: true, 
  createdAt: true 
});

export const insertExerciseSchema = createInsertSchema(exercises).omit({ 
  id: true 
});

export const insertWorkoutEntrySchema = createInsertSchema(workoutEntries).omit({ 
  id: true, 
  createdAt: true 
});

// === BASE TYPES ===
export type WeightEntry = typeof weightEntries.$inferSelect;
export type Exercise = typeof exercises.$inferSelect;
export type WorkoutEntry = typeof workoutEntries.$inferSelect;

// === REQUEST TYPES ===
export type CreateWeightEntryRequest = z.infer<typeof insertWeightEntrySchema>;
export type UpdateWeightEntryRequest = Partial<z.infer<typeof insertWeightEntrySchema>>;

export type CreateExerciseRequest = z.infer<typeof insertExerciseSchema>;

export type CreateWorkoutEntryRequest = z.infer<typeof insertWorkoutEntrySchema>;
export type UpdateWorkoutEntryRequest = Partial<z.infer<typeof insertWorkoutEntrySchema>>;

// === RESPONSE TYPES ===
export type WeightEntryResponse = WeightEntry;
export type ExerciseResponse = Exercise;
export type WorkoutEntryResponse = WorkoutEntry & {
  exerciseName?: string;
  exerciseCategory?: string;
};

// === QUERY PARAMS ===
export interface WeightEntriesQueryParams {
  startDate?: string;
  endDate?: string;
}

export interface WorkoutEntriesQueryParams {
  startDate?: string;
  endDate?: string;
  exerciseId?: number;
}

export interface PRResponse {
  benchPress?: number;
  deadlift?: number;
  squat?: number;
}

// === STATS RESPONSE ===
export interface StatsResponse {
  totalWeightEntries: number;
  totalWorkouts: number;
  currentWeight?: number;
  weightChange?: number; // change from first to latest
  recentWorkouts: WorkoutEntryResponse[];
  recentWeightEntries: WeightEntryResponse[];
  prs: PRResponse;
}
