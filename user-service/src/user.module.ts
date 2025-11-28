import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AuthController } from './auth/auth.controller';
import { AccountModule } from './account/account.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    AccountModule,
  ],
  controllers: [AuthController, HealthController],
  providers: [],
})
export class UserModule {}
