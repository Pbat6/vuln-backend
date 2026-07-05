import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SettingsService } from './settings.service';

@Controller('settings')
@UseGuards(AuthGuard('jwt'))
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('theme')
  getTheme(@CurrentUser('id') userId: number) {
    return this.settingsService.getTheme(userId);
  }

  @Patch('theme')
  updateTheme(
    @CurrentUser('id') userId: number,
    @Body() body: Record<string, unknown>,
  ) {
    return this.settingsService.updateTheme(userId, body);
  }
}