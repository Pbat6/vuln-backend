import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Role } from '../common/enums/role.enum';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { UsersService } from './users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const user = await this.usersService.create({
      email: dto.email,
      password: dto.password,
      role: Role.USER,
    });

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      access_token: await this.signToken(user.id, user.email, user.role),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.password_hash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      access_token: await this.signToken(user.id, user.email, user.role),
    };
  }

  async getProfile(userId: number) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
    };
  }

  private async signToken(id: number, email: string, role: Role) {
    const privateKey = readFileSync(
      join(
        process.cwd(),
        this.configService.get<string>('jwt.privateKeyPath') ??
          'keys/private.pem',
      ),
      'utf8',
    );

    return this.jwtService.signAsync(
      { sub: id, email, role },
      {
        algorithm: 'RS256',
        privateKey,
        expiresIn: (this.configService.get<string>('jwt.expiresIn') ??
          '24h') as `${number}h`,
      },
    );
  }
}