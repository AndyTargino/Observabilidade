# Guia Completo: Monitorar Banco de Dados com PMM

Este guia mostra como conectar seu banco de dados ao PMM Server para monitorar queries lentas, performance e muito mais.

## Passo 1: Verificar se PMM está rodando

```bash
docker compose ps
```

Deve mostrar `pmm-server` rodando na porta 33443.

## Passo 2: Acessar PMM UI

Abra: http://localhost:33443

- Login: `admin`
- Senha: `admin`

## Passo 3: Configurar Banco de Dados

### MySQL / MariaDB

#### A) Criar usuário com permissões

No servidor MySQL, execute:

```sql
CREATE USER 'pmm'@'%' IDENTIFIED BY 'senha_forte_aqui';

GRANT SELECT, PROCESS, REPLICATION CLIENT, RELOAD ON *.* TO 'pmm'@'%';

-- Para MySQL 8.0+
GRANT BACKUP_ADMIN ON *.* TO 'pmm'@'%';

FLUSH PRIVILEGES;
```

#### B) Habilitar slow query log (opcional mas recomendado)

```sql
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 0.5;  -- Queries > 0.5 segundos
SET GLOBAL log_slow_admin_statements = ON;
SET GLOBAL log_slow_slave_statements = ON;
```

#### C) Adicionar ao PMM via UI

1. No PMM UI, vá em **Configuration → PMM Inventory → Add Service**
2. Selecione **MySQL**
3. Preencha:
   - **Service name**: `meu-mysql` (ou nome que preferir)
   - **Hostname**: IP ou hostname do MySQL
   - **Port**: `3306`
   - **Username**: `pmm`
   - **Password**: `senha_forte_aqui`
4. Clique em **Add service**

#### D) Ou adicionar via linha de comando

Se seu MySQL está em Docker na mesma rede:

```bash
docker run --rm \
  --network observability \
  percona/pmm-client:2 \
  pmm-admin add mysql \
  --username=pmm \
  --password=senha_forte_aqui \
  --server-url=http://admin:admin@pmm-server:80 \
  --query-source=perfschema \
  meu-mysql mysql:3306
```

---

### PostgreSQL

#### A) Criar usuário com permissões

```sql
CREATE USER pmm WITH PASSWORD 'senha_forte_aqui';
GRANT pg_monitor TO pmm;

-- PostgreSQL 10+
ALTER USER pmm SET ROLE TO pg_monitor;
```

#### B) Habilitar extensões

```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

Adicione no `postgresql.conf`:

```conf
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.track = all
```

Reinicie o PostgreSQL.

#### C) Adicionar ao PMM

No PMM UI:
1. **Configuration → Add Service**
2. Selecione **PostgreSQL**
3. Preencha hostname, porta, usuário e senha
4. Clique em **Add service**

---

### MongoDB

#### A) Criar usuário

```javascript
use admin

db.createUser({
  user: "pmm",
  pwd: "senha_forte_aqui",
  roles: [
    { role: "clusterMonitor", db: "admin" },
    { role: "read", db: "local" }
  ]
})
```

#### B) Habilitar profiling

```javascript
use seu_database

db.setProfilingLevel(1, { slowms: 500 })  // Log queries > 500ms
```

#### C) Adicionar ao PMM

No PMM UI:
1. **Configuration → Add Service**
2. Selecione **MongoDB**
3. Preencha connection string: `mongodb://pmm:senha@host:27017/admin`
4. Clique em **Add service**

---

## Passo 4: Visualizar Dashboards

Após adicionar, aguarde 1-2 minutos e acesse:

### MySQL

- **Home → MySQL → MySQL Instance Overview**
  - CPU, memória, connections, queries/s

- **Home → MySQL → MySQL Query Analytics**
  - **TOP queries por tempo total**
  - **TOP queries por execuções**
  - **TOP queries por tempo médio**
  - Queries lentas individuais

- **Home → MySQL → MySQL InnoDB Details**
  - Cache hit ratio
  - Buffer pool
  - Locks e deadlocks

- **Home → MySQL → MySQL Performance Schema**
  - Waits e eventos
  - Table statistics

### PostgreSQL

- **Home → PostgreSQL → PostgreSQL Overview**
- **Home → PostgreSQL → PostgreSQL Query Analytics**

### MongoDB

- **Home → MongoDB → MongoDB Overview**
- **Home → MongoDB → MongoDB Query Analytics**

---

## Passo 5: Entender os Dados

### Query Analytics - O que significa cada coluna

| Coluna | Significado |
|--------|-------------|
| **Query Time** | Tempo total gasto nesta query (soma de todas execuções) |
| **Count** | Quantas vezes foi executada |
| **Avg Time** | Tempo médio por execução |
| **Lock Time** | Tempo esperando por locks |
| **Rows Examined** | Quantas linhas foram lidas |
| **Rows Sent** | Quantas linhas foram retornadas |

### Como Identificar Problemas

**Query Lenta:**
- High Avg Time (> 1 segundo)
- Solução: Adicionar índices, otimizar query

**Query Pesada:**
- High Query Time (tempo total)
- Solução: Otimizar ou cachear

**Query Muito Executada:**
- High Count
- Solução: Cachear resultado, otimizar código

**Scan Completo de Tabela:**
- Rows Examined >> Rows Sent
- Solução: Adicionar índice

---

## Passo 6: Configurar Alertas

1. No PMM UI, vá em **Alerting → Alert Rules**
2. Clique em **Create alert rule**
3. Exemplos:

**Alerta de Query Lenta:**
```
avg_query_time > 2 seconds
```

**Alerta de Conexões Altas:**
```
mysql_global_status_threads_connected > 100
```

**Alerta de Replicação Atrasada:**
```
mysql_slave_status_seconds_behind_master > 30
```

---

## Troubleshooting

### PMM não mostra dados

```bash
# 1. Verificar se PMM está rodando
docker logs pmm-server

# 2. Verificar se banco está acessível do PMM
docker exec pmm-server ping seu-mysql-host

# 3. Testar conexão manualmente
docker exec -it pmm-server mysql -h seu-host -u pmm -p
```

### "Access denied" ao adicionar MySQL

Verifique se o usuário tem as permissões corretas:

```sql
SHOW GRANTS FOR 'pmm'@'%';
```

Deve mostrar: `PROCESS, REPLICATION CLIENT, SELECT`

### Queries não aparecem no Query Analytics

Para MySQL, verifique se performance_schema está habilitado:

```sql
SHOW VARIABLES LIKE 'performance_schema';
```

Deve retornar `ON`. Se estiver `OFF`, adicione no `my.cnf`:

```conf
[mysqld]
performance_schema = ON
```

E reinicie o MySQL.

---

## Exemplo Prático

Depois de configurar, execute no seu banco:

```sql
-- Query lenta de propósito
SELECT SLEEP(2);

-- Query com scan completo
SELECT * FROM sua_tabela WHERE coluna_sem_indice = 'valor';
```

Aguarde 30 segundos e veja no **Query Analytics**.

---

## Próximos Passos

1. Configure alertas para queries > 1 segundo
2. Crie dashboards customizados
3. Analise e otimize as top 10 queries mais lentas
4. Configure backup do PMM:
   ```bash
   docker exec pmm-server pmm-admin backup
   ```

---

**Pronto!** Agora você tem monitoramento completo do banco de dados.
