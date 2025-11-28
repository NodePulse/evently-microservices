import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ProxyController } from "./proxy.controller";
import { ProxyService } from "./proxy.service";
import { ServicesConfig } from "../config/services.config";
import { AuthModule } from "../auth/auth.module";
import { ResponseBuilderService } from "../common/encryption.service";

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000, // 30 seconds
      maxRedirects: 5,
      maxContentLength: 10 * 1024 * 1024, // 10MB
      maxBodyLength: 10 * 1024 * 1024, // 10MB
    }),
    AuthModule,
  ],
  controllers: [ProxyController],
  providers: [ProxyService, ServicesConfig, ResponseBuilderService],
})
export class ProxyModule {}
