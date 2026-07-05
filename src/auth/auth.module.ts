import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSettings } from '../entities/user-settings.entity';
import { User } from '../entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserSettings]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        signOptions: {
          algorithm: 'RS256' as const,
          expiresIn: (config.get<string>('jwt.expiresIn') ?? '24h') as `${number}h`,
        },
      }),
    }),
  ],
  controllers: [AuthController, UsersController],
  providers: [AuthService, UsersService, JwtStrategy],
  exports: [AuthService, UsersService, JwtModule, PassportModule],
})
export class AuthModule {}