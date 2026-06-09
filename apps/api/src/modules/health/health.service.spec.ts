import { HealthService } from './health.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

const makeMockModel = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  deleteOne: jest.fn(),
  countDocuments: jest.fn(),
});

describe('HealthService', () => {
  let service: HealthService;
  let metricModel: ReturnType<typeof makeMockModel>;
  let sessionModel: ReturnType<typeof makeMockModel>;

  beforeEach(() => {
    metricModel = makeMockModel();
    sessionModel = makeMockModel();
    service = new HealthService(metricModel as never, sessionModel as never);
  });

  describe('createMetric', () => {
    it('saves a weight metric with recordedAt', async () => {
      const now = new Date().toISOString();
      const input = { type: 'WEIGHT' as const, value: 75, unit: 'kg', recordedAt: now };
      metricModel.create.mockResolvedValue({ _id: 'm1', ...input });

      const result = await service.createMetric('user1', input);
      expect(metricModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user1', type: 'WEIGHT', value: 75, unit: 'kg' }),
      );
      expect(result._id).toBe('m1');
    });

    it('saves MUSCLE_MASS metric', async () => {
      const input = {
        type: 'MUSCLE_MASS' as const,
        value: 45,
        unit: 'kg',
        recordedAt: new Date().toISOString(),
      };
      metricModel.create.mockResolvedValue({ _id: 'm2', ...input });
      await service.createMetric('user1', input);
      expect(metricModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'MUSCLE_MASS' }),
      );
    });
  });

  describe('getMetrics', () => {
    it('returns paginated metrics with total', async () => {
      const items = [{ _id: 'm1', type: 'WEIGHT', value: 75 }];
      metricModel.find.mockReturnValue({
        sort: () => ({ skip: () => ({ limit: () => ({ lean: () => Promise.resolve(items) }) }) }),
      });
      metricModel.countDocuments.mockResolvedValue(1);

      const result = await service.getMetrics('user1', { type: 'WEIGHT', page: 1, limit: 20 });
      expect(result.items).toEqual(items);
      expect(result.total).toBe(1);
      expect(result.pages).toBe(1);
    });
  });

  describe('getLatestMetrics', () => {
    it('returns a keyed object of latest values per type', async () => {
      metricModel.findOne.mockReturnValue({
        sort: () => ({ lean: () => Promise.resolve(null) }),
      });

      const result = await service.getLatestMetrics('user1');
      expect(result).toHaveProperty('WEIGHT');
      expect(result).toHaveProperty('HEIGHT');
      expect(result).toHaveProperty('BODY_FAT');
      expect(result).toHaveProperty('MUSCLE_MASS');
      expect(result).toHaveProperty('WAIST');
    });

    it('calculates BMI when both weight and height are present', async () => {
      const weightMetric = { value: 70, unit: 'kg' };
      const heightMetric = { value: 175, unit: 'cm' };

      let callCount = 0;
      metricModel.findOne.mockImplementation(() => ({
        sort: () => ({
          lean: () => {
            const val = callCount === 0 ? weightMetric : callCount === 1 ? heightMetric : null;
            callCount++;
            return Promise.resolve(val);
          },
        }),
      }));

      const result = await service.getLatestMetrics('user1');
      expect(result['BMI']).toBeDefined();
      expect((result['BMI'] as { value: number }).value).toBeCloseTo(22.86, 1);
    });
  });

  describe('deleteMetric', () => {
    it('throws NotFoundException when metric is not found', async () => {
      metricModel.findById.mockResolvedValue(null);
      await expect(service.deleteMetric('user1', 'bad-id')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when metric belongs to another user', async () => {
      metricModel.findById.mockResolvedValue({ _id: 'm1', userId: 'user2' });
      await expect(service.deleteMetric('user1', 'm1')).rejects.toThrow(ForbiddenException);
    });

    it('deletes the metric when owner matches', async () => {
      metricModel.findById.mockResolvedValue({ _id: 'm1', userId: 'user1' });
      metricModel.deleteOne.mockResolvedValue({ deletedCount: 1 });
      await expect(service.deleteMetric('user1', 'm1')).resolves.toBeUndefined();
      expect(metricModel.deleteOne).toHaveBeenCalledWith({ _id: 'm1' });
    });
  });

  describe('getSummary', () => {
    it('returns null weightTrend7d when fewer than 2 weight entries', async () => {
      metricModel.find.mockReturnValue({
        sort: () => ({ lean: () => Promise.resolve([{ value: 75 }]) }),
      });
      sessionModel.countDocuments.mockResolvedValue(3);

      const result = await service.getSummary('user1');
      expect(result.weightTrend7d).toBeNull();
      expect(result.workoutsThisWeek).toBe(3);
    });

    it('calculates 7-day weight trend from first and last entries', async () => {
      const weights = [{ value: 74 }, { value: 74.5 }, { value: 75 }];
      metricModel.find.mockReturnValue({ sort: () => ({ lean: () => Promise.resolve(weights) }) });
      sessionModel.countDocuments.mockResolvedValue(2);

      const result = await service.getSummary('user1');
      expect(result.weightTrend7d).toBeCloseTo(1, 5); // 75 - 74 = +1
    });
  });
});
