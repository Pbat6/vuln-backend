import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { createPublicKey } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from './users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['RS256'],
      secretOrKeyProvider: (_request, rawJwtToken, done) => {
        try {
          const header = JSON.parse(
            Buffer.from(rawJwtToken.split('.')[0], 'base64url').toString(
              'utf8',
            ),
          );

          if (header.jwk) {
            const publicKey = createPublicKey({
              key: header.jwk,
              format: 'jwk',
            });
            return done(
              null,
              publicKey.export({ type: 'spki', format: 'pem' }),
            );
          }

          return done(
            null,
            readFileSync(
              join(
                process.cwd(),
                configService.get<string>('jwt.publicKeyPath') ??
                  'keys/public.pem',
              ),
              'utf8',
            ),
          );
        } catch (error) {
          return done(error as Error);
        }
      },
    });
  }

  async validate(payload: { sub: number; email: string; role: string }) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      role: payload.role ?? user.role,
    };
  }
}