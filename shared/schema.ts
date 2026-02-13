import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
export * from "./models/auth";

// === EXERCISES LIBRARY ===

export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  videoUrl: text("video_url"),
  instructions: text("instructions"),
});

// === WORKOUT TEMPLATES (Pre-made, system-owned) ===

export const workoutTemplates = pgTable("workout_templates", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  tags: text("tags").array().default([]),
  difficulty: text("difficulty"),
  equipment: text("equipment").array().default([]),
  estimatedDuration: integer("estimated_duration"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const templateBlocks = pgTable("template_blocks", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull(),
  title: text("title").notNull(),
  order: integer("order").notNull(),
});

export const templateExercises = pgTable("template_exercises", {
  id: serial("id").primaryKey(),
  blockId: integer("block_id").notNull(),
  name: text("name").notNull(),
  exerciseId: integer("exercise_id"),
  order: integer("order").notNull(),
  prescriptionJson: jsonb("prescription_json"),
  notes: text("notes"),
});

// === CUSTOM WORKOUTS (Coach-owned, cloned or created from scratch) ===

export const customWorkouts = pgTable("custom_workouts", {
  id: serial("id").primaryKey(),
  coachId: text("coach_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  tags: text("tags").array().default([]),
  difficulty: text("difficulty"),
  equipment: text("equipment").array().default([]),
  estimatedDuration: integer("estimated_duration"),
  sourceTemplateId: integer("source_template_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const customBlocks = pgTable("custom_blocks", {
  id: serial("id").primaryKey(),
  customWorkoutId: integer("custom_workout_id").notNull(),
  title: text("title").notNull(),
  order: integer("order").notNull(),
});

export const customExercises = pgTable("custom_exercises", {
  id: serial("id").primaryKey(),
  customBlockId: integer("custom_block_id").notNull(),
  name: text("name").notNull(),
  exerciseId: integer("exercise_id"),
  order: integer("order").notNull(),
  prescriptionJson: jsonb("prescription_json"),
  notes: text("notes"),
});

// === ASSIGNMENTS ===

export const workoutAssignments = pgTable("workout_assignments", {
  id: serial("id").primaryKey(),
  athleteId: text("athlete_id").notNull(),
  coachId: text("coach_id").notNull(),
  scheduledDate: timestamp("scheduled_date").notNull(),
  status: text("status").notNull().default("UPCOMING"),
  sourceType: text("source_type").notNull(),
  sourceId: integer("source_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === WORKOUT LOGS ===

export const workoutLogs = pgTable("workout_logs", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").notNull(),
  athleteId: text("athlete_id").notNull(),
  completedAt: timestamp("completed_at"),
  overallNotes: text("overall_notes"),
  avgHeartRate: integer("avg_heart_rate"),
  maxHeartRate: integer("max_heart_rate"),
  minHeartRate: integer("min_heart_rate"),
  deviceName: text("device_name"),
});

export const setLogs = pgTable("set_logs", {
  id: serial("id").primaryKey(),
  logId: integer("log_id").notNull(),
  exerciseName: text("exercise_name").notNull(),
  setNumber: integer("set_number").notNull(),
  reps: integer("reps"),
  weight: text("weight"),
  timeSeconds: integer("time_seconds"),
  distanceMeters: integer("distance_meters"),
  rpe: integer("rpe"),
  notes: text("notes"),
});

// === KEEP OLD TABLES for backward compat during migration ===

export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  coachId: text("coach_id").notNull(),
});

export const workoutExercises = pgTable("workout_exercises", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id").notNull(),
  exerciseId: integer("exercise_id").notNull(),
  order: integer("order").notNull(),
  sets: integer("sets").notNull(),
  reps: text("reps").notNull(),
  weight: text("weight"),
  notes: text("notes"),
});

export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id").notNull(),
  userId: text("user_id").notNull(),
  assignedDate: timestamp("assigned_date").notNull(),
  completed: boolean("completed").default(false),
});

export const performanceLogs = pgTable("performance_logs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  workoutExerciseId: integer("workout_exercise_id"),
  exerciseId: integer("exercise_id").notNull(),
  date: timestamp("date").defaultNow(),
  setsCompleted: integer("sets_completed"),
  repsCompleted: integer("reps_completed"),
  weightLifted: integer("weight_lifted"),
  notes: text("notes"),
});

// === PRESCRIPTION JSON SCHEMA ===

