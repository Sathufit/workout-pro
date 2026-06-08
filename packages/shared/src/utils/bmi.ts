export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export type BMICategory =
  | 'UNDERWEIGHT'
  | 'NORMAL'
  | 'OVERWEIGHT'
  | 'OBESE_CLASS_1'
  | 'OBESE_CLASS_2'
  | 'OBESE_CLASS_3';

export function getBMICategory(bmi: number): BMICategory {
  if (bmi < 18.5) return 'UNDERWEIGHT';
  if (bmi < 25) return 'NORMAL';
  if (bmi < 30) return 'OVERWEIGHT';
  if (bmi < 35) return 'OBESE_CLASS_1';
  if (bmi < 40) return 'OBESE_CLASS_2';
  return 'OBESE_CLASS_3';
}

export const BMI_CATEGORY_LABELS: Record<BMICategory, string> = {
  UNDERWEIGHT: 'Underweight',
  NORMAL: 'Normal weight',
  OVERWEIGHT: 'Overweight',
  OBESE_CLASS_1: 'Obese (Class I)',
  OBESE_CLASS_2: 'Obese (Class II)',
  OBESE_CLASS_3: 'Obese (Class III)',
};
