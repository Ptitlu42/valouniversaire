# 🎮 Valouniversaire - Tree Clicker Game

Un jeu de clicker moderne développé en Go avec une architecture robuste et professionnelle suivant les meilleures pratiques de l'écosystème Go.

[![Go Version](https://img.shields.io/badge/Go-1.24.2+-blue.svg)](https://golang.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Coverage](https://img.shields.io/badge/Coverage-100%25-brightgreen.svg)](coverage.html)

## 🌟 Fonctionnalités

- **🎮 Jeu de clicker complet** : Coupez des arbres, récoltez du bois, achetez des améliorations
- **🔄 Système de prestige** : Recommencez avec des bonus permanents
- **🤖 Ouvriers automatiques** : P'tit Lu, Mathieu et Vico travaillent pour vous
- **⚡ Améliorations spéciales** : Auto-clicker, École de bûcheron, Bonus de brasserie, Hache dorée
- **📊 Statistiques détaillées** : Suivi complet de votre progression
- **💻 Interface moderne** : Design responsive avec animations
- **🔧 API REST complète** : Backend découplé avec endpoints documentés

## 🏗️ Architecture Go Classique

Ce projet suit les conventions et meilleures pratiques de l'écosystème Go :

### Structure des répertoires

```
valouniversaire/
├── 📁 cmd/                     # Points d'entrée de l'application
│   └── server/                 # Serveur principal
│       ├── main.go
│       └── main_test.go
├── 📁 internal/                # Code privé de l'application
│   ├── game/                   # Logique métier du jeu
│   │   ├── game.go
│   │   └── *_test.go
│   └── web/                    # Serveur HTTP et handlers
│       ├── handlers.go
│       └── *_test.go
├── 📁 pkg/                     # Bibliothèques réutilisables (vide pour l'instant)
├── 📁 api/                     # Définitions API (OpenAPI/Swagger)
├── 📁 configs/                 # Fichiers de configuration
│   ├── config.yaml             # Configuration par défaut
│   └── config.local.yaml       # Configuration locale (git ignored)
├── 📁 scripts/                 # Scripts de build et déploiement
│   ├── setup.sh               # Configuration initiale
│   ├── build.sh               # Script de build
│   └── test.sh                # Script de tests
├── 📁 build/                   # Binaires compilés
├── 📁 dist/                    # Distribution multi-plateformes
├── 📁 docs/                    # Documentation
│   ├── api/                   # Documentation API générée
│   └── images/                # Images et diagrammes
├── 📁 test/                    # Tests additionnels
│   ├── fixtures/              # Données de test
│   └── integration/           # Tests d'intégration
├── 📁 deployments/             # Configurations de déploiement
├── 📁 tools/                   # Outils de développement
├── 📁 examples/                # Exemples d'utilisation
├── 📁 static/                  # Fichiers statiques web
│   ├── style.css
│   ├── game.js
│   └── images/
├── 📁 templates/               # Templates HTML
│   └── index.html
├── 📄 go.mod                   # Dépendances Go
├── 📄 go.sum                   # Checksums des dépendances
├── 📄 Makefile                 # Commandes de build
├── 📄 Dockerfile              # Image Docker
├── 📄 docker-compose.yml      # Orchestration Docker
├── 📄 .air.toml               # Configuration hot reload
└── 📄 .gitignore              # Fichiers à ignorer
```

### Principes architecturaux

- **📦 Modules Go** : Gestion moderne des dépendances avec `go.mod`
- **🔒 Package internal** : Code privé non exportable
- **🎯 Single Responsibility** : Chaque package a une responsabilité claire
- **🧪 Tests First** : Couverture de tests de 100%
- **📋 Documentation** : Code auto-documenté avec godoc
- **🔧 Tooling** : Intégration complète des outils Go standard

## 🚀 Démarrage Rapide

### Prérequis

- **Go 1.24.2+** : [Installer Go](https://golang.org/dl/)
- **Make** : Pour les commandes de build
- **Git** : Pour la gestion de version

### Installation automatique

```bash
# Clone le projet
git clone <repository-url>
cd valouniversaire

# Configuration automatique
make setup
```

### Démarrage manuel

```bash
# 1. Installer les dépendances
make deps

# 2. Compiler l'application
make build

# 3. Lancer le serveur
make run
```

### Mode développement

```bash
# Hot reload avec Air
make dev

# Ou démarrage simple
go run ./cmd/server
```

## 📋 Commandes Make Disponibles

### 🏗️ Build & Run
```bash
make build          # Compile l'application
make build-all      # Compile pour toutes les plateformes
make run            # Lance l'application
make dev            # Mode développement avec hot reload
```

### 🧪 Tests
```bash
make test           # Tests unitaires
make test-all       # Tous les tests (unit, race, bench, lint)
make test-coverage  # Tests avec couverture
make test-race      # Tests de race conditions
make test-bench     # Tests de performance
make test-stress    # Tests de stress
make test-security  # Tests de sécurité
```

### 🔧 Outils
```bash
make lint           # Analyse statique (golangci-lint)
make fmt            # Formatage du code
make vet            # Analyse vétérinaire Go
make deps           # Gestion des dépendances
make clean          # Nettoyage
```

### 🐳 Docker
```bash
make docker-build        # Construire l'image Docker
make docker-run          # Lancer dans Docker
make docker-compose-up   # Démarrer avec docker-compose
make docker-compose-down # Arrêter docker-compose
```

### 📊 Informations
```bash
make info           # Informations sur le projet
make status         # Statut du développement
make help           # Aide complète
```

## 🎯 Utilisation

### Démarrage standard

1. **Lancer le serveur** :
   ```bash
   make run
   ```

2. **Ouvrir dans le navigateur** :
   ```
   http://localhost:8080
   ```

3. **Commencer à jouer** :
   - Cliquez sur l'arbre pour obtenir du bois
   - Achetez des améliorations avec votre bois
   - Débloquez des ouvriers automatiques
   - Activez le prestige pour des bonus permanents

### Configuration

Le serveur peut être configuré via :

#### Variables d'environnement
```bash
export PORT=8080
export HOST=localhost
export LOG_LEVEL=debug
```

#### Fichier de configuration
```yaml
# configs/config.local.yaml
server:
  host: "0.0.0.0"
  port: 3000
logging:
  level: "debug"
```

#### Arguments de ligne de commande
```bash
./valouniversaire-server --port=3000 --host=0.0.0.0 --log-level=debug
```

## 🌐 API REST

### Endpoints principaux

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/` | Interface web du jeu |
| `GET` | `/api/health` | Santé du serveur |
| `GET` | `/api/game/{playerID}` | État du jeu |
| `POST` | `/api/game/{playerID}/click` | Cliquer sur l'arbre |
| `POST` | `/api/game/{playerID}/buy/{item}` | Acheter un objet |
| `POST` | `/api/game/{playerID}/prestige` | Activer le prestige |

### Exemple d'utilisation

```bash
# Santé du serveur
curl http://localhost:8080/api/health

# État du jeu
curl http://localhost:8080/api/game/player1

# Cliquer sur l'arbre
curl -X POST http://localhost:8080/api/game/player1/click

# Acheter une hache
curl -X POST http://localhost:8080/api/game/player1/buy/axe
```

## 🧪 Tests

Le projet maintient une couverture de tests de 100% avec différents types de tests :

### Tests unitaires
```bash
make test
# ou
go test ./...
```

### Tests avec couverture
```bash
make test-coverage
# Génère coverage.html pour visualisation
```

### Tests de performance
```bash
make test-bench
# Benchmarks de toutes les fonctions critiques
```

### Tests de race conditions
```bash
make test-race
# Détection des conditions de course
```

## 🐳 Docker

### Build et run
```bash
# Build l'image
make docker-build

# Lancer le container
make docker-run
```

### Docker Compose

Le projet inclut une configuration docker-compose complète :

```bash
# Démarrage standard
make docker-compose-up

# Avec base de données PostgreSQL
docker-compose --profile postgres up

# Avec monitoring
docker-compose --profile monitoring up

# Mode développement
docker-compose --profile dev up
```

## 🔧 Développement

### Configuration de l'environnement

```bash
# Installation complète
make setup

# Installation des outils uniquement
make install-tools
```

### Outils recommandés

- **Air** : Hot reload pour le développement
- **golangci-lint** : Linter statique
- **goimports** : Formatage automatique des imports
- **swag** : Génération de documentation API

### Structure de développement

1. **Code dans `internal/`** : Logique métier privée
2. **Points d'entrée dans `cmd/`** : Applications exécutables
3. **Tests à côté du code** : Fichiers `*_test.go`
4. **Configuration dans `configs/`** : Fichiers YAML
5. **Scripts dans `scripts/`** : Automatisation

### Bonnes pratiques

- ✅ **Nommage explicite** : Variables et fonctions auto-documentées
- ✅ **Gestion d'erreur** : Toujours vérifier et propager les erreurs
- ✅ **Tests first** : Écrire les tests avant le code
- ✅ **Documentation** : Commenter les fonctions publiques
- ✅ **Formatage** : Utiliser `gofmt` et `goimports`

## 📊 Performance

### Métriques

- **Temps de réponse** : < 1ms pour la plupart des endpoints
- **Concurrence** : Support de milliers d'utilisateurs simultanés
- **Mémoire** : Optimisation pour un usage minimal
- **CPU** : Algorithmes efficaces pour les calculs de jeu

### Monitoring

```bash
# Métriques Prometheus (optionnel)
docker-compose --profile monitoring up

# Accès aux métriques
curl http://localhost:9090
```

## 🚀 Déploiement

### Build de production

```bash
# Build optimisé pour production
make release

# Binaires disponibles dans dist/
ls dist/
```

### Plateformes supportées

- Linux (amd64, arm64)
- macOS (amd64, arm64)
- Windows (amd64)

## 🤝 Contribution

1. **Fork** le projet
2. **Créer** une branche feature (`git checkout -b feature/amazing-feature`)
3. **Commit** les changements (`git commit -m 'Add amazing feature'`)
4. **Push** vers la branche (`git push origin feature/amazing-feature`)
5. **Ouvrir** une Pull Request

### Standards de code

- Suivre les conventions Go standard
- Maintenir la couverture de tests à 100%
- Documenter les fonctions publiques
- Passer tous les linters

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- **Gorilla Mux** : Routeur HTTP puissant
- **Air** : Hot reload pour le développement
- **golangci-lint** : Analyse statique complète
- La communauté Go pour les excellents outils et pratiques

---

<div align="center">
  <strong>🌳 Bon jeu ! 🌳</strong>
  <br>
  <em>Développé avec ❤️ en Go</em>
</div>