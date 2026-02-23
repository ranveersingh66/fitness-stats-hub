import { db } from "./db";
import {
  weightEntries,
  exercises,
  workoutEntries,
  type WeightEntry,
  type Exercise,
  type WorkoutEntry,
  type WorkoutEntryResponse,
  type CreateWeightEntryRequest,
  type UpdateWeightEntryRequest,
  type CreateExerciseRequest,
  type CreateWorkoutEntryRequest,
  type UpdateWorkoutEntryRequest,
  type WeightEntriesQueryParams,
  type WorkoutEntriesQueryParams,
  type StatsResponse,
} from "@shared/schema";
import { eq, desc, asc, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // Weight Entries
  getWeightEntries(params?: WeightEntriesQueryParams): Promise<WeightEntry[]>;
  getWeightEntry(id: number): Promise<WeightEntry | undefined>;
  createWeightEntry(entry: CreateWeightEntryRequest): Promise<WeightEntry>;
  updateWeightEntry(id: number, updates: UpdateWeightEntryRequest): Promise<WeightEntry>;
  deleteWeightEntry(id: number): Promise<void>;

  // Exercises
  getExercises(): Promise<Exercise[]>;
  getExercise(id: number): Promise<Exercise | undefined>;
  createExercise(exercise: CreateExerciseRequest): Promise<Exercise>;

  // Workout Entries
  getWorkoutEntries(params?: WorkoutEntriesQueryParams): Promise<WorkoutEntryResponse[]>;
  getWorkoutEntry(id: number): Promise<WorkoutEntryResponse | undefined>;
  createWorkoutEntry(entry: CreateWorkoutEntryRequest): Promise<WorkoutEntryResponse>;
  updateWorkoutEntry(id: number, updates: UpdateWorkoutEntryRequest): Promise<WorkoutEntryResponse>;
  deleteWorkoutEntry(id: number): Promise<void>;

  // Stats
  getStats(): Promise<StatsResponse>;
}

export class DatabaseStorage implements IStorage {
  // Weight Entries
  async getWeightEntries(params?: WeightEntriesQueryParams): Promise<WeightEntry[]> {
    const conditions = [];
    
    if (params?.startDate) {
      conditions.push(gte(weightEntries.date, params.startDate));
    }
    if (params?.endDate) {
      conditions.push(lte(weightEntries.date, params.endDate));
    }

    const query = db.select().from(weightEntries);
    
    if (conditions.length > 0) {
      return await query.where(and(...conditions)).orderBy(desc(weightEntries.date));
    }
    
    return await query.orderBy(desc(weightEntries.date));
  }

  async getWeightEntry(id: number): Promise<WeightEntry | undefined> {
    const [entry] = await db.select().from(weightEntries).where(eq(weightEntries.id, id));
    return entry;
  }

  async createWeightEntry(entry: CreateWeightEntryRequest): Promise<WeightEntry> {
    const [created] = await db.insert(weightEntries).values(entry).returning();
    return created;
  }

  async updateWeightEntry(id: number, updates: UpdateWeightEntryRequest): Promise<WeightEntry> {
    const [updated] = await db.update(weightEntries)
      .set(updates)
      .where(eq(weightEntries.id, id))
      .returning();
    return updated;
  }

  async deleteWeightEntry(id: number): Promise<void> {
    await db.delete(weightEntries).where(eq(weightEntries.id, id));
  }

  // Exercises
  async getExercises(): Promise<Exercise[]> {
    return await db.select().from(exercises).orderBy(asc(exercises.category), asc(exercises.name));
  }

  async getExercise(id: number): Promise<Exercise | undefined> {
    const [exercise] = await db.select().from(exercises).where(eq(exercises.id, id));
    return exercise;
  }

  async createExercise(exercise: CreateExerciseRequest): Promise<Exercise> {
    const [created] = await db.insert(exercises).values(exercise).returning();
    return created;
  }

