// Weight
export const kgToLbs = (kg: number): number => Math.round(kg * 2.20462 * 10) / 10;
export const lbsToKg = (lbs: number): number => Math.round((lbs / 2.20462) * 10) / 10;

// Height
export const cmToInches = (cm: number): number => Math.round(cm / 2.54 * 10) / 10;
export const inchesToCm = (inches: number): number => Math.round(inches * 2.54 * 10) / 10;
export const cmToFeetInches = (cm: number): { feet: number; inches: number } => {
  const totalInches = cm / 2.54;
  return { feet: Math.floor(totalInches / 12), inches: Math.round(totalInches % 12) };
};

// Volume (hydration)
export const mlToOz = (ml: number): number => Math.round(ml * 0.033814 * 10) / 10;
export const ozToMl = (oz: number): number => Math.round(oz * 29.5735 * 10) / 10;

// Display helpers
export const formatWeight = (kg: number, unit: 'METRIC' | 'IMPERIAL'): string =>
  unit === 'METRIC' ? `${kg} kg` : `${kgToLbs(kg)} lbs`;

export const formatHeight = (cm: number, unit: 'METRIC' | 'IMPERIAL'): string => {
  if (unit === 'METRIC') return `${cm} cm`;
  const { feet, inches } = cmToFeetInches(cm);
  return `${feet}'${inches}"`;
};
