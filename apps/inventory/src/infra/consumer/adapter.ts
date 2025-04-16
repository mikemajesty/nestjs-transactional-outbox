import { EmitInput } from '@/utils/kafka';
import { Consumer, Kafka, Producer, ProducerRecord } from 'kafkajs';


export abstract class IConsumerAdapter {
  consumer!: Consumer;
}
