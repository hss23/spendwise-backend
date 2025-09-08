import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'spendwise-super-secret-key',
  signOptions: {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
}));
