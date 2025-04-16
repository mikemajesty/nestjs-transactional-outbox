import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ISecretsAdapter } from './adapter';
import { EnvEnum } from './types';

@Injectable()
export class SecretsService implements ISecretsAdapter {
  constructor(private readonly config: ConfigService) {}

  IS_LOCAL = this.config.get<EnvEnum>('NODE_ENV') === EnvEnum.LOCAL;

  IS_PRODUCTION = this.config.get<EnvEnum>('NODE_ENV') === EnvEnum.PRD;

  ENV = this.config.get<EnvEnum>('NODE_ENV') as string;

  LOG_LEVEL = this.config.get('LOG_LEVEL');

  DATE_FORMAT = this.config.get('DATE_FORMAT');

  TZ = this.config.get('TZ');

  POSTGRES = {
    INVENTORY_URL: `postgresql://${this.config.get('INVENTORY_POSTGRES_USER')}:${this.config.get(
      'INVENTORY_POSTGRES_PASSWORD'
    )}@${this.config.get('INVENTORY_POSTGRES_HOST')}:${this.config.get('INVENTORY_POSTGRES_PORT')}/${this.config.get('INVENTORY_POSTGRES_DATABASE')}`
  };

  MONGO = { ORDER_URL: this.config.get('ORDER_MONGO_URL') };
}
