import { z } from 'zod';
import { 
  insertExerciseSchema, 
  insertWorkoutSchema, 
  insertWorkoutExerciseSchema, 
  insertAssignmentSchema, 
  insertPerformanceLogSchema,
  prescriptionSchema,
} from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
  unauthorized: z.object({ message: z.string() }),
  forbidden: z.object({ message: z.string() }),
};

export const api = {
  // User / Role
  me: {
    method: 'GET' as const,
    path: '/api/me' as const,
  },
  setRole: {
    method: 'POST' as const,
    path: '/api/me/role' as const,
    input: z.object({ role: z.enum(["COACH", "ATHLETE"]) }),
  },
  athletes: {
    list: {
      method: 'GET' as const,
      path: '/api/athletes' as const,
    },
  },

  // Exercises
  exercises: {
    list: {
      method: 'GET' as const,
      path: '/api/exercises' as const,
    },
    create: {
      method: 'POST' as const,
      path: '/api/exercises' as const,
      input: insertExerciseSchema,
    },
  },

  // Workout Templates
  templates: {
    list: {
      method: 'GET' as const,
      path: '/api/templates' as const,
    },
    get: {
      method: 'GET' as const,
      path: '/api/templates/:id' as const,
    },
    clone: {
      method: 'POST' as const,
      path: '/api/templates/:id/clone' as const,
    },
  },

  // Custom Workouts (Coach)
  customWorkouts: {
    list: {
      method: 'GET' as const,
      path: '/api/custom-workouts' as const,
    },
    create: {
      method: 'POST' as const,
      path: '/api/custom-workouts' as const,
      input: z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
        difficulty: z.string().optional(),
        equipment: z.array(z.string()).optional(),
        estimatedDuration: z.number().optional(),
        blocks: z.array(z.object({
          title: z.string().min(1),
          order: z.number(),
          exercises: z.array(z.object({
            name: z.string().min(1),
            exerciseId: z.number().nullable().optional(),
            order: z.number(),
            prescriptionJson: prescriptionSchema.optional(),
            notes: z.string().optional(),
          })),
        })),
      }),
    },
    get: {
      method: 'GET' as const,
      path: '/api/custom-workouts/:id' as const,
    },
    update: {
      method: 'PUT' as const,
      path: '/api/custom-workouts/:id' as const,
      input: z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
        difficulty: z.string().optional(),
        equipment: z.array(z.string()).optional(),
        estimatedDuration: z.number().optional(),
        blocks: z.array(z.object({
          title: z.string().min(1),
          order: z.number(),
          exercises: z.array(z.object({
            name: z.string().min(1),
            exerciseId: z.number().nullable().optional(),
            order: z.number(),
            prescriptionJson: prescriptionSchema.optional(),
            notes: z.string().optional(),
          })),
        })),
      }),
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/custom-workouts/:id' as const,
    },
  },

  // Assignments
  coachAssignments: {
    list: {
      method: 'GET' as const,
      path: '/api/coach/assignments' as const,
    },
    create: {
      method: 'POST' as const,
      path: '/api/coach/assignments' as const,
      input: z.object({
        athleteIds: z.array(z.string()).optional(),
        groupId: z.number().optional(),
        sourceType: z.enum(["TEMPLATE", "CUSTOM"]),
        sourceId: z.number(),
        scheduledDate: z.string(),
      }).refine(
        data => (data.athleteIds && data.athleteIds.length > 0) || data.groupId,
        { message: "Either athleteIds or groupId must be provided" }
      ),
    },
  },
  athleteAssignments: {
    list: {
      method: 'GET' as const,
      path: '/api/athlete/workouts' as const,
    },
    get: {
      method: 'GET' as const,
      path: '/api/athlete/workouts/:assignmentId' as const,
    },
    log: {
      method: 'POST' as const,
      path: '/api/athlete/workouts/:assignmentId/log' as const,
      input: z.object({
        overallNotes: z.string().optional(),
        sets: z.array(z.object({
          exerciseName: z.string(),
          setNumber: z.number(),
          reps: z.number().nullable().optional(),
          weight: z.string().nullable().optional(),
          timeSeconds: z.number().nullable().optional(),
          distanceMeters: z.number().nullable().optional(),
          rpe: z.number().nullable().optional(),
          notes: z.string().nullable().optional(),
        })),
        heartRate: z.object({
          avgHeartRate: z.number().nullable(),
          maxHeartRate: z.number().nullable(),
          minHeartRate: z.number().nullable(),
          deviceName: z.string().nullable(),
        }).optional(),
      }),
    },
    complete: {
      method: 'POST' as const,
      path: '/api/athlete/workouts/:assignmentId/complete' as const,
    },
  },

  // Coach viewing athlete logs
  coachAthleteLog: {
    method: 'GET' as const,
    path: '/api/coach/assignments/:assignmentId/log' as const,
  },

  // Athlete's connected coaches
  athleteCoaches: {
    list: {
      method: 'GET' as const,
      path: '/api/athlete/coaches' as const,
    },
  },

  // Groups (Teams/Squads)
  coachGroups: {
    list: {
      method: 'GET' as const,
      path: '/api/coach/groups' as const,
    },
    create: {
      method: 'POST' as const,
      path: '/api/coach/groups' as const,
      input: z.object({
        name: z.string().min(1),
        description: z.string().optional(),
      }),
    },
    get: {
      method: 'GET' as const,
      path: '/api/coach/groups/:id' as const,
    },
    update: {
      method: 'PUT' as const,
      path: '/api/coach/groups/:id' as const,
      input: z.object({
        name: z.string().min(1),
        description: z.string().optional(),
      }),
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/coach/groups/:id' as const,
    },
    addMember: {
      method: 'POST' as const,
      path: '/api/coach/groups/:id/members' as const,
      input: z.object({
        athleteId: z.string().min(1),
      }),
    },
    removeMember: {
      method: 'DELETE' as const,
      path: '/api/coach/groups/:id/members/:athleteId' as const,
    },
  },
  athleteGroups: {
    list: {
      method: 'GET' as const,
      path: '/api/athlete/groups' as const,
    },
  },

  // Coach ↔ Athlete Connections
  coachAthleteConnections: {
    list: {
      method: 'GET' as const,
      path: '/api/coach/athletes' as const,
    },
    connect: {
      method: 'POST' as const,
      path: '/api/coach/athletes/connect' as const,
      input: z.object({ athleteEmail: z.string().email() }),
    },
    disconnect: {
      method: 'DELETE' as const,
      path: '/api/coach/athletes/:athleteId' as const,
    },
  },

  // Messaging
  messaging: {
    conversations: {
      list: {
        method: 'GET' as const,
        path: '/api/messages/conversations' as const,
      },
      create: {
        method: 'POST' as const,
        path: '/api/messages/conversations' as const,
        input: z.object({
          participantIds: z.array(z.string()).optional(),
          isGroup: z.boolean().optional(),
          title: z.string().optional(),
          groupId: z.number().optional(),
        }),
      },
      messages: {
        method: 'GET' as const,
        path: '/api/messages/conversations/:id/messages' as const,
      },
      send: {
        method: 'POST' as const,
        path: '/api/messages/conversations/:id/messages' as const,
        input: z.object({ content: z.string().min(1) }),
      },
    },
  },

  // Recurring Assignments
  recurringAssignments: {
    list: {
      method: 'GET' as const,
      path: '/api/coach/recurring-assignments' as const,
    },
    create: {
      method: 'POST' as const,
      path: '/api/coach/recurring-assignments' as const,
      input: z.object({
        sourceType: z.enum(["TEMPLATE", "CUSTOM"]),
        sourceId: z.number(),
        athleteIds: z.array(z.string()).optional(),
        groupId: z.number().optional(),
        frequency: z.enum(["weekly", "2x_week"]),
        daysOfWeek: z.array(z.number().min(0).max(6)),
        startDate: z.string(),
        endDate: z.string(),
      }).refine(
        data => (data.athleteIds && data.athleteIds.length > 0) || data.groupId,
        { message: "Either athleteIds or groupId must be provided" }
      ),
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/coach/recurring-assignments/:id' as const,
    },
  },

  // Workout Comments
  workoutComments: {
    list: {
      method: 'GET' as const,
      path: '/api/workouts/:assignmentId/comments' as const,
    },
    create: {
      method: 'POST' as const,
      path: '/api/workouts/:assignmentId/comments' as const,
      input: z.object({ content: z.string().min(1) }),
    },
  },

  // Wellness Check-ins
  wellness: {
    submit: {
      method: 'POST' as const,
      path: '/api/athlete/wellness' as const,
      input: z.object({
        sleep: z.number().min(1).max(5),
        soreness: z.number().min(1).max(5),
        stress: z.number().min(1).max(5),
        mood: z.number().min(1).max(5),
        note: z.string().optional(),
      }),
    },
    history: {
      method: 'GET' as const,
      path: '/api/athlete/wellness' as const,
    },
    coachView: {
      method: 'GET' as const,
      path: '/api/coach/athletes/:id/wellness' as const,
    },
  },

  // Personal Records
  personalRecords: {
    athlete: {
      method: 'GET' as const,
      path: '/api/athlete/prs' as const,
    },
    coachView: {
      method: 'GET' as const,
      path: '/api/coach/athletes/:id/prs' as const,
    },
  },

  // Exercise History
  exerciseHistory: {
    athlete: {
      method: 'GET' as const,
      path: '/api/athlete/exercise-history' as const,
    },
    coachView: {
      method: 'GET' as const,
      path: '/api/coach/athletes/:id/exercise-history' as const,
    },
  },

  // Coach Athlete Detail
  coachAthleteDetail: {
    method: 'GET' as const,
    path: '/api/coach/athletes/:id' as const,
  },

  // Legacy
  workouts: {
    list: { method: 'GET' as const, path: '/api/workouts' as const },
    create: { method: 'POST' as const, path: '/api/workouts' as const, input: insertWorkoutSchema },
    get: { method: 'GET' as const, path: '/api/workouts/:id' as const },
    addExercise: {
      method: 'POST' as const,
      path: '/api/workouts/:id/exercises' as const,
      input: insertWorkoutExerciseSchema.omit({ workoutId: true }),
    }
  },
  assignments: {
    list: { method: 'GET' as const, path: '/api/assignments' as const, input: z.object({ userId: z.string().optional(), date: z.string().optional() }).optional() },
    create: { method: 'POST' as const, path: '/api/assignments' as const, input: insertAssignmentSchema },
    complete: { method: 'PATCH' as const, path: '/api/assignments/:id/complete' as const, input: z.object({ completed: z.boolean() }) },
  },
  performance: {
    log: { method: 'POST' as const, path: '/api/performance' as const, input: insertPerformanceLogSchema },
    history: { method: 'GET' as const, path: '/api/performance/:exerciseId' as const },
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
