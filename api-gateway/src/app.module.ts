import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { ProxyModule } from "./proxy/proxy.module";
import { AuthModule } from "./auth/auth.module";
import { HealthModule } from "./health/health.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.RATE_LIMIT_TTL || "60", 10) * 1000,
        limit: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
      },
    ]),
    ProxyModule,
    AuthModule,
    HealthModule,
  ],
})
export class AppModule {}
