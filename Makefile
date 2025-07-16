# Variables
BINARY_NAME=valouniversaire-server
APP_NAME=valouniversaire
CMD_DIR=./cmd/server
BUILD_DIR=./build
DIST_DIR=./dist
COVERAGE_FILE=coverage.out
COVERAGE_HTML=coverage.html

# Version et metadata
VERSION ?= $(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
BUILD_TIME = $(shell date -u '+%Y-%m-%d_%H:%M:%S')
GIT_COMMIT = $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")

# Configuration serveur
PORT=8080
HOST=localhost

# Flags de build
LDFLAGS = -w -s -X main.version=$(VERSION) -X main.buildTime=$(BUILD_TIME) -X main.gitCommit=$(GIT_COMMIT)

# Couleurs pour les messages
RED=\033[0;31m
GREEN=\033[0;32m
YELLOW=\033[1;33m
BLUE=\033[0;34m
NC=\033[0m # No Color

.PHONY: help setup build build-all run dev test test-all clean deps lint docker-build docker-run fmt vet

# Target par défaut
all: clean deps test build

help: ## 📚 Affiche cette aide
	@echo "$(BLUE)🎮 Valouniversaire - Commandes Make$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

setup: ## 🚀 Configuration initiale du projet
	@echo "$(GREEN)🚀 Configuration de l'environnement...$(NC)"
	@chmod +x scripts/*.sh
	@./scripts/setup.sh

# Build commands
build: ## 🏗️ Compile l'application
	@echo "$(GREEN)🏗️ Construction de $(BINARY_NAME)...$(NC)"
	@chmod +x scripts/build.sh
	@./scripts/build.sh

build-all: ## 🌍 Compile pour toutes les plateformes
	@echo "$(GREEN)🌍 Build multi-plateformes...$(NC)"
	@chmod +x scripts/build.sh
	@./scripts/build.sh all

# Run commands
run: build ## 🚀 Lance l'application
	@echo "$(GREEN)🚀 Démarrage de $(BINARY_NAME)...$(NC)"
	@./$(BUILD_DIR)/$(BINARY_NAME) &
	@echo "$(GREEN)🌐 Serveur disponible sur http://$(HOST):$(PORT)$(NC)"

dev: ## 🔥 Lance en mode développement avec hot reload
	@echo "$(GREEN)🔥 Mode développement avec hot reload...$(NC)"
	@if command -v air > /dev/null 2>&1; then \
		air; \
	else \
		echo "$(YELLOW)⚠️ Air n'est pas installé. Utilisation de 'go run'...$(NC)"; \
		go run $(CMD_DIR)/main.go; \
	fi

# Test commands
test: ## 🧪 Lance les tests unitaires
	@echo "$(GREEN)🧪 Tests unitaires...$(NC)"
	@chmod +x scripts/test.sh
	@./scripts/test.sh

test-all: ## 🧪 Lance tous les types de tests
	@echo "$(GREEN)🧪 Tests complets...$(NC)"
	@chmod +x scripts/test.sh
	@./scripts/test.sh all

test-coverage: ## 📊 Tests avec couverture
	@echo "$(GREEN)📊 Tests avec couverture...$(NC)"
	@chmod +x scripts/test.sh
	@./scripts/test.sh coverage

test-race: ## 🏃 Tests de race conditions
	@echo "$(GREEN)🏃 Tests de race conditions...$(NC)"
	@chmod +x scripts/test.sh
	@./scripts/test.sh race

test-bench: ## ⚡ Tests de performance
	@echo "$(GREEN)⚡ Tests de performance...$(NC)"
	@chmod +x scripts/test.sh
	@./scripts/test.sh bench

test-stress: ## 💪 Tests de stress
	@echo "$(GREEN)💪 Tests de stress...$(NC)"
	@go test ./internal/game -run="Stress|Concurrent|Massive" -v

test-security: ## 🔒 Tests de sécurité
	@echo "$(GREEN)🔒 Tests de sécurité...$(NC)"
	@go test ./internal/web -run="Security|XSS|SQL|CSRF" -v

# Code quality commands
lint: ## 🔍 Analyse statique du code
	@echo "$(GREEN)🔍 Analyse statique...$(NC)"
	@chmod +x scripts/test.sh
	@./scripts/test.sh lint

fmt: ## 🎨 Formate le code
	@echo "$(GREEN)🎨 Formatage du code...$(NC)"
	@go fmt ./...
	@goimports -w . 2>/dev/null || true

vet: ## 🔬 Analyse vétérinaire Go
	@echo "$(GREEN)🔬 Analyse vétérinaire...$(NC)"
	@go vet ./...

# Dependency management
deps: ## 📦 Installe/met à jour les dépendances
	@echo "$(GREEN)📦 Gestion des dépendances...$(NC)"
	@go mod download
	@go mod tidy
	@go mod verify

install: deps ## 📦 Alias pour deps (compatibilité)

install-tools: ## 🔧 Installe les outils de développement
	@echo "$(GREEN)🔧 Installation des outils...$(NC)"
	@go install github.com/cosmtrek/air@latest
	@go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	@go install golang.org/x/tools/cmd/goimports@latest
	@go install github.com/swaggo/swag/cmd/swag@latest

# Cleanup commands
clean: ## 🧹 Nettoie les fichiers générés
	@echo "$(GREEN)🧹 Nettoyage...$(NC)"
	@rm -rf $(BUILD_DIR) $(DIST_DIR)
	@rm -f $(BINARY_NAME) # Ancien binaire à la racine
	@rm -f $(COVERAGE_FILE) $(COVERAGE_HTML)
	@rm -f *.log
	@go clean -cache
	@go clean -testcache
	@echo "$(GREEN)✅ Nettoyage terminé$(NC)"

stop: ## 🛑 Arrête le serveur
	@echo "$(GREEN)🛑 Arrêt du serveur...$(NC)"
	@pkill -f $(BINARY_NAME) || true
	@echo "$(GREEN)✅ Serveur arrêté$(NC)"

# Docker commands
docker-build: ## 🐳 Construit l'image Docker
	@echo "$(GREEN)🐳 Construction de l'image Docker...$(NC)"
	@docker build -t $(APP_NAME):$(VERSION) -t $(APP_NAME):latest .

docker-run: docker-build ## 🐳 Lance dans Docker
	@echo "$(GREEN)🐳 Démarrage dans Docker...$(NC)"
	@docker run -p 8080:8080 --name $(APP_NAME) $(APP_NAME):latest

docker-compose-up: ## 🐳 Lance avec docker-compose
	@echo "$(GREEN)🐳 Démarrage avec docker-compose...$(NC)"
	@docker-compose up --build -d

docker-compose-down: ## 🐳 Arrête docker-compose
	@echo "$(GREEN)🐳 Arrêt de docker-compose...$(NC)"
	@docker-compose down

docker-compose-logs: ## 📋 Affiche les logs docker-compose
	@docker-compose logs -f

# Utility commands
restart: stop run ## 🔄 Redémarre le serveur

logs: ## 📋 Affiche les logs du serveur
	@echo "$(GREEN)📋 Logs du serveur...$(NC)"
	@tail -f server.log || echo "Aucun fichier de log trouvé"

check: ## 🏥 Vérifie la santé du serveur
	@echo "$(GREEN)🏥 Vérification de la santé du serveur...$(NC)"
	@curl -s http://$(HOST):$(PORT)/api/health | jq . || echo "Serveur non accessible"

demo: ## 🎮 Lance une démonstration
	@echo "$(GREEN)🎮 Démonstration du jeu...$(NC)"
	@echo "$(GREEN)🌐 Ouvrez http://$(HOST):$(PORT) dans votre navigateur$(NC)"
	@sleep 2
	@which xdg-open > /dev/null && xdg-open http://$(HOST):$(PORT) || true
	@which open > /dev/null && open http://$(HOST):$(PORT) || true

# Release and deployment
release: clean test build-all ## 🚢 Prépare une release
	@echo "$(GREEN)🚢 Préparation de la release $(VERSION)...$(NC)"
	@echo "$(GREEN)✅ Release prête dans $(DIST_DIR)$(NC)"

# Information commands
info: ## ℹ️ Informations sur le projet
	@echo "$(BLUE)📋 Informations du projet$(NC)"
	@echo "  Nom: $(APP_NAME)"
	@echo "  Version: $(VERSION)"
	@echo "  Commit: $(GIT_COMMIT)"
	@echo "  Build Time: $(BUILD_TIME)"
	@echo "  Go Version: $(shell go version)"
	@echo ""

status: ## 📊 Statut du développement
	@echo "$(BLUE)📊 Statut du projet$(NC)"
	@echo "  Fichiers Go: $(shell find . -name "*.go" | wc -l)"
	@echo "  Tests: $(shell find . -name "*_test.go" | wc -l)"
	@echo "  Lignes de code: $(shell find . -name "*.go" -not -name "*_test.go" | xargs wc -l | tail -1 | awk '{print $$1}')"
	@echo ""

# Convenience aliases and compound commands
start: run ## 🚀 Alias pour 'run'
serve: run ## 🚀 Alias pour 'run'
check-all: test lint vet ## ✅ Vérifications complètes
quick-start: clean deps build run check demo ## 🚀 Démarrage rapide complet