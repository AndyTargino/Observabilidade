// Exemplo simples de como enviar logs para a stack
// Execute: npm install @opentelemetry/api @opentelemetry/sdk-logs @opentelemetry/exporter-logs-otlp-http
// Depois: node example-logger.js

const { LoggerProvider, BatchLogRecordProcessor } = require('@opentelemetry/sdk-logs');
const { OTLPLogExporter } = require('@opentelemetry/exporter-logs-otlp-http');
const { logs } = require('@opentelemetry/api-logs');

// Configurar exportador para enviar para o OpenTelemetry Collector
const logExporter = new OTLPLogExporter({
  url: 'http://localhost:34318/v1/logs',
});

// Configurar provider
const loggerProvider = new LoggerProvider();
loggerProvider.addLogRecordProcessor(new BatchLogRecordProcessor(logExporter));
logs.setGlobalLoggerProvider(loggerProvider);

// Obter logger
const logger = logs.getLogger('example-app', '1.0.0');

// Exemplos de diferentes tipos de logs
console.log('Enviando logs de exemplo...\n');

// 1. Log de INFO
logger.emit({
  severityText: 'INFO',
  body: 'Aplicação iniciada com sucesso',
  attributes: {
    environment: 'development',
    version: '1.0.0'
  }
});
console.log('✓ Log INFO enviado');

// 2. Log de WARN
logger.emit({
  severityText: 'WARN',
  body: 'Memória acima de 80%',
  attributes: {
    memory_usage: '85%',
    available_mb: 150
  }
});
console.log('✓ Log WARN enviado');

// 3. Log de ERROR
logger.emit({
  severityText: 'ERROR',
  body: 'Erro ao conectar com banco de dados',
  attributes: {
    error: 'Connection timeout',
    database: 'mysql',
    host: 'localhost',
    port: 3306
  }
});
console.log('✓ Log ERROR enviado');

// 4. Log com contexto de usuário
logger.emit({
  severityText: 'INFO',
  body: 'Usuário realizou login',
  attributes: {
    userId: 12345,
    username: 'joao.silva',
    ip: '192.168.1.100',
    userAgent: 'Mozilla/5.0'
  }
});
console.log('✓ Log de login enviado');

// 5. Log de transação
logger.emit({
  severityText: 'INFO',
  body: 'Pagamento processado',
  attributes: {
    transactionId: 'TXN-789456',
    amount: 150.00,
    currency: 'BRL',
    paymentMethod: 'credit_card',
    userId: 12345
  }
});
console.log('✓ Log de transação enviado');

// 6. Log de performance
logger.emit({
  severityText: 'DEBUG',
  body: 'Query executada',
  attributes: {
    query: 'SELECT * FROM users WHERE id = ?',
    duration_ms: 45,
    rows_returned: 1,
    database: 'mysql'
  }
});
console.log('✓ Log de performance enviado');

console.log('\nAguardando processamento...');

// Aguardar envio dos logs
setTimeout(() => {
  console.log('\n✅ Todos os logs foram enviados!');
  console.log('Acesse o Grafana em http://localhost:33000');
  console.log('Vá em Explore > Loki e use a query: {service_name="example-app"}');
  process.exit(0);
}, 2000);
