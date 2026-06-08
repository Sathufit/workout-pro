export const EXERCISE_CATEGORIES = [
  'STRENGTH',
  'CARDIO',
  'FLEXIBILITY',
  'BALANCE',
  'PLYOMETRIC',
  'POWERLIFTING',
  'OLYMPIC_LIFTING',
  'CALISTHENICS',
  'YOGA',
  'STRETCHING',
] as const;

export type ExerciseCategory = (typeof EXERCISE_CATEGORIES)[number];

export const DIFFICULTY_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;
export type Difficulty = (typeof DIFFICULTY_LEVELS)[number];
