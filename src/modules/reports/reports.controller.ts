import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('analytics')
  async getSpendingAnalytics(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }

    const dateRange = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };

    return this.reportsService.getSpendingAnalytics(req.user.userId, dateRange);
  }

  @Get('monthly-trends')
  async getMonthlyTrends(
    @Request() req,
    @Query('months') months?: string,
  ) {
    const monthsNumber = months ? parseInt(months, 10) : 12;
    return this.reportsService.getMonthlyTrends(req.user.userId, monthsNumber);
  }

  @Get('budget-performance')
  getBudgetPerformance(@Request() req) {
    return this.reportsService.getBudgetPerformance(req.user.userId);
  }

  @Get('goals-progress')
  getGoalsProgress(@Request() req) {
    return this.reportsService.getGoalsProgress(req.user.userId);
  }

  @Get('financial-health')
  getFinancialHealthScore(@Request() req) {
    return this.reportsService.getFinancialHealthScore(req.user.userId);
  }

  @Get('comparison')
  async getExpenseComparison(
    @Request() req,
    @Query('currentStart') currentStart: string,
    @Query('currentEnd') currentEnd: string,
    @Query('previousStart') previousStart: string,
    @Query('previousEnd') previousEnd: string,
  ) {
    if (!currentStart || !currentEnd || !previousStart || !previousEnd) {
      throw new BadRequestException('All date parameters are required');
    }

    const currentPeriod = {
      startDate: new Date(currentStart),
      endDate: new Date(currentEnd),
    };

    const previousPeriod = {
      startDate: new Date(previousStart),
      endDate: new Date(previousEnd),
    };

    return this.reportsService.getExpenseComparison(req.user.userId, currentPeriod, previousPeriod);
  }

  @Get('export')
  async exportData(
    @Request() req,
    @Query('format') format: 'CSV' | 'PDF',
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response,
  ) {
    if (!startDate || !endDate || !format) {
      throw new BadRequestException('startDate, endDate, and format are required');
    }

    if (!['CSV', 'PDF'].includes(format)) {
      throw new BadRequestException('Format must be CSV or PDF');
    }

    const dateRange = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };

    const buffer = await this.reportsService.exportData(req.user.userId, format, dateRange);

    const filename = `spendwise-report-${startDate}-to-${endDate}.${format.toLowerCase()}`;
    const contentType = format === 'CSV' ? 'text/csv' : 'application/pdf';

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }
}
