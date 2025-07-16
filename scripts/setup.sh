#!/bin/bash

set -e

echo "🚀 Configuration de l'environnement Valouniversaire"

# Vérifier que Go est installé
if ! command -v go &> /dev/null; then
    echo "❌ Go n'est pas installé. Installez Go 1.21+ avant de continuer."
    exit 1
fi

# Vérifier la version de Go
GO_VERSION=$(go version | cut -d ' ' -f 3 | sed 's/go//')
echo "✅ Go version: $GO_VERSION"

# Créer les répertoires nécessaires
echo "📁 Création des répertoires..."
mkdir -p {logs,data,build,dist}

# Installer les dépendances
echo "📦 Installation des dépendances..."
go mod download
go mod tidy

# Installer les outils de développement
echo "🔧 Installation des outils de développement..."
go install github.com/cosmtrek/air@latest
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
go install github.com/swaggo/swag/cmd/swag@latest

# Vérifier que les outils sont installés
if command -v air &> /dev/null; then
    echo "✅ Air (hot reload) installé"
else
    echo "⚠️  Air n'est pas dans le PATH, ajoutez \$GOPATH/bin à votre PATH"
fi

# Générer la documentation API (si swagger est configuré)
if [ -f "docs/docs.go" ]; then
    echo "📚 Génération de la documentation API..."
    swag init -g cmd/server/main.go -o docs/api
fi

# Copier la configuration d'exemple
if [ ! -f "configs/config.local.yaml" ]; then
    echo "⚙️  Création de la configuration locale..."
    cp configs/config.yaml configs/config.local.yaml
fi

# Créer le fichier .env d'exemple
if [ ! -f ".env.example" ]; then
    echo "📝 Création du fichier .env d'exemple..."
    cat > .env.example << 'EOF'
# Configuration du serveur
PORT=8080
HOST=localhost
GIN_MODE=debug

# Base de données
DB_DRIVER=sqlite
DB_SOURCE=./data/game.db

# Logging
LOG_LEVEL=debug
LOG_FORMAT=text

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:8080
EOF
fi

echo ""
echo "🎉 Configuration terminée !"
echo ""
echo "Pour démarrer le projet :"
echo "  make run          # Démarrage standard"
echo "  make dev          # Démarrage avec hot reload"
echo "  make test         # Lancer les tests"
echo "  make build        # Compiler l'application"
echo ""