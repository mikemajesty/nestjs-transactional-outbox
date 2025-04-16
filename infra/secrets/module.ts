import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { ApiInternalServerException } from '../../utils/exception';
import { ZodInferSchema } from '../../utils/types';
import { InputValidator, ZodException, ZodExceptionIssue } from '../../utils/validator';

import { LogLevelEnum } from '../logger';
import { ISecretsAdapter } from './adapter';
import { SecretsService } from './service';
import { EnvEnum } from './types';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env']
    })
  ],
  providers: [
    {
      provide: ISecretsAdapter,
      useFactory: (config: ConfigService) => {
        const SecretsSchema = InputValidator.object<ZodInferSchema<ISecretsAdapter>>({
          ENV: InputValidator.nativeEnum(EnvEnum),
          IS_LOCAL: InputValidator.boolean(),
          IS_PRODUCTION: InputValidator.boolean(),
          LOG_LEVEL: InputValidator.nativeEnum(LogLevelEnum),
          DATE_FORMAT: InputValidator.string(),
          TZ: InputValidator.string(),
          POSTGRES: InputValidator.object({ INVENTORY_URL: InputValidator.string().url() }),
          MONGO: InputValidator.object({ ORDER_URL: InputValidator.string().url() }),
        });
        const secret = new SecretsService(config);

        try {
          SecretsSchema.parse(secret);
        } catch (error) {
          const zodError = error as ZodException;
          const message = zodError.issues
            .map((i: ZodExceptionIssue) => `${SecretsService.name}.${i.path.join('.')}: ${i.message}`)
            .join(',');
          throw new ApiInternalServerException(message);
        }

        return SecretsSchema.parse(secret);
      },
      inject: [ConfigService]
    }
  ],
  exports: [ISecretsAdapter]
})
export class SecretsModule {}
