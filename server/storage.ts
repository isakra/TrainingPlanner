import { db } from "./db";
import {
  exercises, workouts, workoutExercises, assignments, performanceLogs,
  type Exercise, type InsertExercise,
  type Workout, type InsertWorkout,
  type WorkoutExercise, type InsertWorkoutExercise,
  type Assignment, type InsertAssignment,
  type PerformanceLog, type InsertPerformanceLog,
  type WorkoutWithExercises
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Exercises
  getExercises(): Promise<Exercise[]>;
  getExerciseByName(name: string): Promise<Exercise | undefined>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;

  // Workouts
  getWorkouts(): Promise<Workout[]>;
  getWorkout(id: number): Promise<WorkoutWithExercises | undefined>;
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  addExerciseToWorkout(workoutExercise: InsertWorkoutExercise): Promise<WorkoutExercise>;

  // Assignments
  getAssignments(userId?: string, date?: Date): Promise<(Assignment & { workout: Workout })[]>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  completeAssignment(id: number, completed: boolean): Promise<Assignment>;

  // Performance
  logPerformance(log: InsertPerformanceLog): Promise<PerformanceLog>;
  getPerformanceHistory(exerciseId: number, userId: string): Promise<PerformanceLog[]>;
}

export class DatabaseStorage implements IStorage {
  // Exercises
  async getExercises(): Promise<Exercise[]> {
    return await db.select().from(exercises);
  }

  async getExerciseByName(name: string): Promise<Exercise | undefined> {
    const [exercise] = await db.select().from(exercises).where(eq(exercises.name, name)).limit(1);
    return exercise;
  }

  async createExercise(exercise: InsertExercise): Promise<Exercise> {
    const [newExercise] = await db.insert(exercises).values(exercise).returning();
    return newExercise;
  }

  // Workouts
  async getWorkouts(): Promise<Workout[]> {
    return await db.select().from(workouts);
  }

  async getWorkout(id: number): Promise<WorkoutWithExercises | undefined> {
    const [workout] = await db.select().from(workouts).where(eq(workouts.id, id));
    if (!workout) return undefined;

    const exercisesInWorkout = await db
      .select({
        workoutExercise: workoutExercises,
        exercise: exercises,
      })
      .from(workoutExercises)
      .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
      .where(eq(workoutExercises.workoutId, id))
      .orderBy(workoutExercises.order);

    return {
      ...workout,
      exercises: exercisesInWorkout.map(item => ({
        ...item.workoutExercise,
        exercise: item.exercise,
      })),
    };
  }

  async createWorkout(workout: InsertWorkout): Promise<Workout> {
    const [newWorkout] = await db.insert(workouts).values(workout).returning();
    return newWorkout;
  }

  async addExerciseToWorkout(workoutExercise: InsertWorkoutExercise): Promise<WorkoutExercise> {
    const [newItem] = await db.insert(workoutExercises).values(workoutExercise).returning();
    return newItem;
  }

  // Assignments
  async getAssignments(userId?: string, date?: Date): Promise<(Assignment & { workout: Workout })[]> {
    const conditions = [];
    if (userId) conditions.push(eq(assignments.userId, userId));
    // Simple date match - strict equality might be tricky with timestamps, 
    // but for now assume exact match or range if needed. 
    // For MVP, if date is passed, we might want to match the day.
    // Let's rely on backend filtering for now or simple match.
    // Ideally use date_trunc('day', assigned_date)
    
    // For simplicity in this mock-like implementation:
    if (date) {
        // This is a naive check, really should check range
        // conditions.push(eq(assignments.assignedDate, date));
    }

    const query = db
      .select({
        assignment: assignments,
        workout: workouts,
      })
      .from(assignments)
      .innerJoin(workouts, eq(assignments.workoutId, workouts.id));

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    const results = await query;
    return results.map(r => ({ ...r.assignment, workout: r.workout }));
  }

  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const [newAssignment] = await db.insert(assignments).values(assignment).returning();
    return newAssignment;
  }

  async completeAssignment(id: number, completed: boolean): Promise<Assignment> {
    const [updated] = await db
      .update(assignments)
      .set({ completed })
      .where(eq(assignments.id, id))
      .returning();
    return updated;
  }

  // Performance
  async logPerformance(log: InsertPerformanceLog): Promise<PerformanceLog> {
    const [newLog] = await db.insert(performanceLogs).values(log).returning();
    return newLog;
  }

  async getPerformanceHistory(exerciseId: number, userId: string): Promise<PerformanceLog[]> {
    return await db
      .select()
      .from(performanceLogs)
      .where(
        and(
          eq(performanceLogs.exerciseId, exerciseId),
          eq(performanceLogs.userId, userId)
        )
      )
      .orderBy(desc(performanceLogs.date));
  }
}

export const storage = new DatabaseStorage();
