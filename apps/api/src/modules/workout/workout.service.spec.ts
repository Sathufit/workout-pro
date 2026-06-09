import { WorkoutService } from './workout.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

const makeMockModel = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findOneAndUpdate: jest.fn(),
  create: jest.fn(),
  deleteOne: jest.fn(),
  countDocuments: jest.fn(),
});

describe('WorkoutService', () => {
  let service: WorkoutService;
  let planModel: ReturnType<typeof makeMockModel>;
  let sessionModel: ReturnType<typeof makeMockModel>;

  beforeEach(() => {
    planModel = makeMockModel();
    sessionModel = makeMockModel();
    service = new WorkoutService(planModel as never, sessionModel as never);
  });

  // ── Plans ─────────────────────────────────────────────────────────────────

  describe('listPlans', () => {
    it('returns the raw plan array', async () => {
      const plans = [{ _id: 'p1', name: 'Push Day', exercises: [] }];
      planModel.find.mockReturnValue({ sort: () => ({ lean: () => Promise.resolve(plans) }) });

      const result = await service.listPlans('user1');
      expect(result).toEqual(plans);
    });

    it('returns empty array when user has no plans', async () => {
      planModel.find.mockReturnValue({ sort: () => ({ lean: () => Promise.resolve([]) }) });
      const result = await service.listPlans('user1');
      expect(result).toEqual([]);
    });
  });

  describe('getPlan', () => {
    it('throws NotFoundException when plan does not exist', async () => {
      planModel.findOne.mockReturnValue({ lean: () => Promise.resolve(null) });
      await expect(service.getPlan('user1', 'bad-id')).rejects.toThrow(NotFoundException);
    });

    it('returns plan when found', async () => {
      const plan = { _id: 'p1', name: 'Push Day', userId: 'user1' };
      planModel.findOne.mockReturnValue({ lean: () => Promise.resolve(plan) });
      await expect(service.getPlan('user1', 'p1')).resolves.toEqual(plan);
    });
  });

  describe('addExerciseToPlan', () => {
    it('adds exercise and returns updated plan', async () => {
      const plan = { _id: 'p1', userId: 'user1', exercises: [] };
      const updated = { ...plan, exercises: [{ exerciseId: 'ex1', order: 0 }] };
      planModel.findOne.mockReturnValue({ lean: () => Promise.resolve(plan) });
      planModel.findByIdAndUpdate.mockReturnValue({ lean: () => Promise.resolve(updated) });

      const result = await service.addExerciseToPlan('user1', 'p1', { exerciseId: 'ex1', order: 0 });
      expect(planModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'p1',
        { $push: { exercises: { exerciseId: 'ex1', order: 0 } } },
        { new: true },
      );
      expect(result).toEqual(updated);
    });
  });

  // ── Sessions ──────────────────────────────────────────────────────────────

  describe('startSession', () => {
    it('creates a session with empty sets and current timestamp', async () => {
      const created = { _id: 's1', userId: 'user1', sets: [], startedAt: new Date() };
      sessionModel.create.mockResolvedValue(created);
      const result = await service.startSession('user1', { name: 'Quick Session' });
      expect(sessionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user1', sets: [], startedAt: expect.any(Date) }),
      );
      expect(result).toEqual(created);
    });
  });

  describe('completeSession', () => {
    it('throws BadRequestException if session already completed', async () => {
      const session = { _id: 's1', completedAt: new Date() };
      sessionModel.findOne.mockReturnValue({ lean: () => Promise.resolve(session) });
      await expect(service.completeSession('user1', 's1', {})).rejects.toThrow(BadRequestException);
    });

    it('sets completedAt when session is active', async () => {
      const session = { _id: 's1', completedAt: null };
      const completed = { ...session, completedAt: new Date() };
      sessionModel.findOne.mockReturnValue({ lean: () => Promise.resolve(session) });
      sessionModel.findByIdAndUpdate.mockReturnValue({ lean: () => Promise.resolve(completed) });
      const result = await service.completeSession('user1', 's1', { notes: 'good session' });
      expect(sessionModel.findByIdAndUpdate).toHaveBeenCalledWith(
        's1',
        { $set: { completedAt: expect.any(Date), notes: 'good session' } },
        { new: true },
      );
      expect(result).toEqual(completed);
    });
  });

  describe('logSet', () => {
    it('appends a set with weight to the session', async () => {
      const session = { _id: 's1', userId: 'user1' };
      sessionModel.findOne.mockReturnValue({ lean: () => Promise.resolve(session) });
      sessionModel.findByIdAndUpdate.mockReturnValue({ lean: () => Promise.resolve(session) });

      await service.logSet('user1', 's1', {
        exerciseId: 'ex1',
        exerciseName: 'Bench Press',
        setNumber: 1,
        reps: 10,
        weight: 60,
      });

      expect(sessionModel.findByIdAndUpdate).toHaveBeenCalledWith(
        's1',
        { $push: { sets: expect.objectContaining({ weight: 60, reps: 10 }) } },
        { new: true },
      );
    });
  });

  describe('getStats', () => {
    it('returns total sessions, sessions this week, and total sets', async () => {
      sessionModel.countDocuments
        .mockResolvedValueOnce(10) // totalSessions
        .mockResolvedValueOnce(2); // sessionsThisWeek
      sessionModel.find.mockReturnValue({
        select: () => ({ lean: () => Promise.resolve([{ sets: [1, 2] }, { sets: [3] }]) }),
      });

      const result = await service.getStats('user1');
      expect(result.totalSessions).toBe(10);
      expect(result.sessionsThisWeek).toBe(2);
      expect(result.totalSets).toBe(3);
    });
  });
});
