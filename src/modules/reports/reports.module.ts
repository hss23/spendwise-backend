import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Expense, ExpenseSchema } from '../expenses/schemas/expense.schema';
import { Budget, BudgetSchema } from '../budgets/schemas/budget.schema';
import { Goal, GoalSchema } from '../goals/schemas/goal.schema';
import { Transaction, TransactionSchema } from '../transactions/schemas/transaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Expense.name, schema: ExpenseSchema },
      { name: Budget.name, schema: BudgetSchema },
      { name: Goal.name, schema: GoalSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
