import { Process, Processor } from '@nestjs/bull';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bull';
import { Model } from 'mongoose';
import { Job } from 'bull';
import { Queue } from 'bull';
import { Reminder } from '../../schemas/reminder.schema';
import { Notification } from '../../schemas/notification.schema';
import { PushSubscription } from '../../schemas/push-subscription.schema';
import { User } from '../../schemas/user.schema';
import * as cronParser from 'cron-parser';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { getHours } from 'date-fns';

interface FireReminderJob {
  reminderId: string;
}

@Processor('notifications')
export class RemindersProcessor {
  constructor(
    @InjectModel(Reminder.name) private reminderModel: Model<Reminder>,
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
    @InjectModel(PushSubscription.name) private pushSubModel: Model<PushSubscription>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectQueue('notifications') private notificationsQueue: Queue,
  ) {}

  @Process('fire-reminder')
  async handleFireReminder(job: Job<FireReminderJob>) {
    const { reminderId } = job.data;
    const reminder = await this.reminderModel.findById(reminderId).lean();
    if (!reminder || !reminder.isActive) return;

    const user = await this.userModel.findById(reminder.userId).select('timezone profile').lean();
    if (!user) return;

    const prefs = (user.profile?.preferences ?? {}) as Record<string, unknown>;
    const quietStart = prefs.quietHoursStart as number | undefined;
    const quietEnd = prefs.quietHoursEnd as number | undefined;

    // Quiet hours check in user's local time
    const userLocalTime = toZonedTime(new Date(), user.timezone);
    const localHour = getHours(userLocalTime);

    if (quietStart !== undefined && quietEnd !== undefined) {
      const inQuiet =
        quietStart <= quietEnd
          ? localHour >= quietStart && localHour < quietEnd
          : localHour >= quietStart || localHour < quietEnd;

      if (inQuiet) {
        const fireAt = fromZonedTime(
          new Date(
            userLocalTime.getFullYear(),
            userLocalTime.getMonth(),
            userLocalTime.getDate() + (localHour >= quietEnd ? 1 : 0),
            quietEnd, 0, 0,
          ),
          user.timezone,
        );
        const delay = fireAt.getTime() - Date.now();
        if (delay > 0) {
          await this.notificationsQueue.add('fire-reminder', { reminderId }, {
            delay, jobId: `reminder-${reminderId}-delayed`, removeOnComplete: true,
          });
        }
        return;
      }
    }

    await this.dispatch(reminder, reminder.userId);
    await this.reminderModel.updateOne({ _id: reminderId }, { lastFiredAt: new Date() });

    if (reminder.cronExpr) {
      const interval = cronParser.parseExpression(reminder.cronExpr, { tz: user.timezone });
      const nextFireAt = interval.next().toDate();
      const delay = nextFireAt.getTime() - Date.now();
      if (delay > 0) {
        await this.notificationsQueue.add('fire-reminder', { reminderId }, {
          delay, jobId: `reminder-${reminderId}`, removeOnComplete: true,
        });
      }
    }
  }

  private async dispatch(reminder: { _id: unknown; title: string; message?: string | null; channels: string[] }, userId: string) {
    const body = reminder.message ?? '';
    await this.notificationModel.create({
      userId, reminderId: reminder._id?.toString(), title: reminder.title, body, channel: 'in_app',
    });

    if (reminder.channels.includes('push')) {
      await this.sendWebPush(userId, reminder.title, body);
    }
  }

  private async sendWebPush(userId: string, title: string, body: string) {
    const subscriptions = await this.pushSubModel.find({ userId }).lean();
    const webpush = await import('web-push');
    webpush.setVapidDetails(
      process.env.VAPID_EMAIL ?? 'mailto:dev@example.com',
      process.env.VAPID_PUBLIC_KEY ?? '',
      process.env.VAPID_PRIVATE_KEY ?? '',
    );

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title, body }),
        );
      } catch (err: unknown) {
        if ((err as { statusCode?: number }).statusCode === 410 || (err as { statusCode?: number }).statusCode === 404) {
          await this.pushSubModel.deleteOne({ _id: sub._id });
        }
      }
    }
  }
}
