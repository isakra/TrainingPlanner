import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";

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
    // Check if data exists
    const existing = await storage.getExercises();
    if (existing.length > 0) return;

    console.log("Seeding database...");

    // Create Exercises
    const squat = await storage.createExercise({
        name: "Back Squat",
        category: "Strength",
        videoUrl: "https://www.youtube.com/embed/SW_C1A-rejs",
        instructions: "Keep chest up, hips back."
    });
    
    const bench = await storage.createExercise({
        name: "Bench Press",
        category: "Strength",
        videoUrl: "https://www.youtube.com/embed/rT7DgCr-3pg",
        instructions: "Keep feet planted, eyes under the bar."
    });

    const deadlift = await storage.createExercise({
        name: "Deadlift",
        category: "Strength", 
        videoUrl: "https://www.youtube.com/embed/op9kVnSso6Q",
        instructions: "Hinge at the hips, keep back straight."
    });
    
    const boxJump = await storage.createExercise({
        name: "Box Jump",
        category: "Plyometrics",
        instructions: "Land softly."
    });

    // Create Workout Template
    const legDay = await storage.createWorkout({
        name: "Hypertrophy Legs",
        description: "Focus on quads and hamstrings.",
        coachId: "mock-coach-id"
    });

    // Add Exercises to Workout
    await storage.addExerciseToWorkout({
        workoutId: legDay.id,
        exerciseId: squat.id,
        order: 1,
        sets: 4,
        reps: "8-10",
        weight: "75%",
        notes: "Control the eccentric"
    });

    await storage.addExerciseToWorkout({
        workoutId: deadlift.id, // wait, exerciseId not workoutId? No, this is Deadlift. ID is exercise.id
        // Typo in logic above, referencing deadlift.id as workoutId? No.
        workoutId: legDay.id,
        exerciseId: deadlift.id,
        order: 2,
        sets: 3,
        reps: "5",
        weight: "80%",
    });
    
    // Create an assignment for "today" for a mock user (if they existed)
    // We don't have a user ID yet, so skip assignment seeding or use a placeholder.
    console.log("Database seeded!");
}
