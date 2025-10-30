# Arquitetura da Stack de Observabilidade

Este documento descreve a arquitetura técnica e o fluxo de dados da stack de observabilidade.

## Visão Geral

A stack implementa os três pilares da observabilidade:
- **Traces**: Rastreamento distribuído de requisições
- **Metrics**: Coleta e agregação de métricas de performance
- **Logs**: Agregação centralizada de logs

## Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         APLICAÇÕES                              │
│  (Node.js, Python, Go, Java, etc. com SDKs OpenTelemetry)      │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ OTLP (gRPC/HTTP)
                     │ Porta 34317/34318
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              OPENTELEMETRY COLLECTOR                            │
│                    (Hub Central)                                │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐        │
│  │  Receivers  │→ │  Processors  │→ │   Exporters    │        │
│  │  OTLP/gRPC  │  │    Batch     │  │  Jaeger/Loki  │        │
│  │  OTLP/HTTP  │  │  Transform   │  │  /Prometheus   │        │
│  └─────────────┘  └──────────────┘  └────────────────┘        │
└───────────┬────────────────┬─────────────────┬─────────────────┘
            │                │                 │
            │ Traces         │ Logs            │ Metrics
            ▼                ▼                 ▼
┌─────────────────┐  ┌────────────────┐  ┌──────────────────────┐
│     JAEGER      │  │      LOKI      │  │    PROMETHEUS        │
│                 │  │                │  │                      │
│  - All-in-One   │  │  - BoltDB      │  │  - Time Series DB    │
│  - Memory Store │  │  - Filesystem  │  │  - 90d Retention     │
│  - UI: 36686    │  │  - 30d Retention│ │  - Scraping:         │
│                 │  │                │  │    * Node Exporter   │
│                 │  │                │  │    * cAdvisor        │
│                 │  │                │  │    * OTEL Collector  │
└─────────────────┘  └────────────────┘  └──────────────────────┘
            │                │                 │
            │                │                 │
            └────────────────┴─────────────────┘
                             │
                             │ Queries
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         GRAFANA                                 │
│                    (Visualização)                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Dashboards  │  │   Explore    │  │   Alerting   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
│  Data Sources: Prometheus + Loki + Jaeger                      │
│  Correlação: Trace ID ↔ Logs ↔ Metrics                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              MONITORAMENTO DE INFRAESTRUTURA                    │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐ │
│  │  Node Exporter  │  │    cAdvisor     │  │   Promtail     │ │
│  │                 │  │                 │  │                │ │
│  │  - CPU, RAM     │  │  - Container    │  │  - Coleta logs │ │
│  │  - Disk, Network│  │    Metrics      │  │    Docker      │ │
│  │  - Host OS      │  │  - Docker Stats │  │  → Envia Loki  │ │
│  └─────────────────┘  └─────────────────┘  └────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│           MONITORAMENTO DE BANCO DE DADOS                       │
│                                                                 │
│                    ┌────────────────┐                          │
│                    │   PMM Server   │                          │
│                    │                │                          │
│                    │  - MySQL       │                          │
│                    │  - PostgreSQL  │                          │
│                    │  - MongoDB     │                          │
│                    └────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

## Fluxo de Dados Detalhado

### 1. Coleta de Telemetria

#### Traces (Rastreamento Distribuído)
```
Aplicação → SDK OpenTelemetry → OTLP Export →
OTEL Collector (4317/4318) → Jaeger (4317 internal) →
Storage (Memory) → Query API → Grafana/Jaeger UI
```

#### Logs
```
Path 1 (Aplicações):
Aplicação → SDK OpenTelemetry → OTLP Export →
OTEL Collector → Loki (3100 internal) → BoltDB →
Query API → Grafana

Path 2 (Containers Docker):
Docker Container → Docker Log Driver →
/var/lib/docker/containers/*.log → Promtail →
Loki (3100 internal) → BoltDB → Query API → Grafana
```

#### Metrics
```
Path 1 (Aplicações):
Aplicação → SDK OpenTelemetry → OTLP Export →
OTEL Collector → Prometheus Exporter (8888) →
Prometheus Scrape → TSDB → Query API → Grafana

Path 2 (Infraestrutura):
Host/Container → Node Exporter/cAdvisor →
Metrics Endpoint → Prometheus Scrape →
TSDB → Query API → Grafana
```

## Componentes Detalhados

### OpenTelemetry Collector

**Função**: Hub central de telemetria
**Portas**:
- 34317: OTLP gRPC receiver
- 34318: OTLP HTTP receiver
- 38888: Prometheus metrics exporter

**Pipeline**:
```yaml
receivers:
  otlp:
    protocols:
      grpc: (0.0.0.0:4317)
      http: (0.0.0.0:4318)

processors:
  batch:
    timeout: 1s
    send_batch_size: 1024

exporters:
  otlp/jaeger:    # Traces
  otlphttp/loki:  # Logs
  prometheus:     # Metrics
```

### Prometheus

**Função**: Sistema de métricas time-series
**Características**:
- Modelo pull (scraping)
- Retenção: 90 dias
- PromQL para queries
- Scrape interval: 15s

