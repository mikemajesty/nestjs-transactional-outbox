import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Kafka } from 'kafkajs';
import { name } from '../package.json';
import { TopicsProducerEnum } from '@/utils/topics';
import { MicroserviceOptions } from '@nestjs/microservices';
import { KafkaUtils } from '@/utils/kafka';
import 'dotenv/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);


  const kafkaMicroservice = app.connectMicroservice<MicroserviceOptions>(KafkaUtils.getKafkaConfig({ brokers: [process.env.KAFKA_BROKEN as string], clientId: name, groupId: name }));

  const config = new DocumentBuilder()
    .setTitle(name)
    .addBearerAuth()
    .setVersion('1.0')
    .addServer('http://localhost:4000')
    .addTag('Swagger Documentation')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await kafkaMicroservice.listen();
  await app.listen(process.env.port ?? 4000);
}
bootstrap();
