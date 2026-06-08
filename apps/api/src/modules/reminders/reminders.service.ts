import { Injectable, NotFoundException, ForbiddenException, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as cron from 'node-cron';
import { toZonedTime } from 'date-fns-tz';
import { getHours } from 'date-fns';
import { Reminder } from '../../schemas/reminder.schema';
import { Notification } from '../../schemas/notification.schema';
import { User } from '../../schemas/user.schema';
import { PushSubscription } from '../../schemas/push-subscription.schema';
import { CreateReminderInput, UpdateReminderInput } from '@workout-pro/shared';

@Injectable()
export class RemindersService implements OnModuleInit, OnModuleDestroy {
  private jobs = new Map<string, cron.ScheduledTask>();

  constructor(
    @InjectModel(Reminder.name) private reminderModel: Model<Reminder>,
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(PushSubscription.name) private pushSubModel: Model<PushSubscription>,
  ) {}

  async onModuleInit() {
    const reminders = await this.reminderModel.find({ isActive: true, cronExpr: { $exists: true, $ne: null } }).lean();
    for (const reminder of reminders) {
      this.schedule(reminder._id.toString(), reminder.cronExpr!, reminder.userId);
    }
  }

  onModuleDestroy() {
    for (const task of this.jobs.values()) task.stop();
    this.jobs.clear();
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────

  async list(userId: string) {
    return this.reminderModel.find({ userId }).sort({ createdAt: -1 }).lean();
  }

  async create(userId: string, input: CreateReminderInput) {
    const reminder = await this.reminderModel.create({ userId, ...input });
    if (reminder.isActive && reminder.cronExpr) {
      this.schedule(reminder._id.toString(), reminder.cronExpr, userId);
    }
    return reminder;
  }

  async update(userId: string, id: string, input: UpdateReminderInput) {
    await this.getOwned(userId, id);
    const updated = await this.reminderModel.findByIdAndUpdate(id, { $set: input }, { new: true }).lean();
    if (!updated) throw new NotFoundException();
    this.cancelJob(id);
    if (updated.isActive && updated.cronExpr) {
      this.schedule(id, updated.cronExpr, userId);
    }
    return updated;
  }

  async toggle(userId: string, id: string) {
    const reminder = await this.getOwned(userId, id);
    const updated = await this.reminderModel
      .findByIdAndUpdate(id, { $set: { isActive: !reminder.isActive } }, { new: true })
      .lean();
    if (!updated) throw new NotFoundException();
    this.cancelJob(id);
    if (updated.isActive && updated.cronExpr) {
      this.schedule(id, updated.cronExpr, userId);
    }
    return updated;
  }

  async delete(userId: string, id: string) {
    await this.getOwned(userId, id);
    this.cancelJob(id);
    await this.reminderModel.deleteOne({ _id: id });
  }

  // ── Notifications ──────────────────────────────────────────────────────────

  async getNotifications(userId: string, page = 1, limit = 20) {
    const [items, total, unreadCount] = await Promise.all([
      this.notificationModel.find({ userId }).sort({ sentAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.notificationModel.countDocuments({ userId }),
      this.notificationModel.countDocuments({ userId, isRead: false }),
    ]);
    return { items, total, unreadCount, page, limit, pages: Math.ceil(total / limit) };
  }

  async markRead(userId: string, notificationId: string) {
    const notif = await this.notificationModel.findById(notificationId);
    if (!notif || notif.userId !== userId) throw new NotFoundException();
    return this.notificationModel.findByIdAndUpdate(notificationId, { isRead: true, readAt: new Date() }, { new: true });
  }

  async markAllRead(userId: string) {
    await this.notificationModel.updateMany({ userId, isRead: false }, { isRead: true, readAt: new Date() });
  }

  // ── Scheduler ──────────────────────────────────────────────────────────────

  private schedule(reminderId: string, cronExpr: string, userId: string) {
    if (!cron.validate(cronExpr)) return;
    const task = cron.schedule(cronExpr, () => void this.fire(reminderId, userId));
    this.jobs.set(reminderId, task);
  }

  private cancelJob(reminderId: string) {
    this.jobs.get(reminderId)?.stop();
    this.jobs.delete(reminderId);
  }

  private async fire(reminderId: string, userId: string) {
    const [reminder, user] = await Promise.all([
      this.reminderModel.findById(reminderId).lean(),
      this.userModel.findById(userId).select('timezone profile').lean(),
    ]);
    if (!reminder || !reminder.isActive || !user) return;

    // Quiet hours check
    const prefs = (user.profile?.preferences ?? {}) as Record<string, unknown>;
    const quietStart = prefs.quietHoursStart as number | undefined;
    const quietEnd = prefs.quietHoursEnd as number | undefined;
    if (quietStart !== undefined && quietEnd !== undefined) {
      const localHour = getHours(toZonedTime(new Date(), user.timezone));
      const inQuiet =
        quietStart <= quietEnd
          ? localHour >= quietStart && localHour < quietEnd
          : localHour >= quietStart || localHour < quietEnd;
      if (inQuiet) return;
    }

    // Create in-app notification
    await this.notificationModel.create({
      userId,
      reminderId,
      title: reminder.title,
      body: reminder.message ?? '',
      channel: 'in_app',
    });

    // Push notification
    if (reminder.channels.includes('push')) {
      await this.sendPush(userId, reminder.title, reminder.message ?? '');
    }

    await this.reminderModel.updateOne({ _id: reminderId }, { lastFiredAt: new Date() });
  }

  private async sendPush(userId: string, title: string, body: string) {
    const subs = await this.pushSubModel.find({ userId }).lean();
    if (!subs.length) return;
    const webpush = await import('web-push');
    webpush.setVapidDetails(
      process.env.VAPID_EMAIL ?? 'mailto:dev@example.com',
      process.env.VAPID_PUBLIC_KEY ?? '',
      process.env.VAPID_PRIVATE_KEY ?? '',
    );
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title, body }),
        );
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 410 || status === 404) {
          await this.pushSubModel.deleteOne({ _id: sub._id });
        }
      }
    }
  }

  private async getOwned(userId: string, id: string) {
    const reminder = await this.reminderModel.findById(id).lean();
    if (!reminder) throw new NotFoundException('Reminder not found');
    if (reminder.userId !== userId) throw new ForbiddenException();
    return reminder;
  }
}
