import { Module } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { ISecretsAdapter, SecretsModule } from '@/infra/secrets';

import { RedisService } from './service';

@Module({
  imports: [LoggerModule],
  providers: [
    {
      provide: RedisService,
      useFactory: async (logger: ILoggerAdapter) => {
        const client = createClient({ url: "redis://localhost:6379" }) as RedisClientType;
        const cacheService = new RedisService(logger, client);
        await cacheService.connect();
        return cacheService;
      },
      inject: [ILoggerAdapter]
    }
  ],
  exports: [RedisService]
})
export class RedisCacheModule {}