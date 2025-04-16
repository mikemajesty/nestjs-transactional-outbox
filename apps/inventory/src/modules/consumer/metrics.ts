import { Controller, Injectable, OnModuleInit } from '@nestjs/common';
import { MetricService } from 'nestjs-otel';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Counter, Histogram, ValueType } from '@opentelemetry/api';
@Injectable()
export class MetricsService {
  // Armazenamos as métricas como propriedades da classe
  private circuitBreakerState: Counter;
  private retryAttemptCounter: Counter;
  private retryDelayHistogram: Histogram;
  private retryCountCounter: Counter;
  private maxRetriesCounter: Counter;
  private manualInterventionCounter: Counter;


  // this.circuitBreakerGauge = this.metricService.getObservableGauge(
  //   'circuit_breaker_state',
  //   async () => {
  //     return this.currentState; // 0, 0.5 ou 1
  //   },
  //   { description: 'Circuit Breaker state' }
  // );

  // // No método:
  // setCircuitBreakerState(state: 0 | 0.5 | 1) {
  //   this.currentState = state;
  // }
  constructor(private readonly metricService: MetricService) {
    // Inicializa todas as métricas no construtor
    this.circuitBreakerState = this.metricService.getCounter('circuit_breaker_state', {
      description: 'Current state of the circuit breaker (1=CLOSED, 1=HALF_OPEN, 1=OPEN)'
    });

    this.retryAttemptCounter = this.metricService.getCounter('message_retry_attempt_total', {
      description: 'Total message retry attempts',
    });

    this.retryDelayHistogram = this.metricService.getHistogram('message_retry_delay_seconds', {
      description: 'Delay between message retries in seconds',
      valueType: ValueType.INT,
      advice: { explicitBucketBoundaries: [1000, 2000, 4000, 8000, 16000] }
      // As boundaries são configuradas no Collector ou no SDK
    });

    this.retryCountCounter = this.metricService.getCounter('message_retry_count_total', {
      description: 'Total messages sent to retry',
    });

    this.maxRetriesCounter = this.metricService.getCounter('message_max_retries_reached_total', {
      description: 'Total messages that reached max retries',
    });

    this.manualInterventionCounter = this.metricService.getCounter('message_manual_intervention_total', {
      description: 'Total messages requiring manual intervention',
    });
  }

  setCircuitBreakerState(state: string, app: string) {
    this.circuitBreakerState.add(1, {
      app,
      label: state
    });
  }

  incrementRetryAttempt(statusCode: number) {
    this.retryAttemptCounter.add(1, { statusCode: statusCode.toString() });
  }

  recordRetryDelay(delaySeconds: number, retry: number, app: string) {
    this.retryDelayHistogram.record(delaySeconds, { app, retry });
  }

  incrementRetryCount(app: string) {
    this.retryCountCounter.add(1, { app });
  }

  incrementMaxRetries(app: string) {
    this.maxRetriesCounter.add(1, { app });
  }

  recordManualIntervention(errorType: string, statusCode: number) {
    this.manualInterventionCounter.add(1, {
      errorType,
      statusCode: statusCode
    });
  }
}