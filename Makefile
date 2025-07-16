.PHONY: build run test clean dev help install

# Variables
BINARY_NAME=valouniversaire-server
PORT=8080
HOST=localhost

help: ## Affiche cette aide
	@echo "🌳 Valouniversaire - Commandes disponibles:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""

install: ## Installe les dépendances
	@echo "📦 Installation des dépendances..."
	go mod tidy
	go mod download

build: ## Compile le projet
	@echo "🔨 Compilation du projet..."
	go build -o $(BINARY_NAME) ./cmd/server
	@echo "✅ Compilation terminée : $(BINARY_NAME)"

run: build ## Lance le serveur
	@echo "🚀 Démarrage du serveur..."
	@./$(BINARY_NAME) &
	@echo "🌐 Serveur disponible sur http://$(HOST):$(PORT)"

dev: ## Lance en mode développement (avec rechargement)
	@echo "🔧 Mode développement..."
	go run ./cmd/server

test: ## Lance tous les tests
	@echo "🧪 Lancement des tests..."
	go test ./... -v

test-coverage: ## Lance les tests avec couverture
	@echo "📊 Tests avec couverture..."
	go test ./... -coverprofile=coverage.out
	go tool cover -html=coverage.out -o coverage.html
	@echo "📈 Rapport de couverture : coverage.html"

test-bench: ## Lance les benchmarks
	@echo "⚡ Benchmarks de performance..."
	go test ./... -bench=. -benchmem

test-stress: ## Lance les tests de stress
	@echo "💪 Tests de stress..."
	go test ./internal/game -run="Stress|Concurrent|Massive" -v

test-security: ## Lance les tests de sécurité
	@echo "🔒 Tests de sécurité..."
	go test ./internal/web -run="Security|XSS|SQL|CSRF" -v

clean: ## Nettoie les fichiers générés
	@echo "🧹 Nettoyage..."
	rm -f $(BINARY_NAME)
	rm -f coverage.out coverage.html
	rm -f *.log
	@echo "✅ Nettoyage terminé"

stop: ## Arrête le serveur
	@echo "🛑 Arrêt du serveur..."
	@pkill -f $(BINARY_NAME) || true
	@echo "✅ Serveur arrêté"

restart: stop run ## Redémarre le serveur

logs: ## Affiche les logs du serveur
	@echo "📋 Logs du serveur..."
	@tail -f server.log || echo "Aucun fichier de log trouvé"

check: ## Vérifie la santé du serveur
	@echo "🏥 Vérification de la santé du serveur..."
	@curl -s http://$(HOST):$(PORT)/api/health | jq . || echo "Serveur non accessible"

demo: ## Lance une démonstration
	@echo "🎮 Démonstration du jeu..."
	@echo "🌐 Ouvrez http://$(HOST):$(PORT) dans votre navigateur"
	@sleep 2
	@which xdg-open > /dev/null && xdg-open http://$(HOST):$(PORT) || true
	@which open > /dev/null && open http://$(HOST):$(PORT) || true

quick-start: clean install build run check demo ## Démarrage rapide complet