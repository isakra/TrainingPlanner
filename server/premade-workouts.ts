export interface PremadeWorkout {
  name: string;
  description: string;
  level: string;
  sport: string;
  exercises: {
    exerciseName: string;
    sets: number;
    reps: string;
    weight?: string;
    notes?: string;
    order: number;
  }[];
}

export const premadeWorkouts: PremadeWorkout[] = [
  // ============================================
  // BEGINNER PROGRAMS
  // ============================================
  {
    name: "Beginner Full Body A",
    description: "Classic beginner full-body session focusing on compound lifts. Based on Starting Strength principles. Perform 3x per week alternating with Full Body B.",
    level: "Beginner",
    sport: "General Fitness",
    exercises: [
      { exerciseName: "Back Squat", sets: 3, reps: "5", weight: "Start with bar, add 5lbs each session", order: 1 },
      { exerciseName: "Barbell Bench Press", sets: 3, reps: "5", weight: "Start with bar, add 5lbs each session", order: 2 },
      { exerciseName: "Barbell Bent-Over Row", sets: 3, reps: "5", weight: "Start light, add 5lbs each session", order: 3 },
      { exerciseName: "Plank", sets: 3, reps: "30-60s", notes: "Hold for time", order: 4 },
    ],
  },
  {
    name: "Beginner Full Body B",
    description: "Alternate with Full Body A. Based on Starting Strength principles with deadlift and overhead press. Perform 3x per week.",
    level: "Beginner",
    sport: "General Fitness",
    exercises: [
      { exerciseName: "Back Squat", sets: 3, reps: "5", weight: "Add 5lbs from last session", order: 1 },
      { exerciseName: "Barbell Overhead Press", sets: 3, reps: "5", weight: "Start with bar, add 2.5lbs each session", order: 2 },
      { exerciseName: "Conventional Deadlift", sets: 1, reps: "5", weight: "Start light, add 10lbs each session", order: 3 },
      { exerciseName: "Chin-Up", sets: 3, reps: "5-8", notes: "Use assisted machine if needed", order: 4 },
    ],
  },
  {
    name: "Beginner Bodyweight Starter",
    description: "No equipment needed. Perfect for building a base of strength and movement quality before progressing to weights.",
    level: "Beginner",
    sport: "General Fitness",
    exercises: [
      { exerciseName: "Push-Up", sets: 3, reps: "8-12", notes: "Start from knees if needed", order: 1 },
      { exerciseName: "Goblet Squat", sets: 3, reps: "10-12", notes: "Use a dumbbell or kettlebell", order: 2 },
      { exerciseName: "Inverted Row", sets: 3, reps: "8-10", notes: "Adjust bar height to change difficulty", order: 3 },
      { exerciseName: "Glute Bridge", sets: 3, reps: "12-15", order: 4 },
      { exerciseName: "Plank", sets: 3, reps: "20-30s", order: 5 },
      { exerciseName: "Walking Lunge", sets: 2, reps: "10 each leg", order: 6 },
    ],
  },
  {
    name: "StrongLifts 5x5 - Workout A",
    description: "One of the most popular beginner programs. Simple and effective: 5 sets of 5 reps on three compound lifts. Add weight every session.",
    level: "Beginner",
    sport: "General Fitness",
    exercises: [
      { exerciseName: "Back Squat", sets: 5, reps: "5", weight: "Add 5lbs each session", order: 1 },
      { exerciseName: "Barbell Bench Press", sets: 5, reps: "5", weight: "Add 5lbs each session", order: 2 },
      { exerciseName: "Pendlay Row", sets: 5, reps: "5", weight: "Add 5lbs each session", order: 3 },
    ],
  },
  {
    name: "StrongLifts 5x5 - Workout B",
    description: "Alternate with Workout A, 3 days per week. Focus on adding weight progressively while maintaining good form.",
    level: "Beginner",
    sport: "General Fitness",
    exercises: [
      { exerciseName: "Back Squat", sets: 5, reps: "5", weight: "Add 5lbs each session", order: 1 },
      { exerciseName: "Barbell Overhead Press", sets: 5, reps: "5", weight: "Add 2.5lbs each session", order: 2 },
      { exerciseName: "Conventional Deadlift", sets: 1, reps: "5", weight: "Add 10lbs each session", order: 3 },
    ],
  },

  // ============================================
  // INTERMEDIATE PROGRAMS
  // ============================================
  {
    name: "Push Day (PPL Split)",
    description: "Push/Pull/Legs is the gold standard for intermediate lifters. This push day targets chest, shoulders, and triceps. Run 2x per week.",
    level: "Intermediate",
    sport: "General Fitness",
    exercises: [
      { exerciseName: "Barbell Bench Press", sets: 4, reps: "6-8", order: 1 },
      { exerciseName: "Dumbbell Shoulder Press", sets: 3, reps: "8-10", order: 2 },
      { exerciseName: "Incline Dumbbell Bench Press", sets: 3, reps: "8-10", order: 3 },
      { exerciseName: "Dumbbell Lateral Raise", sets: 3, reps: "12-15", order: 4 },
      { exerciseName: "Cable Chest Fly", sets: 3, reps: "10-12", order: 5 },
      { exerciseName: "Cable Tricep Pushdown (Rope)", sets: 3, reps: "10-12", order: 6 },
      { exerciseName: "Dumbbell Overhead Tricep Extension", sets: 3, reps: "10-12", order: 7 },
    ],
  },
  {
    name: "Pull Day (PPL Split)",
    description: "Targets back and biceps. Part of the Push/Pull/Legs split. Emphasizes compound pulling with isolation finishers.",
    level: "Intermediate",
    sport: "General Fitness",
    exercises: [
      { exerciseName: "Conventional Deadlift", sets: 3, reps: "5", order: 1 },
      { exerciseName: "Pull-Up", sets: 3, reps: "6-10", notes: "Add weight if bodyweight is easy", order: 2 },
      { exerciseName: "Seated Cable Row", sets: 3, reps: "8-10", order: 3 },
      { exerciseName: "Face Pull", sets: 3, reps: "12-15", order: 4 },
      { exerciseName: "Barbell Curl", sets: 3, reps: "8-10", order: 5 },
      { exerciseName: "Hammer Curl", sets: 3, reps: "10-12", order: 6 },
    ],
  },
  {
    name: "Leg Day (PPL Split)",
    description: "Complete lower body session hitting quads, hamstrings, glutes, and calves. Part of the Push/Pull/Legs split.",
    level: "Intermediate",
    sport: "General Fitness",
    exercises: [
      { exerciseName: "Back Squat", sets: 4, reps: "6-8", order: 1 },
      { exerciseName: "Romanian Deadlift (Barbell)", sets: 3, reps: "8-10", order: 2 },
      { exerciseName: "Leg Press", sets: 3, reps: "10-12", order: 3 },
      { exerciseName: "Lying Leg Curl", sets: 3, reps: "10-12", order: 4 },
      { exerciseName: "Bulgarian Split Squat", sets: 3, reps: "10 each leg", order: 5 },
      { exerciseName: "Standing Calf Raise (Machine)", sets: 4, reps: "12-15", order: 6 },
    ],
  },
  {
    name: "Upper Body Strength",
    description: "Upper/Lower split - strength focused upper day. Heavy compound pressing and pulling with moderate accessories.",
    level: "Intermediate",
    sport: "General Fitness",
    exercises: [
      { exerciseName: "Barbell Bench Press", sets: 4, reps: "5", order: 1 },
      { exerciseName: "Pendlay Row", sets: 4, reps: "5", order: 2 },
      { exerciseName: "Barbell Overhead Press", sets: 3, reps: "6-8", order: 3 },
      { exerciseName: "Pull-Up", sets: 3, reps: "8", order: 4 },
      { exerciseName: "Dumbbell Curl", sets: 3, reps: "10-12", order: 5 },
      { exerciseName: "Cable Tricep Pushdown (Rope)", sets: 3, reps: "10-12", order: 6 },
    ],
  },
  {
    name: "Lower Body Strength",
    description: "Upper/Lower split - strength focused lower day. Heavy squats and deadlifts with targeted accessory work.",
    level: "Intermediate",
    sport: "General Fitness",
    exercises: [
      { exerciseName: "Back Squat", sets: 4, reps: "5", order: 1 },
      { exerciseName: "Conventional Deadlift", sets: 3, reps: "5", order: 2 },
      { exerciseName: "Bulgarian Split Squat", sets: 3, reps: "8 each leg", order: 3 },
      { exerciseName: "Lying Leg Curl", sets: 3, reps: "10-12", order: 4 },
      { exerciseName: "Standing Calf Raise (Machine)", sets: 4, reps: "12-15", order: 5 },
      { exerciseName: "Hanging Leg Raise", sets: 3, reps: "10-15", order: 6 },
    ],
  },
  {
    name: "Upper Body Hypertrophy",
    description: "Upper/Lower split - hypertrophy focused upper day. Higher reps and more volume to build muscle size.",
    level: "Intermediate",
    sport: "General Fitness",
    exercises: [
      { exerciseName: "Incline Dumbbell Bench Press", sets: 4, reps: "8-10", order: 1 },
      { exerciseName: "Lat Pulldown", sets: 4, reps: "10-12", order: 2 },
      { exerciseName: "Dumbbell Shoulder Press", sets: 3, reps: "10-12", order: 3 },
      { exerciseName: "Seated Cable Row", sets: 3, reps: "10-12", order: 4 },
      { exerciseName: "Cable Chest Fly", sets: 3, reps: "12-15", order: 5 },
      { exerciseName: "Face Pull", sets: 3, reps: "15-20", order: 6 },
      { exerciseName: "Barbell Curl", sets: 3, reps: "10-12", order: 7 },
      { exerciseName: "Cable Tricep Pushdown (Rope)", sets: 3, reps: "10-12", order: 8 },
    ],
  },
  {
    name: "Lower Body Hypertrophy",
    description: "Upper/Lower split - hypertrophy focused lower day. Higher reps targeting quad, hamstring, and glute growth.",
    level: "Intermediate",
    sport: "General Fitness",
    exercises: [
      { exerciseName: "Hack Squat", sets: 4, reps: "10-12", order: 1 },
      { exerciseName: "Dumbbell Romanian Deadlift", sets: 3, reps: "10-12", order: 2 },
      { exerciseName: "Leg Press", sets: 3, reps: "12-15", order: 3 },
      { exerciseName: "Leg Extension", sets: 3, reps: "12-15", order: 4 },
      { exerciseName: "Lying Leg Curl", sets: 3, reps: "12-15", order: 5 },
      { exerciseName: "Barbell Hip Thrust", sets: 3, reps: "10-12", order: 6 },
      { exerciseName: "Seated Calf Raise", sets: 4, reps: "15-20", order: 7 },
    ],
  },

  // ============================================
  // ADVANCED PROGRAMS
  // ============================================
  {
    name: "Powerlifting Peaking - Heavy Day",
    description: "Advanced powerlifting session focused on the competition lifts at high intensity. For lifters preparing for a meet or max-out.",
    level: "Advanced",
    sport: "Powerlifting",
    exercises: [
      { exerciseName: "Back Squat", sets: 5, reps: "3", weight: "85-90% 1RM", order: 1 },
      { exerciseName: "Barbell Bench Press", sets: 5, reps: "3", weight: "85-90% 1RM", order: 2 },
      { exerciseName: "Conventional Deadlift", sets: 3, reps: "2", weight: "85-90% 1RM", order: 3 },
      { exerciseName: "Close-Grip Barbell Bench Press", sets: 3, reps: "6-8", notes: "Bench accessory for lockout", order: 4 },
      { exerciseName: "Front Squat", sets: 3, reps: "5", notes: "Squat accessory for quad strength", order: 5 },
    ],
  },
  {
    name: "Olympic Weightlifting Session",
    description: "Full Olympic lifting session for advanced athletes. Focus on speed, technique, and power through the classic lifts.",
    level: "Advanced",
    sport: "Olympic Lifting",
    exercises: [
      { exerciseName: "Snatch", sets: 5, reps: "2", weight: "70-80% 1RM", notes: "Focus on speed under the bar", order: 1 },
      { exerciseName: "Clean and Jerk", sets: 5, reps: "2", weight: "70-80% 1RM", order: 2 },
      { exerciseName: "Front Squat", sets: 4, reps: "3", weight: "80% 1RM", order: 3 },
      { exerciseName: "Snatch-Grip Romanian Deadlift", sets: 3, reps: "6", notes: "Build pulling strength", order: 4 },
      { exerciseName: "Barbell Push Press", sets: 3, reps: "5", order: 5 },
    ],
  },

  // ============================================
  // SPORT-SPECIFIC PROGRAMS
  // ============================================
  {
    name: "Football - Explosive Power",
    description: "Designed for American football players. Builds explosive power, raw strength, and speed needed on the field. Based on NFL combine prep programs.",
    level: "Intermediate",
    sport: "Football",
    exercises: [
      { exerciseName: "Power Clean", sets: 5, reps: "3", weight: "75-80% 1RM", notes: "Explosive triple extension", order: 1 },
      { exerciseName: "Back Squat", sets: 4, reps: "5", weight: "80% 1RM", order: 2 },
      { exerciseName: "Barbell Bench Press", sets: 4, reps: "5", weight: "80% 1RM", order: 3 },
      { exerciseName: "Box Jump", sets: 4, reps: "5", notes: "Maximum height, step down between reps", order: 4 },
      { exerciseName: "Barbell Hip Thrust", sets: 3, reps: "8", notes: "Drive through heels explosively", order: 5 },
      { exerciseName: "Kettlebell Swing (Russian)", sets: 3, reps: "12", order: 6 },
    ],
  },
  {
    name: "Football - Speed & Agility",
    description: "NFL-style speed and agility session. Focuses on acceleration, change of direction, and reactive ability.",
    level: "Intermediate",
    sport: "Football",
    exercises: [
      { exerciseName: "10-Yard Sprint", sets: 6, reps: "1", notes: "Full recovery between sprints (90s rest)", order: 1 },
      { exerciseName: "L-Drill (3-Cone Drill)", sets: 4, reps: "1", notes: "Focus on tight cuts and low center of gravity", order: 2 },
      { exerciseName: "Shuttle Run", sets: 4, reps: "1", notes: "5-10-5 drill, explosive start", order: 3 },
      { exerciseName: "Box Jump", sets: 3, reps: "5", notes: "Focus on rapid hip extension", order: 4 },
      { exerciseName: "Lateral Bound", sets: 3, reps: "6 each side", notes: "Stick the landing", order: 5 },
      { exerciseName: "Broad Jump", sets: 4, reps: "3", notes: "Maximum distance, full recovery", order: 6 },
    ],
  },
  {
    name: "Basketball - Vertical Leap & Power",
    description: "Based on programs used by NBA players like Russell Westbrook. Builds vertical leap, court speed, and explosive power for basketball.",
    level: "Intermediate",
    sport: "Basketball",
    exercises: [
      { exerciseName: "Front Squat", sets: 4, reps: "5", notes: "Deep squat for full range of motion", order: 1 },
      { exerciseName: "Depth Jump", sets: 4, reps: "5", notes: "Step off box, immediately jump max height upon landing", order: 2 },
      { exerciseName: "Bulgarian Split Squat", sets: 3, reps: "8 each leg", notes: "Explosive drive up", order: 3 },
      { exerciseName: "Barbell Hip Thrust", sets: 3, reps: "10", order: 4 },
      { exerciseName: "Tuck Jump", sets: 3, reps: "8", notes: "Bring knees to chest at peak", order: 5 },
      { exerciseName: "Standing Calf Raise (Barbell)", sets: 4, reps: "15", order: 6 },
    ],
  },
  {
    name: "Basketball - Conditioning & Agility",
    description: "Court-specific conditioning for basketball players. Develops the stop-start endurance and lateral quickness needed during games.",
    level: "Intermediate",
    sport: "Basketball",
    exercises: [
      { exerciseName: "Shuttle Run", sets: 6, reps: "1", notes: "Full court shuttle: baseline-free throw-half court-far free throw-far baseline", order: 1 },
      { exerciseName: "Lateral Bound", sets: 3, reps: "8 each side", notes: "Mimics defensive slides", order: 2 },
      { exerciseName: "Zigzag Sprint", sets: 4, reps: "1", notes: "Sprint with direction changes every 5 yards", order: 3 },
      { exerciseName: "Burpee", sets: 3, reps: "10", notes: "Game-speed intensity", order: 4 },
      { exerciseName: "Mountain Climber", sets: 3, reps: "20 each side", notes: "Fast tempo", order: 5 },
      { exerciseName: "Plank", sets: 3, reps: "45-60s", notes: "Core stability for body contact", order: 6 },
    ],
  },
  {
    name: "Soccer - Strength & Power",
    description: "Gym session for soccer players. Builds lower body power for sprinting, shooting, and tackling while maintaining agility.",
    level: "Intermediate",
    sport: "Soccer",
    exercises: [
      { exerciseName: "Back Squat", sets: 4, reps: "6", weight: "75-80% 1RM", order: 1 },
      { exerciseName: "Romanian Deadlift (Barbell)", sets: 3, reps: "8", notes: "Hamstring protection - key for injury prevention", order: 2 },
      { exerciseName: "Bulgarian Split Squat", sets: 3, reps: "8 each leg", notes: "Single-leg strength for kicking power", order: 3 },
      { exerciseName: "Barbell Hip Thrust", sets: 3, reps: "10", notes: "Sprint power", order: 4 },
      { exerciseName: "Standing Calf Raise (Machine)", sets: 3, reps: "15", order: 5 },
      { exerciseName: "Plank", sets: 3, reps: "45-60s", order: 6 },
      { exerciseName: "Russian Twist", sets: 3, reps: "15 each side", notes: "Rotational core strength for kicking", order: 7 },
    ],
  },
  {
    name: "Soccer - Speed & Endurance",
    description: "Field session for soccer players. Develops the aerobic base and sprint ability needed to perform across a full 90-minute match.",
    level: "Intermediate",
    sport: "Soccer",
    exercises: [
      { exerciseName: "Sprint Interval", sets: 8, reps: "1", notes: "30s sprint at 90%, 30s walk recovery", order: 1 },
      { exerciseName: "L-Drill (3-Cone Drill)", sets: 4, reps: "1", notes: "Quick feet and tight turns", order: 2 },
      { exerciseName: "Shuttle Run", sets: 4, reps: "1", notes: "Short burst acceleration", order: 3 },
      { exerciseName: "Lateral Bound", sets: 3, reps: "8 each side", notes: "Lateral agility for defending", order: 4 },
      { exerciseName: "Broad Jump", sets: 3, reps: "5", notes: "Explosive forward power", order: 5 },
      { exerciseName: "Burpee", sets: 3, reps: "10", notes: "Conditioning finisher", order: 6 },
    ],
  },
  {
    name: "Swimming - Dryland Training",
    description: "Dryland strength session for competitive swimmers. Focuses on shoulder stability, lat power, and core strength for faster strokes.",
    level: "Intermediate",
    sport: "Swimming",
    exercises: [
      { exerciseName: "Pull-Up", sets: 4, reps: "8-10", notes: "Wide grip, mimics pulling phase", order: 1 },
      { exerciseName: "Straight-Arm Lat Pulldown", sets: 3, reps: "12", notes: "Mimics catch phase of stroke", order: 2 },
      { exerciseName: "Dumbbell Shoulder Press", sets: 3, reps: "10", notes: "Shoulder stability", order: 3 },
      { exerciseName: "Face Pull", sets: 3, reps: "15", notes: "Rotator cuff health", order: 4 },
      { exerciseName: "Dumbbell Fly", sets: 3, reps: "12", notes: "Chest strength for breaststroke", order: 5 },
      { exerciseName: "Plank", sets: 3, reps: "60s", notes: "Core stability for streamline position", order: 6 },
      { exerciseName: "Russian Twist", sets: 3, reps: "15 each side", notes: "Rotational core for freestyle", order: 7 },
    ],
  },
  {
    name: "Track & Field - Sprinter Power",
    description: "Strength program for 100m-400m sprinters. Emphasizes explosive hip extension, hamstring strength, and starting power.",
    level: "Advanced",
    sport: "Track & Field",
    exercises: [
      { exerciseName: "Power Clean", sets: 5, reps: "3", weight: "75-80% 1RM", notes: "Triple extension power", order: 1 },
      { exerciseName: "Back Squat", sets: 4, reps: "4", weight: "85% 1RM", order: 2 },
      { exerciseName: "Barbell Hip Thrust", sets: 4, reps: "6", weight: "Heavy", notes: "Sprint-specific hip drive", order: 3 },
      { exerciseName: "Single-Leg Romanian Deadlift (Dumbbell)", sets: 3, reps: "8 each leg", notes: "Hamstring injury prevention", order: 4 },
      { exerciseName: "Box Jump", sets: 4, reps: "5", notes: "Maximum height", order: 5 },
      { exerciseName: "Broad Jump", sets: 4, reps: "4", notes: "Maximum distance", order: 6 },
    ],
  },
  {
    name: "MMA / Combat Sports - Fight Strength",
    description: "Strength and conditioning for MMA fighters and combat athletes. Builds total-body power, grip endurance, and fight-ready conditioning.",
    level: "Advanced",
    sport: "Combat Sports",
    exercises: [
      { exerciseName: "Conventional Deadlift", sets: 4, reps: "5", weight: "80% 1RM", notes: "Takedown and clinch strength", order: 1 },
      { exerciseName: "Pull-Up", sets: 4, reps: "8-10", notes: "Grip and pulling power for grappling", order: 2 },
      { exerciseName: "Barbell Push Press", sets: 4, reps: "5", notes: "Overhead power for clinch work", order: 3 },
      { exerciseName: "Kettlebell Swing (Russian)", sets: 3, reps: "15", notes: "Hip power and conditioning", order: 4 },
      { exerciseName: "Barbell Bent-Over Row", sets: 3, reps: "8", order: 5 },
      { exerciseName: "Burpee", sets: 3, reps: "12", notes: "Fight conditioning", order: 6 },
      { exerciseName: "Plank", sets: 3, reps: "60s", notes: "Anti-rotation core stability", order: 7 },
    ],
  },
  {
    name: "Tennis - Court Performance",
    description: "Strength and agility program for tennis players. Develops rotational power, lateral movement, and shoulder endurance for long matches.",
    level: "Intermediate",
    sport: "Tennis",
    exercises: [
      { exerciseName: "Goblet Squat", sets: 3, reps: "10", notes: "Lower body foundation for court coverage", order: 1 },
      { exerciseName: "Single-Arm Dumbbell Row", sets: 3, reps: "10 each", notes: "Anti-rotation and back strength", order: 2 },
      { exerciseName: "Russian Twist", sets: 3, reps: "15 each side", notes: "Rotational power for strokes", order: 3 },
      { exerciseName: "Lateral Bound", sets: 3, reps: "8 each side", notes: "Lateral court movement", order: 4 },
      { exerciseName: "Face Pull", sets: 3, reps: "15", notes: "Shoulder health for serving", order: 5 },
      { exerciseName: "Walking Lunge", sets: 3, reps: "10 each leg", notes: "Deceleration strength", order: 6 },
      { exerciseName: "Plank", sets: 3, reps: "45s", order: 7 },
    ],
  },
  {
    name: "CrossFit-Style WOD",
    description: "High-intensity workout combining strength and conditioning in a circuit format. Perform exercises with minimal rest for total-body fitness.",
    level: "Intermediate",
    sport: "CrossFit",
    exercises: [
      { exerciseName: "Barbell Overhead Press", sets: 3, reps: "10", notes: "Moderate weight, controlled pace", order: 1 },
      { exerciseName: "Conventional Deadlift", sets: 3, reps: "10", notes: "Moderate weight", order: 2 },
      { exerciseName: "Pull-Up", sets: 3, reps: "10-15", notes: "Kipping allowed if proficient", order: 3 },
      { exerciseName: "Box Jump", sets: 3, reps: "15", notes: "Step down between reps for safety", order: 4 },
      { exerciseName: "Push-Up", sets: 3, reps: "15", order: 5 },
      { exerciseName: "Kettlebell Swing (American)", sets: 3, reps: "15", order: 6 },
      { exerciseName: "Burpee", sets: 3, reps: "10", notes: "Finisher - go hard", order: 7 },
    ],
  },
  {
    name: "Baseball - Rotational Power",
    description: "Develops rotational power for hitting and throwing, plus the lower body strength needed for explosive base running.",
    level: "Intermediate",
    sport: "Baseball",
    exercises: [
      { exerciseName: "Trap Bar Deadlift", sets: 4, reps: "5", notes: "Total body power base", order: 1 },
      { exerciseName: "Russian Twist", sets: 3, reps: "15 each side", notes: "Rotational core for swinging/throwing", order: 2 },
      { exerciseName: "Single-Arm Dumbbell Row", sets: 3, reps: "10 each", notes: "Anti-rotation strength", order: 3 },
      { exerciseName: "Bulgarian Split Squat", sets: 3, reps: "8 each leg", notes: "Single-leg push-off power", order: 4 },
      { exerciseName: "Face Pull", sets: 3, reps: "15", notes: "Shoulder health for throwing", order: 5 },
      { exerciseName: "Lateral Bound", sets: 3, reps: "6 each side", notes: "Lateral first-step quickness", order: 6 },
    ],
  },
  {
    name: "Cycling - Leg Power",
    description: "Gym-based strength work for cyclists. Builds pedaling power, single-leg balance, and core stability for endurance rides.",
    level: "Intermediate",
    sport: "Cycling",
    exercises: [
      { exerciseName: "Back Squat", sets: 4, reps: "6-8", notes: "Primary power builder for pedaling", order: 1 },
      { exerciseName: "Single-Leg Romanian Deadlift (Dumbbell)", sets: 3, reps: "10 each leg", notes: "Hamstring and balance work", order: 2 },
      { exerciseName: "Leg Press", sets: 3, reps: "12", notes: "High rep quad endurance", order: 3 },
      { exerciseName: "Bulgarian Split Squat", sets: 3, reps: "10 each leg", notes: "Single-leg strength for climbing", order: 4 },
      { exerciseName: "Standing Calf Raise (Machine)", sets: 3, reps: "15", order: 5 },
      { exerciseName: "Plank", sets: 3, reps: "60s", notes: "Core for aero position", order: 6 },
    ],
  },
  {
    name: "Mobility & Recovery Session",
    description: "Active recovery day focused on mobility, flexibility, and reducing soreness. Essential for injury prevention and long-term progress.",
    level: "Beginner",
    sport: "General Fitness",
    exercises: [
      { exerciseName: "Foam Roll Quadriceps", sets: 1, reps: "60s each leg", order: 1 },
      { exerciseName: "Foam Roll Hamstrings", sets: 1, reps: "60s each leg", order: 2 },
      { exerciseName: "Foam Roll Upper Back", sets: 1, reps: "60s", order: 3 },
      { exerciseName: "World's Greatest Stretch", sets: 2, reps: "5 each side", notes: "Hold each position 3-5 seconds", order: 4 },
      { exerciseName: "Cat-Cow Stretch", sets: 2, reps: "10", notes: "Slow controlled spinal movement", order: 5 },
      { exerciseName: "Half-Kneeling Hip Flexor Stretch", sets: 2, reps: "30s each side", order: 6 },
      { exerciseName: "Dead Bug", sets: 3, reps: "10 each side", notes: "Core activation without spinal stress", order: 7 },
    ],
  },
];
