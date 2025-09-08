
import { Injectable, Inject } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user._id };
    const access_token = this.jwtService.sign(payload);

    const expiresInSeconds = 7 * 24 * 60 * 60; // Default 7 days

    await this.cacheManager.set(`jwt:${user._id}:${access_token}`, access_token, expiresInSeconds);

    return {
      access_token,
    };
  }

  async logout(userId: string, token: string) {
    await this.cacheManager.del(`jwt:${userId}:${token}`);
  }
}
