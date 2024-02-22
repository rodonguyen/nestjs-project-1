import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // validates incoming client payloads against some set of rules, which are typically defined using decorators in DTO (Data Transfer Object) classes.
  // The whitelist: true option means that the ValidationPipe will strip away any properties in the request payload that do not have any decorators associated with them in the DTO class
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );
  await app.listen(3333);
}
bootstrap();
