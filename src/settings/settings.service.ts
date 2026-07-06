import { BadRequestException, Injectable } from '@nestjs/common';
// import { BadRequestException, Injectable } from '@nestjs/common';
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
  ) { }

  async getTheme(userId: number) {
    const settings = await this.getOrCreate(userId);
    return { theme: settings.theme_config };
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

    return { theme: settings.theme_config };
  }

  // async updateTheme(userId: number, payload: Record<string, unknown>) {
  //   this.rejectPrototypePollutionKeys(payload);

  //   const settings = await this.getOrCreate(userId);
  //   const base = {
  //     ...((settings.theme_config as Record<string, unknown>) ?? DEFAULT_THEME),
  //   };

  //   settings.theme_config = deepMerge(base, payload);
  //   await this.settingsRepo.save(settings);

  //   return { theme: settings.theme_config };
  // }

  // private rejectPrototypePollutionKeys(value: unknown): void {
  //   const blocked = new Set(['__proto__', 'constructor', 'prototype']);
  //   if (value === null || typeof value !== 'object' || Array.isArray(value)) return;

  //   for (const key of Object.keys(value as Record<string, unknown>)) {
  //     if (blocked.has(key)) {
  //       throw new BadRequestException('Invalid theme payload');
  //     }
  //     this.rejectPrototypePollutionKeys((value as Record<string, unknown>)[key]);
  //   }
  // }

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
}