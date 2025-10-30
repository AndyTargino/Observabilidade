# Makefile Simplificado - Stack de Observabilidade
# Use 'make help' para ver todos os comandos

.PHONY: help up down restart logs status test-logs

help: ## Mostra esta mensagem de ajuda
	@echo "Comandos disponíveis:"
	@echo ""
	@echo "  make up          - Inicia a stack"
	@echo "  make down        - Para a stack"
	@echo "  make restart     - Reinicia a stack"
	@echo "  make logs        - Mostra logs de todos os serviços"
	@echo "  make status      - Status dos serviços"
	@echo "  make test-logs   - Envia logs de teste"
	@echo "  make open        - Abre Grafana e PMM no navegador"
	@echo ""

up: ## Inicia todos os serviços
	@echo "Iniciando stack..."
	docker compose up -d
	@echo ""
	@echo "Stack iniciada!"
	@echo ""
	@echo "Acesse:"
	@echo "  Grafana (logs): http://localhost:33000"
	@echo "  PMM (banco):    http://localhost:33443"
	@echo ""

down: ## Para todos os serviços
	@echo "Parando stack..."
	docker compose down
	@echo "Stack parada!"

restart: ## Reinicia todos os serviços
	@echo "Reiniciando stack..."
	docker compose restart
	@echo "Stack reiniciada!"

logs: ## Mostra logs de todos os serviços
	docker compose logs -f

logs-%: ## Mostra logs de um serviço específico (ex: make logs-grafana)
	docker compose logs -f $*

status: ## Mostra status de todos os serviços
	@echo "Status dos serviços:"
	@docker compose ps

test-logs: ## Envia logs de teste para o Loki
	@echo "Enviando log de teste..."
	@curl -X POST http://localhost:34318/v1/logs \
	  -H "Content-Type: application/json" \
	  -d '{"resourceLogs":[{"resource":{"attributes":[{"key":"service.name","value":{"stringValue":"test-app"}}]},"scopeLogs":[{"logRecords":[{"body":{"stringValue":"Log de teste enviado via Makefile"},"severityText":"INFO","timeUnixNano":"'$$(date +%s)000000000'"}]}]}]}' \
	  && echo "Log enviado! Veja no Grafana: http://localhost:33000" \
	  || echo "Erro ao enviar log. Verifique se a stack está rodando."

open: ## Abre Grafana e PMM no navegador
	@echo "Abrindo navegador..."
	@start http://localhost:33000
	@start http://localhost:33443
