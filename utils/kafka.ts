import { KafkaOptions, Transport } from '@nestjs/microservices';
import { RetryOptions } from 'kafkajs';

export class KafkaUtils {
  static retry: RetryOptions = {
    retries: 5,
    initialRetryTime: 1000,
    maxRetryTime: 5000,
    multiplier: 2,
  };

  static getKafkaConfig = (input: KafkaIputConfig): KafkaOptions => {
    return {
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: input.clientId,
          brokers: input.brokers,
        },
        consumer: {
          allowAutoTopicCreation: true,
          groupId: input.groupId,
          sessionTimeout: 30000,
          readUncommitted: true,
          retry: KafkaUtils.retry
        },
        producer: {
          allowAutoTopicCreation: true,
        },
        subscribe: {
          fromBeginning: true,
        },
        run: { autoCommit: true },
      },
    };
  };
}

export type KafkaIputConfig = {
  clientId: string;
  brokers: string[];
  groupId: string;
};


export type EmitInput = {
  key?: string,
  value: unknown
  headers?: Record<string, string | number> & { "x-attempt"?: string | number }
};