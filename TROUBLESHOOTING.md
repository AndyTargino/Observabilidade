# Guia de Solução de Problemas

Este documento contém soluções para problemas comuns encontrados ao usar a stack de observabilidade.

## Sumário
- [Problemas de Inicialização](#problemas-de-inicialização)
- [Problemas de Conectividade](#problemas-de-conectividade)
- [Problemas de Performance](#problemas-de-performance)
- [Problemas com Volumes](#problemas-com-volumes)
- [Problemas com Portas](#problemas-com-portas)
- [Problemas de Integração](#problemas-de-integração)

---

## Problemas de Inicialização

### Erro: "port is already allocated"

**Sintoma**: Ao executar `docker compose up`, você recebe um erro informando que uma porta já está alocada.

**Solução**:
```bash
# Verifique quais processos estão usando as portas
netstat -ano | findstr :33000
# Ou no Linux/Mac
lsof -i :33000

# Pare o serviço que está usando a porta ou altere a porta no docker-compose.yml
```

### Erro: "no configuration file provided"

**Sintoma**: Erro ao iniciar o Prometheus, Loki ou OTEL Collector.

**Solução**:
```bash
# Verifique se os arquivos de configuração existem
ls -la configs/

# Se estiverem faltando, restaure do repositório ou recrie
```

### Container reiniciando continuamente

**Sintoma**: Um ou mais containers ficam reiniciando em loop.

**Solução**:
```bash
# Verifique os logs do container
docker logs <container_name>

# Verifique se há problemas de permissão nos volumes
docker compose down
docker volume ls
docker volume inspect observabilidade_<volume_name>
```

---

## Problemas de Conectividade

### Grafana não conecta ao Prometheus/Loki/Jaeger

**Sintoma**: Data sources aparecem como "unreachable" no Grafana.

**Solução**:
1. Verifique se todos os serviços estão rodando:
   ```bash
   docker compose ps
   ```

2. Verifique a rede Docker:
   ```bash
   docker network inspect observability
   ```

3. Teste a conectividade dentro da rede:
   ```bash
   docker exec grafana ping prometheus
   docker exec grafana wget -O- http://prometheus:9090/-/healthy
   ```

4. Verifique os data sources provisionados:
   ```bash
   cat grafana/provisioning/datasources/datasources.yml
   ```

### Aplicação externa não consegue enviar dados para OTEL Collector

**Sintoma**: Traces/logs/métricas não aparecem no Jaeger/Loki/Prometheus.

**Solução**:
1. Verifique se está usando as portas corretas:
   - OTLP gRPC: `localhost:34317`
   - OTLP HTTP: `localhost:34318`

2. Se sua aplicação está em um container Docker, use o nome do serviço:
   - `http://otel-collector:4317` (dentro da rede observability)

3. Verifique os logs do OTEL Collector:
   ```bash
   docker logs otel-collector
   ```

4. Teste a conectividade:
   ```bash
   curl -v http://localhost:34318/v1/traces
   ```

---

## Problemas de Performance

### Alto uso de CPU/Memória

**Sintoma**: Containers consumindo muitos recursos.

**Solução**:
1. Verifique o uso de recursos:
   ```bash
   docker stats
   ```

2. Ajuste os limites de retenção no `.env`:
   ```env
   PROMETHEUS_RETENTION_TIME=30d  # Reduzir de 90d
   LOKI_RETENTION_DAYS=7d         # Reduzir de 30d
   ```

3. Adicione limites de recursos no `docker-compose.yml`:
   ```yaml
   services:
     prometheus:
       deploy:
         resources:
           limits:
             cpus: '1'
             memory: 2G
   ```

### Prometheus consumindo muito disco

**Sintoma**: Volume `prometheus_data` crescendo rapidamente.

**Solução**:
```bash
# Reduza o tempo de retenção
# Edite .env e altere PROMETHEUS_RETENTION_TIME

# Ou reduza o intervalo de scrape em configs/prometheus.yml
# De 15s para 30s ou 60s
```

### Loki lento para consultas

**Sintoma**: Queries no Grafana demoram muito.

**Solução**:
1. Reduza o intervalo de tempo da query
2. Use filtros mais específicos (labels)
3. Considere aumentar os recursos do Loki
4. Verifique a retenção de logs

---

## Problemas com Volumes

### Dados perdidos após `docker compose down`

**Sintoma**: Dashboards, configurações ou dados históricos desapareceram.

**Solução**:
```bash
# NÃO use o flag -v ao parar os containers
docker compose down     # Correto - mantém volumes
docker compose down -v  # ERRADO - remove volumes

# Para verificar se os volumes existem
docker volume ls | grep observabilidade
```

### Erro de permissão em volumes

**Sintoma**: Containers falham ao iniciar com erros de permissão.

**Solução** (Linux/Mac):
```bash
# Verifique as permissões dos volumes montados
ls -la grafana/

# Ajuste as permissões se necessário
sudo chown -R 472:472 grafana/  # UID do Grafana
```

### Restaurar backup de volumes

**Sintoma**: Precisa restaurar dados de um backup.

**Solução**:
```bash
# 1. Pare os serviços
docker compose down

# 2. Restaure o volume
docker run --rm -v observabilidade_grafana_data:/data \
  -v $(pwd)/backups:/backup alpine \
  tar xzf /backup/grafana_data_XXXXXXXX.tar.gz -C /data

# 3. Reinicie os serviços
docker compose up -d
```

---

## Problemas com Portas

### Windows: Portas não acessíveis

**Sintoma**: Não consegue acessar `localhost:33000` mesmo com containers rodando.

**Solução**:
```powershell
# Verifique se o Docker Desktop está usando WSL2
# Verifique firewall do Windows

# Teste com o IP do container diretamente
docker inspect grafana | findstr IPAddress

# Acesse http://<IP>:3000
```

### Conflito de portas mesmo após mudança

**Sintoma**: Porta ainda conflitando após alteração no docker-compose.yml.

**Solução**:
```bash
# 1. Pare todos os containers
docker compose down

# 2. Remova containers órfãos
docker rm $(docker ps -aq)

# 3. Inicie novamente
docker compose up -d
```

---

## Problemas de Integração

### Traces não aparecem no Jaeger

**Sintoma**: Aplicação instrumentada mas traces não aparecem.

**Solução**:
1. Verifique se OTLP está ativado no Jaeger:
   ```bash
   docker exec jaeger env | grep OTLP
   # Deve mostrar COLLECTOR_OTLP_ENABLED=true
   ```

2. Verifique se OTEL Collector está exportando para Jaeger:
   ```bash
   cat configs/otel-collector-config.yaml
   # Verifique a seção exporters.otlp.endpoint
   ```

3. Teste enviando um trace manualmente:
   ```bash
   # Instale grpcurl
   grpcurl -plaintext -d '{"resourceSpans":[]}' \
     localhost:34317 \
     opentelemetry.proto.collector.trace.v1.TraceService/Export
   ```

### Logs não aparecem no Loki

**Sintoma**: Logs de containers não aparecem no Grafana.

**Solução**:
1. Verifique se Promtail está rodando:
   ```bash
   docker logs promtail
   ```

2. Verifique se Promtail consegue acessar os logs Docker:
   ```bash
   docker exec promtail ls -la /var/lib/docker/containers/
   ```

3. Teste query no Loki diretamente:
   ```bash
   curl -G 'http://localhost:33100/loki/api/v1/query' \
     --data-urlencode 'query={job="containerlogs"}'
   ```

### Métricas não aparecem no Prometheus

**Sintoma**: Targets aparecem como "down" no Prometheus.

**Solução**:
1. Verifique os targets no Prometheus UI:
   - Acesse http://localhost:39090/targets

2. Verifique a configuração de scrape:
   ```bash
   cat configs/prometheus.yml
   ```

3. Teste o endpoint de métricas:
   ```bash
   curl http://localhost:39100/metrics  # Node Exporter
   curl http://localhost:38080/metrics  # cAdvisor
   ```

---

## Comandos Úteis para Diagnóstico

### Verificar saúde de todos os serviços
```bash
make health
# Ou
docker compose ps
```

### Verificar logs de um serviço específico
```bash
docker logs -f <service_name>
# Ou usando make
make logs-grafana
```

### Verificar conectividade entre containers
```bash
docker exec <container1> ping <container2>
docker exec <container1> wget -O- http://<container2>:<port>
```

### Verificar uso de recursos
```bash
docker stats
```

### Verificar volumes
```bash
docker volume ls
docker volume inspect <volume_name>
```

### Verificar rede
```bash
docker network ls
docker network inspect observability
```

---

## Ainda com Problemas?

Se nenhuma das soluções acima resolveu seu problema:

1. **Colete informações**:
   ```bash
   docker compose ps
   docker compose logs > logs.txt
   docker stats --no-stream > stats.txt
   ```

2. **Verifique a documentação oficial**:
   - [Grafana Docs](https://grafana.com/docs/)
   - [Prometheus Docs](https://prometheus.io/docs/)
   - [Jaeger Docs](https://www.jaegertracing.io/docs/)
   - [OpenTelemetry Docs](https://opentelemetry.io/docs/)

3. **Procure por issues similares** nos repositórios oficiais

4. **Reinicie do zero** (última opção):
   ```bash
   docker compose down -v
   docker system prune -a
   docker compose up -d
   ```
