import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Anthropic from '@anthropic-ai/sdk';
import { WorkoutSession } from '../../schemas/workout-session.schema';
import { HealthMetric } from '../../schemas/health-metric.schema';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable()
export class AiService {
  private client: Anthropic;

  constructor(
    @InjectModel(WorkoutSession.name) private sessionModel: Model<WorkoutSession>,
    @InjectModel(HealthMetric.name) private metricModel: Model<HealthMetric>,
  ) {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async chat(userId: string, message: string, history: ChatMessage[]): Promise<string> {
    const context = await this.buildContext(userId);

    const systemPrompt = `You are a personal fitness AI assistant inside WorkoutPro, a workout tracking app. Be concise, practical, and encouraging. Use the user's actual data when relevant.

${context}

Guidelines:
- Keep answers to 2-4 sentences unless the user asks for detail
- Reference the user's actual workout history, metrics, and goals when relevant
- For exercise questions, give form cues and weight progression advice
- For nutrition, give simple actionable advice
- Never make up data — if you don't know something, say so`;

    const messages = [
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: message },
    ];

    const response = await this.client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: systemPrompt,
      messages,
    });

    const block = response.content[0];
    return block.type === 'text' ? block.text : '';
  }

  private async buildContext(userId: string): Promise<string> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [recentSessions, weightMetrics, heightMetric, bodyFatMetric] = await Promise.all([
      this.sessionModel
        .find({ userId })
        .sort({ startedAt: -1 })
        .limit(5)
        .lean(),
      this.metricModel
        .find({ userId, type: 'WEIGHT', recordedAt: { $gte: sevenDaysAgo } })
        .sort({ recordedAt: -1 })
        .limit(7)
        .lean(),
      this.metricModel.findOne({ userId, type: 'HEIGHT' }).sort({ recordedAt: -1 }).lean(),
      this.metricModel.findOne({ userId, type: 'BODY_FAT' }).sort({ recordedAt: -1 }).lean(),
    ]);

    const lines: string[] = [];

    // Health metrics
    const latestWeight = weightMetrics[0];
    if (latestWeight || heightMetric || bodyFatMetric) {
      lines.push('## User Health Metrics');
      if (latestWeight) lines.push(`- Weight: ${latestWeight.value} ${latestWeight.unit}`);
      if (heightMetric) lines.push(`- Height: ${heightMetric.value} ${heightMetric.unit}`);
      if (latestWeight && heightMetric) {
        const wKg = latestWeight.unit === 'lbs' ? latestWeight.value / 2.20462 : latestWeight.value;
        const hM = (heightMetric.unit === 'in' ? heightMetric.value * 2.54 : heightMetric.value) / 100;
        const bmi = wKg / (hM * hM);
        const cat = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese';
        lines.push(`- BMI: ${bmi.toFixed(1)} (${cat})`);
      }
      if (bodyFatMetric) lines.push(`- Body fat: ${bodyFatMetric.value}%`);
      if (weightMetrics.length >= 2) {
        const trend = weightMetrics[0].value - weightMetrics[weightMetrics.length - 1].value;
        lines.push(`- 7-day weight trend: ${trend > 0 ? '+' : ''}${trend.toFixed(1)} kg`);
      }
    }

    // Recent sessions
    if (recentSessions.length > 0) {
      lines.push('\n## Recent Workout Sessions');
      for (const s of recentSessions) {
        const date = new Date(s.startedAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const sets = s.sets as Array<{ exerciseName?: string; exerciseId: string; reps?: number; weight?: number; setNumber: number }>;
        const status = s.completedAt ? 'completed' : 'in progress';

        // Unique exercises
        const exMap = new Map<string, { name: string; sets: typeof sets }>();
        for (const set of sets) {
          const key = set.exerciseId;
          if (!exMap.has(key)) exMap.set(key, { name: set.exerciseName ?? 'Exercise', sets: [] });
          exMap.get(key)!.sets.push(set);
        }

        lines.push(`- **${s.name}** (${date}, ${status}): ${sets.length} sets across ${exMap.size} exercises`);
        for (const [, ex] of exMap) {
          const bestSet = ex.sets.reduce((best, cur) =>
            (cur.weight ?? 0) > (best.weight ?? 0) ? cur : best, ex.sets[0]);
          const detail = [
            bestSet.reps && `${bestSet.reps} reps`,
            bestSet.weight && `@ ${bestSet.weight} kg`,
          ].filter(Boolean).join(' ');
          lines.push(`  - ${ex.name}: ${ex.sets.length} sets${detail ? ` (best: ${detail})` : ''}`);
        }
      }
    } else {
      lines.push('\n## Recent Workout Sessions\nNo sessions logged yet.');
    }

    return lines.join('\n');
  }
}
