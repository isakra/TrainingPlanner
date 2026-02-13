import { db } from "./db";
import {
  exercises, workouts, workoutExercises, assignments, performanceLogs,
  workoutTemplates, templateBlocks, templateExercises,
  customWorkouts, customBlocks, customExercises,
  workoutAssignments, workoutLogs, setLogs,
  users,
  type Exercise, type InsertExercise,
  type Workout, type InsertWorkout,
  type WorkoutExercise, type InsertWorkoutExercise,
  type Assignment, type InsertAssignment,
  type PerformanceLog, type InsertPerformanceLog,
  type WorkoutWithExercises,
  type WorkoutTemplate, type InsertWorkoutTemplate, type WorkoutTemplateWithBlocks,
  type TemplateBlock, type InsertTemplateBlock, type TemplateBlockWithExercises,
  type TemplateExercise, type InsertTemplateExercise,
  type CustomWorkout, type InsertCustomWorkout, type CustomWorkoutWithBlocks,
  type CustomBlock, type InsertCustomBlock, type CustomBlockWithExercises,
  type CustomExercise, type InsertCustomExercise,
  type WorkoutAssignment, type InsertWorkoutAssignment,
  type WorkoutLog, type InsertWorkoutLog, type WorkoutLogWithSets,
  type SetLog, type InsertSetLog,
  type User,
} from "@shared/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // Users
  getUserById(id: string): Promise<User | undefined>;
  updateUserRole(id: string, role: string): Promise<User>;
  getAthletes(): Promise<User[]>;

  // Exercises
  getExercises(): Promise<Exercise[]>;
  getExerciseByName(name: string): Promise<Exercise | undefined>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;

  // Workout Templates
  getWorkoutTemplates(): Promise<WorkoutTemplate[]>;
  getWorkoutTemplate(id: number): Promise<WorkoutTemplateWithBlocks | undefined>;
  createWorkoutTemplate(template: InsertWorkoutTemplate): Promise<WorkoutTemplate>;
  createTemplateBlock(block: InsertTemplateBlock): Promise<TemplateBlock>;
  createTemplateExercise(exercise: InsertTemplateExercise): Promise<TemplateExercise>;

  // Custom Workouts
  getCustomWorkouts(coachId: string): Promise<CustomWorkout[]>;
  getCustomWorkout(id: number): Promise<CustomWorkoutWithBlocks | undefined>;
  createCustomWorkout(workout: InsertCustomWorkout): Promise<CustomWorkout>;
  updateCustomWorkout(id: number, data: Partial<InsertCustomWorkout>): Promise<CustomWorkout>;
  deleteCustomWorkout(id: number): Promise<void>;
  createCustomBlock(block: InsertCustomBlock): Promise<CustomBlock>;
  deleteCustomBlocksByWorkout(workoutId: number): Promise<void>;
  createCustomExercise(exercise: InsertCustomExercise): Promise<CustomExercise>;

  // Clone
  cloneTemplateToCustomWorkout(templateId: number, coachId: string): Promise<CustomWorkout>;

  // Assignments
  getCoachAssignments(coachId: string): Promise<(WorkoutAssignment & { athleteName: string; workoutTitle: string })[]>;
  getAthleteAssignments(athleteId: string): Promise<(WorkoutAssignment & { workoutTitle: string; coachName: string })[]>;
  createAssignments(data: { coachId: string; athleteIds: string[]; sourceType: string; sourceId: number; scheduledDate: Date }): Promise<WorkoutAssignment[]>;
  completeAssignment(id: number): Promise<WorkoutAssignment>;

  // Logging
  getWorkoutLog(assignmentId: number): Promise<WorkoutLogWithSets | undefined>;
  upsertWorkoutLog(data: { assignmentId: number; athleteId: string; overallNotes?: string; completedAt?: Date }): Promise<WorkoutLog>;
  upsertSetLogs(logId: number, sets: InsertSetLog[]): Promise<SetLog[]>;

  // Legacy (keep for backward compat)
  getWorkouts(): Promise<Workout[]>;
  getWorkout(id: number): Promise<WorkoutWithExercises | undefined>;
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  addExerciseToWorkout(workoutExercise: InsertWorkoutExercise): Promise<WorkoutExercise>;
  getAssignments(userId?: string, date?: Date): Promise<(Assignment & { workout: Workout })[]>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  completeOldAssignment(id: number, completed: boolean): Promise<Assignment>;
  logPerformance(log: InsertPerformanceLog): Promise<PerformanceLog>;
  getPerformanceHistory(exerciseId: number, userId: string): Promise<PerformanceLog[]>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async updateUserRole(id: string, role: string): Promise<User> {
    const [updated] = await db.update(users).set({ role }).where(eq(users.id, id)).returning();
    return updated;
  }

  async getAthletes(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, "ATHLETE"));
  }

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

  // Workout Templates
  async getWorkoutTemplates(): Promise<WorkoutTemplate[]> {
    return await db.select().from(workoutTemplates).orderBy(workoutTemplates.title);
  }

  async getWorkoutTemplate(id: number): Promise<WorkoutTemplateWithBlocks | undefined> {
    const [template] = await db.select().from(workoutTemplates).where(eq(workoutTemplates.id, id));
    if (!template) return undefined;

    const blocks = await db.select().from(templateBlocks)
      .where(eq(templateBlocks.templateId, id))
      .orderBy(templateBlocks.order);

    const blockIds = blocks.map(b => b.id);
    let allExercises: TemplateExercise[] = [];
    if (blockIds.length > 0) {
      allExercises = await db.select().from(templateExercises)
        .where(inArray(templateExercises.blockId, blockIds))
        .orderBy(templateExercises.order);
    }

    const blocksWithExercises: TemplateBlockWithExercises[] = blocks.map(block => ({
      ...block,
      exercises: allExercises.filter(e => e.blockId === block.id),
    }));

    return { ...template, blocks: blocksWithExercises };
  }

  async createWorkoutTemplate(template: InsertWorkoutTemplate): Promise<WorkoutTemplate> {
    const [newTemplate] = await db.insert(workoutTemplates).values(template).returning();
    return newTemplate;
  }

  async createTemplateBlock(block: InsertTemplateBlock): Promise<TemplateBlock> {
    const [newBlock] = await db.insert(templateBlocks).values(block).returning();
    return newBlock;
  }

  async createTemplateExercise(exercise: InsertTemplateExercise): Promise<TemplateExercise> {
    const [newExercise] = await db.insert(templateExercises).values(exercise).returning();
    return newExercise;
  }

  // Custom Workouts
  async getCustomWorkouts(coachId: string): Promise<CustomWorkout[]> {
    return await db.select().from(customWorkouts)
      .where(eq(customWorkouts.coachId, coachId))
      .orderBy(desc(customWorkouts.createdAt));
  }

  async getCustomWorkout(id: number): Promise<CustomWorkoutWithBlocks | undefined> {
    const [workout] = await db.select().from(customWorkouts).where(eq(customWorkouts.id, id));
    if (!workout) return undefined;

    const blocks = await db.select().from(customBlocks)
      .where(eq(customBlocks.customWorkoutId, id))
      .orderBy(customBlocks.order);

    const blockIds = blocks.map(b => b.id);
    let allExercises: CustomExercise[] = [];
    if (blockIds.length > 0) {
      allExercises = await db.select().from(customExercises)
        .where(inArray(customExercises.customBlockId, blockIds))
        .orderBy(customExercises.order);
    }

    const blocksWithExercises: CustomBlockWithExercises[] = blocks.map(block => ({
      ...block,
      exercises: allExercises.filter(e => e.customBlockId === block.id),
    }));

    return { ...workout, blocks: blocksWithExercises };
  }

  async createCustomWorkout(workout: InsertCustomWorkout): Promise<CustomWorkout> {
    const [newWorkout] = await db.insert(customWorkouts).values(workout).returning();
    return newWorkout;
  }

  async updateCustomWorkout(id: number, data: Partial<InsertCustomWorkout>): Promise<CustomWorkout> {
    const [updated] = await db.update(customWorkouts).set(data).where(eq(customWorkouts.id, id)).returning();
    return updated;
  }

  async deleteCustomWorkout(id: number): Promise<void> {
    await this.deleteCustomBlocksByWorkout(id);
    await db.delete(customWorkouts).where(eq(customWorkouts.id, id));
  }

  async createCustomBlock(block: InsertCustomBlock): Promise<CustomBlock> {
    const [newBlock] = await db.insert(customBlocks).values(block).returning();
    return newBlock;
  }

  async deleteCustomBlocksByWorkout(workoutId: number): Promise<void> {
    const blocks = await db.select().from(customBlocks).where(eq(customBlocks.customWorkoutId, workoutId));
    const blockIds = blocks.map(b => b.id);
    if (blockIds.length > 0) {
      await db.delete(customExercises).where(inArray(customExercises.customBlockId, blockIds));
    }
    await db.delete(customBlocks).where(eq(customBlocks.customWorkoutId, workoutId));
  }

  async createCustomExercise(exercise: InsertCustomExercise): Promise<CustomExercise> {
    const [newExercise] = await db.insert(customExercises).values(exercise).returning();
    return newExercise;
  }

  // Clone
  async cloneTemplateToCustomWorkout(templateId: number, coachId: string): Promise<CustomWorkout> {
    const template = await this.getWorkoutTemplate(templateId);
    if (!template) throw new Error("Template not found");

    const newWorkout = await this.createCustomWorkout({
      coachId,
      title: template.title,
      description: template.description,
      tags: template.tags,
      difficulty: template.difficulty,
      equipment: template.equipment,
      estimatedDuration: template.estimatedDuration,
      sourceTemplateId: templateId,
    });

    for (const block of template.blocks) {
      const newBlock = await this.createCustomBlock({
        customWorkoutId: newWorkout.id,
        title: block.title,
        order: block.order,
      });

      for (const ex of block.exercises) {
        await this.createCustomExercise({
          customBlockId: newBlock.id,
          name: ex.name,
          exerciseId: ex.exerciseId,
          order: ex.order,
          prescriptionJson: ex.prescriptionJson,
          notes: ex.notes,
        });
      }
    }

    return newWorkout;
  }

  // Assignments
  async getCoachAssignments(coachId: string): Promise<(WorkoutAssignment & { athleteName: string; workoutTitle: string })[]> {
    const results = await db.select().from(workoutAssignments)
      .where(eq(workoutAssignments.coachId, coachId))
      .orderBy(desc(workoutAssignments.scheduledDate));

    const enriched = [];
    for (const a of results) {
      const [athlete] = await db.select().from(users).where(eq(users.id, a.athleteId)).limit(1);
      let workoutTitle = "Unknown";
      if (a.sourceType === "TEMPLATE") {
        const [t] = await db.select().from(workoutTemplates).where(eq(workoutTemplates.id, a.sourceId)).limit(1);
        if (t) workoutTitle = t.title;
      } else {
        const [c] = await db.select().from(customWorkouts).where(eq(customWorkouts.id, a.sourceId)).limit(1);
        if (c) workoutTitle = c.title;
      }
      enriched.push({
        ...a,
        athleteName: athlete ? `${athlete.firstName || ''} ${athlete.lastName || ''}`.trim() || athlete.email || 'Unknown' : 'Unknown',
        workoutTitle,
      });
    }
    return enriched;
  }

  async getAthleteAssignments(athleteId: string): Promise<(WorkoutAssignment & { workoutTitle: string; coachName: string })[]> {
    const results = await db.select().from(workoutAssignments)
      .where(eq(workoutAssignments.athleteId, athleteId))
      .orderBy(desc(workoutAssignments.scheduledDate));

    const enriched = [];
    for (const a of results) {
      const [coach] = await db.select().from(users).where(eq(users.id, a.coachId)).limit(1);
      let workoutTitle = "Unknown";
      if (a.sourceType === "TEMPLATE") {
        const [t] = await db.select().from(workoutTemplates).where(eq(workoutTemplates.id, a.sourceId)).limit(1);
        if (t) workoutTitle = t.title;
      } else {
        const [c] = await db.select().from(customWorkouts).where(eq(customWorkouts.id, a.sourceId)).limit(1);
        if (c) workoutTitle = c.title;
      }
      enriched.push({
        ...a,
        workoutTitle,
        coachName: coach ? `${coach.firstName || ''} ${coach.lastName || ''}`.trim() || coach.email || 'Unknown' : 'Unknown',
      });
    }
    return enriched;
  }

  async createAssignments(data: { coachId: string; athleteIds: string[]; sourceType: string; sourceId: number; scheduledDate: Date }): Promise<WorkoutAssignment[]> {
    const values = data.athleteIds.map(athleteId => ({
      athleteId,
      coachId: data.coachId,
      sourceType: data.sourceType,
      sourceId: data.sourceId,
      scheduledDate: data.scheduledDate,
      status: "UPCOMING",
    }));
    const result = await db.insert(workoutAssignments).values(values).returning();
    return result;
  }

  async completeAssignment(id: number): Promise<WorkoutAssignment> {
    const [updated] = await db.update(workoutAssignments)
      .set({ status: "COMPLETED" })
      .where(eq(workoutAssignments.id, id))
      .returning();
    return updated;
  }

  // Logging
  async getWorkoutLog(assignmentId: number): Promise<WorkoutLogWithSets | undefined> {
    const [log] = await db.select().from(workoutLogs).where(eq(workoutLogs.assignmentId, assignmentId)).limit(1);
    if (!log) return undefined;

    const sets = await db.select().from(setLogs)
      .where(eq(setLogs.logId, log.id))
      .orderBy(setLogs.exerciseName, setLogs.setNumber);

    return { ...log, sets };
  }

  async upsertWorkoutLog(data: { assignmentId: number; athleteId: string; overallNotes?: string; completedAt?: Date }): Promise<WorkoutLog> {
    const existing = await db.select().from(workoutLogs).where(eq(workoutLogs.assignmentId, data.assignmentId)).limit(1);
    if (existing.length > 0) {
      const [updated] = await db.update(workoutLogs)
        .set({ overallNotes: data.overallNotes, completedAt: data.completedAt })
        .where(eq(workoutLogs.id, existing[0].id))
        .returning();
      return updated;
    }
    const [newLog] = await db.insert(workoutLogs).values(data).returning();
    return newLog;
  }

  async upsertSetLogs(logId: number, sets: InsertSetLog[]): Promise<SetLog[]> {
    await db.delete(setLogs).where(eq(setLogs.logId, logId));
    if (sets.length === 0) return [];
    const result = await db.insert(setLogs).values(sets.map(s => ({ ...s, logId }))).returning();
    return result;
  }

  // === LEGACY METHODS ===

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

  async getAssignments(userId?: string, date?: Date): Promise<(Assignment & { workout: Workout })[]> {
    const conditions = [];
    if (userId) conditions.push(eq(assignments.userId, userId));

    const query = db
      .select({ assignment: assignments, workout: workouts })
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

  async completeOldAssignment(id: number, completed: boolean): Promise<Assignment> {
    const [updated] = await db
      .update(assignments)
      .set({ completed })
      .where(eq(assignments.id, id))
      .returning();
    return updated;
  }

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
