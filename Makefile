# Makefile para gerenciar a stack de observabilidade
# Use 'make help' para ver todos os comandos disponíveis

.PHONY: help up down restart logs status clean prune backup restore health

# Cores para output
BLUE=\033[0;34m
GREEN=\033[0;32m
RED=\033[0;31m
YELLOW=\033[0;33m
NC=\033[0m # No Color

help: ## Mostra esta mensagem de ajuda
	@echo "$(BLUE)Stack de Observabilidade - Comandos Disponíveis:$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ""

up: ## Inicia todos os serviços
	@echo "$(BLUE)Iniciando stack de observabilidade...$(NC)"
	docker compose up -d
	@echo "$(GREEN)Stack iniciada com sucesso!$(NC)"
	@echo ""
	@$(MAKE) endpoints

down: ## Para todos os serviços
	@echo "$(YELLOW)Parando stack de observabilidade...$(NC)"
	docker compose down
	@echo "$(GREEN)Stack parada com sucesso!$(NC)"

restart: ## Reinicia todos os serviços
	@echo "$(YELLOW)Reiniciando stack...$(NC)"
	docker compose restart
	@echo "$(GREEN)Stack reiniciada!$(NC)"

logs: ## Mostra logs de todos os serviços
	docker compose logs -f

logs-%: ## Mostra logs de um serviço específico (ex: make logs-grafana)
	docker compose logs -f $*

status: ## Mostra status de todos os serviços
	@echo "$(BLUE)Status dos serviços:$(NC)"
	@docker compose ps

health: ## Verifica saúde de todos os serviços
	@echo "$(BLUE)Verificando saúde dos serviços...$(NC)"
	@docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

endpoints: ## Lista todos os endpoints disponíveis
	@echo "$(GREEN)Endpoints da Stack de Observabilidade:$(NC)"
	@echo ""
	@echo "  $(BLUE)Grafana UI:$(NC)          http://localhost:33000"
	@echo "  $(BLUE)Prometheus UI:$(NC)       http://localhost:39090"
	@echo "  $(BLUE)Jaeger UI:$(NC)           http://localhost:36686"
	@echo "  $(BLUE)PMM Server:$(NC)          http://localhost:33443"
	@echo "  $(BLUE)cAdvisor:$(NC)            http://localhost:38080"
	@echo "  $(BLUE)Node Exporter:$(NC)       http://localhost:39100/metrics"
	@echo "  $(BLUE)Loki API:$(NC)            http://localhost:33100"
	@echo ""
	@echo "  $(BLUE)OTLP Collector gRPC:$(NC) http://localhost:34317"
	@echo "  $(BLUE)OTLP Collector HTTP:$(NC) http://localhost:34318"
	@echo ""

pull: ## Baixa as imagens mais recentes
	@echo "$(BLUE)Baixando imagens Docker...$(NC)"
	docker compose pull

build: ## Reconstrói os serviços
	docker compose build

clean: ## Remove containers parados e imagens não utilizadas
	@echo "$(YELLOW)Limpando containers e imagens não utilizadas...$(NC)"
	docker compose down
	docker system prune -f
	@echo "$(GREEN)Limpeza concluída!$(NC)"

prune: ## Remove TUDO (containers, volumes, imagens) - CUIDADO!
	@echo "$(RED)ATENÇÃO: Este comando removerá TODOS os dados dos volumes!$(NC)"
	@echo "$(RED)Pressione Ctrl+C para cancelar ou Enter para continuar...$(NC)"
	@read
	docker compose down -v
	docker system prune -a -f --volumes
	@echo "$(GREEN)Limpeza completa realizada!$(NC)"

backup: ## Faz backup dos volumes de dados
	@echo "$(BLUE)Criando backup dos volumes...$(NC)"
	@mkdir -p backups
	@docker run --rm -v observabilidade_grafana_data:/data -v $(PWD)/backups:/backup alpine tar czf /backup/grafana_data_$$(date +%Y%m%d_%H%M%S).tar.gz -C /data .
	@docker run --rm -v observabilidade_prometheus_data:/data -v $(PWD)/backups:/backup alpine tar czf /backup/prometheus_data_$$(date +%Y%m%d_%H%M%S).tar.gz -C /data .
	@docker run --rm -v observabilidade_loki_data:/data -v $(PWD)/backups:/backup alpine tar czf /backup/loki_data_$$(date +%Y%m%d_%H%M%S).tar.gz -C /data .
	@docker run --rm -v observabilidade_pmm_data:/data -v $(PWD)/backups:/backup alpine tar czf /backup/pmm_data_$$(date +%Y%m%d_%H%M%S).tar.gz -C /data .
	@echo "$(GREEN)Backup concluído em ./backups/$(NC)"

dev: ## Inicia em modo desenvolvimento (com logs visíveis)
	docker compose up

test: ## Testa a conectividade com os serviços
	@echo "$(BLUE)Testando conectividade...$(NC)"
	@curl -s http://localhost:33000/api/health > /dev/null && echo "$(GREEN)✓ Grafana$(NC)" || echo "$(RED)✗ Grafana$(NC)"
	@curl -s http://localhost:39090/-/healthy > /dev/null && echo "$(GREEN)✓ Prometheus$(NC)" || echo "$(RED)✗ Prometheus$(NC)"
	@curl -s http://localhost:36686/ > /dev/null && echo "$(GREEN)✓ Jaeger$(NC)" || echo "$(RED)✗ Jaeger$(NC)"
	@curl -s http://localhost:33100/ready > /dev/null && echo "$(GREEN)✓ Loki$(NC)" || echo "$(RED)✗ Loki$(NC)"

validate: ## Valida arquivos de configuração
	@echo "$(BLUE)Validando configurações...$(NC)"
	docker compose config > /dev/null && echo "$(GREEN)✓ docker-compose.yml válido$(NC)" || echo "$(RED)✗ docker-compose.yml inválido$(NC)"

update: ## Atualiza para as versões mais recentes
	@echo "$(BLUE)Atualizando serviços...$(NC)"
	$(MAKE) down
	$(MAKE) pull
	$(MAKE) up
	@echo "$(GREEN)Atualização concluída!$(NC)"
