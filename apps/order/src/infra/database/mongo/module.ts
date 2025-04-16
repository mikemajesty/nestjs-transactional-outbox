import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { red } from 'colorette';
import { Connection } from 'mongoose';

import { ILoggerAdapter, LoggerModule } from 'infra/logger';
import { ISecretsAdapter, SecretsModule } from 'infra/secrets';
import { ApiInternalServerException } from 'utils/exception';

import { name } from '../../../../package.json';
import { ConnectionName } from '../enum';
import { MongoService } from './service';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      connectionName: ConnectionName.ORDER,
      useFactory: ({ MONGO: { ORDER_URL } }: ISecretsAdapter, logger: ILoggerAdapter) => {
        const connection = new MongoService().getConnection({ URI: ORDER_URL });
        return {
          connectionFactory: async (connection: Connection) => {
            connection.on('disconnected', () => {
              logger.error(new ApiInternalServerException('mongo disconnected!'));
            });
            connection.on('reconnected', () => {
              logger.log(red('mongo reconnected!\n'));
            });
            connection.on('error', (error) => {
              logger.fatal(new ApiInternalServerException(error.message || error, { context: 'MongoConnection' }));
            });

            return connection;
          },
          uri: connection.uri,
          minPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 5000,
          readPreference: 'secondaryPreferred',
          appName: name
        };
      },
      inject: [ISecretsAdapter, ILoggerAdapter],
      imports: [SecretsModule, LoggerModule]
    })
  ]
})
export class MongoDatabaseModule {}
