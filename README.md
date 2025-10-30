# Stack Simplificada de Observabilidade

Stack focada em **logs de aplicação** e **monitoramento de banco de dados**.

## O que esta stack faz?

1. **Coleta logs da sua aplicação** via OpenTelemetry
2. **Monitora seu banco de dados** (queries lentas, mais frequentes, performance)
3. **Visualiza tudo** em dashboards no Grafana

## Serviços (apenas 4)

- **Grafana** (Visualização)
- **Loki** (Armazena logs)
- **OpenTelemetry Collector** (Recebe logs da aplicação)
- **PMM Server** (Monitora banco de dados)

---

## Início Rápido

### 1. Iniciar a stack

```bash
docker compose up -d
```

### 2. Acessar as interfaces

- **Grafana** (Logs): http://localhost:33000
  - Login: `admin`
  - Senha: `4aM97pOntVhI6nCHlUCOYHov63lr`

- **PMM Server** (Banco de Dados): http://localhost:33443
  - Login: `admin`
  - Senha: `admin`

---

## Como Enviar Logs da Aplicação

### Node.js

**1. Instalar dependências:**

```bash
npm install @opentelemetry/api @opentelemetry/sdk-logs @opentelemetry/exporter-logs-otlp-http
```

**2. Criar arquivo `logger.js`:**

```javascript
const { LoggerProvider, BatchLogRecordProcessor } = require('@opentelemetry/sdk-logs');
const { OTLPLogExporter } = require('@opentelemetry/exporter-logs-otlp-http');
const { logs } = require('@opentelemetry/api-logs');

// Configurar exportador
const logExporter = new OTLPLogExporter({
  url: 'http://localhost:34318/v1/logs',
});

// Configurar provider
const loggerProvider = new LoggerProvider();
loggerProvider.addLogRecordProcessor(new BatchLogRecordProcessor(logExporter));

// Registrar globalmente
logs.setGlobalLoggerProvider(loggerProvider);

// Obter logger
const logger = logs.getLogger('my-app', '1.0.0');

module.exports = logger;
```

**3. Usar no seu código:**

```javascript
const logger = require('./logger');

// Log simples
logger.emit({
  severityText: 'INFO',
  body: 'Usuário fez login',
  attributes: {
    userId: 123,
    username: 'joao'
  }
});

// Log de erro
logger.emit({
  severityText: 'ERROR',
  body: 'Erro ao processar pagamento',
  attributes: {
    error: 'Cartão inválido',
    userId: 123,
    amount: 100.50
  }
});

// Log com contexto
logger.emit({
  severityText: 'WARN',
  body: 'Tentativa de acesso negada',
  attributes: {
    ip: '192.168.1.1',
    endpoint: '/admin'
  }
});
```

### Python

**1. Instalar dependências:**

```bash
pip install opentelemetry-api opentelemetry-sdk opentelemetry-exporter-otlp
```

**2. Criar `logger.py`:**

```python
from opentelemetry import logs
from opentelemetry.sdk.logs import LoggerProvider, LoggingHandler
from opentelemetry.sdk.logs.export import BatchLogRecordProcessor
from opentelemetry.exporter.otlp.proto.http.logs_exporter import OTLPLogExporter
import logging

# Configurar OpenTelemetry
logger_provider = LoggerProvider()
logs.set_logger_provider(logger_provider)

# Exportador OTLP
exporter = OTLPLogExporter(endpoint="http://localhost:34318/v1/logs")
logger_provider.add_log_record_processor(BatchLogRecordProcessor(exporter))

# Configurar logging padrão do Python
handler = LoggingHandler(logger_provider=logger_provider)
logging.getLogger().addHandler(handler)
logging.getLogger().setLevel(logging.INFO)

# Usar normalmente
logger = logging.getLogger(__name__)
```

**3. Usar no código:**

```python
from logger import logger

# Logs simples
logger.info("Usuário fez login", extra={"user_id": 123})
logger.error("Erro ao processar", extra={"error": "Database timeout"})
logger.warning("Memória alta", extra={"usage": "85%"})
```

---

## Como Monitorar Banco de Dados

O PMM Server monitora queries do banco, performance, locks, etc.

### MySQL

**1. Instalar PMM Client no servidor do banco:**

```bash
# Docker
docker run --rm -e PMM_AGENT_SERVER_ADDRESS=localhost:34443 \
  -e PMM_AGENT_SERVER_USERNAME=admin \
  -e PMM_AGENT_SERVER_PASSWORD=admin \
  percona/pmm-client:2 setup

# Ou baixar manualmente
wget https://www.percona.com/downloads/pmm2/pmm-client-2.40.1.tar.gz
```

**2. Adicionar banco ao PMM:**

