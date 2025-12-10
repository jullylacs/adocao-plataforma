import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:3001', // porta do Next
    credentials: true,
  });

  await app.listen(3003); // ✔ garante que é a 3003
}
bootstrap();
