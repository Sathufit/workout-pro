import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../schemas/user.schema';
import { HealthMetric } from '../../schemas/health-metric.schema';
import { WorkoutPlan } from '../../schemas/workout-plan.schema';
import { WorkoutSession } from '../../schemas/workout-session.schema';

export type WidgetType =
  | 'METRICS_SUMMARY'
  | 'WEEKLY_SCHEDULE'
  | 'RECENT_SESSIONS'
  | 'HYDRATION_TRACKER'
  | 'STREAK_COUNTER';

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  position: number;
  visible: boolean;
  config?: Record<string, unknown>;
}

const DEFAULT_LAYOUT: WidgetConfig[] = [
  { id: 'metrics', type: 'METRICS_SUMMARY', position: 0, visible: true },
  { id: 'schedule', type: 'WEEKLY_SCHEDULE', position: 1, visible: true },
  { id: 'sessions', type: 'RECENT_SESSIONS', position: 2, visible: true },
  { id: 'hydration', type: 'HYDRATION_TRACKER', position: 3, visible: true },
  { id: 'streak', type: 'STREAK_COUNTER', position: 4, visible: true },
];

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(HealthMetric.name) private metricModel: Model<HealthMetric>,
    @InjectModel(WorkoutPlan.name) private planModel: Model<WorkoutPlan>,
    @InjectModel(WorkoutSession.name) private sessionModel: Model<WorkoutSession>,
  ) {}

  async getDashboard(userId: string) {
    const user = await this.userModel.findById(userId).select('dashboardConfig').lean();
    const layout: WidgetConfig[] = (user?.dashboardConfig?.layout as WidgetConfig[]) ?? DEFAULT_LAYOUT;

    const visibleWidgets = layout.filter((w) => w.visible);
    const widgets = await Promise.all(
      visibleWidgets.map(async (widget) => ({
        ...widget,
        data: await this.getWidgetData(userId, widget.type),
      })),
    );

    return { layout, widgets };
  }

  async updateLayout(userId: string, layout: WidgetConfig[]) {
    return this.userModel.findByIdAndUpdate(
      userId,
      { $set: { 'dashboardConfig.layout': layout } },
      { new: true },
    ).select('dashboardConfig').lean();
  }

  async getWidgetData(userId: string, type: WidgetType) {
    switch (type) {
      case 'METRICS_SUMMARY': return this.getMetricsSummary(userId);
      case 'WEEKLY_SCHEDULE': return this.getWeeklySchedule(userId);
      case 'RECENT_SESSIONS': return this.getRecentSessions(userId);
      case 'HYDRATION_TRACKER': return this.getHydrationToday(userId);
      case 'STREAK_COUNTER': return this.getStreak(userId);
      default: return null;
    }
  }

  private async getMetricsSummary(userId: string) {
    return Promise.all(
      ['WEIGHT', 'CALORIES_CONSUMED', 'HYDRATION'].map((type) =>
        this.metricModel.findOne({ userId, type }).sort({ recordedAt: -1 }).lean(),
      ),
    );
  }

  private async getWeeklySchedule(userId: string) {
    return this.planModel
      .find({ userId, 'scheduleDays.0': { $exists: true } })
      .select('name scheduleDays')
      .lean();
  }

  private async getRecentSessions(userId: string) {
    return this.sessionModel
      .find({ userId, completedAt: { $exists: true, $ne: null } })
      .sort({ startedAt: -1 })
      .limit(5)
      .select('name startedAt completedAt')
      .lean();
  }

  private async getHydrationToday(userId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const entries = await this.metricModel.find({ userId, type: 'HYDRATION', recordedAt: { $gte: todayStart } }).lean();
    const total = entries.reduce((sum, e) => sum + e.value, 0);
    return { total, unit: entries[0]?.unit ?? 'ml', entries: entries.length };
  }

  private async getStreak(userId: string) {
    const sessions = await this.sessionModel
      .find({ userId, completedAt: { $exists: true, $ne: null } })
      .sort({ startedAt: -1 })
      .select('startedAt')
      .lean();

    if (!sessions.length) return { current: 0, best: 0 };

    let streak = 0, best = 0;
    let prevDate: Date | null = null;

    for (const s of sessions) {
      const date = new Date(s.startedAt);
      date.setHours(0, 0, 0, 0);
      if (!prevDate) { streak = 1; }
      else {
        const diff = (prevDate.getTime() - date.getTime()) / 86400000;
        if (diff === 1) streak++;
        else if (diff > 1) break;
      }
      prevDate = date;
      best = Math.max(best, streak);
    }
    return { current: streak, best };
  }
}
