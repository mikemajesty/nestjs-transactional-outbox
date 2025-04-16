import { start } from '@/utils/tracing';
import { TopicsProducerEnum } from '@/utils/topics';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/module';
import { MicroserviceOptions } from '@nestjs/microservices';
import { KafkaUtils } from 'utils/kafka';
import 'dotenv/config';
import { name } from '../package.json';
import { Kafka } from 'kafkajs';
import { IInventoryRepository } from './core/repository/inventory';
import { InventoryEntity } from './core/entity/inventory';

async function bootstrap() {
  start()
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    KafkaUtils.getKafkaConfig({ brokers: [process.env.KAFKA_BROKEN as string], clientId: name, groupId: name })
  );

  const kafka = new Kafka({
    clientId: name,
    brokers: [process.env.KAFKA_BROKEN as string],
  });
  const admin = kafka.admin();
  await admin.connect();

  const existingTopics = await admin.listTopics();
  const topicsToCreate = [
    TopicsProducerEnum.VERIFIED_INVENTORY_ERROR_RETRY,
    TopicsProducerEnum.VERIFIED_INVENTORY_ERROR_MANUAL_INTERVATION,
  ].filter(topic => !existingTopics.includes(topic));

  if (topicsToCreate.length > 0) {
    await admin.createTopics({
      topics: topicsToCreate.map(topic => ({
        topic,
        numPartitions: 1,
        replicationFactor: 1,
      })),
      waitForLeaders: true,
    });
  }

  const repository = app.get(IInventoryRepository)

  const found = await repository.findOne({ productId: "508aeef7-f081-4e72-90d3-764bda7deb9b" })
  if (!found) {
    await repository.create(new InventoryEntity({ productId: "508aeef7-f081-4e72-90d3-764bda7deb9b", stock: 100 }))
  }

  await admin.disconnect();
  await admin.disconnect();
  await app.listen();
}
bootstrap();
