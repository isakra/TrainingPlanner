import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, uniqueIndex } from "drizzle-orm/pg-core";
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

// === COACH ↔ ATHLETE CONNECTIONS ===

export const coachAthletes = pgTable("coach_athletes", {
  id: serial("id").primaryKey(),
  coachId: text("coach_id").notNull(),
  athleteId: text("athlete_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("coach_athlete_unique").on(table.coachId, table.athleteId),
]);

// === MESSAGING ===

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  isGroup: boolean("is_group").notNull().default(false),
  title: text("title"),
  createdAt: timestamp("created_at").defaultNow(),
  lastMessageAt: timestamp("last_message_at"),
});

export const conversationParticipants = pgTable("conversation_participants", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  userId: text("user_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => [
  uniqueIndex("conversation_participant_unique").on(table.conversationId, table.userId),
]);

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  senderId: text("sender_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === GROUPS (TEAMS/SQUADS) ===

export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  coachId: text("coach_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const groupMembers = pgTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  athleteId: text("athlete_id").notNull(),
  addedAt: timestamp("added_at").defaultNow(),
}, (table) => [
  uniqueIndex("group_member_unique").on(table.groupId, table.athleteId),
]);

// === RECURRING ASSIGNMENTS ===

export const recurringAssignments = pgTable("recurring_assignments", {
  id: serial("id").primaryKey(),
  coachId: text("coach_id").notNull(),
  sourceType: text("source_type").notNull(),
  sourceId: integer("source_id").notNull(),
  athleteIds: text("athlete_ids").array().default([]),
  groupId: integer("group_id"),
  frequency: text("frequency").notNull(),
  daysOfWeek: integer("days_of_week").array().default([]),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// === PERSONAL RECORDS ===

export const personalRecords = pgTable("personal_records", {
  id: serial("id").primaryKey(),
  athleteId: text("athlete_id").notNull(),
  exerciseName: text("exercise_name").notNull(),
  type: text("type").notNull(),
  value: text("value").notNull(),
  reps: integer("reps"),
  date: timestamp("date").notNull(),
  assignmentId: integer("assignment_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === WORKOUT COMMENTS ===

export const workoutComments = pgTable("workout_comments", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").notNull(),
  authorId: text("author_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === WELLNESS CHECK-INS ===

export const wellnessCheckins = pgTable("wellness_checkins", {
  id: serial("id").primaryKey(),
  athleteId: text("athlete_id").notNull(),
  date: timestamp("date").notNull(),
  sleep: integer("sleep").notNull(),
  soreness: integer("soreness").notNull(),
  stress: integer("stress").notNull(),
  mood: integer("mood").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === COACH INVITE CODES ===

export const coachInviteCodes = pgTable("coach_invite_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  createdBy: text("created_by").notNull(),
  usedBy: text("used_by"),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
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

export const insertCoachAthleteSchema = createInsertSchema(coachAthletes).omit({ id: true, createdAt: true });
export const insertConversationSchema = createInsertSchema(conversations).omit({ id: true, createdAt: true, lastMessageAt: true });
export const insertConversationParticipantSchema = createInsertSchema(conversationParticipants).omit({ id: true, joinedAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });

export const insertGroupSchema = createInsertSchema(groups).omit({ id: true, createdAt: true });
export const insertGroupMemberSchema = createInsertSchema(groupMembers).omit({ id: true, addedAt: true });

export const insertRecurringAssignmentSchema = createInsertSchema(recurringAssignments).omit({ id: true, createdAt: true, active: true });
export const insertPersonalRecordSchema = createInsertSchema(personalRecords).omit({ id: true, createdAt: true });
export const insertWorkoutCommentSchema = createInsertSchema(workoutComments).omit({ id: true, createdAt: true });
export const insertWellnessCheckinSchema = createInsertSchema(wellnessCheckins).omit({ id: true, createdAt: true });

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

export type CoachAthlete = typeof coachAthletes.$inferSelect;
export type InsertCoachAthlete = z.infer<typeof insertCoachAthleteSchema>;

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;

export type ConversationParticipant = typeof conversationParticipants.$inferSelect;
export type InsertConversationParticipant = z.infer<typeof insertConversationParticipantSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Group = typeof groups.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;

export type GroupMember = typeof groupMembers.$inferSelect;
export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;

export type GroupWithMemberCount = Group & { memberCount: number };
export type GroupWithMembers = Group & { members: (GroupMember & { athlete: User })[] };

export type RecurringAssignment = typeof recurringAssignments.$inferSelect;
export type InsertRecurringAssignment = z.infer<typeof insertRecurringAssignmentSchema>;

export type PersonalRecord = typeof personalRecords.$inferSelect;
export type InsertPersonalRecord = z.infer<typeof insertPersonalRecordSchema>;

export type WorkoutComment = typeof workoutComments.$inferSelect;
export type InsertWorkoutComment = z.infer<typeof insertWorkoutCommentSchema>;

export type WellnessCheckin = typeof wellnessCheckins.$inferSelect;
export type InsertWellnessCheckin = z.infer<typeof insertWellnessCheckinSchema>;

export type WorkoutCommentWithAuthor = WorkoutComment & { author: User };

export type CoachInviteCode = typeof coachInviteCodes.$inferSelect;

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
