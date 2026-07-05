import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Role } from '../common/enums/role.enum';
import { UserSettings } from '../entities/user-settings.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(UserSettings)
    private readonly settingsRepo: Repository<UserSettings>,
  ) {}

  async create(data: { email: string; password: string; role: Role }) {
    const user = this.usersRepo.create({
      email: data.email,
      password_hash: await bcrypt.hash(data.password, 10),
      role: data.role,
    });
    const saved = await this.usersRepo.save(user);
    await this.settingsRepo.save(
      this.settingsRepo.create({
        user_id: saved.id,
        theme_config: { primaryColor: '#6366f1', darkMode: false },
      }),
    );
    return saved;
  }

  findByEmail(email: string) {
    return this.usersRepo.findOne({ where: { email } });
  }

  findById(id: number) {
    return this.usersRepo.findOne({ where: { id } });
  }

  findAll() {
    return this.usersRepo.find({
      select: { id: true, email: true, role: true, created_at: true },
      order: { id: 'ASC' },
    });
  }

  async remove(id: number) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.usersRepo.remove(user);
    return { deleted: true, id };
  }
}