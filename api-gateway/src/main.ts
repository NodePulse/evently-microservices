import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { LoggingInterceptor } from "./common/logging.interceptor";
import * as cookieParser from "cookie-parser";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ["log", "error", "warn", "debug", "verbose"],
  });

  // Cookie parser middleware
  app.use(cookieParser());

  // Global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    })
  );

  // CORS configuration
  app.enableCors({
    origin: [
      process.env.CORS_ORIGIN,
      "http://localhost:3000",
      "http://localhost:3001",
    ],
    credentials: true,
    exposedHeaders: ["set-cookie"],
  });

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle("API Gateway")
    .setDescription("The API Gateway for Evently Microservices")
    .setVersion("1.0")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  const port = process.env.PORT || 3100;
  await app.listen(port);
  console.log(`🚀 API Gateway running on port ${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/docs`);
}

bootstrap();
