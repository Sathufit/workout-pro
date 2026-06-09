import {
  CreatePlanSchema,
  LogSetSchema,
  PlanExerciseSchema,
  StartSessionSchema,
} from '@workout-pro/shared';

describe('LogSetSchema', () => {
  const validSet = {
    exerciseId: '507f1f77bcf86cd799439011',
    setNumber: 1,
    reps: 10,
    weight: 60,
  };

  it('accepts a valid set with weight', () => {
    expect(LogSetSchema.safeParse(validSet).success).toBe(true);
  });

  it('accepts a set without weight (bodyweight exercise)', () => {
    const { weight: _, ...withoutWeight } = validSet;
    expect(LogSetSchema.safeParse(withoutWeight).success).toBe(true);
  });

  it('rejects zero or negative weight', () => {
    expect(LogSetSchema.safeParse({ ...validSet, weight: 0 }).success).toBe(false);
    expect(LogSetSchema.safeParse({ ...validSet, weight: -5 }).success).toBe(false);
  });

  it('rejects setNumber of zero or negative', () => {
    expect(LogSetSchema.safeParse({ ...validSet, setNumber: 0 }).success).toBe(false);
    expect(LogSetSchema.safeParse({ ...validSet, setNumber: -1 }).success).toBe(false);
  });

  it('rejects missing exerciseId', () => {
    const { exerciseId: _, ...without } = validSet;
    expect(LogSetSchema.safeParse(without).success).toBe(false);
  });

  it('rejects empty exerciseId', () => {
    expect(LogSetSchema.safeParse({ ...validSet, exerciseId: '' }).success).toBe(false);
  });

  it('accepts RPE in range 1-10', () => {
    expect(LogSetSchema.safeParse({ ...validSet, rpe: 8 }).success).toBe(true);
  });

  it('rejects RPE outside 1-10', () => {
    expect(LogSetSchema.safeParse({ ...validSet, rpe: 0 }).success).toBe(false);
    expect(LogSetSchema.safeParse({ ...validSet, rpe: 11 }).success).toBe(false);
  });
});

describe('PlanExerciseSchema', () => {
  const validExercise = {
    exerciseId: '507f1f77bcf86cd799439011',
  };

  it('accepts minimal exercise with just an id', () => {
    expect(PlanExerciseSchema.safeParse(validExercise).success).toBe(true);
  });

  it('accepts full exercise config including weight', () => {
    expect(
      PlanExerciseSchema.safeParse({
        ...validExercise,
        targetSets: 3,
        targetReps: 10,
        targetWeight: 60,
        restSeconds: 90,
      }).success,
    ).toBe(true);
  });

  it('rejects non-positive targetWeight', () => {
    expect(
      PlanExerciseSchema.safeParse({ ...validExercise, targetWeight: 0 }).success,
    ).toBe(false);
  });

  it('defaults order to 0', () => {
    const result = PlanExerciseSchema.safeParse(validExercise);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.order).toBe(0);
  });
});

describe('CreatePlanSchema', () => {
  it('accepts a valid plan', () => {
    expect(
      CreatePlanSchema.safeParse({ name: 'Push Day', scheduleDays: [1, 3, 5] }).success,
    ).toBe(true);
  });

  it('rejects an empty plan name', () => {
    expect(CreatePlanSchema.safeParse({ name: '' }).success).toBe(false);
  });

  it('defaults scheduleDays to empty array', () => {
    const result = CreatePlanSchema.safeParse({ name: 'Push Day' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.scheduleDays).toEqual([]);
  });
});

describe('StartSessionSchema', () => {
  it('accepts a session with a plan id', () => {
    expect(
      StartSessionSchema.safeParse({ planId: '507f1f77bcf86cd799439011' }).success,
    ).toBe(true);
  });

  it('accepts a quick session without planId', () => {
    expect(StartSessionSchema.safeParse({}).success).toBe(true);
  });

  it('defaults name to Workout Session', () => {
    const result = StartSessionSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe('Workout Session');
  });
});
