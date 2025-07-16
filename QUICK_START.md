# 🚀 Guide de Démarrage Rapide

## Pour les pressés

```bash
# 1. Setup complet en une commande
make setup

# 2. Démarrer le serveur
make run

# 3. Ouvrir http://localhost:8080 et jouer !
```

## Pour les développeurs

```bash
# Mode développement avec hot reload
make dev

# Tests complets
make test-all

# Build de production
make build-all
```

## Docker Express

```bash
# Tout en Docker
make docker-compose-up

# Arrêter
make docker-compose-down
```

## Commandes Essentielles

| Commande | Description |
|----------|-------------|
| `make help` | 📚 Aide complète |
| `make setup` | 🚀 Configuration initiale |
| `make dev` | 🔥 Mode développement |
| `make test` | 🧪 Tests unitaires |
| `make build` | 🏗️ Compilation |
| `make clean` | 🧹 Nettoyage |

## Structure Rapide

```
📦 valouniversaire/
├── 🎮 cmd/server/main.go      # Point d'entrée
├── 🧠 internal/game/          # Logique métier
├── 🌐 internal/web/           # API REST
├── ⚙️ configs/               # Configuration
├── 🔨 scripts/               # Scripts utiles
└── 📖 docs/                  # Documentation
```

## Aide

- 📖 [README complet](README.md)
- 🎮 [Comment jouer](🎮_COMMENT_JOUER.md)
- 🏗️ [Structure du projet](PROJECT_STRUCTURE.md)

---
*Développé avec ❤️ en Go*