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
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUserById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  });

  app.post(api.setRole.path, async (req, res) => {
    const userId = requireAuth(req, res);
    if (!userId) return;
    try {
      const { role } = api.setRole.input.parse(req.body);
      const updated = await storage.updateUserRole(userId, role);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.athletes.list.path, async (req, res) => {
    const userId = await requireRole(req, res, "COACH");
    if (!userId) return;
    const athletes = await storage.getAthletes();
    res.json(athletes);
  });

  // === EXERCISES ===

  app.get(api.exercises.list.path, async (req, res) => {
    const ex = await storage.getExercises();
    res.json(ex);
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
      const result = await storage.createAssignments({
        coachId: userId,
        athleteIds: input.athleteIds,
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

  app.get(api.coachAthleteLog.path, async (req, res) => {
    const userId = await requireRole(req, res, "COACH");
    if (!userId) return;
    const log = await storage.getWorkoutLog(Number(req.params.assignmentId));
    if (!log) return res.json(null);
    res.json(log);
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
