import { EmitInput } from '@/utils/kafka';
import { Kafka, Producer, ProducerRecord } from 'kafkajs';


export abstract class IProducerAdapter {
  producer!: Producer;
  abstract publish(payload: ProducerRecord): Promise<void>;
}
