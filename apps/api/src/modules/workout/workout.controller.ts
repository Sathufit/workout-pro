import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { WorkoutService } from './workout.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CreatePlanSchema, UpdatePlanSchema, PlanExerciseSchema,
  StartSessionSchema, LogSetSchema, CompleteSessionSchema,
  ReorderExercisesSchema,
} from '@workout-pro/shared';

@ApiTags('workout')
@ApiBearerAuth()
@Controller('workout')
export class WorkoutController {
  constructor(private workoutService: WorkoutService) {}

  // ── Plans ──────────────────────────────────────────────────────────────────

  @Get('plans')
  async listPlans(@CurrentUser() user: { id: string }) {
    const items = await this.workoutService.listPlans(user.id);
    return { items };
  }

  @Post('plans')
  createPlan(@CurrentUser() user: { id: string }, @Body() body: unknown) {
    return this.workoutService.createPlan(user.id, CreatePlanSchema.parse(body));
  }

  @Get('plans/:id')
  getPlan(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.workoutService.getPlan(user.id, id);
  }

  @Patch('plans/:id')
  updatePlan(@CurrentUser() user: { id: string }, @Param('id') id: string, @Body() body: unknown) {
    return this.workoutService.updatePlan(user.id, id, UpdatePlanSchema.parse(body));
  }

  @Delete('plans/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePlan(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    await this.workoutService.deletePlan(user.id, id);
  }

  @Post('plans/:id/duplicate')
  duplicatePlan(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.workoutService.duplicatePlan(user.id, id);
  }

  // ── Plan Exercises ─────────────────────────────────────────────────────────

  @Post('plans/:id/exercises')
  addExercise(@CurrentUser() user: { id: string }, @Param('id') planId: string, @Body() body: unknown) {
    return this.workoutService.addExerciseToPlan(user.id, planId, PlanExerciseSchema.parse(body));
  }

  @Patch('plans/:id/exercises/:exerciseId')
  updateExercise(
    @CurrentUser() user: { id: string },
    @Param('id') planId: string,
    @Param('exerciseId') exerciseId: string,
    @Body() body: unknown,
  ) {
    return this.workoutService.updatePlanExercise(user.id, planId, exerciseId, PlanExerciseSchema.partial().parse(body));
  }

  @Delete('plans/:id/exercises/:exerciseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeExercise(
    @CurrentUser() user: { id: string },
    @Param('id') planId: string,
    @Param('exerciseId') exerciseId: string,
  ) {
    await this.workoutService.removeExerciseFromPlan(user.id, planId, exerciseId);
  }

  @Patch('plans/:id/exercises/reorder')
  reorderExercises(@CurrentUser() user: { id: string }, @Param('id') planId: string, @Body() body: unknown) {
    const { order } = ReorderExercisesSchema.parse(body);
    return this.workoutService.reorderExercises(user.id, planId, order);
  }

  // ── Sessions ───────────────────────────────────────────────────────────────

  @Post('sessions')
  startSession(@CurrentUser() user: { id: string }, @Body() body: unknown) {
    return this.workoutService.startSession(user.id, StartSessionSchema.parse(body));
  }

  @Get('sessions')
  listSessions(@CurrentUser() user: { id: string }, @Query() query: unknown) {
    return this.workoutService.listSessions(user.id, query as Record<string, string>);
  }

  @Get('sessions/:id')
  getSession(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.workoutService.getSession(user.id, id);
  }

  @Delete('sessions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSession(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    await this.workoutService.deleteSession(user.id, id);
  }

  @Patch('sessions/:id')
  completeSession(@CurrentUser() user: { id: string }, @Param('id') id: string, @Body() body: unknown) {
    return this.workoutService.completeSession(user.id, id, CompleteSessionSchema.parse(body));
  }

  @Post('sessions/:id/sets')
  logSet(@CurrentUser() user: { id: string }, @Param('id') sessionId: string, @Body() body: unknown) {
    return this.workoutService.logSet(user.id, sessionId, LogSetSchema.parse(body));
  }

  @Delete('sessions/:id/sets/:setId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSet(
    @CurrentUser() user: { id: string },
    @Param('id') sessionId: string,
    @Param('setId') setId: string,
  ) {
    await this.workoutService.deleteSet(user.id, sessionId, setId);
  }

  // ── Progress ───────────────────────────────────────────────────────────────

  @Get('progress/:exerciseId')
  getExerciseProgress(@CurrentUser() user: { id: string }, @Param('exerciseId') exerciseId: string) {
    return this.workoutService.getExerciseProgress(user.id, exerciseId);
  }

  @Get('stats')
  getStats(@CurrentUser() user: { id: string }) {
    return this.workoutService.getStats(user.id);
  }
}
