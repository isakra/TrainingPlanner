import { db } from "./db";
import {
  exercises, workouts, workoutExercises, assignments, performanceLogs,
  workoutTemplates, templateBlocks, templateExercises,
  customWorkouts, customBlocks, customExercises,
  workoutAssignments, workoutLogs, setLogs,
  coachAthletes, conversations, conversationParticipants, messages,
  groups, groupMembers,
  users,
  recurringAssignments, personalRecords, workoutComments, wellnessCheckins,
  coachInviteCodes, type CoachInviteCode,
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
  type CoachAthlete, type Conversation, type ConversationParticipant, type Message,
  type Group, type InsertGroup, type GroupMember, type GroupWithMemberCount, type GroupWithMembers,
  type User,
  type RecurringAssignment, type InsertRecurringAssignment,
  type PersonalRecord, type InsertPersonalRecord,
  type WorkoutComment, type InsertWorkoutComment, type WorkoutCommentWithAuthor,
  type WellnessCheckin, type InsertWellnessCheckin,
} from "@shared/schema";
import { eq, and, desc, sql, inArray, asc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUserById(id: string): Promise<User | undefined>;
  updateUserRole(id: string, role: string | null): Promise<User>;
  getAthletes(): Promise<User[]>;

  // Coach Invite Codes
  createInviteCode(code: string, createdBy: string): Promise<CoachInviteCode>;
  getInviteCode(code: string): Promise<CoachInviteCode | undefined>;
  useInviteCode(code: string, usedBy: string): Promise<CoachInviteCode>;
  getInviteCodesByCoach(coachId: string): Promise<CoachInviteCode[]>;
  getUsedInviteCodeByUser(userId: string): Promise<CoachInviteCode | undefined>;

  // Exercises
  getExercises(): Promise<Exercise[]>;
  getExerciseByName(name: string): Promise<Exercise | undefined>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  updateExercise(id: number, data: Partial<InsertExercise>): Promise<Exercise>;

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
  upsertWorkoutLog(data: { assignmentId: number; athleteId: string; overallNotes?: string; completedAt?: Date; avgHeartRate?: number | null; maxHeartRate?: number | null; minHeartRate?: number | null; deviceName?: string | null }): Promise<WorkoutLog>;
  upsertSetLogs(logId: number, sets: InsertSetLog[]): Promise<SetLog[]>;

  // Coach ↔ Athlete Connections
  getCoachAthletesByCoach(coachId: string): Promise<(CoachAthlete & { athlete: User })[]>;
  getCoachAthletesByAthlete(athleteId: string): Promise<(CoachAthlete & { coach: User })[]>;
  isCoachAthletePair(coachId: string, athleteId: string): Promise<boolean>;
  connectCoachAthlete(coachId: string, athleteId: string): Promise<CoachAthlete>;
  disconnectCoachAthlete(coachId: string, athleteId: string): Promise<void>;
  getUserByEmail(email: string): Promise<User | undefined>;

  // Groups
  getCoachGroups(coachId: string): Promise<GroupWithMemberCount[]>;
  getGroup(id: number): Promise<Group | undefined>;
  getGroupWithMembers(id: number): Promise<GroupWithMembers | undefined>;
  createGroup(data: InsertGroup): Promise<Group>;
  updateGroup(id: number, data: { name: string; description?: string | null }): Promise<Group>;
  deleteGroup(id: number): Promise<void>;
  addGroupMember(groupId: number, athleteId: string): Promise<GroupMember>;
  removeGroupMember(groupId: number, athleteId: string): Promise<void>;
  isGroupMember(groupId: number, athleteId: string): Promise<boolean>;
  getGroupMemberAthleteIds(groupId: number): Promise<string[]>;
  getAthleteGroups(athleteId: string): Promise<GroupWithMemberCount[]>;

  // Messaging
  createConversation(creatorId: string, participantIds: string[], isGroup: boolean, title?: string): Promise<Conversation>;
  getConversationsForUser(userId: string): Promise<any[]>;
  getConversationMessages(conversationId: number, limit?: number, offset?: number): Promise<(Message & { sender: { id: string; firstName: string | null; lastName: string | null } })[]>;
  sendMessage(conversationId: number, senderId: string, content: string): Promise<Message>;
  isUserInConversation(userId: string, conversationId: number): Promise<boolean>;
  getConversationParticipants(conversationId: number): Promise<(ConversationParticipant & { user: User })[]>;

  // Recurring Assignments
  getRecurringAssignments(coachId: string): Promise<RecurringAssignment[]>;
  createRecurringAssignment(data: InsertRecurringAssignment): Promise<RecurringAssignment>;
  deactivateRecurringAssignment(id: number): Promise<RecurringAssignment>;
  getRecurringAssignment(id: number): Promise<RecurringAssignment | undefined>;

  // Workout Comments
  getWorkoutComments(assignmentId: number): Promise<WorkoutCommentWithAuthor[]>;
  createWorkoutComment(data: InsertWorkoutComment): Promise<WorkoutComment>;

  // Wellness Check-ins
  createWellnessCheckin(data: InsertWellnessCheckin): Promise<WellnessCheckin>;
  getAthleteWellness(athleteId: string): Promise<WellnessCheckin[]>;
  getLatestWellness(athleteId: string): Promise<WellnessCheckin | undefined>;

  // Personal Records
  getAthletePRs(athleteId: string): Promise<PersonalRecord[]>;
  upsertPersonalRecord(data: InsertPersonalRecord): Promise<PersonalRecord>;

  // Exercise History
  getExerciseHistory(athleteId: string, exerciseName?: string): Promise<SetLog[]>;

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

  async updateUserRole(id: string, role: string | null): Promise<User> {
    const [updated] = await db.update(users).set({ role }).where(eq(users.id, id)).returning();
    return updated;
  }

  async getAthletes(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, "ATHLETE"));
  }

  // Coach Invite Codes
  async createInviteCode(code: string, createdBy: string): Promise<CoachInviteCode> {
    const [invite] = await db.insert(coachInviteCodes).values({ code, createdBy }).returning();
    return invite;
  }

  async getInviteCode(code: string): Promise<CoachInviteCode | undefined> {
    const [invite] = await db.select().from(coachInviteCodes).where(eq(coachInviteCodes.code, code)).limit(1);
    return invite;
  }

  async useInviteCode(code: string, usedBy: string): Promise<CoachInviteCode> {
    const [updated] = await db.update(coachInviteCodes)
      .set({ usedBy, usedAt: new Date() })
      .where(eq(coachInviteCodes.code, code))
      .returning();
    return updated;
  }

  async getInviteCodesByCoach(coachId: string): Promise<CoachInviteCode[]> {
    return await db.select().from(coachInviteCodes)
      .where(eq(coachInviteCodes.createdBy, coachId))
      .orderBy(desc(coachInviteCodes.createdAt));
  }

  async getUsedInviteCodeByUser(userId: string): Promise<CoachInviteCode | undefined> {
    const [invite] = await db.select().from(coachInviteCodes)
      .where(eq(coachInviteCodes.usedBy, userId))
      .limit(1);
    return invite;
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

  async updateExercise(id: number, data: Partial<InsertExercise>): Promise<Exercise> {
    const [updated] = await db.update(exercises).set(data).where(eq(exercises.id, id)).returning();
    return updated;
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

  async upsertWorkoutLog(data: { assignmentId: number; athleteId: string; overallNotes?: string; completedAt?: Date; avgHeartRate?: number | null; maxHeartRate?: number | null; minHeartRate?: number | null; deviceName?: string | null }): Promise<WorkoutLog> {
    const existing = await db.select().from(workoutLogs).where(eq(workoutLogs.assignmentId, data.assignmentId)).limit(1);
    const updateFields: any = {};
    if (data.overallNotes !== undefined) updateFields.overallNotes = data.overallNotes;
    if (data.completedAt !== undefined) updateFields.completedAt = data.completedAt;
    if (data.avgHeartRate !== undefined) updateFields.avgHeartRate = data.avgHeartRate;
    if (data.maxHeartRate !== undefined) updateFields.maxHeartRate = data.maxHeartRate;
    if (data.minHeartRate !== undefined) updateFields.minHeartRate = data.minHeartRate;
    if (data.deviceName !== undefined) updateFields.deviceName = data.deviceName;

    if (existing.length > 0) {
      const [updated] = await db.update(workoutLogs)
        .set(updateFields)
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

  // === COACH ↔ ATHLETE CONNECTIONS ===

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user;
  }

  async getCoachAthletesByCoach(coachId: string): Promise<(CoachAthlete & { athlete: User })[]> {
    const rows = await db.select().from(coachAthletes).where(eq(coachAthletes.coachId, coachId));
    const result = [];
    for (const row of rows) {
      const [athlete] = await db.select().from(users).where(eq(users.id, row.athleteId)).limit(1);
      if (athlete) result.push({ ...row, athlete });
    }
    result.sort((a, b) => {
      const nameA = `${a.athlete.firstName || ''} ${a.athlete.lastName || ''}`.trim().toLowerCase();
      const nameB = `${b.athlete.firstName || ''} ${b.athlete.lastName || ''}`.trim().toLowerCase();
      return nameA.localeCompare(nameB);
    });
    return result;
  }

  async getCoachAthletesByAthlete(athleteId: string): Promise<(CoachAthlete & { coach: User })[]> {
    const rows = await db.select().from(coachAthletes).where(eq(coachAthletes.athleteId, athleteId));
    const result = [];
    for (const row of rows) {
      const [coach] = await db.select().from(users).where(eq(users.id, row.coachId)).limit(1);
      if (coach) result.push({ ...row, coach });
    }
    return result;
  }

  async isCoachAthletePair(coachId: string, athleteId: string): Promise<boolean> {
    const [row] = await db.select().from(coachAthletes)
      .where(and(eq(coachAthletes.coachId, coachId), eq(coachAthletes.athleteId, athleteId)))
      .limit(1);
    return !!row;
  }

  async connectCoachAthlete(coachId: string, athleteId: string): Promise<CoachAthlete> {
    const [row] = await db.insert(coachAthletes).values({ coachId, athleteId }).returning();
    return row;
  }

  async disconnectCoachAthlete(coachId: string, athleteId: string): Promise<void> {
    await db.delete(coachAthletes)
      .where(and(eq(coachAthletes.coachId, coachId), eq(coachAthletes.athleteId, athleteId)));
  }

  // === GROUPS ===

  async getCoachGroups(coachId: string): Promise<GroupWithMemberCount[]> {
    const grps = await db.select().from(groups)
      .where(eq(groups.coachId, coachId))
      .orderBy(groups.name);

    const result: GroupWithMemberCount[] = [];
    for (const g of grps) {
      const members = await db.select().from(groupMembers).where(eq(groupMembers.groupId, g.id));
      result.push({ ...g, memberCount: members.length });
    }
    return result;
  }

  async getGroup(id: number): Promise<Group | undefined> {
    const [g] = await db.select().from(groups).where(eq(groups.id, id)).limit(1);
    return g;
  }

  async getGroupWithMembers(id: number): Promise<GroupWithMembers | undefined> {
    const [g] = await db.select().from(groups).where(eq(groups.id, id)).limit(1);
    if (!g) return undefined;

    const memberRows = await db.select().from(groupMembers).where(eq(groupMembers.groupId, id));
    const membersWithAthletes = [];
    for (const m of memberRows) {
      const [athlete] = await db.select().from(users).where(eq(users.id, m.athleteId)).limit(1);
      if (athlete) membersWithAthletes.push({ ...m, athlete });
    }
    return { ...g, members: membersWithAthletes };
  }

  async createGroup(data: InsertGroup): Promise<Group> {
    const [g] = await db.insert(groups).values(data).returning();
    return g;
  }

  async updateGroup(id: number, data: { name: string; description?: string | null }): Promise<Group> {
    const [g] = await db.update(groups).set(data).where(eq(groups.id, id)).returning();
    return g;
  }

  async deleteGroup(id: number): Promise<void> {
    await db.delete(groupMembers).where(eq(groupMembers.groupId, id));
    await db.delete(groups).where(eq(groups.id, id));
  }

  async addGroupMember(groupId: number, athleteId: string): Promise<GroupMember> {
    const [m] = await db.insert(groupMembers).values({ groupId, athleteId }).returning();
    return m;
  }

  async removeGroupMember(groupId: number, athleteId: string): Promise<void> {
    await db.delete(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.athleteId, athleteId)));
  }

  async isGroupMember(groupId: number, athleteId: string): Promise<boolean> {
    const [row] = await db.select().from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.athleteId, athleteId)))
      .limit(1);
    return !!row;
  }

  async getGroupMemberAthleteIds(groupId: number): Promise<string[]> {
    const members = await db.select().from(groupMembers).where(eq(groupMembers.groupId, groupId));
    return members.map(m => m.athleteId);
  }

  async getAthleteGroups(athleteId: string): Promise<GroupWithMemberCount[]> {
    const memberRows = await db.select().from(groupMembers).where(eq(groupMembers.athleteId, athleteId));
    if (memberRows.length === 0) return [];

    const groupIds = memberRows.map(m => m.groupId);
    const grps = await db.select().from(groups).where(inArray(groups.id, groupIds)).orderBy(groups.name);

    const result: GroupWithMemberCount[] = [];
    for (const g of grps) {
      const allMembers = await db.select().from(groupMembers).where(eq(groupMembers.groupId, g.id));
      result.push({ ...g, memberCount: allMembers.length });
    }
    return result;
  }

  // === MESSAGING ===

  async createConversation(creatorId: string, participantIds: string[], isGroup: boolean, title?: string): Promise<Conversation> {
    const allParticipants = [creatorId, ...participantIds.filter(id => id !== creatorId)];
    const [conv] = await db.insert(conversations).values({
      isGroup,
      title: title || null,
    }).returning();

    for (const userId of allParticipants) {
      await db.insert(conversationParticipants).values({
        conversationId: conv.id,
        userId,
      });
    }

    return conv;
  }

  async getConversationsForUser(userId: string): Promise<any[]> {
    const participantRows = await db.select().from(conversationParticipants)
      .where(eq(conversationParticipants.userId, userId));

    if (participantRows.length === 0) return [];

    const convIds = participantRows.map(p => p.conversationId);
    const convs = await db.select().from(conversations)
      .where(inArray(conversations.id, convIds))
      .orderBy(desc(conversations.lastMessageAt));

    const result = [];
    for (const conv of convs) {
      const participants = await db.select().from(conversationParticipants)
        .where(eq(conversationParticipants.conversationId, conv.id));

      const participantUsers = [];
      for (const p of participants) {
        const [u] = await db.select().from(users).where(eq(users.id, p.userId)).limit(1);
        if (u) participantUsers.push({ id: u.id, firstName: u.firstName, lastName: u.lastName, role: u.role, profileImageUrl: u.profileImageUrl });
      }

      const [lastMessage] = await db.select().from(messages)
        .where(eq(messages.conversationId, conv.id))
        .orderBy(desc(messages.createdAt))
        .limit(1);

      result.push({
        ...conv,
        participants: participantUsers,
        lastMessage: lastMessage || null,
      });
    }

    return result;
  }

  async getConversationMessages(conversationId: number, limit = 100, offset = 0): Promise<(Message & { sender: { id: string; firstName: string | null; lastName: string | null } })[]> {
    const msgs = await db.select().from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    const result = [];
    for (const msg of msgs) {
      const [sender] = await db.select().from(users).where(eq(users.id, msg.senderId)).limit(1);
      result.push({
        ...msg,
        sender: sender
          ? { id: sender.id, firstName: sender.firstName, lastName: sender.lastName }
          : { id: msg.senderId, firstName: null, lastName: null },
      });
    }

    return result;
  }

  async sendMessage(conversationId: number, senderId: string, content: string): Promise<Message> {
    const [msg] = await db.insert(messages).values({
      conversationId,
      senderId,
      content,
    }).returning();

    await db.update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, conversationId));

    return msg;
  }

  async isUserInConversation(userId: string, conversationId: number): Promise<boolean> {
    const [row] = await db.select().from(conversationParticipants)
      .where(and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId),
      ))
      .limit(1);
    return !!row;
  }

  async getConversationParticipants(conversationId: number): Promise<(ConversationParticipant & { user: User })[]> {
    const rows = await db.select().from(conversationParticipants)
      .where(eq(conversationParticipants.conversationId, conversationId));

    const result = [];
    for (const row of rows) {
      const [user] = await db.select().from(users).where(eq(users.id, row.userId)).limit(1);
      if (user) result.push({ ...row, user });
    }
    return result;
  }

  // === RECURRING ASSIGNMENTS ===

  async getRecurringAssignments(coachId: string): Promise<RecurringAssignment[]> {
    return await db.select().from(recurringAssignments)
      .where(and(eq(recurringAssignments.coachId, coachId), eq(recurringAssignments.active, true)))
      .orderBy(desc(recurringAssignments.createdAt));
  }

  async createRecurringAssignment(data: InsertRecurringAssignment): Promise<RecurringAssignment> {
    const [row] = await db.insert(recurringAssignments).values({ ...data, active: true }).returning();
    return row;
  }

  async deactivateRecurringAssignment(id: number): Promise<RecurringAssignment> {
    const [row] = await db.update(recurringAssignments)
      .set({ active: false })
      .where(eq(recurringAssignments.id, id))
      .returning();
    return row;
  }

  async getRecurringAssignment(id: number): Promise<RecurringAssignment | undefined> {
    const [row] = await db.select().from(recurringAssignments).where(eq(recurringAssignments.id, id)).limit(1);
    return row;
  }

  // === WORKOUT COMMENTS ===

  async getWorkoutComments(assignmentId: number): Promise<WorkoutCommentWithAuthor[]> {
    const comments = await db.select().from(workoutComments)
      .where(eq(workoutComments.assignmentId, assignmentId))
      .orderBy(asc(workoutComments.createdAt));

    const result: WorkoutCommentWithAuthor[] = [];
    for (const comment of comments) {
      const [author] = await db.select().from(users).where(eq(users.id, comment.authorId)).limit(1);
      if (author) {
        result.push({ ...comment, author });
      }
    }
    return result;
  }

  async createWorkoutComment(data: InsertWorkoutComment): Promise<WorkoutComment> {
    const [row] = await db.insert(workoutComments).values(data).returning();
    return row;
  }

  // === WELLNESS CHECK-INS ===

  async createWellnessCheckin(data: InsertWellnessCheckin): Promise<WellnessCheckin> {
    const [row] = await db.insert(wellnessCheckins).values(data).returning();
    return row;
  }

  async getAthleteWellness(athleteId: string): Promise<WellnessCheckin[]> {
    return await db.select().from(wellnessCheckins)
      .where(eq(wellnessCheckins.athleteId, athleteId))
      .orderBy(desc(wellnessCheckins.date))
      .limit(90);
  }

  async getLatestWellness(athleteId: string): Promise<WellnessCheckin | undefined> {
    const [row] = await db.select().from(wellnessCheckins)
      .where(eq(wellnessCheckins.athleteId, athleteId))
      .orderBy(desc(wellnessCheckins.date))
      .limit(1);
    return row;
  }

  // === PERSONAL RECORDS ===

  async getAthletePRs(athleteId: string): Promise<PersonalRecord[]> {
    return await db.select().from(personalRecords)
      .where(eq(personalRecords.athleteId, athleteId))
      .orderBy(asc(personalRecords.exerciseName), desc(personalRecords.date));
  }

  async upsertPersonalRecord(data: InsertPersonalRecord): Promise<PersonalRecord> {
    const existing = await db.select().from(personalRecords)
      .where(and(
        eq(personalRecords.athleteId, data.athleteId),
        eq(personalRecords.exerciseName, data.exerciseName),
        eq(personalRecords.type, data.type),
      ))
      .limit(1);

    if (existing.length > 0) {
      const current = existing[0];
      const newVal = parseFloat(data.value);
      const oldVal = parseFloat(current.value);
      if (newVal > oldVal) {
        const [updated] = await db.update(personalRecords)
          .set({ value: data.value, date: data.date, reps: data.reps, assignmentId: data.assignmentId })
          .where(eq(personalRecords.id, current.id))
          .returning();
        return updated;
      }
      return current;
    }

    const [row] = await db.insert(personalRecords).values(data).returning();
    return row;
  }

  // === EXERCISE HISTORY ===

  async getExerciseHistory(athleteId: string, exerciseName?: string): Promise<SetLog[]> {
    const conditions = [eq(workoutLogs.athleteId, athleteId)];

    const baseQuery = db.select({ setLog: setLogs })
      .from(setLogs)
      .innerJoin(workoutLogs, eq(setLogs.logId, workoutLogs.id))
      .where(and(...conditions))
      .orderBy(desc(setLogs.id))
      .limit(500);

    if (exerciseName) {
      const rows = await db.select({ setLog: setLogs })
        .from(setLogs)
        .innerJoin(workoutLogs, eq(setLogs.logId, workoutLogs.id))
        .where(and(eq(workoutLogs.athleteId, athleteId), eq(setLogs.exerciseName, exerciseName)))
        .orderBy(desc(setLogs.id))
        .limit(500);
      return rows.map(r => r.setLog);
    }

    const rows = await baseQuery;
    return rows.map(r => r.setLog);
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
