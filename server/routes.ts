import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { exerciseData } from "./exercise-data";
import { premadeWorkouts } from "./premade-workouts";

function getUserId(req: Request): string | null {
  return (req.user as any)?.claims?.sub || null;
}

function requireAuth(req: Request, res: Response): string | null {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return null;
  }
  return userId;
}

async function requireRole(req: Request, res: Response, role: string): Promise<string | null> {
  const userId = requireAuth(req, res);
  if (!userId) return null;
  const user = await storage.getUserById(userId);
  if (!user || user.role !== role) {
    res.status(403).json({ message: `Forbidden: ${role} role required` });
    return null;
  }
  return userId;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  // === USER / ROLE ===

  app.get(api.me.path, async (req, res) => {
    const userId = getUserId(req);
    console.log("[AUTH] /api/auth/user called, userId from session:", userId);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUserById(userId);
    console.log("[AUTH] /api/auth/user user from DB:", user?.id, "role:", user?.role, "email:", user?.email);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  });

  app.post(api.setRole.path, async (req, res) => {
    const userId = requireAuth(req, res);
    if (!userId) return;
    try {
      const { role, inviteCode } = api.setRole.input.parse(req.body);
      console.log("[AUTH] setRole called, userId:", userId, "role:", role, "inviteCode:", inviteCode);

      if (role === "COACH") {
        const user = await storage.getUserById(userId);
        console.log("[AUTH] setRole user from DB:", user?.id, "role:", user?.role, "email:", user?.email);
        if (user?.role === "COACH") {
          console.log("[AUTH] user already COACH, returning");
          return res.json(user);
        }

        const FOUNDER_EMAILS = ["isakrafnsson@gmail.com"];
        if (user && FOUNDER_EMAILS.includes(user.email || "")) {
          console.log("[AUTH] Founder email recognized, granting COACH");
          const updated = await storage.updateUserRole(userId, role);
          return res.json(updated);
        }

        const existingUsed = await storage.getUsedInviteCodeByUser(userId);
        const createdCodes = await storage.getInviteCodesByCoach(userId);
        console.log("[AUTH] existingUsed:", !!existingUsed, "createdCodes:", createdCodes.length);
        if (existingUsed || createdCodes.length > 0) {
          const updated = await storage.updateUserRole(userId, role);
          return res.json(updated);
        }

        if (!inviteCode) {
          console.log("[AUTH] No invite code provided, rejecting");
          return res.status(403).json({ message: "An invite code is required to become a coach." });
        }
        const invite = await storage.getInviteCode(inviteCode);
        if (!invite) {
          return res.status(403).json({ message: "Invalid invite code." });
        }
        if (invite.usedBy) {
          return res.status(403).json({ message: "This invite code has already been used." });
        }
        await storage.useInviteCode(inviteCode, userId);
      }

      const updated = await storage.updateUserRole(userId, role);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.clearRole.path, async (req, res) => {
    const userId = requireAuth(req, res);
    if (!userId) return;
    try {
      const updated = await storage.updateUserRole(userId, null);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === COACH INVITE CODES ===

  app.post(api.inviteCodes.create.path, async (req, res) => {
    const userId = await requireRole(req, res, "COACH");
    if (!userId) return;
    try {
      const { randomBytes } = await import("crypto");
      const code = randomBytes(8).toString("hex").toUpperCase();
      const invite = await storage.createInviteCode(code, userId);
      res.json(invite);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.inviteCodes.list.path, async (req, res) => {
    const userId = await requireRole(req, res, "COACH");
    if (!userId) return;
    try {
      const codes = await storage.getInviteCodesByCoach(userId);
      res.json(codes);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.athletes.list.path, async (req, res) => {
    const userId = await requireRole(req, res, "COACH");
    if (!userId) return;
    const connections = await storage.getCoachAthletesByCoach(userId);
    const athletes = connections.map(c => c.athlete);
    res.json(athletes);
  });

  // === EXERCISES ===

  app.get(api.exercises.list.path, async (req, res) => {
    const ex = await storage.getExercises();
    res.json(ex);
  });

  app.get("/api/exercises/:id", async (req, res) => {
    const exercise = await storage.getExerciseById(Number(req.params.id));
    if (!exercise) return res.status(404).json({ message: "Exercise not found" });
    res.json(exercise);
  });

  app.post(api.exercises.create.path, async (req, res) => {
    try {
      const input = api.exercises.create.input.parse(req.body);
      const exercise = await storage.createExercise(input);
      res.status(201).json(exercise);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === WORKOUT TEMPLATES ===

  app.get(api.templates.list.path, async (req, res) => {
    const templates = await storage.getWorkoutTemplates();
    res.json(templates);
  });

  app.get(api.templates.get.path, async (req, res) => {
    const template = await storage.getWorkoutTemplate(Number(req.params.id));
    if (!template) return res.status(404).json({ message: "Template not found" });
    res.json(template);
  });

  app.post(api.templates.clone.path, async (req, res) => {
    const userId = await requireRole(req, res, "COACH");
    if (!userId) return;
    try {
      const cloned = await storage.cloneTemplateToCustomWorkout(Number(req.params.id), userId);
      res.status(201).json(cloned);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Clone failed" });
    }
  });

  // === CUSTOM WORKOUTS ===

  app.get(api.customWorkouts.list.path, async (req, res) => {
    const userId = await requireRole(req, res, "COACH");
    if (!userId) return;
    const workoutsList = await storage.getCustomWorkouts(userId);
    res.json(workoutsList);
  });

  app.post(api.customWorkouts.create.path, async (req, res) => {
    const userId = await requireRole(req, res, "COACH");
    if (!userId) return;
    try {
      const input = api.customWorkouts.create.input.parse(req.body);
      const workout = await storage.createCustomWorkout({
        coachId: userId,
        title: input.title,
        description: input.description || null,
        tags: input.tags || [],
        difficulty: input.difficulty || null,
        equipment: input.equipment || [],
        estimatedDuration: input.estimatedDuration || null,
        sourceTemplateId: null,
      });

      for (const block of input.blocks) {
        const newBlock = await storage.createCustomBlock({
          customWorkoutId: workout.id,
          title: block.title,
          order: block.order,
        });
        for (const ex of block.exercises) {
          await storage.createCustomExercise({
            customBlockId: newBlock.id,
            name: ex.name,
            exerciseId: ex.exerciseId || null,
            order: ex.order,
            prescriptionJson: ex.prescriptionJson || null,
            notes: ex.notes || null,
          });
        }
      }

      const full = await storage.getCustomWorkout(workout.id);
      res.status(201).json(full);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.customWorkouts.get.path, async (req, res) => {
    const userId = await requireRole(req, res, "COACH");
    if (!userId) return;
    const workout = await storage.getCustomWorkout(Number(req.params.id));
    if (!workout) return res.status(404).json({ message: "Workout not found" });
    if (workout.coachId !== userId) return res.status(403).json({ message: "Forbidden" });
    res.json(workout);
  });

  app.put(api.customWorkouts.update.path, async (req, res) => {
    const userId = await requireRole(req, res, "COACH");
    if (!userId) return;
    try {
      const input = api.customWorkouts.update.input.parse(req.body);
      const existing = await storage.getCustomWorkout(Number(req.params.id));
      if (!existing) return res.status(404).json({ message: "Workout not found" });
      if (existing.coachId !== userId) return res.status(403).json({ message: "Forbidden" });

      await storage.updateCustomWorkout(existing.id, {
        title: input.title,
        description: input.description || null,
        tags: input.tags || [],
        difficulty: input.difficulty || null,
        equipment: input.equipment || [],
        estimatedDuration: input.estimatedDuration || null,
      });

      await storage.deleteCustomBlocksByWorkout(existing.id);
      for (const block of input.blocks) {
        const newBlock = await storage.createCustomBlock({
          customWorkoutId: existing.id,
          title: block.title,
          order: block.order,
        });
        for (const ex of block.exercises) {
          await storage.createCustomExercise({
            customBlockId: newBlock.id,
            name: ex.name,
            exerciseId: ex.exerciseId || null,
            order: ex.order,
            prescriptionJson: ex.prescriptionJson || null,
            notes: ex.notes || null,
          });
        }
      }

      const full = await storage.getCustomWorkout(existing.id);
      res.json(full);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.customWorkouts.delete.path, async (req, res) => {
    const userId = await requireRole(req, res, "COACH");
    if (!userId) return;
    const existing = await storage.getCustomWorkout(Number(req.params.id));
    if (!existing) return res.status(404).json({ message: "Workout not found" });
    if (existing.coachId !== userId) return res.status(403).json({ message: "Forbidden" });
    await storage.deleteCustomWorkout(existing.id);
    res.json({ message: "Deleted" });
  });

  // === COACH GROUPS ===

  app.get(api.coachGroups.list.path, async (req, res) => {
    const userId = await requireRole(req, res, "COACH");
    if (!userId) return;
    const grps = await storage.getCoachGroups(userId);
    res.json(grps);
  });

  app.post(api.coachGroups.create.path, async (req, res) => {
    const userId = await requireRole(req, res, "COACH");
    if (!userId) return;
    try {
      const input = api.coachGroups.create.input.parse(req.body);
      const group = await storage.createGroup({
        coachId: userId,
        name: input.name,
        description: input.description || null,
      });
      res.status(201).json(group);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.coachGroups.get.path, async (req, res) => {
    const userId = await requireRole(req, res, "COACH");
    if (!userId) return;
    const group = await storage.getGroupWithMembers(Number(req.params.id));
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (group.coachId !== userId) return res.status(403).json({ message: "Forbidden" });
    res.json(group);
  });

  app.put(api.coachGroups.update.path, async (req, res) => {
    const userId = await requireRole(req, res, "COACH");
    if (!userId) return;
    try {
      const input = api.coachGroups.update.input.parse(req.body);
      const group = await storage.getGroup(Number(req.params.id));
      if (!group) return res.status(404).json({ message: "Group not found" });
      if (group.coachId !== userId) return res.status(403).json({ message: "Forbidden" });
      const updated = await storage.updateGroup(group.id, {
        name: input.name,
        description: input.description || null,
      });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.coachGroups.delete.path, async (req, res) => {
    const userId = await requireRole(req, res, "COACH");
    if (!userId) return;
    const group = await storage.getGroup(Number(req.params.id));
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (group.coachId !== userId) return res.status(403).json({ message: "Forbidden" });
    await storage.deleteGroup(group.id);
    res.json({ message: "Deleted" });
  });

  app.post(api.coachGroups.addMember.path, async (req, res) => {
    const userId = await requireRole(req, res, "COACH");
    if (!userId) return;
    try {
      const input = api.coachGroups.addMember.input.parse(req.body);
      const group = await storage.getGroup(Number(req.params.id));
      if (!group) return res.status(404).json({ message: "Group not found" });
      if (group.coachId !== userId) return res.status(403).json({ message: "Forbidden" });

      const isConnected = await storage.isCoachAthletePair(userId, input.athleteId);
      if (!isConnected) return res.status(403).json({ message: "Athlete is not connected to you" });

      const isMember = await storage.isGroupMember(group.id, input.athleteId);
      if (isMember) return res.status(409).json({ message: "Athlete is already in this group" });

      const member = await storage.addGroupMember(group.id, input.athleteId);
      res.status(201).json(member);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.coachGroups.removeMember.path, async (req, res) => {
    const userId = await requireRole(req, res, "COACH");
    if (!userId) return;
    const group = await storage.getGroup(Number(req.params.id));
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (group.coachId !== userId) return res.status(403).json({ message: "Forbidden" });

    const isMember = await storage.isGroupMember(group.id, req.params.athleteId);
    if (!isMember) return res.status(404).json({ message: "Athlete not in this group" });

    await storage.removeGroupMember(group.id, req.params.athleteId);
    res.json({ message: "Removed" });
  });

  // === ATHLETE GROUPS ===

  app.get(api.athleteGroups.list.path, async (req, res) => {
    const userId = await requireRole(req, res, "ATHLETE");
    if (!userId) return;
    const grps = await storage.getAthleteGroups(userId);
    res.json(grps);
  });

  // === COACH ASSIGNMENTS ===

  app.get(api.coachAssignments.list.path, async (req, res) => {
    const userId = await requireRole(req, res, "COACH");
    if (!userId) return;
    const assignmentsList = await storage.getCoachAssignments(userId);
    res.json(assignmentsList);
  });

  app.post(api.coachAssignments.create.path, async (req, res) => {
    const userId = await requireRole(req, res, "COACH");
    if (!userId) return;
    try {
      const input = api.coachAssignments.create.input.parse(req.body);

      let athleteIds: string[] = [];

      if (input.groupId) {
        const group = await storage.getGroup(input.groupId);
        if (!group) return res.status(404).json({ message: "Group not found" });
        if (group.coachId !== userId) return res.status(403).json({ message: "You can only assign to your own groups" });
        athleteIds = await storage.getGroupMemberAthleteIds(input.groupId);
        if (athleteIds.length === 0) return res.status(400).json({ message: "Group has no members" });
      } else if (input.athleteIds && input.athleteIds.length > 0) {
        athleteIds = input.athleteIds;
      } else {
        return res.status(400).json({ message: "Either athleteIds or groupId must be provided" });
      }

      for (const athleteId of athleteIds) {
        const isPair = await storage.isCoachAthletePair(userId, athleteId);
        if (!isPair) return res.status(403).json({ message: "You can only assign workouts to connected athletes" });
      }

      const result = await storage.createAssignments({
        coachId: userId,
        athleteIds,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        scheduledDate: new Date(input.scheduledDate),
      });
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.coachAssignments.update.path, async (req, res) => {
    const userId = await requireRole(req, res, "COACH");
    if (!userId) return;
    try {
      const assignmentId = Number(req.params.id);
      const existing = await storage.getAssignmentById(assignmentId);
      if (!existing) return res.status(404).json({ message: "Assignment not found" });
      if (existing.coachId !== userId) return res.status(403).json({ message: "Forbidden" });
      if (existing.status === "COMPLETED") return res.status(400).json({ message: "Cannot edit a completed assignment" });

      const input = api.coachAssignments.update.input.parse(req.body);

      if ((input.sourceType !== undefined) !== (input.sourceId !== undefined)) {
        return res.status(400).json({ message: "sourceType and sourceId must be provided together" });
      }

      const updateData: any = {};
      if (input.sourceType !== undefined && input.sourceId !== undefined) {
        updateData.sourceType = input.sourceType;
        updateData.sourceId = input.sourceId;
      }
      if (input.scheduledDate !== undefined) updateData.scheduledDate = new Date(input.scheduledDate);

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "No fields to update" });
      }

      const updated = await storage.updateAssignment(assignmentId, updateData);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.coachAssignments.delete.path, async (req, res) => {
    const userId = await requireRole(req, res, "COACH");
    if (!userId) return;
    const assignmentId = Number(req.params.id);
    const existing = await storage.getAssignmentById(assignmentId);
    if (!existing) return res.status(404).json({ message: "Assignment not found" });
    if (existing.coachId !== userId) return res.status(403).json({ message: "Forbidden" });
    await storage.deleteAssignment(assignmentId);
    res.json({ success: true });
  });

  app.get(api.coachAthleteLog.path, async (req, res) => {
    const userId = await requireRole(req, res, "COACH");
    if (!userId) return;
    const log = await storage.getWorkoutLog(Number(req.params.assignmentId));
    if (!log) return res.json(null);
    res.json(log);
  });

  // === COACH ↔ ATHLETE CONNECTIONS ===

  app.get(api.coachAthleteConnections.list.path, async (req, res) => {
    const userId = await requireRole(req, res, "COACH");
    if (!userId) return;
    const connections = await storage.getCoachAthletesByCoach(userId);
    res.json(connections);
  });

  app.post(api.coachAthleteConnections.connect.path, async (req, res) => {
    const userId = await requireRole(req, res, "COACH");
    if (!userId) return;
    try {
      const { athleteEmail } = api.coachAthleteConnections.connect.input.parse(req.body);
      const athlete = await storage.getUserByEmail(athleteEmail);
      if (!athlete) return res.status(404).json({ message: "No user found with that email" });
      if (athlete.role !== "ATHLETE") return res.status(400).json({ message: "That user is not an athlete" });
      const existing = await storage.isCoachAthletePair(userId, athlete.id);
      if (existing) return res.status(409).json({ message: "Already connected to this athlete" });
      const connection = await storage.connectCoachAthlete(userId, athlete.id);
      res.status(201).json(connection);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.coachAthleteConnections.disconnect.path, async (req, res) => {
    const userId = await requireRole(req, res, "COACH");
    if (!userId) return;
    const athleteId = req.params.athleteId;
    const isPair = await storage.isCoachAthletePair(userId, athleteId);
    if (!isPair) return res.status(404).json({ message: "Connection not found" });
    await storage.disconnectCoachAthlete(userId, athleteId);
    res.json({ message: "Disconnected" });
  });

  // === MESSAGING ===

  app.get(api.messaging.conversations.list.path, async (req, res) => {
    const userId = requireAuth(req, res);
    if (!userId) return;
    const convs = await storage.getConversationsForUser(userId);
    res.json(convs);
  });

  app.post(api.messaging.conversations.create.path, async (req, res) => {
    const userId = requireAuth(req, res);
    if (!userId) return;
    try {
      const input = api.messaging.conversations.create.input.parse(req.body);
      const user = await storage.getUserById(userId);
      if (!user) return res.status(401).json({ message: "User not found" });
      if (!user.role || (user.role !== "COACH" && user.role !== "ATHLETE")) {
        return res.status(403).json({ message: "You must select a role before messaging" });
      }

      let participantIds: string[] = input.participantIds || [];
      let isGroup = input.isGroup || false;
      let title = input.title;

      if (input.groupId) {
        const group = await storage.getGroupWithMembers(input.groupId);
        if (!group) return res.status(404).json({ message: "Group not found" });

        if (user.role === "COACH") {
          if (group.coachId !== userId) return res.status(403).json({ message: "You can only create group chats for your own groups" });
          participantIds = group.members.map(m => m.athleteId);
        } else {
          const isMember = await storage.isGroupMember(input.groupId, userId);
          if (!isMember) return res.status(403).json({ message: "You are not a member of this group" });
          participantIds = [group.coachId, ...group.members.map(m => m.athleteId).filter(id => id !== userId)];
        }
        isGroup = true;
        title = title || group.name;
      }

      if (participantIds.length === 0) {
        return res.status(400).json({ message: "No participants specified" });
      }

      for (const pId of participantIds) {
        if (pId === userId) continue;
        if (user.role === "COACH") {
          const isPair = await storage.isCoachAthletePair(userId, pId);
          if (!isPair) return res.status(403).json({ message: "You can only message connected athletes" });
        } else {
          const isPair = await storage.isCoachAthletePair(pId, userId);
          if (!isPair) return res.status(403).json({ message: "You can only message connected coaches" });
        }
      }

      if (!isGroup) isGroup = participantIds.length > 1;
      const conv = await storage.createConversation(userId, participantIds, isGroup, title);
      res.status(201).json(conv);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.messaging.conversations.messages.path, async (req, res) => {
    const userId = requireAuth(req, res);
    if (!userId) return;
    const conversationId = Number(req.params.id);
    const isMember = await storage.isUserInConversation(userId, conversationId);
    if (!isMember) return res.status(403).json({ message: "Not a member of this conversation" });
    const msgs = await storage.getConversationMessages(conversationId);
    res.json(msgs);
  });

  app.post(api.messaging.conversations.send.path, async (req, res) => {
    const userId = requireAuth(req, res);
    if (!userId) return;
    try {
      const conversationId = Number(req.params.id);
      const isMember = await storage.isUserInConversation(userId, conversationId);
      if (!isMember) return res.status(403).json({ message: "Not a member of this conversation" });
      const { content } = api.messaging.conversations.send.input.parse(req.body);
      const msg = await storage.sendMessage(conversationId, userId, content);
      res.status(201).json(msg);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === ATHLETE COACHES ===

  app.get(api.athleteCoaches.list.path, async (req, res) => {
    const userId = await requireRole(req, res, "ATHLETE");
    if (!userId) return;
    const connections = await storage.getCoachAthletesByAthlete(userId);
    res.json(connections.map(c => c.coach));
  });

  // === ATHLETE WORKOUTS ===

  app.get(api.athleteAssignments.list.path, async (req, res) => {
    const userId = await requireRole(req, res, "ATHLETE");
    if (!userId) return;
    const assignmentsList = await storage.getAthleteAssignments(userId);
    res.json(assignmentsList);
  });

  app.get(api.athleteAssignments.get.path, async (req, res) => {
    const userId = await requireRole(req, res, "ATHLETE");
    if (!userId) return;
    const assignmentId = Number(req.params.assignmentId);

    const allAssignments = await storage.getAthleteAssignments(userId);
    const assignment = allAssignments.find(a => a.id === assignmentId);
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });

    let workoutDetail: any = null;
    if (assignment.sourceType === "TEMPLATE") {
      workoutDetail = await storage.getWorkoutTemplate(assignment.sourceId);
    } else {
      workoutDetail = await storage.getCustomWorkout(assignment.sourceId);
    }

    const log = await storage.getWorkoutLog(assignmentId);

    res.json({ assignment, workout: workoutDetail, log });
  });

  app.post(api.athleteAssignments.log.path, async (req, res) => {
    const userId = await requireRole(req, res, "ATHLETE");
    if (!userId) return;
    try {
      const input = api.athleteAssignments.log.input.parse(req.body);
      const log = await storage.upsertWorkoutLog({
        assignmentId: Number(req.params.assignmentId),
        athleteId: userId,
        overallNotes: input.overallNotes,
        avgHeartRate: input.heartRate?.avgHeartRate ?? undefined,
        maxHeartRate: input.heartRate?.maxHeartRate ?? undefined,
        minHeartRate: input.heartRate?.minHeartRate ?? undefined,
        deviceName: input.heartRate?.deviceName ?? undefined,
      });
      await storage.upsertSetLogs(log.id, input.sets.map(s => ({
        logId: log.id,
        exerciseName: s.exerciseName,
        setNumber: s.setNumber,
        reps: s.reps ?? null,
        weight: s.weight ?? null,
        timeSeconds: s.timeSeconds ?? null,
        distanceMeters: s.distanceMeters ?? null,
        rpe: s.rpe ?? null,
        notes: s.notes ?? null,
      })));
      const fullLog = await storage.getWorkoutLog(Number(req.params.assignmentId));

      for (const s of input.sets) {
        if (s.weight && s.reps && parseFloat(s.weight) > 0 && s.reps > 0) {
          await storage.upsertPersonalRecord({
            athleteId: userId,
            exerciseName: s.exerciseName,
            type: "weight",
            value: s.weight,
            reps: s.reps,
            date: new Date(),
            assignmentId: Number(req.params.assignmentId),
          });
          const estimated1RM = parseFloat(s.weight) * (1 + s.reps / 30);
          await storage.upsertPersonalRecord({
            athleteId: userId,
            exerciseName: s.exerciseName,
            type: "estimated_1rm",
            value: estimated1RM.toFixed(1),
            reps: 1,
            date: new Date(),
            assignmentId: Number(req.params.assignmentId),
          });
        }
        if (s.timeSeconds && s.distanceMeters && s.distanceMeters > 0) {
          await storage.upsertPersonalRecord({
            athleteId: userId,
            exerciseName: s.exerciseName,
            type: "fastest_time",
            value: String(s.timeSeconds),
            reps: null,
            date: new Date(),
            assignmentId: Number(req.params.assignmentId),
          });
        }
      }

      res.json(fullLog);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.athleteAssignments.complete.path, async (req, res) => {
    const userId = await requireRole(req, res, "ATHLETE");
    if (!userId) return;
    try {
      const assignmentId = Number(req.params.assignmentId);
      await storage.upsertWorkoutLog({
        assignmentId,
        athleteId: userId,
        completedAt: new Date(),
      });
      const updated = await storage.completeAssignment(assignmentId);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === RECURRING ASSIGNMENTS ===

  app.get(api.recurringAssignments.list.path, async (req, res) => {
    const userId = await requireRole(req, res, "COACH");
    if (!userId) return;
    const list = await storage.getRecurringAssignments(userId);
    res.json(list);
  });

  app.post(api.recurringAssignments.create.path, async (req, res) => {
    const userId = await requireRole(req, res, "COACH");
    if (!userId) return;
    try {
      const input = api.recurringAssignments.create.input.parse(req.body);

      let athleteIds: string[] = [];
      if (input.groupId) {
        const group = await storage.getGroup(input.groupId);
        if (!group) return res.status(404).json({ message: "Group not found" });
        if (group.coachId !== userId) return res.status(403).json({ message: "Forbidden" });
        athleteIds = await storage.getGroupMemberAthleteIds(input.groupId);
        if (athleteIds.length === 0) return res.status(400).json({ message: "Group has no members" });
      } else if (input.athleteIds && input.athleteIds.length > 0) {
        athleteIds = input.athleteIds;
      } else {
        return res.status(400).json({ message: "Either athleteIds or groupId must be provided" });
      }

      for (const aid of athleteIds) {
        const isPair = await storage.isCoachAthletePair(userId, aid);
        if (!isPair) return res.status(403).json({ message: "Not connected to all athletes" });
      }

      const recurring = await storage.createRecurringAssignment({
        coachId: userId,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        athleteIds: input.groupId ? [] : athleteIds,
        groupId: input.groupId || null,
        frequency: input.frequency,
        daysOfWeek: input.daysOfWeek,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
      });

      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);
      let current = new Date(startDate);
      const generatedAssignments = [];

      while (current <= endDate) {
        const dayOfWeek = current.getDay();
        if (input.daysOfWeek.includes(dayOfWeek)) {
          const result = await storage.createAssignments({
            coachId: userId,
            athleteIds,
            sourceType: input.sourceType,
            sourceId: input.sourceId,
            scheduledDate: new Date(current),
          });
          generatedAssignments.push(...result);
        }
        current.setDate(current.getDate() + 1);
      }

      res.status(201).json({ recurring, generatedCount: generatedAssignments.length });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.recurringAssignments.delete.path, async (req, res) => {
    const userId = await requireRole(req, res, "COACH");
    if (!userId) return;
    const recurring = await storage.getRecurringAssignment(Number(req.params.id));
    if (!recurring) return res.status(404).json({ message: "Not found" });
    if (recurring.coachId !== userId) return res.status(403).json({ message: "Forbidden" });
    const updated = await storage.deactivateRecurringAssignment(recurring.id);
    res.json(updated);
  });

  // === WORKOUT COMMENTS ===

  app.get(api.workoutComments.list.path, async (req, res) => {
    const userId = requireAuth(req, res);
    if (!userId) return;
    const assignmentId = Number(req.params.assignmentId);
    const comments = await storage.getWorkoutComments(assignmentId);
    res.json(comments);
  });

  app.post(api.workoutComments.create.path, async (req, res) => {
    const userId = requireAuth(req, res);
    if (!userId) return;
    try {
      const input = api.workoutComments.create.input.parse(req.body);
      const assignmentId = Number(req.params.assignmentId);
      const comment = await storage.createWorkoutComment({
        assignmentId,
        authorId: userId,
        content: input.content,
      });
      res.status(201).json(comment);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === WELLNESS CHECK-INS ===

  app.post(api.wellness.submit.path, async (req, res) => {
    const userId = await requireRole(req, res, "ATHLETE");
    if (!userId) return;
    try {
      const input = api.wellness.submit.input.parse(req.body);
      const checkin = await storage.createWellnessCheckin({
        athleteId: userId,
        date: new Date(),
        sleep: input.sleep,
        soreness: input.soreness,
        stress: input.stress,
        mood: input.mood,
        note: input.note || null,
      });
      res.status(201).json(checkin);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.wellness.history.path, async (req, res) => {
    const userId = await requireRole(req, res, "ATHLETE");
    if (!userId) return;
    const history = await storage.getAthleteWellness(userId);
    res.json(history);
  });

  app.get(api.wellness.coachView.path, async (req, res) => {
    const userId = await requireRole(req, res, "COACH");
    if (!userId) return;
    const athleteId = req.params.id;
    const isPair = await storage.isCoachAthletePair(userId, athleteId);
    if (!isPair) return res.status(403).json({ message: "Not connected to this athlete" });
    const history = await storage.getAthleteWellness(athleteId);
    res.json(history);
  });

  // === PERSONAL RECORDS ===

  app.get(api.personalRecords.athlete.path, async (req, res) => {
    const userId = await requireRole(req, res, "ATHLETE");
    if (!userId) return;
    const prs = await storage.getAthletePRs(userId);
    res.json(prs);
  });

  app.get(api.personalRecords.coachView.path, async (req, res) => {
    const userId = await requireRole(req, res, "COACH");
    if (!userId) return;
    const athleteId = req.params.id;
    const isPair = await storage.isCoachAthletePair(userId, athleteId);
    if (!isPair) return res.status(403).json({ message: "Not connected to this athlete" });
    const prs = await storage.getAthletePRs(athleteId);
    res.json(prs);
  });

  // === EXERCISE HISTORY ===

  app.get(api.exerciseHistory.athlete.path, async (req, res) => {
    const userId = await requireRole(req, res, "ATHLETE");
    if (!userId) return;
    const exerciseName = (req.query.name as string) || undefined;
    const history = await storage.getExerciseHistory(userId, exerciseName);
    res.json(history);
  });

  app.get(api.exerciseHistory.coachView.path, async (req, res) => {
    const userId = await requireRole(req, res, "COACH");
    if (!userId) return;
    const athleteId = req.params.id;
    const isPair = await storage.isCoachAthletePair(userId, athleteId);
    if (!isPair) return res.status(403).json({ message: "Not connected to this athlete" });
    const exerciseName = (req.query.name as string) || undefined;
    const history = await storage.getExerciseHistory(athleteId, exerciseName);
    res.json(history);
  });

  // === COACH ATHLETE DETAIL ===

  app.get(api.coachAthleteDetail.path, async (req, res) => {
    const userId = await requireRole(req, res, "COACH");
    if (!userId) return;
    const athleteId = req.params.id;
    const isPair = await storage.isCoachAthletePair(userId, athleteId);
    if (!isPair) return res.status(403).json({ message: "Not connected to this athlete" });
    const athlete = await storage.getUserById(athleteId);
    if (!athlete) return res.status(404).json({ message: "Athlete not found" });

    const assignmentsList = await storage.getCoachAssignments(userId);
    const athleteAssignments = assignmentsList.filter(a => a.athleteId === athleteId);
    const recentAssignments = athleteAssignments.slice(0, 10);

    const latestWellness = await storage.getLatestWellness(athleteId);
    const prs = await storage.getAthletePRs(athleteId);

    res.json({
      athlete,
      recentAssignments,
      latestWellness,
      prs: prs.slice(0, 20),
    });
  });

  // === PR AUTO-DETECTION IN LOG ROUTE ===
  // Enhance the existing log route to detect PRs after logging

  // === LEGACY ROUTES (keep for backward compat) ===

  app.get(api.workouts.list.path, async (req, res) => {
    const w = await storage.getWorkouts();
    res.json(w);
  });

  app.post(api.workouts.create.path, async (req, res) => {
    try {
      const input = api.workouts.create.input.parse(req.body);
      const coachId = getUserId(req) || "mock-coach-id";
      const workout = await storage.createWorkout({ ...input, coachId });
      res.status(201).json(workout);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.workouts.get.path, async (req, res) => {
    const workout = await storage.getWorkout(Number(req.params.id));
    if (!workout) return res.status(404).json({ message: "Workout not found" });
    res.json(workout);
  });

  app.post(api.workouts.addExercise.path, async (req, res) => {
    try {
      const input = api.workouts.addExercise.input.parse(req.body);
      const result = await storage.addExerciseToWorkout({
        ...input, workoutId: Number(req.params.id)
      });
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.performance.history.path, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const history = await storage.getPerformanceHistory(Number(req.params.exerciseId), userId);
    res.json(history);
  });

  // === SEED ===
  app.post("/api/seed", async (req, res) => {
    await seedDatabase();
    res.json({ message: "Database seeded" });
  });

  seedDatabase().catch(err => console.error("Error seeding database:", err));

  return httpServer;
}

async function seedDatabase() {
  const existing = await storage.getExercises();
  if (existing.length < 100) {
    console.log(`Seeding database with ${exerciseData.length} exercises...`);
    const BATCH_SIZE = 50;
    let count = 0;
    for (let i = 0; i < exerciseData.length; i += BATCH_SIZE) {
      const batch = exerciseData.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(ex => storage.createExercise(ex)));
      count += batch.length;
      if (count % 200 === 0) {
        console.log(`  Seeded ${count}/${exerciseData.length} exercises...`);
      }
    }
    console.log(`Database seeded with ${exerciseData.length} exercises!`);
  } else {
    const needsVideoUpdate = existing.filter(e => !e.videoUrl);
    if (needsVideoUpdate.length > 0) {
      console.log(`Backfilling videoUrl for ${needsVideoUpdate.length} exercises...`);
      const exerciseDataMap = new Map(exerciseData.map(e => [e.name.toLowerCase(), e]));
      let updated = 0;
      for (const ex of needsVideoUpdate) {
        const data = exerciseDataMap.get(ex.name.toLowerCase());
        if (data?.videoUrl) {
          await storage.updateExercise(ex.id, {
            videoUrl: data.videoUrl,
            instructions: data.instructions || ex.instructions,
          });
          updated++;
        }
      }
      console.log(`Updated ${updated} exercises with videoUrl!`);
    }
  }

  // Seed workout templates from premade data
  const existingTemplates = await storage.getWorkoutTemplates();
  if (existingTemplates.length < premadeWorkouts.length) {
    console.log(`Seeding ${premadeWorkouts.length} workout templates...`);
    const allExercises = await storage.getExercises();
    const exerciseMap = new Map(allExercises.map(e => [e.name.toLowerCase(), e]));

    for (const pw of premadeWorkouts) {
      const existingByTitle = existingTemplates.find(t => t.title === pw.name);
      if (existingByTitle) continue;

      const template = await storage.createWorkoutTemplate({
        title: pw.name,
        description: pw.description,
        tags: [pw.sport, pw.level],
        difficulty: pw.level,
        equipment: [],
        estimatedDuration: null,
      });

      const block = await storage.createTemplateBlock({
        templateId: template.id,
        title: "Main",
        order: 1,
      });

      for (const ex of pw.exercises) {
        const matchedExercise = exerciseMap.get(ex.exerciseName.toLowerCase());
        await storage.createTemplateExercise({
          blockId: block.id,
          name: ex.exerciseName,
          exerciseId: matchedExercise?.id || null,
          order: ex.order,
          prescriptionJson: {
            sets: ex.sets,
            reps: ex.reps,
            weight: ex.weight || undefined,
          },
          notes: ex.notes || null,
        });
      }
    }
    console.log(`Workout templates seeded!`);
  }

  // Legacy seed for old workouts table
  const existingWorkouts = await storage.getWorkouts();
  const systemWorkouts = existingWorkouts.filter(w => w.coachId === "system");
  if (systemWorkouts.length >= premadeWorkouts.length) return;

  console.log(`Seeding ${premadeWorkouts.length} legacy pre-made workouts...`);
  for (const pw of premadeWorkouts) {
    const existingByName = existingWorkouts.find(w => w.name === pw.name && w.coachId === "system");
    if (existingByName) continue;

    const workout = await storage.createWorkout({
      name: pw.name,
      description: `[${pw.level}] [${pw.sport}] ${pw.description}`,
      coachId: "system",
    });

    for (const ex of pw.exercises) {
      const exercise = await storage.getExerciseByName(ex.exerciseName);
      if (!exercise) {
        console.warn(`  Exercise not found: ${ex.exerciseName} (skipping)`);
        continue;
      }
      await storage.addExerciseToWorkout({
        workoutId: workout.id,
        exerciseId: exercise.id,
        order: ex.order,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight || null,
        notes: ex.notes || null,
      });
    }
  }
  console.log(`Legacy pre-made workouts seeded!`);
}
