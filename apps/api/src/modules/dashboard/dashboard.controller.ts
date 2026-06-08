import { Controller, Get, Patch, Body, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DashboardService, WidgetType, WidgetConfig } from './dashboard.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get()
  getDashboard(@CurrentUser() user: { id: string }) {
    return this.dashboardService.getDashboard(user.id);
  }

  @Patch('layout')
  updateLayout(@CurrentUser() user: { id: string }, @Body() body: { layout: WidgetConfig[] }) {
    return this.dashboardService.updateLayout(user.id, body.layout);
  }

  @Get('widgets/:type/data')
  getWidgetData(@CurrentUser() user: { id: string }, @Param('type') type: string) {
    return this.dashboardService.getWidgetData(user.id, type as WidgetType);
  }
}
