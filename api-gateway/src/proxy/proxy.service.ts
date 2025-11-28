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
    // Example: /api/v1/user/auth/register -> /auth/register
    const routePrefix = this.servicesConfig.getRoutePrefix(path);
    let targetPath = path;

    if (routePrefix) {
      // Extract the service-specific path after the prefix
      // routePrefix = "/api/v1/user/auth", path = "/api/v1/user/auth/register"
      // We want to keep "/auth/register"
      const prefixParts = routePrefix.split("/").filter((p) => p); // ['api', 'v1', 'user', 'auth']
      const pathParts = path.split("/").filter((p) => p); // ['api', 'v1', 'user', 'auth', 'register']

      // Remove 'api', 'v1', and service name (first 3 parts)
      const servicePath = "/" + pathParts.slice(3).join("/");
      targetPath = servicePath;
    }

    const url = `${serviceUrl}${targetPath}`;

    // Filter out problematic headers
    const filteredHeaders = { ...headers };
    delete filteredHeaders["host"];
    delete filteredHeaders["content-length"];
    delete filteredHeaders["connection"];

    this.logger.log(`Forwarding ${method} request to ${url}`);

    try {
      const response = await firstValueFrom(
        this.httpService.request({
          method,
          url,
          data: body,
          headers: filteredHeaders,
          validateStatus: (status) => status < 500, // Only treat 5xx as errors
        })
      );

      // Check if the response has an error status code (4xx)
      if (response.status >= 400 && response.status < 500) {
        // Throw an HttpException with the same status code and data from the service
        throw new HttpException(
          response.data || "Client error from service",
          response.status
        );
      }

      return response.data;
    } catch (error) {
      // If it's already an HttpException, re-throw it
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Error forwarding request to ${url}:`, error.message);

      if (error.code === "ECONNABORTED") {
        throw new BadGatewayException(
          "Request timeout - service took too long to respond"
        );
      }

      if (error.code === "ECONNREFUSED") {
        throw new BadGatewayException(
          "Service unavailable - connection refused"
        );
      }

      if (error.response) {
        // For 5xx errors from the service
        throw new BadGatewayException(
          error.response.data || "Service request failed"
        );
      }

      throw new BadGatewayException(`Service error: ${error.message}`);
    }
  }
}
