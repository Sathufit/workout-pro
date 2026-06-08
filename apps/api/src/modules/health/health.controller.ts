import {
  Controller, Get, Post, Delete, Body, Param, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateMetricSchema, MetricQuerySchema } from '@workout-pro/shared';

@ApiTags('health')
@ApiBearerAuth()
@Controller('health')
export class HealthController {
  constructor(private healthService: HealthService) {}

  @Post('metrics')
  createMetric(@CurrentUser() user: { id: string }, @Body() body: unknown) {
    const input = CreateMetricSchema.parse(body);
    return this.healthService.createMetric(user.id, input);
  }

  @Get('metrics')
  getMetrics(@CurrentUser() user: { id: string }, @Query() query: unknown) {
    const parsed = MetricQuerySchema.parse(query);
    return this.healthService.getMetrics(user.id, parsed);
  }

  @Get('metrics/latest')
  getLatestMetrics(@CurrentUser() user: { id: string }) {
    return this.healthService.getLatestMetrics(user.id);
  }

  @Delete('metrics/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMetric(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    await this.healthService.deleteMetric(user.id, id);
  }

  @Get('summary')
  getSummary(@CurrentUser() user: { id: string }) {
    return this.healthService.getSummary(user.id);
  }
}
