import { Controller, Get } from "@nestjs/common";
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
} from "@nestjs/terminus";
import { ConfigService } from "@nestjs/config";

@Controller("health")
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private configService: ConfigService
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () =>
        this.http.pingCheck(
          "user-service",
          `${this.configService.get("USER_SERVICE_URL")}/health`
        ),
    ]);
  }

  @Get("gateway")
  getGatewayHealth() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "api-gateway",
    };
  }
}
