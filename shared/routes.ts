import { z } from 'zod';
import { 
  insertWeightEntrySchema, 
  insertExerciseSchema, 
  insertWorkoutEntrySchema,
  type WeightEntry,
  type Exercise,
  type WorkoutEntry,
  type WorkoutEntryResponse,
  type StatsResponse,
} from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  stats: {
    get: {
      method: 'GET' as const,
      path: '/api/stats' as const,
      responses: {
        200: z.custom<StatsResponse>(),
      },
    },
  },
  weightEntries: {
    list: {
      method: 'GET' as const,
      path: '/api/weight-entries' as const,
      input: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<WeightEntry>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/weight-entries/:id' as const,
      responses: {
        200: z.custom<WeightEntry>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/weight-entries' as const,
      input: insertWeightEntrySchema,
      responses: {
        201: z.custom<WeightEntry>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/weight-entries/:id' as const,
      input: insertWeightEntrySchema.partial(),
      responses: {
        200: z.custom<WeightEntry>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/weight-entries/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  exercises: {
    list: {
      method: 'GET' as const,
      path: '/api/exercises' as const,
      responses: {
        200: z.array(z.custom<Exercise>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/exercises' as const,
      input: insertExerciseSchema,
      responses: {
        201: z.custom<Exercise>(),
        400: errorSchemas.validation,
      },
    },
  },
  workoutEntries: {
    list: {
      method: 'GET' as const,
      path: '/api/workout-entries' as const,
      input: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        exerciseId: z.coerce.number().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<WorkoutEntryResponse>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/workout-entries/:id' as const,
      responses: {
        200: z.custom<WorkoutEntryResponse>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/workout-entries' as const,
      input: insertWorkoutEntrySchema,
      responses: {
        201: z.custom<WorkoutEntryResponse>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/workout-entries/:id' as const,
      input: insertWorkoutEntrySchema.partial(),
      responses: {
        200: z.custom<WorkoutEntryResponse>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/workout-entries/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
};

// ============================================
// REQUIRED: buildUrl helper
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// ============================================
// TYPE HELPERS
// ============================================
export type WeightEntryInput = z.infer<typeof api.weightEntries.create.input>;
export type WeightEntryUpdateInput = z.infer<typeof api.weightEntries.update.input>;
export type ExerciseInput = z.infer<typeof api.exercises.create.input>;
export type WorkoutEntryInput = z.infer<typeof api.workoutEntries.create.input>;
export type WorkoutEntryUpdateInput = z.infer<typeof api.workoutEntries.update.input>;
export type ValidationError = z.infer<typeof errorSchemas.validation>;
export type NotFoundError = z.infer<typeof errorSchemas.notFound>;
