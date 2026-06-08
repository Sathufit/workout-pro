import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ExerciseService } from './exercise.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('exercises')
@ApiBearerAuth()
@Controller('exercises')
export class ExerciseController {
  constructor(private exerciseService: ExerciseService) {}

  @Get()
  list(@CurrentUser() user: { id: string }, @Query() query: unknown) {
    return this.exerciseService.list(user.id, query);
  }

  @Get(':id')
  getById(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.exerciseService.getById(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() body: unknown) {
    return this.exerciseService.create(user.id, body);
  }

  @Patch(':id')
  update(@CurrentUser() user: { id: string }, @Param('id') id: string, @Body() body: unknown) {
    return this.exerciseService.update(user.id, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    await this.exerciseService.delete(user.id, id);
  }
}
