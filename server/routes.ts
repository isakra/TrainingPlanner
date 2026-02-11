import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { exerciseData } from "./exercise-data";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // === AUTH SETUP ===
  await setupAuth(app);
  registerAuthRoutes(app);

  // === DOMAIN ROUTES ===

  // Exercises
  app.get(api.exercises.list.path, async (req, res) => {
    const exercises = await storage.getExercises();
    res.json(exercises);
  });

  app.post(api.exercises.create.path, async (req, res) => {
    try {
      // Validate inputs
      const input = api.exercises.create.input.parse(req.body);
      const exercise = await storage.createExercise(input);
      res.status(201).json(exercise);
    } catch (err) {
        if (err instanceof z.ZodError) {
          res.status(400).json({ message: err.errors[0].message });
        } else {
            res.status(500).json({ message: "Internal server error" });
        }
    }
  });

  // Workouts
  app.get(api.workouts.list.path, async (req, res) => {
    const workouts = await storage.getWorkouts();
    res.json(workouts);
  });

  app.post(api.workouts.create.path, async (req, res) => {
    try {
      const input = api.workouts.create.input.parse(req.body);
      // Mock coach ID from auth if available, or default
      const coachId = (req.user as any)?.claims?.sub || "mock-coach-id";
      const workout = await storage.createWorkout({ ...input, coachId });
      res.status(201).json(workout);
    } catch (err) {
         if (err instanceof z.ZodError) {
          res.status(400).json({ message: err.errors[0].message });
        } else {
            res.status(500).json({ message: "Internal server error" });
        }
    }
  });

  app.get(api.workouts.get.path, async (req, res) => {
    const workout = await storage.getWorkout(Number(req.params.id));
    if (!workout) {
      return res.status(404).json({ message: "Workout not found" });
    }
    res.json(workout);
  });

  app.post(api.workouts.addExercise.path, async (req, res) => {
    try {
      const input = api.workouts.addExercise.input.parse(req.body);
      const result = await storage.addExerciseToWorkout({
          ...input,
          workoutId: Number(req.params.id)
      });
      res.status(201).json(result);
    } catch (err) {
        if (err instanceof z.ZodError) {
          res.status(400).json({ message: err.errors[0].message });
        } else {
            res.status(500).json({ message: "Internal server error" });
        }
    }
  });

  // Assignments
  app.get(api.assignments.list.path, async (req, res) => {
    const userId = req.query.userId ? String(req.query.userId) : ((req.user as any)?.claims?.sub);
    // If no user specified and not logged in, empty list or 401. 
    // For MVP allow fetching assignments if query param provided (e.g. coach viewing athlete)
    
    // date parsing
    let date = undefined;
    if (req.query.date) {
        date = new Date(String(req.query.date));
    }

    const assignments = await storage.getAssignments(userId, date);
    res.json(assignments);
  });

  app.post(api.assignments.create.path, async (req, res) => {
    try {
      const input = api.assignments.create.input.parse(req.body);
      const assignment = await storage.createAssignment(input);
      res.status(201).json(assignment);
    } catch (err) {
        if (err instanceof z.ZodError) {
          res.status(400).json({ message: err.errors[0].message });
        } else {
            res.status(500).json({ message: "Internal server error" });
        }
    }
  });

  app.patch(api.assignments.complete.path, async (req, res) => {
    try {
        const completed = req.body.completed;
        const result = await storage.completeAssignment(Number(req.params.id), completed);
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
  });

  // Performance
  app.post(api.performance.log.path, async (req, res) => {
    try {
      const input = api.performance.log.input.parse(req.body);
      const log = await storage.logPerformance(input);
      res.status(201).json(log);
    } catch (err) {
        if (err instanceof z.ZodError) {
          res.status(400).json({ message: err.errors[0].message });
        } else {
            res.status(500).json({ message: "Internal server error" });
        }
    }
  });
  
  app.get(api.performance.history.path, async (req, res) => {
      // Assume logged in user for now
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
          return res.status(401).json({ message: "Unauthorized" });
      }
      const history = await storage.getPerformanceHistory(Number(req.params.exerciseId), userId);
      res.json(history);
  });

  // Seed Data Endpoint (for demo)
  app.post("/api/seed", async (req, res) => {
      await seedDatabase();
      res.json({ message: "Database seeded" });
  });
  
  // Also seed on startup if empty (async)
  seedDatabase().catch(err => console.error("Error seeding database:", err));

  return httpServer;
}

async function seedDatabase() {
    const existing = await storage.getExercises();
    if (existing.length >= 100) return;

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
}
