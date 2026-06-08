export const MUSCLE_GROUPS = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'core',
  'abs',
  'obliques',
  'glutes',
  'quadriceps',
  'hamstrings',
  'calves',
  'hip_flexors',
  'lower_back',
  'traps',
  'lats',
  'rhomboids',
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];
