import { Controller, Get } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { HealthService } from '@health/health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @MessagePattern('health.check')
  async checkHealth() {
    return this.healthService.checkHealth();
  }

  @Get('ready')
  @MessagePattern('health.ready')
  async checkReadiness() {
    return this.healthService.checkReadiness();
  }

  @Get('live')
  @MessagePattern('health.live')
  async checkLiveness() {
    return this.healthService.checkLiveness();
  }
} 