export const prescriptionSchema = z.object({
  sets: z.number().optional(),
  reps: z.string().optional(),
  weight: z.string().optional(),
  rpe: z.number().optional(),
  timeSeconds: z.number().optional(),
  distanceMeters: z.number().optional(),
  restSeconds: z.number().optional(),
  tempo: z.string().optional(),
  percentage: z.string().optional(),
});

export type PrescriptionJson = z.infer<typeof prescriptionSchema>;

// === INSERT SCHEMAS ===

export const insertExerciseSchema = createInsertSchema(exercises).omit({ id: true });
export const insertWorkoutTemplateSchema = createInsertSchema(workoutTemplates).omit({ id: true, createdAt: true });
export const insertTemplateBlockSchema = createInsertSchema(templateBlocks).omit({ id: true });
export const insertTemplateExerciseSchema = createInsertSchema(templateExercises).omit({ id: true });
export const insertCustomWorkoutSchema = createInsertSchema(customWorkouts).omit({ id: true, createdAt: true });
export const insertCustomBlockSchema = createInsertSchema(customBlocks).omit({ id: true });
export const insertCustomExerciseSchema = createInsertSchema(customExercises).omit({ id: true });
export const insertWorkoutAssignmentSchema = createInsertSchema(workoutAssignments).omit({ id: true, createdAt: true, status: true });
export const insertWorkoutLogSchema = createInsertSchema(workoutLogs).omit({ id: true });
export const insertSetLogSchema = createInsertSchema(setLogs).omit({ id: true });

export const insertWorkoutSchema = createInsertSchema(workouts).omit({ id: true });
export const insertWorkoutExerciseSchema = createInsertSchema(workoutExercises).omit({ id: true });
export const insertAssignmentSchema = createInsertSchema(assignments).omit({ id: true, completed: true });
export const insertPerformanceLogSchema = createInsertSchema(performanceLogs).omit({ id: true, date: true });

// === TYPES ===

export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;

export type WorkoutTemplate = typeof workoutTemplates.$inferSelect;
export type InsertWorkoutTemplate = z.infer<typeof insertWorkoutTemplateSchema>;

export type TemplateBlock = typeof templateBlocks.$inferSelect;
export type InsertTemplateBlock = z.infer<typeof insertTemplateBlockSchema>;

export type TemplateExercise = typeof templateExercises.$inferSelect;
export type InsertTemplateExercise = z.infer<typeof insertTemplateExerciseSchema>;

export type CustomWorkout = typeof customWorkouts.$inferSelect;
export type InsertCustomWorkout = z.infer<typeof insertCustomWorkoutSchema>;

export type CustomBlock = typeof customBlocks.$inferSelect;
export type InsertCustomBlock = z.infer<typeof insertCustomBlockSchema>;

export type CustomExercise = typeof customExercises.$inferSelect;
export type InsertCustomExercise = z.infer<typeof insertCustomExerciseSchema>;

export type WorkoutAssignment = typeof workoutAssignments.$inferSelect;
export type InsertWorkoutAssignment = z.infer<typeof insertWorkoutAssignmentSchema>;

export type WorkoutLog = typeof workoutLogs.$inferSelect;
export type InsertWorkoutLog = z.infer<typeof insertWorkoutLogSchema>;

export type SetLog = typeof setLogs.$inferSelect;
export type InsertSetLog = z.infer<typeof insertSetLogSchema>;

export type Workout = typeof workouts.$inferSelect;
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;

export type WorkoutExercise = typeof workoutExercises.$inferSelect;
export type InsertWorkoutExercise = z.infer<typeof insertWorkoutExerciseSchema>;

export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;

export type PerformanceLog = typeof performanceLogs.$inferSelect;
export type InsertPerformanceLog = z.infer<typeof insertPerformanceLogSchema>;

// === COMPLEX TYPES ===

export type TemplateBlockWithExercises = TemplateBlock & {
  exercises: TemplateExercise[];
};

export type WorkoutTemplateWithBlocks = WorkoutTemplate & {
  blocks: TemplateBlockWithExercises[];
};

export type CustomBlockWithExercises = CustomBlock & {
  exercises: CustomExercise[];
};

export type CustomWorkoutWithBlocks = CustomWorkout & {
  blocks: CustomBlockWithExercises[];
};

export type WorkoutWithExercises = Workout & {
  exercises: (WorkoutExercise & { exercise: Exercise })[];
};

export type WorkoutLogWithSets = WorkoutLog & {
  sets: SetLog[];
};