No PMM UI (http://localhost:33443):
1. Ir em **PMM → Add Instance**
2. Selecionar **MySQL**
3. Preencher:
   - Hostname: `seu-host-mysql`
   - Port: `3306`
   - Username: `root` (ou usuário com permissões)
   - Password: sua senha

**3. Visualizar dashboards:**

PMM cria automaticamente dashboards mostrando:
- **Queries mais lentas**
- **Queries mais executadas**
- **Queries mais pesadas** (consumo de CPU/memória)
- **Performance geral**
- **Locks e waits**

### PostgreSQL

Similar ao MySQL, mas selecione **PostgreSQL** no passo 2.

### MongoDB

Similar ao MySQL, mas selecione **MongoDB** no passo 2.

---

## Ver Logs no Grafana

1. Acesse http://localhost:33000
2. Login com `admin` / `4aM97pOntVhI6nCHlUCOYHov63lr`
3. Vá em **Explore** (ícone de bússola na lateral)
4. Selecione data source **Loki**
5. Use queries LogQL:

```logql
# Todos os logs
{service_name="my-app"}

# Apenas erros
{service_name="my-app"} | json | level="ERROR"

# Filtrar por usuário
{service_name="my-app"} | json | userId="123"

# Buscar texto
{service_name="my-app"} |~ "pagamento"

# Rate de erros
rate({service_name="my-app"} | json | level="ERROR" [5m])
```

---

## Ver Métricas do Banco no PMM

1. Acesse http://localhost:33443
2. Login com `admin` / `admin`
3. Vá em **Dashboards**
4. Selecione:
   - **MySQL Overview** - Visão geral
   - **MySQL Query Analytics** - Queries lentas e frequentes
   - **MySQL InnoDB Details** - Performance de tabelas

**O que você verá:**
- Top 10 queries mais lentas
- Top 10 queries mais executadas
- Top 10 queries que mais consomem recursos
- Gráficos de performance ao longo do tempo
- Locks e deadlocks
- Cache hit ratio

---

## Comandos Úteis

```bash
# Iniciar
docker compose up -d

# Ver logs
docker compose logs -f

# Parar
docker compose down

# Parar e limpar volumes (cuidado: perde dados)
docker compose down -v

# Ver status
docker compose ps

# Reiniciar um serviço
docker compose restart grafana
```

---

## Estrutura de Arquivos

```
Observabilidade/
├── docker-compose.yml          # Definição dos 4 serviços
├── .env                         # Credenciais
├── configs/
│   ├── otel-collector-config.yaml  # Config do OpenTelemetry
│   └── loki-config.yml             # Config do Loki
└── grafana/
    └── provisioning/
        └── datasources/
            └── datasources.yml     # Config automática do Grafana
```

---

## Troubleshooting

### Logs não aparecem no Grafana

```bash
# 1. Verifique se OTEL Collector está recebendo
docker logs otel-collector

# 2. Verifique se sua aplicação está enviando para a porta correta
# Deve ser: http://localhost:34318/v1/logs

# 3. Teste manualmente
curl -X POST http://localhost:34318/v1/logs \
  -H "Content-Type: application/json" \
  -d '{"resourceLogs":[{"resource":{"attributes":[{"key":"service.name","value":{"stringValue":"test"}}]},"scopeLogs":[{"scope":{},"logRecords":[{"body":{"stringValue":"teste"},"severityText":"INFO"}]}]}]}'
```

### PMM não conecta ao banco

1. Verifique se o banco está acessível do container PMM
2. Verifique credenciais (usuário precisa de permissões)
3. Para MySQL, usuário precisa de: `PROCESS, REPLICATION CLIENT, SELECT`

```sql
-- MySQL: Criar usuário para PMM
CREATE USER 'pmm'@'%' IDENTIFIED BY 'senha_forte';
GRANT PROCESS, REPLICATION CLIENT, SELECT ON *.* TO 'pmm'@'%';
FLUSH PRIVILEGES;
```

---

## Próximos Passos

1. **Adicionar alertas** no Grafana quando houver muitos erros
2. **Criar dashboards customizados** com suas métricas específicas
3. **Integrar CI/CD** para coletar logs de builds
4. **Adicionar mais aplicações** enviando logs para o mesmo Loki

---

## Dúvidas Frequentes

**Q: Preciso do OpenTelemetry SDK completo?**
R: Não! Apenas a parte de logs (`@opentelemetry/sdk-logs`)

**Q: Posso enviar logs de múltiplas aplicações?**
R: Sim! Todas enviam para `http://localhost:34318/v1/logs`

**Q: Como diferenciar logs de diferentes apps?**
R: Use o atributo `service.name` diferente em cada app

**Q: Qual banco de dados o PMM suporta?**
R: MySQL, PostgreSQL, MongoDB, MariaDB, Percona Server

**Q: PMM afeta performance do banco?**
R: Mínimo. Ele usa conexões read-only e amostragem inteligente

---

**Pronto!** Stack simples, funcional e focada no que você precisa.
