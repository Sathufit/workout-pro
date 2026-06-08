import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HealthMetric } from '../../schemas/health-metric.schema';
import { WorkoutSession } from '../../schemas/workout-session.schema';
import { CreateMetricInput, MetricQuery } from '@workout-pro/shared';
import { calculateBMI, getBMICategory } from '@workout-pro/shared';

const METRIC_TYPES = ['WEIGHT', 'HEIGHT', 'BODY_FAT', 'CALORIES_CONSUMED', 'CALORIES_BURNED', 'HYDRATION', 'SLEEP_HOURS', 'STEPS'];

@Injectable()
export class HealthService {
  constructor(
    @InjectModel(HealthMetric.name) private metricModel: Model<HealthMetric>,
    @InjectModel(WorkoutSession.name) private sessionModel: Model<WorkoutSession>,
  ) {}

  async createMetric(userId: string, input: CreateMetricInput) {
    return this.metricModel.create({
      userId,
      type: input.type,
      value: input.value,
      unit: input.unit,
      recordedAt: new Date(input.recordedAt),
      note: input.note,
    });
  }

  async getMetrics(userId: string, query: MetricQuery) {
    const filter: Record<string, unknown> = { userId };
    if (query.type) filter.type = query.type;
    if (query.from || query.to) {
      filter.recordedAt = {
        ...(query.from && { $gte: new Date(query.from) }),
        ...(query.to && { $lte: new Date(query.to) }),
      };
    }

    const [items, total] = await Promise.all([
      this.metricModel
        .find(filter)
        .sort({ recordedAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean(),
      this.metricModel.countDocuments(filter),
    ]);

    return { items, total, page: query.page, limit: query.limit, pages: Math.ceil(total / query.limit) };
  }

  async getLatestMetrics(userId: string) {
    const latest = await Promise.all(
      METRIC_TYPES.map((type) =>
        this.metricModel.findOne({ userId, type }).sort({ recordedAt: -1 }).lean(),
      ),
    );

    const result: Record<string, unknown> = {};
    METRIC_TYPES.forEach((type, i) => { result[type] = latest[i]; });

    const weight = latest[0]; // WEIGHT
    const height = latest[1]; // HEIGHT
    if (weight && height) {
      const weightKg = weight.unit === 'lbs' ? weight.value / 2.20462 : weight.value;
      const heightCm = height.unit === 'in' ? height.value * 2.54 : height.value;
      const bmi = calculateBMI(weightKg, heightCm);
      result['BMI'] = { value: bmi, category: getBMICategory(bmi) };
    }

    return result;
  }

  async deleteMetric(userId: string, metricId: string) {
    const metric = await this.metricModel.findById(metricId);
    if (!metric) throw new NotFoundException('Metric not found');
    if (metric.userId !== userId) throw new ForbiddenException();
    await this.metricModel.deleteOne({ _id: metricId });
  }

  async getSummary(userId: string) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [recentWeights, workoutsThisWeek] = await Promise.all([
      this.metricModel
        .find({ userId, type: 'WEIGHT', recordedAt: { $gte: sevenDaysAgo } })
        .sort({ recordedAt: 1 })
        .lean(),
      this.sessionModel.countDocuments({
        userId,
        completedAt: { $exists: true, $ne: null },
        startedAt: { $gte: sevenDaysAgo },
      }),
    ]);

    const weightTrend7d =
      recentWeights.length >= 2
        ? recentWeights[recentWeights.length - 1].value - recentWeights[0].value
        : null;

    return { weightTrend7d, workoutsThisWeek };
  }
}
