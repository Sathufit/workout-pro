import { CreateMetricSchema, MetricQuerySchema } from '@workout-pro/shared';

describe('CreateMetricSchema', () => {
  const validBase = {
    type: 'WEIGHT' as const,
    value: 75.5,
    unit: 'kg',
    recordedAt: new Date().toISOString(),
  };

  it('accepts a valid weight metric', () => {
    expect(CreateMetricSchema.safeParse(validBase).success).toBe(true);
  });

  it('rejects when recordedAt is missing', () => {
    const { recordedAt: _, ...without } = validBase;
    expect(CreateMetricSchema.safeParse(without).success).toBe(false);
  });

  it('rejects when value is zero or negative', () => {
    expect(CreateMetricSchema.safeParse({ ...validBase, value: 0 }).success).toBe(false);
    expect(CreateMetricSchema.safeParse({ ...validBase, value: -1 }).success).toBe(false);
  });

  it('rejects an unknown metric type', () => {
    expect(CreateMetricSchema.safeParse({ ...validBase, type: 'BENCH_PRESS' }).success).toBe(false);
  });

  it.each(['WEIGHT', 'HEIGHT', 'BODY_FAT', 'MUSCLE_MASS', 'WAIST', 'CHEST', 'HIPS'])(
    'accepts the metric type %s',
    (type) => {
      expect(CreateMetricSchema.safeParse({ ...validBase, type }).success).toBe(true);
    },
  );

  it('accepts an optional note', () => {
    const result = CreateMetricSchema.safeParse({ ...validBase, note: 'morning weigh-in' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.note).toBe('morning weigh-in');
  });

  it('rejects a note longer than 500 chars', () => {
    expect(
      CreateMetricSchema.safeParse({ ...validBase, note: 'x'.repeat(501) }).success,
    ).toBe(false);
  });

  it('rejects a non-ISO-8601 recordedAt string', () => {
    expect(
      CreateMetricSchema.safeParse({ ...validBase, recordedAt: '2024-01-01' }).success,
    ).toBe(false);
  });
});

describe('MetricQuerySchema', () => {
  it('applies default page and limit', () => {
    const result = MetricQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it('coerces page and limit from strings', () => {
    const result = MetricQuerySchema.safeParse({ page: '2', limit: '50' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(50);
    }
  });

  it('rejects limit above 100', () => {
    expect(MetricQuerySchema.safeParse({ limit: '101' }).success).toBe(false);
  });

  it('accepts a valid type filter', () => {
    const result = MetricQuerySchema.safeParse({ type: 'MUSCLE_MASS' });
    expect(result.success).toBe(true);
  });
});
