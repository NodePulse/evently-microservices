import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export interface ServiceRoute {
  prefix: string;
  target: string;
  requiresAuth: boolean;
}

@Injectable()
export class ServicesConfig {
  constructor(private configService: ConfigService) {}

  getRoutes(): ServiceRoute[] {
    return [
      {
        prefix: "/api/v1/user/auth",
        target: this.configService.get("USER_SERVICE_URL"),
        requiresAuth: false,
      },
      {
        prefix: "/api/v1/user/users",
        target: this.configService.get("USER_SERVICE_URL"),
        requiresAuth: true,
      },
      {
        prefix: "/api/v1/event/events",
        target: this.configService.get("EVENT_SERVICE_URL"),
        requiresAuth: false,
      },
      {
        prefix: "/api/v1/ticket/tickets",
        target: this.configService.get("TICKET_SERVICE_URL"),
        requiresAuth: true,
      },
      {
        prefix: "/api/v1/payment/payments",
        target: this.configService.get("PAYMENT_SERVICE_URL"),
        requiresAuth: true,
      },
    ];
  }

  getServiceUrl(path: string): string | null {
    const routes = this.getRoutes();
    const route = routes.find((r) => path.startsWith(r.prefix));
    return route ? route.target : null;
  }

  getRoutePrefix(path: string): string | null {
    const routes = this.getRoutes();
    const route = routes.find((r) => path.startsWith(r.prefix));
    return route ? route.prefix : null;
  }

  requiresAuth(path: string): boolean {
    const routes = this.getRoutes();
    const route = routes.find((r) => path.startsWith(r.prefix));
    return route ? route.requiresAuth : false;
  }
}
