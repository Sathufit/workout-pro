import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../schemas/user.schema';
import { UpdateProfileInput, UpdatePreferencesInput } from '@workout-pro/shared';

@Injectable()
export class ProfileService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async getProfile(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('id email name avatarUrl timezone unitSystem profile createdAt')
      .lean();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const update: Record<string, unknown> = {};
    if (input.name !== undefined) update.name = input.name;
    if (input.avatarUrl !== undefined) update.avatarUrl = input.avatarUrl;
    if (input.dateOfBirth !== undefined) update['profile.dateOfBirth'] = input.dateOfBirth;
    if (input.gender !== undefined) update['profile.gender'] = input.gender;
    if (input.fitnessGoal !== undefined) update['profile.fitnessGoal'] = input.fitnessGoal;
    if (input.activityLevel !== undefined) update['profile.activityLevel'] = input.activityLevel;

    return this.userModel
      .findByIdAndUpdate(userId, { $set: update }, { new: true })
      .select('id email name avatarUrl timezone unitSystem profile')
      .lean();
  }

  async updatePreferences(userId: string, input: UpdatePreferencesInput) {
    const update: Record<string, unknown> = {};
    if (input.timezone) update.timezone = input.timezone;
    if (input.unitSystem) update.unitSystem = input.unitSystem;

    // Merge into profile.preferences
    const prefUpdate: Record<string, unknown> = {};
    if (input.quietHoursStart !== undefined) prefUpdate['profile.preferences.quietHoursStart'] = input.quietHoursStart;
    if (input.quietHoursEnd !== undefined) prefUpdate['profile.preferences.quietHoursEnd'] = input.quietHoursEnd;
    if (input.notificationChannels !== undefined) {
      prefUpdate['profile.preferences.notificationChannels'] = input.notificationChannels;
    }

    return this.userModel
      .findByIdAndUpdate(userId, { $set: { ...update, ...prefUpdate } }, { new: true })
      .select('id timezone unitSystem profile')
      .lean();
  }

  async deleteAccount(userId: string) {
    await this.userModel.findByIdAndUpdate(userId, {
      isActive: false,
      email: `deleted_${userId}@deleted.invalid`,
    });
  }
}
