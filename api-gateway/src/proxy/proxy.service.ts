import {
  Injectable,
  BadGatewayException,
  Logger,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { ServicesConfig } from "../config/services.config";

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  constructor(
    private httpService: HttpService,
    private servicesConfig: ServicesConfig
  ) {}

  async forwardRequest(
    method: string,
    path: string,
    body?: any,
    headers?: any
  ): Promise<any> {
    const serviceUrl = this.servicesConfig.getServiceUrl(path);

    if (!serviceUrl) {
      throw new BadGatewayException("Service not found for this route");
    }

    // Strip /api/v1/{service} prefix from the path
    const routePrefix = this.servicesConfig.getRoutePrefix(path);
    let targetPath = path;

    if (routePrefix) {
    }

    const url = `${serviceUrl}${targetPath}`;

    const filteredHeaders = { ...headers };
    delete filteredHeaders["host"];
    delete filteredHeaders["content-length"];
    delete filteredHeaders["connection"];
    filteredHeaders["x-gateway-secret"] =
      process.env.GATEWAY_SECRET || "secure-gateway-secret";

    this.logger.log(`Forwarding ${method} request to ${url}`);

    try {
      const response = await firstValueFrom(
        this.httpService.request({
          method,
          url,
          data: body,
          headers: filteredHeaders,
          validateStatus: () => true, // <-- important
        })
      );

      return {
        data: response.data,
        headers: response.headers, // <-- return raw headers
        status: response.status,
      };
    } catch (error) {
      this.logger.error(`Error forwarding request to ${url}:`, error.message);
      throw new BadGatewayException(error.message || "Unknown proxy error");
    }
  }
}
