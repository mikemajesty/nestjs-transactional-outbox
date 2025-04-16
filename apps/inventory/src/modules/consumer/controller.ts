import { Controller, Get, OnModuleInit } from '@nestjs/common';
import { TopicsProducerEnum } from '@/utils/topics';
import { ApiBadRequestException, ApiInternalServerException, BaseException } from '@/utils/exception';
import { KafkaMessage, IHeaders } from 'kafkajs';
import { IProducerAdapter } from '@/inventory/infra/producer/adapter';
import { IConsumerAdapter } from '@/inventory/infra/consumer/adapter';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { MetricsService } from './metrics';
import { name } from '../../../package.json';
import CircuitBreaker from 'opossum';
import { RedisService } from '@/infra/redis/service';
import { IInventoryRepository } from '@/inventory/core/repository/inventory';
import { HttpService } from '@nestjs/axios';
import { OrderEntity } from '@/order/core/entity/order';
import { OutboxEntity, OutboxStatus } from '@/order/core/entity/outbox';
import { firstValueFrom } from 'rxjs';

@Controller()
export class ConsumerController implements OnModuleInit {
  private circuitBreaker!: CircuitBreaker;

  constructor(
    private readonly producerVerifyInventoty: IProducerAdapter,
    private readonly consumerVerifyInventoty: IConsumerAdapter,
    private readonly eventEmitter: EventEmitter2,
    private readonly metricsService: MetricsService,
    private readonly redis: RedisService,
    private readonly inventoryRepository: IInventoryRepository,
    private readonly httpService: HttpService
  ) {
    const options = {
      timeout: 6000000,
      errorThresholdPercentage: 50,
      resetTimeout: 5000
    };
    this.circuitBreaker = new CircuitBreaker(this.execute.bind(this), options);
    this.circuitBreaker.on("halfOpen", () => this.halfOpenEvent());
    this.circuitBreaker.on("close", () => this.closeEvent());
    this.circuitBreaker.on("open", () => this.openEvent());
    this.circuitBreaker.fallback((input: OutboxEntity, err: BaseException) => this.fallback(input, err));
  }

  async onModuleInit() {
    await this.consumerVerifyInventoty.consumer.connect();
    await this.consumerVerifyInventoty.consumer.subscribe({
      topic: TopicsProducerEnum.DBZ_VERIFIED_INVENTORY,
      fromBeginning: true
    });

    await this.consumerVerifyInventoty.consumer.run({
      eachMessage: async ({ message, heartbeat }) => {
        await this.processInventory(message);
        await heartbeat();
      },
    });
  }

  async processInventory(message: KafkaMessage): Promise<void> {
    const outbox = JSON.parse(message.value?.toString("utf-8") as string)
    console.log('outbox', outbox);

    const entity = new OutboxEntity(outbox)

    const buffer = message.value as Buffer;
    const input = JSON.parse(buffer.toString());

    console.log(`[${input.id}] Tentativa número ${entity.retryCount || "0"}`);
    if (entity.retryCount) {
      const delay = this.getExponentialDelay(entity.retryCount);
      console.log('message.delay', delay);
      await this.sleep(delay);
    }

    const result = await this.circuitBreaker.fire(entity);
    if (result === 'success') {
      // await firstValueFrom(
      //   this.httpService.put(`http://localhost:4000/outbox/${entity.id}`, { status: OutboxStatus.processed } as OutboxEntity)
      // );
    }
    // if (result === 'error') {
    //   await firstValueFrom(
    //     this.httpService.put(`http://localhost:4000/outbox/${entity.id}`, { status: OutboxStatus.failed } as OutboxEntity)
    //   );
    //   console.log("Processamento com erro");
    // } else {
    //   await firstValueFrom(
    //     this.httpService.put(`http://localhost:4000/outbox/${entity.id}`, { status: OutboxStatus.processed } as OutboxEntity)
    //   );
    //   console.log("Processamento execute bem-sucedido");
    // }
  }

  async fallback(message: OutboxEntity, err: BaseException): Promise<string> {
    const statusCode = err?.['status'] || ApiInternalServerException.STATUS;

    if (this.isRetryable(statusCode)) {
      const url = `http://localhost:4000/outbox/${message.id}`
      console.log('retry', message.retryCount);
      if ((message?.retryCount || 0) <= 5) {
        message.increment()
        this.metricsService.incrementRetryAttempt((err as any as { status: number })?.status || 500);
        this.metricsService.incrementRetryCount(name);
        await firstValueFrom(
          this.httpService.put(url, { retryCount: message.retryCount } as OutboxEntity)
        );
        // message.retryCount = retry + 1
        // this.eventEmitter.emit('retry.event', { input: message, retry: message.retryCount });
        return "error";
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
    const value = Math.random();
    // throw new ApiInternalServerException(`server unavailable`);
    if (value < 1.1) {
      throw new ApiInternalServerException(`server unavailable`);
    }
    if (value < 1) {
      throw new ApiBadRequestException(`invalid : ${message.retryCount}`);
    }
    return "success";
  }

  // @OnEvent('retry.event')
  // async handleRetryEvent({ input, retry }: { input: KafkaMessage; retry: number }) {
  //   await this.producerVerifyInventoty.publish({
  //     messages: [{
  //       value: JSON.stringify(input),
  //     }],
  //     topic: TopicsProducerEnum.DBZ_VERIFIED_INVENTORY,
  //   });
  // }

  @OnEvent('retry.max_reached')
  async handleMaxRetries(input: OutboxEntity) {
    await this.producerVerifyInventoty.publish({
      messages: [{
        value: JSON.stringify(input),
        headers: { 'x-attempt': Buffer.from(`5`) }
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
    console.log("halfOpen event");
  }

  closeEvent() {
    this.metricsService.setCircuitBreakerState('CLOSED', name);
    console.log("close event");
  }

  openEvent() {
    this.metricsService.setCircuitBreakerState('OPEN', name);
    console.log("open event");
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private retryIncrement(attempt: number | string): number {
    const attemptNumber = Number(attempt);
    return isNaN(attemptNumber) || attemptNumber < 1 ? 1 : attemptNumber + 1;
  }

  private getExponentialDelay(retryCount: number): number {
    const baseDelay = 1000;
    const factor = 2;
    const maxDelay = 32000;
    return Math.min(baseDelay * Math.pow(factor, retryCount - 1), maxDelay);
  }

  private isRetryable(status: number): boolean {
    const retryableStatuses = new Set([401, 403, 429]);
    return retryableStatuses.has(status) || (status >= 500 && status < 600);
  }
}
