import { NestFactory } from '@nestjs/core';
import { UserModule } from './user.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(UserModule, {
    bodyParser: true,
    rawBody: true,
  });

  // Cookie parser middleware
  app.use(cookieParser());

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`User service is running on port ${port}`);
}
bootstrap();
