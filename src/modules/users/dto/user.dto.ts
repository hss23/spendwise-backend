import { IsEmail, IsString, IsOptional, IsEnum, IsBoolean, MinLength } from 'class-validator';
import { Currency, SubscriptionPlan } from '../schemas/user.schema';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsEnum(Currency)
  preferredCurrency?: Currency;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEnum(Currency)
  preferredCurrency?: Currency;

  @IsOptional()
  @IsString()
  themePreference?: string;

  @IsOptional()
  @IsBoolean()
  notificationsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  budgetAlertsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  billRemindersEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  biometricEnabled?: boolean;

  @IsOptional()
  @IsString()
  pinCode?: string;
}

export class UpdateSubscriptionDto {
  @IsEnum(SubscriptionPlan)
  subscriptionPlan: SubscriptionPlan;

  @IsOptional()
  subscriptionExpiresAt?: Date;
}
