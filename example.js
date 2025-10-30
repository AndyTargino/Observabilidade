
// example.js
// Exemplo de aplicação Node.js instrumentada com OpenTelemetry

// Instale as dependências necessárias:
// npm install @opentelemetry/sdk-node @opentelemetry/api @opentelemetry/exporter-otlp-grpc @opentelemetry/resources @opentelemetry/semantic-conventions @opentelemetry/sdk-metrics @opentelemetry/sdk-logs

const process = require('process');
const opentelemetry = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-otlp-grpc');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-otlp-grpc');
const { OTLPLogExporter } = require('@opentelemetry/exporter-otlp-grpc');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { MeterProvider, PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
const { LoggerProvider, BatchLogRecordProcessor } = require('@opentelemetry/sdk-logs');
const { ConsoleSpanExporter, SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base');

// --- Configuração do OpenTelemetry SDK ---

// 1. Configuração do Resource (informações sobre o serviço)
const resource = new Resource({
  [SemanticResourceAttributes.SERVICE_NAME]: 'my-nodejs-app',
  [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
  [SemanticResourceAttributes.HOST_NAME]: 'my-host',
});

// 2. Configuração do Exportador OTLP (para traces, métricas e logs)
// O endpoint aponta para o OpenTelemetry Collector
const collectorEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317';

const traceExporter = new OTLPTraceExporter({ url: collectorEndpoint });
const metricExporter = new OTLPMetricExporter({ url: collectorEndpoint });
const logExporter = new OTLPLogExporter({ url: collectorEndpoint });

// 3. Configuração do SDK Node.js
const sdk = new opentelemetry.NodeSDK({
  resource: resource,
  traceExporter: traceExporter,
  metricReader: new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 5000, // Exporta métricas a cada 5 segundos
  }),
  logRecordProcessor: new BatchLogRecordProcessor(logExporter),
  instrumentations: [getNodeAutoInstrumentations()], // Auto-instrumentação para módulos Node.js comuns
});

// Opcional: Adicionar um exportador de console para ver os traces no terminal
// sdk.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));

// Inicializa o SDK
sdk.start()
  .then(() => console.log('OpenTelemetry SDK inicializado com sucesso.'))
  .catch((error) => console.error('Erro ao inicializar OpenTelemetry SDK:', error));

// Garante que o SDK seja desligado corretamente ao encerrar a aplicação
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('OpenTelemetry SDK desligado.'))
    .catch((error) => console.error('Erro ao desligar OpenTelemetry SDK:', error))
    .finally(() => process.exit(0));
});

// --- Exemplo de Uso da Instrumentação ---

const api = require('@opentelemetry/api');
const tracer = api.trace.getTracer('my-nodejs-app-tracer');
const meter = api.metrics.getMeter('my-nodejs-app-meter');
const logger = api.logs.getLogger('my-nodejs-app-logger');

// Exemplo de Métrica: Contador
const requestCounter = meter.createCounter('http_requests_total', {
  description: 'Total number of HTTP requests',
});

// Exemplo de Função com Tracing
function doWork(input) {
  // Cria um span para a operação
  const span = tracer.startSpan('doWork', { attributes: { 'input.value': input } });

  try {
    console.log(`Fazendo algum trabalho com input: ${input}`);
    // Simula um trabalho assíncrono
    return new Promise(resolve => {
      setTimeout(() => {
        const result = `Resultado para ${input}`;
        span.setAttribute('result.value', result);
        span.addEvent('work_completed', { 'timestamp': Date.now() });

        // Exemplo de Log dentro de um Trace
        logger.emit({
          severityText: 'INFO',
          body: `Trabalho concluído para ${input}`,
          attributes: { 'operation': 'doWork', 'input': input, 'result': result },
        });

        requestCounter.add(1, { 'status': 'success', 'method': 'GET' });
        resolve(result);
      }, 100);
    });
  } catch (error) {
    span.recordException(error);
    span.setStatus({ code: api.SpanStatusCode.ERROR, message: error.message });
    requestCounter.add(1, { 'status': 'error', 'method': 'GET' });
    logger.emit({
      severityText: 'ERROR',
      body: `Erro ao fazer trabalho com input: ${input}`,
      attributes: { 'operation': 'doWork', 'input': input, 'error': error.message },
    });
    throw error;
  } finally {
    span.end();
  }
}

// Função principal para simular o fluxo da aplicação
async function main() {
  console.log('Iniciando aplicação Node.js instrumentada...');

  // Cria um span pai para a execução principal
  const mainSpan = tracer.startSpan('main-application-flow');
  api.context.with(api.trace.set,  Span(api.context.active(), mainSpan), async () => {
    try {
      await doWork('dado1');
      await doWork('dado2');
      await doWork('dado3');

      // Exemplo de Log fora de um Trace direto
      logger.emit({
        severityText: 'DEBUG',
        body: 'Fluxo principal da aplicação concluído.',
        attributes: { 'app.status': 'finished' },
      });

    } catch (error) {
      console.error('Erro no fluxo principal:', error);
      mainSpan.recordException(error);
      mainSpan.setStatus({ code: api.SpanStatusCode.ERROR, message: error.message });
    } finally {
      mainSpan.end();
    }
  });

  console.log('Aplicação Node.js finalizada (aguardando exportação de telemetria)...');
}

main();
