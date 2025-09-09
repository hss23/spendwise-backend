import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsDateString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsUrl,
  IsArray,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { GoalCategory, GoalStatus } from '../schemas/goal.schema';

export class CreateGoalDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0.01)
  targetAmount: number;

  @IsDateString()
  @IsOptional()
  deadline?: string;

  @IsEnum(GoalCategory)
  @IsOptional()
  category?: GoalCategory;

  @IsNumber()
  @IsOptional()
  @Min(0)
  monthlyTarget?: number;

  @IsBoolean()
  @IsOptional()
  notificationsEnabled?: boolean;

  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;

  @IsBoolean()
  @IsOptional()
  autoSave?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0.01)
  autoSaveAmount?: number;

  @IsString()
  @IsOptional()
  autoSaveFrequency?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class UpdateGoalDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsNumber()
  @IsOptional()
  @Min(0.01)
  targetAmount?: number;

  @IsDateString()
  @IsOptional()
  deadline?: string;

  @IsEnum(GoalCategory)
  @IsOptional()
  category?: GoalCategory;

  @IsEnum(GoalStatus)
  @IsOptional()
  status?: GoalStatus;

  @IsNumber()
  @IsOptional()
  @Min(0)
  monthlyTarget?: number;

  @IsBoolean()
  @IsOptional()
  notificationsEnabled?: boolean;

  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;

  @IsBoolean()
  @IsOptional()
  autoSave?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0.01)
  autoSaveAmount?: number;

  @IsString()
  @IsOptional()
  autoSaveFrequency?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class ContributeToGoalDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  note?: string;
}
