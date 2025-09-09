import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { GoalsService } from './goals.service';
import { CreateGoalDto, UpdateGoalDto, ContributeToGoalDto } from './dto/goal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  create(@Body() createGoalDto: CreateGoalDto, @Request() req) {
    return this.goalsService.create(createGoalDto, req.user.userId);
  }

  @Get()
  findAll(@Request() req, @Query('includeInactive') includeInactive?: string) {
    const includeInactiveBoolean = includeInactive === 'true';
    return this.goalsService.findAll(req.user.userId, includeInactiveBoolean);
  }

  @Get('summary')
  getSummary(@Request() req) {
    return this.goalsService.getGoalsSummary(req.user.userId);
  }

  @Get('progress')
  getProgress(@Request() req) {
    return this.goalsService.getGoalProgress(req.user.userId);
  }

  @Get('by-category')
  getByCategory(@Request() req) {
    return this.goalsService.getGoalsByCategory(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.goalsService.findOne(id, req.user.userId);
  }

  @Post(':id/contribute')
  contributeToGoal(
    @Param('id') id: string,
    @Body() contributeDto: ContributeToGoalDto,
    @Request() req,
  ) {
    return this.goalsService.contributeToGoal(id, contributeDto, req.user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateGoalDto: UpdateGoalDto,
    @Request() req,
  ) {
    return this.goalsService.update(id, updateGoalDto, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.goalsService.remove(id, req.user.userId);
  }
}
