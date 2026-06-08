import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RemindersService } from './reminders.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateReminderSchema, UpdateReminderSchema } from '@workout-pro/shared';

@ApiTags('reminders')
@ApiBearerAuth()
@Controller('reminders')
export class RemindersController {
  constructor(private remindersService: RemindersService) {}

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.remindersService.list(user.id);
  }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() body: unknown) {
    return this.remindersService.create(user.id, CreateReminderSchema.parse(body));
  }

  @Patch(':id')
  update(@CurrentUser() user: { id: string }, @Param('id') id: string, @Body() body: unknown) {
    return this.remindersService.update(user.id, id, UpdateReminderSchema.parse(body));
  }

  @Patch(':id/toggle')
  toggle(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.remindersService.toggle(user.id, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    await this.remindersService.delete(user.id, id);
  }

  // ── Notifications ──────────────────────────────────────────────────────────

  @Get('/notifications')
  getNotifications(
    @CurrentUser() user: { id: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.remindersService.getNotifications(
      user.id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Patch('/notifications/:id/read')
  markRead(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.remindersService.markRead(user.id, id);
  }

  @Post('/notifications/read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAllRead(@CurrentUser() user: { id: string }) {
    await this.remindersService.markAllRead(user.id);
  }
}
