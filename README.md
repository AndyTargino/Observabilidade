# Stack de Observabilidade Completa

<div align="center">

![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Grafana](https://img.shields.io/badge/Grafana-F46800?style=for-the-badge&logo=grafana&logoColor=white)
![Prometheus](https://img.shields.io/badge/Prometheus-E6522C?style=for-the-badge&logo=prometheus&logoColor=white)
![OpenTelemetry](https://img.shields.io/badge/OpenTelemetry-000000?style=for-the-badge&logo=opentelemetry&logoColor=white)

**Stack de observabilidade empresarial completa e pronta para produção**

Implementa os três pilares da observabilidade: **Traces** • **Logs** • **Metrics**

[Início Rápido](#início-rápido) • [Documentação](#documentação-adicional) • [Arquitetura](#arquitetura) • [Troubleshooting](#troubleshooting)

</div>

---

## Sumário

- [Visão Geral](#visão-geral)
- [Componentes](#componentes)
- [Arquitetura](#arquitetura)
- [Pré-requisitos](#pré-requisitos)
- [Início Rápido](#início-rápido)
- [Endpoints de Acesso](#endpoints-de-acesso)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Configuração](#configuração)
- [Integração com Aplicações](#integração-com-aplicações)
- [Comandos Disponíveis](#comandos-disponíveis)
- [Monitoramento e Queries](#monitoramento-e-queries)
- [Backup e Restore](#backup-e-restore)
- [Considerações para Produção](#considerações-para-produção)
- [Troubleshooting](#troubleshooting)
- [Documentação Adicional](#documentação-adicional)
- [Contribuindo](#contribuindo)
- [Licença](#licença)

---

## Visão Geral

Este projeto fornece uma stack de observabilidade completa e profissional, pronta para ambientes de produção, utilizando Docker. A stack implementa as melhores práticas da indústria para monitoramento, logging e rastreamento distribuído de aplicações modernas.

### Características Principais

- **Completa**: Implementa os três pilares da observabilidade (Traces, Logs e Metrics)
- **Pronta para Produção**: Configurações otimizadas e testadas em ambientes reais
- **Fácil Integração**: Suporte nativo para OpenTelemetry Protocol (OTLP)
- **Correlação de Dados**: Links automáticos entre traces, logs e métricas
- **Persistência**: Volumes Docker configurados para dados críticos
- **Escalável**: Arquitetura preparada para crescimento horizontal
- **Sem Conflitos**: Portas configuradas na faixa 30000+ para evitar conflitos

---

## Componentes

### Visualização e Dashboards

- **Grafana 11.2.0**
  - Plataforma de visualização de dados
  - Data sources provisionados automaticamente
  - Correlação automática entre diferentes tipos de dados
  - Sistema de alertas integrado

### Sistema de Métricas

- **Prometheus 2.48.1**
  - Time-series database
  - Retenção configurável (padrão: 90 dias)
  - Linguagem de query PromQL

- **Node Exporter 1.7.0**
  - Coleta de métricas do sistema operacional host
  - CPU, memória, disco, rede

- **cAdvisor 0.47.2**
  - Métricas de containers Docker
  - Uso de recursos por container

### Sistema de Traces (Rastreamento Distribuído)

- **Jaeger 1.50**
  - Plataforma de distributed tracing
  - Interface de usuário para análise
  - Suporte para OTLP habilitado

- **OpenTelemetry Collector 0.88.0**
  - Hub central de telemetria
  - Suporte para OTLP gRPC e HTTP
  - Processamento e exportação de dados

### Sistema de Logs

- **Loki 2.9.2**
  - Agregação de logs otimizada
  - Retenção configurável (padrão: 30 dias)
  - Queries similares ao Prometheus (LogQL)

- **Promtail 2.9.2**
  - Agente de coleta de logs
  - Integração com Docker

### Monitoramento de Banco de Dados

- **Percona PMM Server 2.40.1**
  - Monitoramento especializado para bancos de dados
  - Suporte para MySQL, PostgreSQL, MongoDB

---

## Arquitetura

```
┌──────────────────────────────────────────────────────────────┐
│                       APLICAÇÕES                             │
│  (Node.js, Python, Go, Java com SDK OpenTelemetry)          │
└────────────────────┬─────────────────────────────────────────┘
                     │ OTLP (gRPC: 34317 | HTTP: 34318)
                     ▼
┌──────────────────────────────────────────────────────────────┐
│            OPENTELEMETRY COLLECTOR                           │
│               (Hub Central de Telemetria)                    │
└──┬──────────────────┬──────────────────┬─────────────────────┘
   │ Traces           │ Logs             │ Metrics
   ▼                  ▼                  ▼
┌─────────────┐  ┌────────────┐  ┌──────────────────────┐
│   JAEGER    │  │    LOKI    │  │    PROMETHEUS        │
│  (Traces)   │  │   (Logs)   │  │    (Metrics)         │
│   :36686    │  │   :33100   │  │      :39090          │
└─────────────┘  └────────────┘  └──────────────────────┘
       │               │                  │
       │               │                  │
       └───────────────┴──────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │     GRAFANA     │
              │  (Visualização) │
              │     :33000      │
              └─────────────────┘

                ┌──────────────────┐
                │   PMM SERVER     │
                │  (DB Monitoring) │
                │     :33443       │
                └──────────────────┘
```

Para documentação completa de arquitetura, consulte [ARCHITECTURE.md](ARCHITECTURE.md).

---

## Pré-requisitos

### Requisitos de Sistema

- **Docker Engine** 20.10 ou superior
- **Docker Compose** 2.0 ou superior
- **RAM**: Mínimo 4 GB disponível (8 GB recomendado)
- **Disco**: Mínimo 10 GB de espaço livre
- **Portas**: Faixa 30000-40000 disponível

### Verificação de Pré-requisitos

```bash
# Verificar versão do Docker
docker --version
# Saída esperada: Docker version 20.10.0 ou superior

# Verificar versão do Docker Compose
docker compose version
# Saída esperada: Docker Compose version 2.0.0 ou superior

# Verificar espaço em disco disponível
docker system df
```

---

## Início Rápido

### Passo 1: Obter o Projeto

```bash
git clone <repositorio>
cd Observabilidade
```

### Passo 2: Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar arquivo .env
# IMPORTANTE: Alterar senhas padrão, especialmente GF_SECURITY_ADMIN_PASSWORD
```

### Passo 3: Iniciar a Stack

```bash
# Método 1: Usando Docker Compose
docker compose up -d

# Método 2: Usando Makefile (recomendado)
make up
```

### Passo 4: Verificar Status dos Serviços

```bash
# Ver status de todos os containers
make status

# Ou usando Docker Compose diretamente
docker compose ps
```

### Passo 5: Acessar as Interfaces

Após a inicialização completa, acesse as seguintes URLs:

- **Grafana**: http://localhost:33000
  - Credenciais: admin / (conforme configurado no .env)
- **Jaeger UI**: http://localhost:36686
- **Prometheus**: http://localhost:39090
- **PMM Server**: http://localhost:33443
  - Credenciais: admin / admin (alterar em produção)

---

## Endpoints de Acesso

### Interfaces Web

| Serviço | URL | Autenticação | Descrição |
|---------|-----|--------------|-----------|
| Grafana | http://localhost:33000 | Sim (ver .env) | Plataforma de visualização e dashboards |
| Jaeger UI | http://localhost:36686 | Não | Interface de análise de traces |
| Prometheus | http://localhost:39090 | Não | Interface de queries e métricas |
| PMM Server | http://localhost:33443 | Sim (admin/admin) | Monitoramento de banco de dados |
| cAdvisor | http://localhost:38080 | Não | Métricas de containers |
| Node Exporter | http://localhost:39100/metrics | Não | Métricas do host (formato Prometheus) |

### APIs e Endpoints de Integração

| Serviço | Porta | Protocolo | Finalidade |
|---------|-------|-----------|------------|
| OTLP Collector | 34317 | gRPC | Ingestão de traces, logs e metrics |
| OTLP Collector | 34318 | HTTP | Ingestão de traces, logs e metrics |
| Jaeger Collector | 34268 | HTTP | Coleta de traces (Thrift HTTP) |
| Jaeger Agent | 6831 | UDP | Coleta de traces (Thrift Binary) |
| Loki | 33100 | HTTP | API de logs |
| OTEL Metrics | 38888 | HTTP | Métricas do OpenTelemetry Collector |

---

## Estrutura do Projeto

```
Observabilidade/
├── docker-compose.yml          # Orquestração dos serviços
├── .env                         # Variáveis de ambiente (não versionar)
├── .env.example                 # Template de configuração
├── .gitignore                   # Arquivos ignorados pelo Git
├── Makefile                     # Comandos de automação
├── README.md                    # Este arquivo
├── ARCHITECTURE.md              # Documentação de arquitetura
├── TROUBLESHOOTING.md           # Guia de resolução de problemas
├── example.js                   # Exemplo de aplicação instrumentada
│
├── configs/                     # Arquivos de configuração
│   ├── otel-collector-config.yaml
│   ├── prometheus.yml
│   ├── loki-config.yml
│   └── promtail-config.yml
│
└── grafana/                     # Configurações do Grafana
    ├── provisioning/
    │   ├── datasources/
    │   │   └── datasources.yml
    │   └── dashboards/
    │       └── dashboards.yml
    └── dashboards/
        └── README.txt
```

---

## Configuração

### Arquivo .env

O arquivo `.env` contém as variáveis de ambiente principais:

```ini
# Versões dos componentes (fixadas para garantir estabilidade)
GRAFANA_VERSION=11.2.0
PROMETHEUS_VERSION=v2.48.1
JAEGER_VERSION=1.50
LOKI_VERSION=2.9.2
# ... demais versões

# Credenciais (ALTERAR EM PRODUÇÃO)
GF_SECURITY_ADMIN_USER=admin
GF_SECURITY_ADMIN_PASSWORD=senha_forte_aqui

# Políticas de Retenção de Dados
PROMETHEUS_RETENTION_TIME=90d    # Métricas
LOKI_RETENTION_DAYS=30d          # Logs
JAEGER_RETENTION_HOURS=24h       # Traces (em memória)
```

### Arquivos de Configuração

| Arquivo | Descrição |
|---------|-----------|
| `configs/otel-collector-config.yaml` | Configuração do OpenTelemetry Collector (receivers, processors, exporters) |
| `configs/prometheus.yml` | Configuração do Prometheus (scrape targets, intervals) |
| `configs/loki-config.yml` | Configuração do Loki (storage, retenção) |
| `configs/promtail-config.yml` | Configuração do Promtail (fontes de logs) |
| `grafana/provisioning/datasources/datasources.yml` | Provisionamento automático de data sources |

### Volumes Persistentes

A stack utiliza volumes Docker nomeados para persistência:

| Volume | Serviço | Conteúdo | Tamanho Estimado |
|--------|---------|----------|------------------|
| `grafana_data` | Grafana | Dashboards, configurações, plugins | ~500 MB |
| `prometheus_data` | Prometheus | Time-series database | 5-50 GB |
| `loki_data` | Loki | Logs agregados e índices | 2-20 GB |
| `pmm_data` | PMM Server | Métricas de banco de dados | 1-10 GB |

---

## Integração com Aplicações

### Configuração do Endpoint OTLP

Configure sua aplicação para enviar dados de telemetria para o OpenTelemetry Collector:

**Aplicação externa ao Docker:**
```bash
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:34317  # gRPC
# ou
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:34318  # HTTP
```

**Aplicação dentro da rede Docker 'observability':**
```bash
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317  # gRPC
# ou
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318  # HTTP
```

### Exemplo de Instrumentação (Node.js)

O arquivo `example.js` contém um exemplo completo de instrumentação. Instalação básica:

```bash
npm install @opentelemetry/sdk-node \
            @opentelemetry/api \
            @opentelemetry/exporter-otlp-grpc \
            @opentelemetry/auto-instrumentations-node
```

Código mínimo:

```javascript
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-otlp-grpc');

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: 'http://localhost:34317',
  }),
});

sdk.start();
```

### Linguagens Suportadas

O OpenTelemetry possui SDKs oficiais para:

- JavaScript/Node.js - [Documentação](https://opentelemetry.io/docs/instrumentation/js/)
- Python - [Documentação](https://opentelemetry.io/docs/instrumentation/python/)
- Go - [Documentação](https://opentelemetry.io/docs/instrumentation/go/)
- Java - [Documentação](https://opentelemetry.io/docs/instrumentation/java/)
- .NET - [Documentação](https://opentelemetry.io/docs/instrumentation/net/)
- PHP, Ruby, Rust e outras

---

## Comandos Disponíveis

### Usando Makefile

O projeto inclui um Makefile com comandos de automação:

```bash
make help          # Exibe todos os comandos disponíveis
make up            # Inicia todos os serviços
make down          # Para todos os serviços
make restart       # Reinicia todos os serviços
make logs          # Exibe logs de todos os serviços
make logs-<service> # Exibe logs de um serviço específico (ex: make logs-grafana)
make status        # Mostra status de todos os serviços
make endpoints     # Lista todos os endpoints disponíveis
make health        # Verifica saúde dos serviços
make test          # Testa conectividade com os serviços
make backup        # Cria backup dos volumes
make clean         # Remove containers e imagens não utilizadas
make validate      # Valida arquivos de configuração
make update        # Atualiza para versões mais recentes
```

### Comandos Docker Compose

```bash
# Iniciar serviços em background
docker compose up -d

# Parar serviços (mantém volumes)
docker compose down

# Parar serviços e remover volumes (CUIDADO: perde dados)
docker compose down -v

# Visualizar logs em tempo real
docker compose logs -f

# Visualizar logs de um serviço específico
docker compose logs -f grafana

# Verificar status
docker compose ps

# Reiniciar um serviço específico
docker compose restart grafana

# Atualizar imagens
docker compose pull
docker compose up -d
```

---

## Monitoramento e Queries

### Acessando o Grafana

1. Acesse http://localhost:33000
2. Faça login com as credenciais do arquivo `.env`
3. Navegue até "Explore" na barra lateral
4. Selecione um data source (Prometheus, Loki ou Jaeger)

### Exemplos de Queries

#### Prometheus (PromQL)

```promql
# Status de todos os targets monitorados
up

# Uso de CPU do host (rate de 5 minutos)
rate(node_cpu_seconds_total{mode="idle"}[5m])

# Uso de memória por container
container_memory_usage_bytes

# Taxa de requisições HTTP (métricas customizadas da aplicação)
rate(http_requests_total[5m])

# Percentil 95 de latência
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

#### Loki (LogQL)

```logql
# Todos os logs de containers
{job="containerlogs"}

# Logs contendo a palavra "error" (case-insensitive)
{job="containerlogs"} |~ "(?i)error"

# Logs de um container específico
{container_name="grafana"}

# Logs com parsing JSON
{job="containerlogs"} | json | level="error"

# Rate de logs de erro nos últimos 5 minutos
rate({job="containerlogs"} |~ "error" [5m])
```

#### Jaeger (Traces)

1. Selecione o serviço na lista (ex: `my-nodejs-app`)
2. Opcionalmente, filtre por operação específica (ex: `doWork`)
3. Adicione tags para filtros avançados (ex: `http.status_code=500`)
4. Clique em "Find Traces"
5. Selecione um trace para visualizar detalhes

### Correlação de Dados

A stack está configurada para correlação automática entre diferentes tipos de dados:

- **Trace para Logs**: Clique em um TraceID em logs do Loki para navegar até o trace correspondente no Jaeger
- **Metrics para Traces**: Queries no Prometheus podem incluir links para traces relacionados
- **Logs para Traces**: Logs que contêm TraceID automaticamente linkam para o Jaeger

---

## Backup e Restore

### Criação de Backup

#### Usando Makefile

```bash
make backup
```

Isso criará backups de todos os volumes na pasta `./backups/` com timestamp.

#### Manualmente

```bash
mkdir -p backups

# Backup do Grafana
docker run --rm -v observabilidade_grafana_data:/data \
  -v $(pwd)/backups:/backup alpine \
  tar czf /backup/grafana_$(date +%Y%m%d_%H%M%S).tar.gz -C /data .

# Backup do Prometheus
docker run --rm -v observabilidade_prometheus_data:/data \
  -v $(pwd)/backups:/backup alpine \
  tar czf /backup/prometheus_$(date +%Y%m%d_%H%M%S).tar.gz -C /data .

# Backup do Loki
docker run --rm -v observabilidade_loki_data:/data \
  -v $(pwd)/backups:/backup alpine \
  tar czf /backup/loki_$(date +%Y%m%d_%H%M%S).tar.gz -C /data .
```

### Restauração de Backup

```bash
# 1. Parar os serviços
docker compose down

# 2. Restaurar o volume desejado
docker run --rm -v observabilidade_grafana_data:/data \
  -v $(pwd)/backups:/backup alpine \
  tar xzf /backup/grafana_TIMESTAMP.tar.gz -C /data

# 3. Reiniciar os serviços
docker compose up -d
```

---

## Considerações para Produção

### Checklist de Segurança

Antes de implantar em produção, é **obrigatório**:

- [ ] Alterar todas as senhas padrão no arquivo `.env`
- [ ] Configurar TLS/SSL para todas as interfaces de usuário
- [ ] Implementar autenticação para Prometheus, Jaeger e Loki
- [ ] Configurar reverse proxy (Nginx, Traefik, HAProxy) na frente dos serviços
- [ ] Restringir acesso via firewall (whitelist de IPs)
- [ ] Configurar Jaeger com storage persistente (Cassandra, Elasticsearch ou PostgreSQL)
- [ ] Implementar rotação automática de logs
- [ ] Configurar backups automatizados e testá-los regularmente
- [ ] Monitorar uso de recursos dos containers
- [ ] Configurar alertas no Grafana e Prometheus
- [ ] Revisar e ajustar políticas de retenção de dados
- [ ] Implementar auditoria de acessos

### Recomendações de Escalabilidade

#### Ambiente de Pequeno Porte (1-10 serviços)

- Configuração atual é adequada
- Considerar migração do Jaeger para storage persistente
- Monitorar uso de disco dos volumes

#### Ambiente de Médio Porte (10-100 serviços)

- Jaeger com Cassandra ou Elasticsearch
- Loki em modo distribuído
- Prometheus com remote storage (Thanos ou Cortex)
- Múltiplas instâncias do OpenTelemetry Collector
- Load balancer para o Grafana

#### Ambiente de Grande Porte (100+ serviços)

- Jaeger totalmente distribuído (Spark, Kafka)
- Loki clustering completo
- Prometheus Federation ou Thanos/Cortex
- OpenTelemetry Collector escalado horizontalmente
- Grafana em alta disponibilidade
- Estratégia de sharding para dados

### Limitação de Recursos

Adicione limites de recursos no `docker-compose.yml` para evitar consumo excessivo:

```yaml
services:
  prometheus:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
```

### Otimização de Performance

- Ajuste os intervalos de scrape do Prometheus conforme necessário
- Configure retenção de dados apropriada para seu caso de uso
- Monitore e ajuste batch sizes no OpenTelemetry Collector
- Implemente sampling de traces em ambientes de alta carga
- Considere compressão de logs

---

## Troubleshooting

### Problemas Comuns

#### Porta já está em uso

```bash
# Windows
netstat -ano | findstr :33000

# Linux/Mac
lsof -i :33000

# Solução: Altere a porta no docker-compose.yml ou finalize o processo
```

#### Container reiniciando continuamente

```bash
# Visualize os logs do container
docker logs <container_name>

# Verifique uso de recursos
docker stats

# Verifique configurações
docker inspect <container_name>
```

#### Data sources não conectam no Grafana

```bash
# Verifique se todos os serviços estão rodando
docker compose ps

# Teste conectividade entre containers
docker exec grafana ping prometheus
docker exec grafana wget -O- http://prometheus:9090/-/healthy

# Verifique logs do Grafana
docker logs grafana
```

#### Dados não aparecem

```bash
# Verifique targets no Prometheus
# Acesse: http://localhost:39090/targets

# Verifique logs do OTEL Collector
docker logs otel-collector

# Teste endpoint do OTEL Collector
curl -v http://localhost:34318/v1/traces
```

Para soluções detalhadas, consulte [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

---

## Documentação Adicional

### Documentação do Projeto

- [ARCHITECTURE.md](ARCHITECTURE.md) - Arquitetura detalhada e fluxo de dados
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Guia completo de resolução de problemas
- [example.js](example.js) - Exemplo de aplicação Node.js instrumentada

### Documentação Externa

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
- [Loki Documentation](https://grafana.com/docs/loki/)

### Recursos da Comunidade

- [CNCF Observability](https://www.cncf.io/projects/)
- [OpenTelemetry Community](https://opentelemetry.io/community/)
- [Grafana Community](https://community.grafana.com/)

---

## Contribuindo

Contribuições são bem-vindas. Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nome-da-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nome-da-feature`)
5. Abra um Pull Request

### Diretrizes de Contribuição

- Mantenha o código limpo e bem documentado
- Siga as convenções de código existentes
- Adicione testes quando apropriado
- Atualize a documentação conforme necessário
- Certifique-se de que todas as mudanças são compatíveis com a arquitetura existente

---

## Licença

Este projeto é fornecido "como está", sem garantias de qualquer tipo, expressas ou implícitas. Use por sua conta e risco.

---

## Agradecimentos

Esta stack foi criada utilizando as seguintes ferramentas open-source:

- [Grafana Labs](https://grafana.com/) - Grafana, Loki, Promtail
- [Prometheus](https://prometheus.io/) - Cloud Native Computing Foundation Project
- [Jaeger](https://www.jaegertracing.io/) - Cloud Native Computing Foundation Project
- [OpenTelemetry](https://opentelemetry.io/) - Cloud Native Computing Foundation Project
- [Percona](https://www.percona.com/) - PMM Server
- [cAdvisor](https://github.com/google/cadvisor) - Google

---

<div align="center">

**Stack de Observabilidade Completa**

Desenvolvido para a comunidade de observabilidade e DevOps

</div>
