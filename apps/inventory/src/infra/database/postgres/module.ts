import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import path from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';


import { name } from '../../../../package.json';
import { PostgresService } from './service';
import { ISecretsAdapter, SecretsModule } from 'infra/secrets';
import { InventorySchema } from './schemas/inventory';
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: ({ POSTGRES: { INVENTORY_URL }, IS_LOCAL }: ISecretsAdapter) => {
        const conn = new PostgresService().getConnection({ URI: INVENTORY_URL });
        return {
          ...conn,
          timeout: 5000,
          connectTimeout: 5000,
          logging: true,
          autoLoadEntities: true,
          namingStrategy: new SnakeNamingStrategy(),
          synchronize: true,
          migrationsTableName: 'migrations',
          migrations: [path.join(__dirname, '/migrations/*.{ts,js}')],
          entities: [InventorySchema],
          applicationName: name,
          extra: {
            connectionTimeoutMillis: 10000,
            idleTimeoutMillis: 30000,
            max: 90,
            min: 10
          }
        };
      },
      async dataSourceFactory(options) {
        const dataSource = new DataSource(options as DataSourceOptions);
        return dataSource.initialize();
      },
      imports: [SecretsModule],
      inject: [ISecretsAdapter]
    })
  ]
})
export class PostgresDatabaseModule {}
