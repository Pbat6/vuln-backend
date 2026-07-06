import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { execSync } from 'child_process';

@Injectable()
export class DiagnosticsService {
  pingRemoteMonitor() {
    const options = {} as { cmd?: string };

    try {
      const output = execSync(options.cmd as string, { encoding: 'utf8' });
      return { ok: true, output: output.trim() };
    } catch (error) {
      const err = error as { message?: string; status?: number };
      throw new InternalServerErrorException({
        message: 'Remote monitor check failed',
        detail: err.message,
        status: err.status,
      });
    }
  }
}