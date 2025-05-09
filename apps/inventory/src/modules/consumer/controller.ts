import { Controller, Get, OnModuleInit } from '@nestjs/common';
import { TopicsProducerEnum } from '@/utils/topics';
import { ApiInternalServerException, ApiNotFoundException, ApiUnprocessableEntityException, BaseException } from '@/utils/exception';
import { KafkaMessage } from 'kafkajs';
import { IProducerAdapter } from '@/inventory/infra/producer/adapter';
import { IConsumerAdapter } from '@/inventory/infra/consumer/adapter';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { MetricsService } from './metrics';
import { name } from '../../../package.json';
import CircuitBreaker from 'opossum';
import { IInventoryRepository } from '@/inventory/core/repository/inventory';
import { HttpService } from '@nestjs/axios';
import { OutboxEntity, OutboxStatus } from '@/order/core/entity/outbox';
import { firstValueFrom } from 'rxjs';
import { Logger } from '@nestjs/common';
import { RedisService } from '@/infra/redis/service';

@Controller()
export class ConsumerController implements OnModuleInit {
  logger = new Logger(ConsumerController.name);
  private errorCircuitBreaker!: CircuitBreaker;

  constructor(
    private readonly producerVerifyInventoty: IProducerAdapter,
    private readonly consumerVerifyInventoty: IConsumerAdapter,
    private readonly eventEmitter: EventEmitter2,
    private readonly metricsService: MetricsService,
    private readonly inventoryRepository: IInventoryRepository,
    private readonly httpService: HttpService,
    private readonly redis: RedisService
  ) {
    this.errorCircuitBreaker = new CircuitBreaker(this.execute.bind(this), {
      timeout: 6000000,
      errorThresholdPercentage: 50,
      resetTimeout: 5000,
      name: "ConsumerController"
    });
    this.errorCircuitBreaker.on("halfOpen", () => this.halfOpenEvent());
    this.errorCircuitBreaker.on("close", () => this.closeEvent());
    this.errorCircuitBreaker.on("open", () => this.openEvent());
    this.errorCircuitBreaker.fallback((input: OutboxEntity, err: BaseException) => this.fallback(input, err));
  }

  async onModuleInit() {
    await this.initializeKafkaConsumer()

    await this.consumerVerifyInventoty.consumer.run({
      eachMessage: async ({ message, heartbeat }) => {
        await this.processInventory(message);
        await heartbeat();
      },
    }).catch(async error => {
      console.error('Kafka consumer crashed', error)
      await this.consumerVerifyInventoty.consumer.disconnect()
      await this.initializeKafkaConsumer()
    });
  }

  async processInventory(message: KafkaMessage): Promise<void> {
    const outbox = JSON.parse(message.value?.toString("utf-8") as string)


    const entity = new OutboxEntity(outbox)
    const exists = await this.getIdempotence(entity)

    if (exists) {
      return
    }

    const OUTBOX_URL = `http://localhost:4000/outbox/${entity.id}`;

    this.logger.warn(`[${entity.id}] Tentativa número ${entity.retryCount}`);
    if (entity.retryCount) {
      const delay = this.getExponentialDelay(entity.retryCount);
      await this.sleep(delay);
    }

    const result = await this.errorCircuitBreaker.fire(entity);
    if (result === 'success') {
      await firstValueFrom(
        this.httpService.put(OUTBOX_URL, { status: OutboxStatus.processed } as OutboxEntity)
      );
    }

    if (result === "error") {
      await firstValueFrom(
        this.httpService.put(OUTBOX_URL, { status: OutboxStatus.failed } as OutboxEntity)
      );
    }
  }

  async fallback(message: OutboxEntity, err: BaseException): Promise<string> {
    const statusCode = err?.['status'] || ApiInternalServerException.STATUS;

    if (this.isRetryable(statusCode)) {
      const url = `http://localhost:4000/outbox/${message.id}`
      if (message?.retryCount < 5) {
        message.increment()
        this.metricsService.incrementRetryAttempt(statusCode);
        this.metricsService.incrementRetryCount(name);
        await firstValueFrom(
          this.httpService.put(url, { retryCount: message.retryCount } as OutboxEntity)
        );
        return "retry";
      }

      this.metricsService.incrementMaxRetries(name);
      this.eventEmitter.emit('retry.max_reached', message);
      return "error";
    }

    this.metricsService.recordManualIntervention(
      err.constructor.name,
      statusCode
    );
    this.eventEmitter.emit('manual.intervention', { input: message, error: err });
    return "error";
  }

  private async execute(message: OutboxEntity): Promise<string> {
    const found = await this.inventoryRepository.findOne({ productId: message.payload.id })
    if (!found) {
      throw new ApiNotFoundException(`product: ${message.payload.id} not found.`);
    }

    if (found.stock < 1) {
      throw new ApiUnprocessableEntityException(`product: ${message.payload.id} without stock.`)
    }

    return "success";
  }

  @OnEvent('retry.max_reached')
  async handleMaxRetries(input: OutboxEntity) {
    await this.producerVerifyInventoty.publish({
      messages: [{
        value: JSON.stringify(input),
      }],
      topic: TopicsProducerEnum.VERIFIED_INVENTORY_ERROR_RETRY,
    });
  }

  @OnEvent('manual.intervention')
  async handleManualIntervention({ input, error }: { input: KafkaMessage; error: BaseException }) {
    await this.producerVerifyInventoty.publish({
      messages: [{
        value: JSON.stringify({ payload: input, error })
      }],
      topic: TopicsProducerEnum.VERIFIED_INVENTORY_ERROR_MANUAL_INTERVATION,
    });
  }

  halfOpenEvent() {
    this.metricsService.setCircuitBreakerState('HALF_OPEN', name);
    this.logger.warn("halfOpen event");
  }

  closeEvent() {
    this.metricsService.setCircuitBreakerState('CLOSED', name);
    this.logger.warn("close event");
  }

  openEvent() {
    this.metricsService.setCircuitBreakerState('OPEN', name);
    this.logger.warn("open event");
  }

  private async getIdempotence(input: OutboxEntity) {
    const key = `idempotency:${input.id}`;
    const value = JSON.stringify(input);
    const ttl = 60 * 5;

    const isSet = await this.redis.client.set(key, value, { EX: ttl });
    if (isSet === null) {
      const existing = await this.redis.client.get(key);
      const idempotence: OutboxEntity = JSON.parse(existing as string);
      return idempotence.status !== OutboxStatus.failed;
    }
    return false;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getExponentialDelay(retryCount: number): number {
    const baseDelay = 1000;
    const factor = 2;
    const maxDelay = 32000;
    const jitter = Math.random() * 1000;
    return Math.min(baseDelay * Math.pow(factor, retryCount - 1) + jitter, maxDelay);
  }

  private isRetryable(status: number): boolean {
    const retryableStatuses = new Set([401, 403, 429]);
    return retryableStatuses.has(status) || (status >= 500 && status < 600);
  }

  private async initializeKafkaConsumer(): Promise<void> {
    await this.consumerVerifyInventoty.consumer.connect();
    await this.consumerVerifyInventoty.consumer.subscribe({
      topic: TopicsProducerEnum.DBZ_VERIFIED_INVENTORY,
      fromBeginning: true
    });
  }
}
