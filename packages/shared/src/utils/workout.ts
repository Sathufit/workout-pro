// Brzycki 1RM formula: weight / (1.0278 - 0.0278 * reps)
export function estimate1RM(weightKg: number, reps: number): number {
  if (reps === 1) return weightKg;
  if (reps > 12) return weightKg; // formula unreliable above 12 reps
  return Math.round((weightKg / (1.0278 - 0.0278 * reps)) * 10) / 10;
}

export function calculateVolume(sets: { weight?: number | null; reps?: number | null }[]): number {
  return sets.reduce((total, set) => {
    if (set.weight && set.reps) return total + set.weight * set.reps;
    return total;
  }, 0);
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// Days of week helper (0=Sun, 6=Sat)
export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
export const DAY_FULL_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
] as const;
