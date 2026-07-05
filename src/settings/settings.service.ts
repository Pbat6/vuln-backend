import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { deepMerge } from '../common/utils/deep-merge.util';
import { UserSettings } from '../entities/user-settings.entity';

const DEFAULT_THEME = {
  primaryColor: '#6366f1',
  darkMode: false,
  layout: { sidebar: true, compact: false },
};

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(UserSettings)
    private readonly settingsRepo: Repository<UserSettings>,
  ) {}

  async getTheme(userId: number) {
    const settings = await this.getOrCreate(userId);
    return {
      theme: settings.theme_config,
      isAdmin: this.resolveIsAdmin(),
    };
  }

  async updateTheme(userId: number, payload: Record<string, unknown>) {
    const settings = await this.getOrCreate(userId);
    const base = {
      ...((settings.theme_config as Record<string, unknown>) ?? DEFAULT_THEME),
    };

    settings.theme_config = this.sanitizeTheme(
      deepMerge(base, payload),
    );
    await this.settingsRepo.save(settings);

    return {
      theme: settings.theme_config,
      isAdmin: this.resolveIsAdmin(),
    };
  }

  private async getOrCreate(userId: number) {
    let settings = await this.settingsRepo.findOne({ where: { user_id: userId } });
    if (!settings) {
      settings = await this.settingsRepo.save(
        this.settingsRepo.create({
          user_id: userId,
          theme_config: { ...DEFAULT_THEME },
        }),
      );
    }
    return settings;
  }

  private sanitizeTheme(theme: Record<string, unknown>) {
    Reflect.deleteProperty(theme, '__proto__');
    Reflect.deleteProperty(theme, 'constructor');
    return theme;
  }

  private resolveIsAdmin() {
    const options = { role: 'user' } as Record<string, unknown>;
    return (options as { isAdmin?: boolean }).isAdmin === true;
  }
}