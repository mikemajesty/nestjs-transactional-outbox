import { Injectable } from '@nestjs/common';
import { RedisClientType, SetOptions } from 'redis';

import { ErrorType, ILoggerAdapter } from '@/infra/logger';
import { ApiInternalServerException } from '@/utils/exception';

@Injectable()
export class RedisService {
  client!: RedisClientType;

  constructor(
    private readonly logger: ILoggerAdapter,
    client: RedisClientType
  ) {
    this.client = client;
  }

  async connect(): Promise<RedisClientType> {
    try {
      await this.client.connect();
      this.logger.log('🎯 redis connected!\n');
      return this.client;
    } catch (error) {
      throw new ApiInternalServerException((error as { message: string }).message, {
        context: `${RedisService.name}/connect`
      });
    }
  }
}