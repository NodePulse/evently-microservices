import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'user-service',
      uptime: process.uptime(),
    };
  }

  @Get()
  root() {
    return {
      message: 'User Service API',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        auth: {
          register: 'POST /auth/register',
          login: 'POST /auth/login',
          refresh: 'POST /auth/refresh',
          logout: 'POST /auth/logout',
          verifyOtp: 'POST /auth/verify-otp',
          resendOtp: 'POST /auth/resend-otp',
        },
        account: {
          profile: 'GET /account/profile',
          updateProfile: 'PATCH /account/profile',
        },
        firebase: {
          verifyToken: 'POST /auth/firebase/verify',
        },
      },
    };
  }
}
