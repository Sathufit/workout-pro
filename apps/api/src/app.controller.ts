import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(@InjectConnection() private readonly db: Connection) {}

  @Public()
  @Get('health')
  healthCheck() {
    const dbState = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      db: dbState[this.db.readyState] ?? 'unknown',
      env: {
        mongoUri: process.env.MONGODB_URI ? 'set' : 'MISSING',
        jwtSecret: process.env.JWT_ACCESS_SECRET ? 'set' : 'MISSING',
        nodeEnv: process.env.NODE_ENV ?? 'not set',
      },
    };
  }
}
