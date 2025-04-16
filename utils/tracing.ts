import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { KafkaJsInstrumentation } from '@opentelemetry/instrumentation-kafkajs';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { name, version } from '../package.json';
import { red } from 'colorette';

// Configuração de logs de diagnóstico
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);

// Exportadores
const tracerExporter = new OTLPTraceExporter();
const metricExporter = new OTLPMetricExporter();

// Leitor de métricas
const metricReader = new PeriodicExportingMetricReader({
  exporter: metricExporter,
  exportIntervalMillis: 10000 // Exporta a cada 10 segundos
});

// SDK do OpenTelemetry
const sdk = new NodeSDK({
  traceExporter: tracerExporter,
  metricReader,
  instrumentations: [new KafkaJsInstrumentation()]
});

// Inicialização
export const start = () => {
  try {
    sdk.start();
    console.log('✅ OpenTelemetry iniciado com sucesso');
  } catch (error) {
    console.error(red('❌ Erro ao iniciar OpenTelemetry:'), error);
  }
};

// Shutdown elegante
process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => console.log('🛑 OpenTelemetry finalizado'))
    .catch((error) => console.error(red('Erro ao finalizar OpenTelemetry:'), error))
    .finally(() => process.exit(0));
});