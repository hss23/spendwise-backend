
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Request } from 'express'; // Import Request from express

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
      passReqToCallback: true, // Pass the request to the validate method
    });
  }

  async validate(req: Request, payload: any) { // Add req as the first argument
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req); // Get the raw token from the request

    // Check if the token exists in Redis
    const storedToken = await this.cacheManager.get(`jwt:${payload.sub}:${token}`);

    if (!storedToken) {
      throw new UnauthorizedException('Token invalidated or expired');
    }

    return { userId: payload.sub, email: payload.email };
  }
}
