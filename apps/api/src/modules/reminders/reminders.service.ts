import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bull';
import { Model } from 'mongoose';
import { Queue } from 'bull';
import { Reminder } from '../../schemas/reminder.schema';
import { Notification } from '../../schemas/notification.schema';
import { User } from '../../schemas/user.schema';
import { CreateReminderInput, UpdateReminderInput } from '@workout-pro/shared';
import * as cronParser from 'cron-parser';

@Injectable()
export class RemindersService {
  constructor(
    @InjectModel(Reminder.name) private reminderModel: Model<Reminder>,
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectQueue('notifications') private notificationsQueue: Queue,
  ) {}

  async list(userId: string) {
    return this.reminderModel.find({ userId }).sort({ createdAt: -1 }).lean();
  }

  async create(userId: string, input: CreateReminderInput) {
    const user = await this.userModel.findById(userId).select('timezone').lean();
    const reminder = await this.reminderModel.create({ userId, ...input });
    await this.scheduleNext(reminder._id.toString(), reminder.cronExpr, reminder.scheduledAt, user?.timezone ?? 'UTC');
    return reminder;
  }

  async update(userId: string, id: string, input: UpdateReminderInput) {
    const reminder = await this.getOwned(userId, id);
    const user = await this.userModel.findById(userId).select('timezone').lean();

    const updated = await this.reminderModel.findByIdAndUpdate(id, { $set: input }, { new: true }).lean();
    if (!updated) throw new NotFoundException();

    if (input.cronExpr !== undefined || input.scheduledAt !== undefined) {
      await this.cancelScheduled(id);
      if (updated.isActive) {
        await this.scheduleNext(id, updated.cronExpr, updated.scheduledAt, user?.timezone ?? 'UTC');
      }
    }
    return updated;
  }

  async toggle(userId: string, id: string) {
    const reminder = await this.getOwned(userId, id);
    const user = await this.userModel.findById(userId).select('timezone').lean();

    const updated = await this.reminderModel
      .findByIdAndUpdate(id, { $set: { isActive: !reminder.isActive } }, { new: true })
      .lean();
    if (!updated) throw new NotFoundException();

    if (updated.isActive) {
      await this.scheduleNext(id, updated.cronExpr, updated.scheduledAt, user?.timezone ?? 'UTC');
    } else {
      await this.cancelScheduled(id);
    }
    return updated;
  }

  async delete(userId: string, id: string) {
    await this.getOwned(userId, id);
    await this.cancelScheduled(id);
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

  // ── Scheduling helpers ─────────────────────────────────────────────────────

  async scheduleNext(reminderId: string, cronExpr: string | undefined | null, scheduledAt: Date | undefined | null, timezone: string) {
    let fireAt: Date;
    if (cronExpr) {
      const interval = cronParser.parseExpression(cronExpr, { tz: timezone });
      fireAt = interval.next().toDate();
    } else if (scheduledAt) {
      fireAt = new Date(scheduledAt);
    } else {
      return;
    }

    const delay = fireAt.getTime() - Date.now();
    if (delay <= 0) return;

    await this.notificationsQueue.add(
      'fire-reminder',
      { reminderId },
      { delay, jobId: `reminder-${reminderId}`, removeOnComplete: true },
    );
  }

  async cancelScheduled(reminderId: string) {
    const job = await this.notificationsQueue.getJob(`reminder-${reminderId}`);
    if (job) await job.remove();
  }

  private async getOwned(userId: string, id: string) {
    const reminder = await this.reminderModel.findById(id).lean();
    if (!reminder) throw new NotFoundException('Reminder not found');
    if (reminder.userId !== userId) throw new ForbiddenException();
    return reminder;
  }
}
