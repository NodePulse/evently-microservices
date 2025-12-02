import { NestFactory } from '@nestjs/core';
import { UserModule } from './user.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(UserModule, {
    bodyParser: true,
    rawBody: true,
  });

  const configService = app.get(ConfigService);

  // Cookie parser middleware
  app.use(cookieParser());

  // Enable CORS
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Evently User Service')
    .setDescription('The User Service API for Evently application')
    .setVersion('1.0')
    .setTermsOfService('http://evently.com/terms/')
    .setContact(
      'Support Team',
      'http://evently.com/support',
      'support@evently.com',
    )
    .setLicense('Apache 2.0', 'http://www.apache.org/licenses/LICENSE-2.0.html')
    .addTag('Auth', 'Authentication endpoints')
    .addServer('http://localhost:3001', 'Local environment')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'Evently User Service API Docs',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: `
      .swagger-ui .topbar { background-color: #0f172a; }
      .swagger-ui .topbar a { display: none; }
      .swagger-ui .topbar .wrapper::after { content: 'Evently'; color: #ffffff; font-weight: 700; font-size: 1.5rem; margin-left: 10px; }
    `,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`User service is running on port ${port}`);
}
bootstrap();
