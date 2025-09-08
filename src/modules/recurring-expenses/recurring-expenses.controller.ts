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
import { RecurringExpensesService } from './recurring-expenses.service';
import { CreateRecurringExpenseDto, UpdateRecurringExpenseDto } from './dto/recurring-expense.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('recurring-expenses')
@UseGuards(JwtAuthGuard)
export class RecurringExpensesController {
  constructor(private readonly recurringExpensesService: RecurringExpensesService) {}

  @Post()
  create(@Body() createRecurringExpenseDto: CreateRecurringExpenseDto, @Request() req) {
    return this.recurringExpensesService.create(createRecurringExpenseDto, req.user.userId);
  }

  @Get()
  findAll(@Request() req) {
    return this.recurringExpensesService.findAll(req.user.userId);
  }

  @Get('upcoming')
  findUpcoming(@Request() req, @Query('days') days?: string) {
    const daysNumber = days ? parseInt(days, 10) : 7;
    return this.recurringExpensesService.findUpcoming(req.user.userId, daysNumber);
  }

  @Get('stats')
  getStats(@Request() req) {
    return this.recurringExpensesService.getStats(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.recurringExpensesService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRecurringExpenseDto: UpdateRecurringExpenseDto,
    @Request() req,
  ) {
    return this.recurringExpensesService.update(id, updateRecurringExpenseDto, req.user.userId);
  }

  @Post(':id/process')
  processRecurring(@Param('id') id: string, @Request() req) {
    return this.recurringExpensesService.processRecurring(id, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.recurringExpensesService.remove(id, req.user.userId);
  }
}
