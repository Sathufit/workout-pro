import {
  Controller, Get, Post, Delete, Body, Param, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NutritionService } from './nutrition.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('nutrition')
@ApiBearerAuth()
@Controller('nutrition')
export class NutritionController {
  constructor(private nutritionService: NutritionService) {}

  @Get('search')
  search(@Query('q') q: string) {
    return this.nutritionService.searchFood(q);
  }

  @Get('logs')
  async getLog(@CurrentUser() user: { id: string }, @Query('date') date?: string): Promise<unknown> {
    return this.nutritionService.getLog(user.id, date);
  }

  @Post('logs/items')
  addItem(
    @CurrentUser() user: { id: string },
    @Query('date') date: string | undefined,
    @Body() body: unknown,
  ) {
    return this.nutritionService.addItem(user.id, date, body);
  }

  @Delete('logs/:date/items/:itemId')
  @HttpCode(HttpStatus.OK)
  removeItem(
    @CurrentUser() user: { id: string },
    @Param('date') date: string,
    @Param('itemId') itemId: string,
  ) {
    return this.nutritionService.removeItem(user.id, date, itemId);
  }

  @Post('logs/goal')
  async updateGoal(
    @CurrentUser() user: { id: string },
    @Query('date') date: string | undefined,
    @Body() body: unknown,
  ): Promise<unknown> {
    return this.nutritionService.updateGoal(user.id, date, body);
  }

  @Get('summary')
  getSummary(
    @CurrentUser() user: { id: string },
    @Query('days') days?: string,
  ) {
    return this.nutritionService.getSummary(user.id, days ? parseInt(days, 10) : 7);
  }
}
