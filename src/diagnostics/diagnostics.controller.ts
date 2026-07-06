import { Controller, Get, Post } from '@nestjs/common';
import { DiagnosticsService } from './diagnostics.service';

@Controller('diagnostics')
export class DiagnosticsController {
  constructor(private readonly diagnosticsService: DiagnosticsService) {}

  @Get()
  pingRemoteMonitor() {
    return this.diagnosticsService.pingRemoteMonitor();
  }
}