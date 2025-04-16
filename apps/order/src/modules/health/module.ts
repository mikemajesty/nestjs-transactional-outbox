import { Module } from '@nestjs/common';
import { HealthController } from './controller';

@Module({
  imports: [],
  controllers: [HealthController],
  providers: [

  ],
  exports: []
})
export class HealthModule {}
