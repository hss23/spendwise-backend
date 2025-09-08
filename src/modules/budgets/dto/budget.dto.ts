import { IsString, IsNotEmpty, IsNumber, IsDateString } from 'class-validator';

export class CreateBudgetDto {
  @IsString()
  @IsNotEmpty()
  category: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;
}

export class UpdateBudgetDto {
  @IsString()
  category?: string;

  @IsNumber()
  amount?: number;

  @IsDateString()
  startDate?: string;

  @IsDateString()
  endDate?: string;
}
