import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { RedisClientType } from 'redis';

import { ErrorType, ILoggerAdapter } from '@/infra/logger';
import { ApiInternalServerException } from '@/utils/exception';

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(
    private readonly logger: ILoggerAdapter,
    readonly client: RedisClientType
  ) {}

  async connect(): Promise<RedisClientType> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
        this.logger.log('🎯 Redis connected!\n');
      }
      return this.client;
    } catch (error) {
      throw new ApiInternalServerException((error as { message: string }).message, {
        context: `${RedisService.name}/connect`
      });
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.quit();
      this.logger.log('🔌 Redis connection closed.\n');
    }
  }
}
