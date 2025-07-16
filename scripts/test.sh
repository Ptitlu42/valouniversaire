#!/bin/bash

set -e

# Couleurs pour l'output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
COVERAGE_FILE="coverage.out"
COVERAGE_HTML="coverage.html"
TEST_TIMEOUT="5m"

echo "🧪 Lancement des tests Valouniversaire"

# Function pour afficher les résultats
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        exit 1
    fi
}

# Vérifier que Go est installé
if ! command -v go &> /dev/null; then
    echo -e "${RED}❌ Go n'est pas installé${NC}"
    exit 1
fi

# Tests unitaires
echo ""
echo "📋 Tests unitaires..."
go test -timeout "$TEST_TIMEOUT" -v ./...
print_result $? "Tests unitaires"

# Tests avec coverage
if [ "$1" == "coverage" ] || [ "$1" == "all" ]; then
    echo ""
    echo "📊 Tests avec couverture..."
    go test -timeout "$TEST_TIMEOUT" -coverprofile="$COVERAGE_FILE" -covermode=atomic ./...
    print_result $? "Tests avec couverture"
    
    # Afficher le résumé de couverture
    coverage=$(go tool cover -func="$COVERAGE_FILE" | grep total | awk '{print $3}')
    echo -e "${YELLOW}📈 Couverture totale: $coverage${NC}"
    
    # Générer le rapport HTML
    go tool cover -html="$COVERAGE_FILE" -o "$COVERAGE_HTML"
    echo "📄 Rapport HTML généré: $COVERAGE_HTML"
fi

# Tests de race conditions
if [ "$1" == "race" ] || [ "$1" == "all" ]; then
    echo ""
    echo "🏃 Tests de race conditions..."
    go test -timeout "$TEST_TIMEOUT" -race -short ./...
    print_result $? "Tests de race conditions"
fi

# Tests de performance (benchmarks)
if [ "$1" == "bench" ] || [ "$1" == "all" ]; then
    echo ""
    echo "⚡ Tests de performance..."
    go test -timeout "$TEST_TIMEOUT" -bench=. -benchmem ./...
    print_result $? "Tests de performance"
fi

# Lint avec golangci-lint
if command -v golangci-lint &> /dev/null; then
    if [ "$1" == "lint" ] || [ "$1" == "all" ]; then
        echo ""
        echo "🔍 Analyse statique (lint)..."
        golangci-lint run
        print_result $? "Analyse statique"
    fi
else
    if [ "$1" == "lint" ] || [ "$1" == "all" ]; then
        echo -e "${YELLOW}⚠️  golangci-lint n'est pas installé, installation...${NC}"
        go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
        golangci-lint run
        print_result $? "Analyse statique"
    fi
fi

# Tests d'intégration (si le dossier existe)
if [ -d "test/integration" ]; then
    if [ "$1" == "integration" ] || [ "$1" == "all" ]; then
        echo ""
        echo "🔗 Tests d'intégration..."
        go test -timeout "$TEST_TIMEOUT" -tags=integration ./test/integration/...
        print_result $? "Tests d'intégration"
    fi
fi

# Vérification des modules
echo ""
echo "📦 Vérification des modules..."
go mod verify
print_result $? "Vérification des modules"

go mod tidy
if [ -n "$(git status --porcelain go.mod go.sum)" ]; then
    echo -e "${RED}❌ go.mod ou go.sum ne sont pas à jour${NC}"
    echo "Lancez 'go mod tidy' pour les mettre à jour"
    exit 1
else
    echo -e "${GREEN}✅ Modules à jour${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Tous les tests sont passés !${NC}"

# Afficher l'usage si aucun argument
if [ $# -eq 0 ]; then
    echo ""
    echo "Usage: $0 [coverage|race|bench|lint|integration|all]"
    echo "  coverage     - Tests avec couverture"
    echo "  race         - Tests de race conditions"
    echo "  bench        - Tests de performance"
    echo "  lint         - Analyse statique"
    echo "  integration  - Tests d'intégration"
    echo "  all          - Tous les tests"
fi