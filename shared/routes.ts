import { z } from 'zod';
import { 
  insertExerciseSchema, 
  insertWorkoutSchema, 
  insertWorkoutExerciseSchema, 
  insertAssignmentSchema, 
  insertPerformanceLogSchema,
  exercises,
  workouts,
  workoutExercises,
  assignments,
  performanceLogs
} from './schema';

// === ERROR SCHEMAS ===
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

// === API CONTRACT ===
export const api = {
  exercises: {
    list: {
      method: 'GET' as const,
      path: '/api/exercises' as const,
      responses: {
        200: z.array(z.custom<typeof exercises.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/exercises' as const,
      input: insertExerciseSchema,
      responses: {
        201: z.custom<typeof exercises.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  workouts: {
    list: {
      method: 'GET' as const,
      path: '/api/workouts' as const,
      responses: {
        200: z.array(z.custom<typeof workouts.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/workouts' as const,
      input: insertWorkoutSchema,
      responses: {
        201: z.custom<typeof workouts.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/workouts/:id' as const,
      responses: {
        200: z.custom<typeof workouts.$inferSelect & { exercises: any[] }>(),
        404: errorSchemas.notFound,
      },
    },
    addExercise: {
      method: 'POST' as const,
      path: '/api/workouts/:id/exercises' as const,
      input: insertWorkoutExerciseSchema.omit({ workoutId: true }),
      responses: {
        201: z.custom<typeof workoutExercises.$inferSelect>(),
        400: errorSchemas.validation,
      },
    }
  },
  assignments: {
    list: { // Get assignments for logged in user or specific user
      method: 'GET' as const,
      path: '/api/assignments' as const, 
      input: z.object({ userId: z.string().optional(), date: z.string().optional() }).optional(),
      responses: {
        200: z.array(z.custom<typeof assignments.$inferSelect & { workout: typeof workouts.$inferSelect }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/assignments' as const,
      input: insertAssignmentSchema,
      responses: {
        201: z.custom<typeof assignments.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    complete: {
      method: 'PATCH' as const,
      path: '/api/assignments/:id/complete' as const,
      input: z.object({ completed: z.boolean() }),
      responses: {
        200: z.custom<typeof assignments.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    }
  },
  performance: {
    log: {
      method: 'POST' as const,
      path: '/api/performance' as const,
      input: insertPerformanceLogSchema,
      responses: {
        201: z.custom<typeof performanceLogs.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    history: {
      method: 'GET' as const,
      path: '/api/performance/:exerciseId' as const,
      responses: {
        200: z.array(z.custom<typeof performanceLogs.$inferSelect>()),
      },
    }
  }
};

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
