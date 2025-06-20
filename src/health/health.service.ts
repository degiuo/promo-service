import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class HealthService {
  constructor(
    private readonly configService: ConfigService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async checkHealth() {
    const mongoStatus = this.getMongoStatus();
    const appInfo = this.getAppInfo();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: appInfo.version,
      services: {
        mongodb: mongoStatus,
      },
    };
  }

  async checkReadiness() {
    const mongoReady = this.connection.readyState === 1;

    return {
      status: mongoReady ? 'ready' : 'not_ready',
      checks: {
        mongodb: mongoReady,
      },
    };
  }

  async checkLiveness() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }

  private getMongoStatus() {
    const state = this.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    
    return {
      status: states[state] || 'unknown',
      ready: state === 1,
    };
  }

  private getAppInfo() {
    return {
      name: this.configService.get('app.name'),
      version: this.configService.get('app.version'),
      description: this.configService.get('app.description'),
    };
  }
} 