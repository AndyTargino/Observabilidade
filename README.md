# 🔍 Stack de Observabilidade Completa

<div align="center">

![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Grafana](https://img.shields.io/badge/Grafana-F46800?style=for-the-badge&logo=grafana&logoColor=white)
![Prometheus](https://img.shields.io/badge/Prometheus-E6522C?style=for-the-badge&logo=prometheus&logoColor=white)
![OpenTelemetry](https://img.shields.io/badge/OpenTelemetry-000000?style=for-the-badge&logo=opentelemetry&logoColor=white)

**Stack de observabilidade empresarial completa e pronta para produção**

Implementa os três pilares da observabilidade: **Traces** • **Logs** • **Metrics**

[Início Rápido](#-início-rápido) • [Documentação](#-documentação) • [Arquitetura](#-arquitetura) • [Troubleshooting](#-troubleshooting)

</div>

---

## 📋 Sumário

- [Visão Geral](#-visão-geral)
- [Componentes](#-componentes)
- [Arquitetura](#-arquitetura)
- [Pré-requisitos](#-pré-requisitos)
- [Início Rápido](#-início-rápido)
- [Endpoints de Acesso](#-endpoints-de-acesso)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Configuração](#-configuração)
- [Integração com Aplicações](#-integração-com-aplicações)
- [Comandos Úteis](#-comandos-úteis)
- [Monitoramento](#-monitoramento)
- [Backup e Restore](#-backup-e-restore)
- [Produção](#-produção)
- [Troubleshooting](#-troubleshooting)
- [Documentação Adicional](#-documentação-adicional)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

---

## 🎯 Visão Geral

Este projeto fornece uma **stack de observabilidade completa e profissional**, pronta para produção, utilizando Docker. A stack implementa as melhores práticas da indústria para monitoramento, logging e rastreamento distribuído de aplicações modernas.

### 🎯 Por que usar esta stack?

- ✅ **Completa**: Traces, Logs e Métricas em um único lugar
- ✅ **Pronta para Produção**: Configurações otimizadas e testadas
- ✅ **Fácil Integração**: Suporte para OpenTelemetry (OTLP)
- ✅ **Correlação de Dados**: Link automático entre traces, logs e métricas
- ✅ **Persistência**: Volumes Docker para dados críticos
- ✅ **Escalável**: Arquitetura preparada para crescimento
- ✅ **Zero Conflitos**: Portas configuradas na faixa 30000+ (sem conflitos)

---

## 🧩 Componentes

<table>
<tr>
<td width="50%">

### 📊 Visualização & Dashboards
- **Grafana 11.2.0**
  - Dashboards interativos
  - Data sources provisionados
  - Correlação automática
  - Alerting integrado

### 📈 Métricas
- **Prometheus 2.48.1**
  - Time-series database
  - Retenção de 90 dias
  - PromQL queries
- **Node Exporter 1.7.0**
  - Métricas do host/SO
- **cAdvisor 0.47.2**
  - Métricas de containers

</td>
<td width="50%">

### 🔍 Traces (Rastreamento)
- **Jaeger 1.50**
  - Distributed tracing
  - UI para análise
  - OTLP enabled
- **OpenTelemetry Collector 0.88.0**
  - Hub central de telemetria
  - OTLP gRPC/HTTP
  - Processamento e exportação

### 📝 Logs
- **Loki 2.9.2**
  - Agregação de logs
  - Retenção de 30 dias
- **Promtail 2.9.2**
  - Coleta logs Docker

### 🗄️ Banco de Dados
- **Percona PMM Server 2.40.1**
  - MySQL, PostgreSQL, MongoDB

</td>
</tr>
</table>

---

## 🏗️ Arquitetura

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

Veja a [documentação completa de arquitetura](ARCHITECTURE.md) para mais detalhes.

---

## 📦 Pré-requisitos

Antes de começar, certifique-se de ter:

- **Docker Engine** 20.10+ instalado ([Instalar Docker](https://docs.docker.com/get-docker/))
- **Docker Compose** 2.0+ instalado ([Instalar Compose](https://docs.docker.com/compose/install/))
- **4 GB de RAM** disponível (mínimo recomendado)
- **10 GB de espaço em disco** disponível
- **Portas disponíveis** na faixa 30000-40000

### Verificar pré-requisitos

```bash
# Verificar versão do Docker
docker --version
# Output esperado: Docker version 20.10.0 ou superior

# Verificar versão do Docker Compose
docker compose version
# Output esperado: Docker Compose version 2.0.0 ou superior

# Verificar espaço em disco
docker system df
```

---

## 🚀 Início Rápido

### 1. Clone ou baixe este projeto

```bash
git clone <seu-repositorio>
cd Observabilidade
```

### 2. Configure as variáveis de ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o arquivo .env e altere as senhas
# IMPORTANTE: Altere GF_SECURITY_ADMIN_PASSWORD!
```

### 3. Inicie a stack

```bash
# Usando Docker Compose
docker compose up -d

# OU usando Makefile (recomendado)
make up
```

### 4. Aguarde os serviços iniciarem

```bash
# Verifique o status
make status

# Ou
docker compose ps
```

### 5. Acesse as interfaces

Abra seu navegador nos seguintes endereços:

- 🎨 **Grafana**: http://localhost:33000 (admin / sua_senha)
- 🔍 **Jaeger UI**: http://localhost:36686
- 📈 **Prometheus**: http://localhost:39090
- 🗄️ **PMM Server**: http://localhost:33443 (admin / admin)

---

## 🌐 Endpoints de Acesso

### Interfaces Web (UIs)

| Serviço | URL | Credenciais | Descrição |
|---------|-----|-------------|-----------|
| **Grafana** | http://localhost:33000 | admin / (ver .env) | Dashboards e visualização |
| **Jaeger UI** | http://localhost:36686 | - | Visualização de traces |
| **Prometheus** | http://localhost:39090 | - | Métricas e queries |
| **PMM Server** | http://localhost:33443 | admin / admin | Monitoramento DB |
| **cAdvisor** | http://localhost:38080 | - | Métricas de containers |
| **Node Exporter** | http://localhost:39100/metrics | - | Métricas do host |

### APIs e Endpoints de Integração

| Serviço | Porta | Protocolo | Uso |
|---------|-------|-----------|-----|
| **OTLP Collector** | 34317 | gRPC | Enviar traces/logs/metrics |
| **OTLP Collector** | 34318 | HTTP | Enviar traces/logs/metrics |
| **Jaeger Collector** | 34268 | HTTP | Coletar traces |
| **Jaeger Agent** | 6831 | UDP | Coletar traces |
| **Loki** | 33100 | HTTP | API de logs |
| **OTEL Metrics** | 38888 | HTTP | Métricas do Collector |

---

## 📁 Estrutura do Projeto

```
Observabilidade/
├── 📄 docker-compose.yml          # Orquestração dos serviços
├── 📄 .env                         # Variáveis de ambiente
├── 📄 .env.example                 # Exemplo de configuração
├── 📄 .gitignore                   # Arquivos ignorados pelo git
├── 📄 Makefile                     # Comandos úteis
├── 📄 README.md                    # Este arquivo
├── 📄 ARCHITECTURE.md              # Documentação de arquitetura
├── 📄 TROUBLESHOOTING.md           # Guia de resolução de problemas
├── 📄 example.js                   # Exemplo de app instrumentada
│
├── 📁 configs/                     # Configurações dos serviços
│   ├── otel-collector-config.yaml # OpenTelemetry Collector
│   ├── prometheus.yml              # Prometheus
│   ├── loki-config.yml             # Loki
│   └── promtail-config.yml         # Promtail
│
└── 📁 grafana/                     # Configurações do Grafana
    ├── provisioning/
    │   ├── datasources/
    │   │   └── datasources.yml     # Prometheus, Loki, Jaeger
    │   └── dashboards/
    │       └── dashboards.yml      # Configuração de dashboards
    └── dashboards/                 # Seus dashboards customizados
        └── README.txt
```

---

## ⚙️ Configuração

### Arquivo `.env`

O arquivo `.env` contém todas as configurações importantes da stack:

```ini
# VERSÕES (fixadas para estabilidade)
GRAFANA_VERSION=11.2.0
PROMETHEUS_VERSION=v2.48.1
JAEGER_VERSION=1.50
# ... outras versões

# CREDENCIAIS
GF_SECURITY_ADMIN_USER=admin
GF_SECURITY_ADMIN_PASSWORD=sua_senha_segura  # ⚠️ ALTERE ISSO!

# RETENÇÃO DE DADOS
PROMETHEUS_RETENTION_TIME=90d    # Métricas: 90 dias
LOKI_RETENTION_DAYS=30d          # Logs: 30 dias
JAEGER_RETENTION_HOURS=24h       # Traces: 24 horas
```

### Arquivos de Configuração

| Arquivo | Descrição |
|---------|-----------|
| `configs/otel-collector-config.yaml` | Receivers, processors e exporters do OTEL |
| `configs/prometheus.yml` | Targets de scrape e configurações |
| `configs/loki-config.yml` | Storage e retenção de logs |
| `configs/promtail-config.yml` | Coleta de logs dos containers |
| `grafana/provisioning/datasources/datasources.yml` | Prometheus, Loki e Jaeger auto-provisionados |

### Volumes Persistentes

Os dados são armazenados em volumes Docker nomeados:

- `grafana_data`: Dashboards e configurações
- `prometheus_data`: Métricas time-series (~5-50GB)
- `loki_data`: Logs agregados (~2-20GB)
- `pmm_data`: Dados de monitoramento de DB

---

## 🔌 Integração com Aplicações

### Como Conectar Sua Aplicação

O OpenTelemetry Collector é o ponto de entrada para toda telemetria. Configure sua aplicação para enviar dados via OTLP:

```bash
# Se sua app está FORA do Docker
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:34317  # gRPC
# ou
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:34318  # HTTP

# Se sua app está DENTRO da rede Docker 'observability'
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317  # gRPC
```

### Exemplo Node.js

Veja o arquivo `example.js` para um exemplo completo de instrumentação.

**Instalação das dependências**:

```bash
npm install @opentelemetry/sdk-node \
            @opentelemetry/api \
            @opentelemetry/exporter-otlp-grpc \
            @opentelemetry/auto-instrumentations-node
```

**Código básico**:

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

- **JavaScript/Node.js** - [Docs](https://opentelemetry.io/docs/instrumentation/js/)
- **Python** - [Docs](https://opentelemetry.io/docs/instrumentation/python/)
- **Go** - [Docs](https://opentelemetry.io/docs/instrumentation/go/)
- **Java** - [Docs](https://opentelemetry.io/docs/instrumentation/java/)
- **.NET** - [Docs](https://opentelemetry.io/docs/instrumentation/net/)
- **PHP, Ruby, Rust** - e muitas outras!

---

## 🛠️ Comandos Úteis

Este projeto inclui um **Makefile** com comandos úteis:

```bash
make help          # Mostra todos os comandos disponíveis
make up            # Inicia todos os serviços
make down          # Para todos os serviços
make restart       # Reinicia todos os serviços
make logs          # Mostra logs de todos os serviços
make logs-grafana  # Mostra logs de um serviço específico
make status        # Status de todos os serviços
make endpoints     # Lista todos os endpoints
make health        # Verifica saúde dos serviços
make test          # Testa conectividade
make backup        # Faz backup dos volumes
make clean         # Remove containers e imagens não usadas
```

### Comandos Docker Compose Diretos

```bash
# Iniciar
docker compose up -d

# Parar (mantém volumes)
docker compose down

# Parar e REMOVER volumes (⚠️ perde dados!)
docker compose down -v

# Ver logs
docker compose logs -f

# Ver logs de um serviço
docker compose logs -f grafana

# Ver status
docker compose ps

# Reiniciar um serviço
docker compose restart grafana

# Atualizar imagens
docker compose pull
docker compose up -d
```

---

## 📊 Monitoramento

### No Grafana

1. **Acesse**: http://localhost:33000
2. **Login**: admin / (sua senha do .env)
3. **Explore**:
   - Clique em "Explore" na barra lateral
   - Selecione um data source (Prometheus, Loki ou Jaeger)

### Exemplos de Queries

**Prometheus (Métricas)**:
```promql
# Ver status de todos os targets
up

# CPU usage do host
rate(node_cpu_seconds_total[5m])

# Memória de containers
container_memory_usage_bytes

# Requests HTTP personalizadas (da sua app)
rate(http_requests_total[5m])
```

**Loki (Logs)**:
```logql
# Todos os logs de containers
{job="containerlogs"}

# Logs com erro
{job="containerlogs"} |~ "error"

# Logs de um container específico
{container_name="grafana"}
```

**Jaeger (Traces)**:
- Selecione o serviço (ex: `my-nodejs-app`)
- Escolha a operação (ex: `doWork`)
- Clique em "Find Traces"

### Correlação de Dados

A stack está configurada para correlação automática:

- 🔍 **Trace → Logs**: Click no TraceID em um log do Loki para ver o trace no Jaeger
- 📊 **Metrics → Traces**: Query no Prometheus com link para traces relacionados
- 📝 **Logs → Traces**: Logs contendo TraceID linkam automaticamente para Jaeger

---

## 💾 Backup e Restore

### Fazer Backup

```bash
# Usando Makefile
make backup

# Ou manualmente
mkdir -p backups
docker run --rm -v observabilidade_grafana_data:/data \
  -v $(pwd)/backups:/backup alpine \
  tar czf /backup/grafana_backup_$(date +%Y%m%d).tar.gz -C /data .
```

### Restaurar Backup

```bash
# 1. Pare os serviços
docker compose down

# 2. Restaure o volume
docker run --rm -v observabilidade_grafana_data:/data \
  -v $(pwd)/backups:/backup alpine \
  tar xzf /backup/grafana_backup_XXXXXXXX.tar.gz -C /data

# 3. Reinicie
docker compose up -d
```

---

## 🚀 Produção

### ⚠️ Checklist de Segurança

Antes de usar em produção, **OBRIGATORIAMENTE**:

- [ ] Altere **todas as senhas** padrão no `.env`
- [ ] Configure TLS/SSL para todas as UIs
- [ ] Configure autenticação para Prometheus, Jaeger, Loki
- [ ] Use reverse proxy (Nginx, Traefik) na frente dos serviços
- [ ] Restrinja acesso via firewall (IPs whitelistados)
- [ ] Configure Jaeger com storage persistente (Cassandra/ES)
- [ ] Implemente rotação de logs
- [ ] Configure backups automatizados
- [ ] Monitore uso de recursos
- [ ] Configure alertas no Grafana/Prometheus

### Escalabilidade

**Pequeno Porte (1-10 serviços)**:
- Configuração atual é suficiente
- Considere Jaeger com storage persistente

**Médio Porte (10-100 serviços)**:
- Jaeger com Cassandra ou Elasticsearch
- Loki distribuído
- Prometheus com remote storage

**Grande Porte (100+ serviços)**:
- Jaeger distribuído (Spark, Kafka)
- Loki clustering
- Prometheus Federation ou Thanos/Cortex
- OTEL Collector escalado horizontalmente

### Limitação de Recursos

Adicione limites no `docker-compose.yml`:

```yaml
services:
  prometheus:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          memory: 2G
```

---

## 🔧 Troubleshooting

### Problemas Comuns

**Porta já está em uso**:
```bash
# Verifique qual processo está usando a porta
netstat -ano | findstr :33000  # Windows
lsof -i :33000                  # Linux/Mac

# Altere a porta no docker-compose.yml
```

**Container reiniciando**:
```bash
# Veja os logs
docker logs <container_name>

# Verifique recursos
docker stats
```

**Dados não aparecem no Grafana**:
```bash
# Verifique se os serviços estão rodando
docker compose ps

# Teste conectividade
docker exec grafana ping prometheus
docker exec grafana wget -O- http://prometheus:9090/-/healthy
```

Para mais soluções, consulte o [Guia de Troubleshooting](TROUBLESHOOTING.md).

---

## 📚 Documentação Adicional

- [ARCHITECTURE.md](ARCHITECTURE.md) - Arquitetura detalhada e fluxo de dados
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Guia completo de resolução de problemas
- [example.js](example.js) - Exemplo de aplicação Node.js instrumentada

### Documentação Externa

- [OpenTelemetry](https://opentelemetry.io/docs/)
- [Grafana](https://grafana.com/docs/)
- [Prometheus](https://prometheus.io/docs/)
- [Jaeger](https://www.jaegertracing.io/docs/)
- [Loki](https://grafana.com/docs/loki/)

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fazer um fork do projeto
2. Criar uma branch para sua feature (`git checkout -b feature/amazing-feature`)
3. Commitar suas mudanças (`git commit -m 'Add amazing feature'`)
4. Push para a branch (`git push origin feature/amazing-feature`)
5. Abrir um Pull Request

---

## 📝 Licença

Este projeto é fornecido "como está", sem garantias. Use por sua conta e risco.

---

## 🙏 Agradecimentos

Stack criada com as seguintes ferramentas open-source:

- [Grafana Labs](https://grafana.com/) - Grafana, Loki, Promtail
- [Prometheus](https://prometheus.io/) - CNCF Project
- [Jaeger](https://www.jaegertracing.io/) - CNCF Project
- [OpenTelemetry](https://opentelemetry.io/) - CNCF Project
- [Percona](https://www.percona.com/) - PMM Server
- [cAdvisor](https://github.com/google/cadvisor) - Google

---

<div align="center">

**⭐ Se este projeto foi útil, considere dar uma estrela!**

Made with ❤️ para a comunidade de observabilidade

</div>
