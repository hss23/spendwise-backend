import { IsString, IsEnum, IsOptional, IsBoolean, IsNumber, IsHexColor, MinLength, MaxLength, Min } from 'class-validator';
import { CategoryType } from '../schemas/category.schema';

export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  description?: string;

  @IsEnum(CategoryType)
  @IsOptional()
  type?: CategoryType;

  @IsHexColor()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  monthlyBudgetLimit?: number;
}

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(50)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  description?: string;

  @IsHexColor()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  monthlyBudgetLimit?: number;
}
