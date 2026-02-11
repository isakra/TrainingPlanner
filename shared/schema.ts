import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
export * from "./models/auth";

// === TABLE DEFINITIONS ===

// Exercises Library
export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // Strength, Cardio, Plyo, etc.
  videoUrl: text("video_url"),
  instructions: text("instructions"),
});

// Workouts (Templates or Assigned Days)
export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  coachId: text("coach_id").notNull(), // References auth.users.id
});

// Exercises within a Workout
export const workoutExercises = pgTable("workout_exercises", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id").notNull(),
  exerciseId: integer("exercise_id").notNull(),
  order: integer("order").notNull(),
  sets: integer("sets").notNull(),
  reps: text("reps").notNull(), // "10" or "8-12"
  weight: text("weight"), // Suggested weight or %
  notes: text("notes"),
});

// Assign Workouts to Athletes
export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id").notNull(),
  userId: text("user_id").notNull(), // References auth.users.id
  assignedDate: timestamp("assigned_date").notNull(),
  completed: boolean("completed").default(false),
});

// Performance Logs (Actual results)
export const performanceLogs = pgTable("performance_logs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  workoutExerciseId: integer("workout_exercise_id"), // Optional link to assigned exercise
  exerciseId: integer("exercise_id").notNull(),
  date: timestamp("date").defaultNow(),
  setsCompleted: integer("sets_completed"),
  repsCompleted: integer("reps_completed"),
  weightLifted: integer("weight_lifted"), // In lbs/kg
  notes: text("notes"),
});

// === SCHEMAS ===

export const insertExerciseSchema = createInsertSchema(exercises).omit({ id: true });
export const insertWorkoutSchema = createInsertSchema(workouts).omit({ id: true });
export const insertWorkoutExerciseSchema = createInsertSchema(workoutExercises).omit({ id: true });
export const insertAssignmentSchema = createInsertSchema(assignments).omit({ id: true, completed: true });
export const insertPerformanceLogSchema = createInsertSchema(performanceLogs).omit({ id: true, date: true });

// === TYPES ===

export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;

export type Workout = typeof workouts.$inferSelect;
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;

export type WorkoutExercise = typeof workoutExercises.$inferSelect;
export type InsertWorkoutExercise = z.infer<typeof insertWorkoutExerciseSchema>;

export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;

export type PerformanceLog = typeof performanceLogs.$inferSelect;
export type InsertPerformanceLog = z.infer<typeof insertPerformanceLogSchema>;

// Complex types for responses
export type WorkoutWithExercises = Workout & {
  exercises: (WorkoutExercise & { exercise: Exercise })[];
};
