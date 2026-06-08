export const EQUIPMENT = [
  'barbell',
  'dumbbell',
  'kettlebell',
  'cable',
  'machine',
  'bodyweight',
  'resistance_band',
  'pull_up_bar',
  'bench',
  'squat_rack',
  'treadmill',
  'bike',
  'rowing_machine',
  'foam_roller',
] as const;

export type Equipment = (typeof EQUIPMENT)[number];
