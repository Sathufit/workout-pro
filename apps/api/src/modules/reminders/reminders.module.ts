import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { RemindersService } from './reminders.service';
import { RemindersController } from './reminders.controller';
import { RemindersProcessor } from './reminders.processor';
import { Reminder, ReminderSchema } from '../../schemas/reminder.schema';
import { Notification, NotificationSchema } from '../../schemas/notification.schema';
import { PushSubscription, PushSubscriptionSchema } from '../../schemas/push-subscription.schema';
import { User, UserSchema } from '../../schemas/user.schema';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'notifications' }),
    MongooseModule.forFeature([
      { name: Reminder.name, schema: ReminderSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: PushSubscription.name, schema: PushSubscriptionSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [RemindersService, RemindersProcessor],
  controllers: [RemindersController],
})
export class RemindersModule {}
