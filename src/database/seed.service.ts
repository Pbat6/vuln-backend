import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Role } from '../common/enums/role.enum';
import { ExploreCache } from '../entities/explore-cache.entity';
import { UserSettings } from '../entities/user-settings.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(ExploreCache)
    private readonly exploreRepo: Repository<ExploreCache>,
    @InjectRepository(UserSettings)
    private readonly settingsRepo: Repository<UserSettings>,
  ) {}

  async onModuleInit() {
    await this.seedUser('admin@lab.local', 'admin123', Role.ADMIN, '#3b82f6');
    await this.seedUser('user@lab.local', 'user123', Role.USER, '#10b981');
    await this.seedExploreCache();
  }

  private async seedUser(
    email: string,
    password: string,
    role: Role,
    color: string,
  ) {
    if (await this.usersRepo.findOne({ where: { email } })) return;

    const user = await this.usersRepo.save(
      this.usersRepo.create({
        email,
        password_hash: await bcrypt.hash(password, 10),
        role,
      }),
    );
    await this.settingsRepo.save(
      this.settingsRepo.create({
        user_id: user.id,
        theme_config: { primaryColor: color, darkMode: false },
      }),
    );
    this.logger.log(`Seeded ${email} / ${password}`);
  }

  private async seedExploreCache() {
    if ((await this.exploreRepo.count()) > 0) return;

    const samples = [
      { picsum_id: '1', author: 'Picsum', width: 1920, height: 1080, tags: 'nature,landscape,mountain' },
      { picsum_id: '10', author: 'Picsum', width: 1920, height: 1080, tags: 'forest,trees,green' },
      { picsum_id: '20', author: 'Picsum', width: 1920, height: 1080, tags: 'ocean,beach,water' },
      { picsum_id: '30', author: 'Picsum', width: 1920, height: 1080, tags: 'city,urban,architecture' },
      { picsum_id: '40', author: 'Picsum', width: 1920, height: 1080, tags: 'sunset,sky,clouds' },
    ];
    await this.exploreRepo.save(samples);
    this.logger.log(`Seeded ${samples.length} explore cache entries`);
  }
}