  // Workout Entries
  async getWorkoutEntries(params?: WorkoutEntriesQueryParams): Promise<WorkoutEntryResponse[]> {
    const conditions = [];
    
    if (params?.startDate) {
      conditions.push(gte(workoutEntries.date, params.startDate));
    }
    if (params?.endDate) {
      conditions.push(lte(workoutEntries.date, params.endDate));
    }
    if (params?.exerciseId) {
      conditions.push(eq(workoutEntries.exerciseId, params.exerciseId));
    }

    const query = db
      .select({
        id: workoutEntries.id,
        date: workoutEntries.date,
        exerciseId: workoutEntries.exerciseId,
        sets: workoutEntries.sets,
        reps: workoutEntries.reps,
        weight: workoutEntries.weight,
        notes: workoutEntries.notes,
        createdAt: workoutEntries.createdAt,
        exerciseName: exercises.name,
        exerciseCategory: exercises.category,
      })
      .from(workoutEntries)
      .leftJoin(exercises, eq(workoutEntries.exerciseId, exercises.id));

    if (conditions.length > 0) {
      return await query.where(and(...conditions)).orderBy(desc(workoutEntries.date));
    }
    
    return await query.orderBy(desc(workoutEntries.date));
  }

  async getWorkoutEntry(id: number): Promise<WorkoutEntryResponse | undefined> {
    const [entry] = await db
      .select({
        id: workoutEntries.id,
        date: workoutEntries.date,
        exerciseId: workoutEntries.exerciseId,
        sets: workoutEntries.sets,
        reps: workoutEntries.reps,
        weight: workoutEntries.weight,
        notes: workoutEntries.notes,
        createdAt: workoutEntries.createdAt,
        exerciseName: exercises.name,
        exerciseCategory: exercises.category,
      })
      .from(workoutEntries)
      .leftJoin(exercises, eq(workoutEntries.exerciseId, exercises.id))
      .where(eq(workoutEntries.id, id));
    return entry;
  }

  async createWorkoutEntry(entry: CreateWorkoutEntryRequest): Promise<WorkoutEntryResponse> {
    const [created] = await db.insert(workoutEntries).values(entry).returning();
    
    const exercise = await this.getExercise(created.exerciseId);
    
    return {
      ...created,
      exerciseName: exercise?.name,
      exerciseCategory: exercise?.category,
    };
  }

  async updateWorkoutEntry(id: number, updates: UpdateWorkoutEntryRequest): Promise<WorkoutEntryResponse> {
    const [updated] = await db.update(workoutEntries)
      .set(updates)
      .where(eq(workoutEntries.id, id))
      .returning();
    
    const exercise = await this.getExercise(updated.exerciseId);
    
    return {
      ...updated,
      exerciseName: exercise?.name,
      exerciseCategory: exercise?.category,
    };
  }

  async deleteWorkoutEntry(id: number): Promise<void> {
    await db.delete(workoutEntries).where(eq(workoutEntries.id, id));
  }

  // Stats
  async getStats(): Promise<StatsResponse> {
    const [weightCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(weightEntries);

    const [workoutCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(workoutEntries);

    const latestWeight = await db
      .select()
      .from(weightEntries)
      .orderBy(desc(weightEntries.date))
      .limit(1);

    const firstWeight = await db
      .select()
      .from(weightEntries)
      .orderBy(asc(weightEntries.date))
      .limit(1);

    const recentWorkouts = await this.getWorkoutEntries();
    const recentWeightEntries = await this.getWeightEntries();

    const currentWeight = latestWeight[0] ? parseFloat(latestWeight[0].weight) : undefined;
    const firstWeightValue = firstWeight[0] ? parseFloat(firstWeight[0].weight) : undefined;
    
    let weightChange: number | undefined;
    if (currentWeight !== undefined && firstWeightValue !== undefined) {
      weightChange = currentWeight - firstWeightValue;
    }

    // Get PRs for Bench Press, Deadlift, Squat
    const prs: PRResponse = {};
    const liftNames = ["Bench Press", "Deadlift", "Squat"];
    
    for (const name of liftNames) {
      const [exercise] = await db.select().from(exercises).where(eq(exercises.name, name));
      if (exercise) {
        const [maxWeight] = await db
          .select({ max: sql<number>`max(weight)::float` })
          .from(workoutEntries)
          .where(eq(workoutEntries.exerciseId, exercise.id));
        
        if (name === "Bench Press") prs.benchPress = maxWeight?.max || 0;
        if (name === "Deadlift") prs.deadlift = maxWeight?.max || 0;
        if (name === "Squat") prs.squat = maxWeight?.max || 0;
      }
    }

    return {
      totalWeightEntries: weightCount.count,
      totalWorkouts: workoutCount.count,
      currentWeight,
      weightChange,
      recentWorkouts: recentWorkouts.slice(0, 5),
      recentWeightEntries: recentWeightEntries.slice(0, 5),
      prs,
    };
  }
}

export const storage = new DatabaseStorage();
