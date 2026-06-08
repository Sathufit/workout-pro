import { Controller, Get, Patch, Delete, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateProfileSchema, UpdatePreferencesSchema } from '@workout-pro/shared';

@ApiTags('profile')
@ApiBearerAuth()
@Controller('profile')
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Get()
  getProfile(@CurrentUser() user: { id: string }) {
    return this.profileService.getProfile(user.id);
  }

  @Patch()
  updateProfile(@CurrentUser() user: { id: string }, @Body() body: unknown) {
    const input = UpdateProfileSchema.parse(body);
    return this.profileService.updateProfile(user.id, input);
  }

  @Patch('preferences')
  updatePreferences(@CurrentUser() user: { id: string }, @Body() body: unknown) {
    const input = UpdatePreferencesSchema.parse(body);
    return this.profileService.updatePreferences(user.id, input);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(@CurrentUser() user: { id: string }) {
    await this.profileService.deleteAccount(user.id);
  }
}