**Targets**:
1. Node Exporter (9100) - Métricas do host
2. cAdvisor (8080) - Métricas de containers
3. OTEL Collector (8888) - Métricas de aplicações
4. Prometheus self (9090) - Auto-monitoramento

### Loki

**Função**: Agregação de logs
**Características**:
- Otimizado para logs de infraestrutura
- Similar ao Prometheus (labels + valores)
- Retenção: 30 dias
- Storage: BoltDB + Filesystem

**Ingestão**:
- Promtail: Logs de containers Docker
- OTEL Collector: Logs de aplicações instrumentadas

### Jaeger

**Função**: Distributed Tracing
**Características**:
- All-in-one deployment
- Storage: Memory (configurável para Cassandra/ES)
- Retention: 24h (memória volátil)
- OTLP enabled

**Componentes**:
- Agent: Recebe spans via UDP/HTTP
- Collector: Processa e armazena spans
- Query: API de consulta
- UI: Interface web

### Grafana

**Função**: Visualização e Dashboards
**Features**:
- Data sources provisionados automaticamente
- Correlação entre traces, logs e metrics
- Alerting
- Explore mode

**Data Sources**:
1. **Prometheus** (default)
   - Queries: PromQL
   - Correlação: TraceID → Jaeger

2. **Loki**
   - Queries: LogQL
   - Derived fields: TraceID → Jaeger

3. **Jaeger**
   - Trace queries
   - Traces to logs: instanceId + service.name → Loki

### Node Exporter

**Função**: Métricas do sistema operacional
**Métricas coletadas**:
- CPU (usage, load)
- Memory (used, free, cached)
- Disk (I/O, usage)
- Network (bandwidth, errors)
- Filesystem

### cAdvisor

**Função**: Métricas de containers
**Métricas coletadas**:
- Container CPU usage
- Container memory usage
- Container network I/O
- Container disk I/O
- Container filesystem usage

### Promtail

**Função**: Agent de coleta de logs
**Fontes**:
- Docker containers via `/var/lib/docker/containers/`
- Adiciona labels automaticamente
- Pipeline de processamento

### Percona PMM Server

**Função**: Monitoramento de banco de dados
**Suporte**:
- MySQL
- PostgreSQL
- MongoDB
- MariaDB

## Rede Docker

**Nome**: `observability`
**Tipo**: Bridge
**Subnet**: Automático (Docker)

**Comunicação interna**:
- Containers comunicam via nome do serviço
- Exemplo: `http://prometheus:9090`
- DNS automático pelo Docker

**Portas expostas** (Host → Container):
```
33000  → grafana:3000
39090  → prometheus:9090
39100  → node-exporter:9100
38080  → cadvisor:8080
33100  → loki:3100
36686  → jaeger:16686
6831   → jaeger:6831 (UDP)
34268  → jaeger:14268
34317  → otel-collector:4317
34318  → otel-collector:4318
38888  → otel-collector:8888
33443  → pmm-server:80
34443  → pmm-server:443
```

## Volumes Persistentes

| Volume | Serviço | Conteúdo | Tamanho Estimado |
|--------|---------|----------|------------------|
| `grafana_data` | Grafana | Dashboards, config, plugins | ~500MB |
| `prometheus_data` | Prometheus | Time-series DB (90d) | ~5-50GB |
| `loki_data` | Loki | Logs + BoltDB index (30d) | ~2-20GB |
| `pmm_data` | PMM Server | DB metrics data | ~1-10GB |

## Segurança

### Autenticação
- **Grafana**: admin/password (configurável via .env)
- **PMM**: admin/admin (alterar em produção)
- **Outros**: Sem autenticação (usar reverse proxy em produção)

### Rede
- Containers isolados em rede bridge
- Apenas portas necessárias expostas ao host
- Sem TLS/SSL configurado (adicionar em produção)

### Dados Sensíveis
- Credenciais no `.env` (não commitar)
- Logs podem conter dados sensíveis (configurar masking)
- Traces podem conter PII (configurar filtering)

## Escalabilidade

### Produção - Pequeno Porte
- 1-10 serviços
- Configuração atual suficiente
- Considerar: Jaeger com storage persistente

### Produção - Médio Porte
- 10-100 serviços
- Implementar:
  - Jaeger com Cassandra/Elasticsearch
  - Loki distribuído
  - Prometheus com remote storage
  - Load balancer para Grafana

### Produção - Grande Porte
- 100+ serviços
- Implementar:
  - Jaeger distribuído (Spark, Kafka)
  - Loki clustering
  - Prometheus federation/Thanos/Cortex
  - Grafana clustering
  - OTEL Collector scaling

## Retenção e Ciclo de Vida dos Dados

| Componente | Retenção | Storage | Política |
|------------|----------|---------|----------|
| Jaeger | 24h | Memory | FIFO (First In First Out) |
| Prometheus | 90d | Disk | Compactação automática |
| Loki | 30d | Disk | Automática via config |
| Grafana | ∞ | Disk | Manual (dashboards) |

## Troubleshooting

Para diagnóstico de problemas, consulte o [Guia de Troubleshooting](TROUBLESHOOTING.md).

## Referências

- [OpenTelemetry Collector](https://opentelemetry.io/docs/collector/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Loki Documentation](https://grafana.com/docs/loki/)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/grafana/)
