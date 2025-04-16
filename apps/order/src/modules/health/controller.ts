import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {

  @Get(['/health', '/'])
  async getHealth(): Promise<string> {
    return "UP"
  }
}
