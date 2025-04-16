// src/alert/alert.controller.ts
import { ILoggerAdapter } from '@/infra/logger';
import { Controller, Post, Body, Logger } from '@nestjs/common';

@Controller('alert')
export class AlertController {
  constructor(private readonly logger: ILoggerAdapter) {

  }

  @Post()
  handleAlert(@Body() body: any) {
    this.logger.warn({ message: '🔔 Alerta recebido:\n' + JSON.stringify(body, null, 2) });
    return { status: 'ok' };
  }
}
