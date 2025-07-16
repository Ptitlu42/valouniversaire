# Valouniversaire - Tree Clicker Game (Go Edition)

Un jeu de clicker moderne développé en Go avec une architecture robuste et des tests complets.

## 🎮 Fonctionnalités

- **Jeu de clicker complet** : Coupez des arbres, récoltez du bois, achetez des améliorations
- **Système de prestige** : Recommencez avec des bonus permanents
- **Ouvriers automatiques** : P'tit Lu, Mathieu et Vico travaillent pour vous
- **Améliorations spéciales** : Auto-clicker, École de bûcheron, Bonus de brasserie, Hache dorée
- **Statistiques détaillées** : Suivi complet de votre progression
- **Interface moderne** : Design responsive avec animations

## 🏗️ Architecture

- **Backend Go** : Serveur HTTP avec API REST
- **Tests complets** : 100% de couverture de tests
- **Structure modulaire** : Code organisé en packages
- **Gestion des états** : Chaque joueur a son propre état de jeu
- **CORS activé** : Compatible avec les clients web

## 📁 Structure du projet

```
valouniversaire/
├── cmd/server/           # Point d'entrée principal
│   └── main.go
├── internal/
│   ├── game/            # Logique de jeu
│   │   ├── game.go
│   │   └── game_test.go
│   └── web/             # Serveur HTTP et handlers
│       ├── handlers.go
│       └── handlers_test.go
├── templates/           # Templates HTML
│   └── index.html
├── static/             # Fichiers statiques
│   ├── style.css
│   └── game.js
├── go.mod
└── README.md
```

## 🚀 Installation et démarrage

### Prérequis

- Go 1.21 ou supérieur

### Compilation

```bash
go build -o valouniversaire-server ./cmd/server
```

### Démarrage

```bash
# Démarrage standard
./valouniversaire-server

# Démarrage avec options
./valouniversaire-server --port=8080 --host=localhost --dev
```

### Options de ligne de commande

- `--port` : Port d'écoute (défaut: 8080)
- `--host` : Adresse d'écoute (défaut: localhost)
- `--dev` : Mode développement

### Variables d'environnement

- `PORT` : Port du serveur
- `HOST` : Adresse d'écoute

## 🧪 Tests

### Lancer tous les tests

```bash
go test ./...
```

### Tests avec couverture

```bash
go test -cover ./...
```

### Tests de performance

```bash
go test -bench=. ./...
```

## 🌐 API REST

### Endpoints disponibles

- `GET /` - Interface web du jeu
- `GET /api/health` - Vérification de santé
- `GET /api/state?player_name=X` - État du jeu pour un joueur
- `POST /api/action` - Exécuter une action de jeu
- `GET /api/scores` - Scores de tous les joueurs
- `POST /api/reset?player_name=X` - Remettre à zéro un joueur
- `GET /static/*` - Fichiers statiques

### Exemples d'utilisation

#### Obtenir l'état du jeu

```bash
curl "http://localhost:8080/api/state?player_name=MonNom"
```

#### Couper un arbre

```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"player_name":"MonNom","action":"chop"}' \
  http://localhost:8080/api/action
```

#### Acheter un ouvrier

```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"player_name":"MonNom","action":"buy_worker","target":"ptit_lu"}' \
  http://localhost:8080/api/action
```

### Actions disponibles

- `chop` - Couper l'arbre
- `upgrade_axe` - Améliorer la hache
- `buy_worker` - Acheter un ouvrier (target: ptit_lu, mathieu, vico)
- `buy_upgrade` - Acheter une amélioration (target: auto_clicker, lumberjack_school, brewery_bonus, golden_axe)
- `buy_beer` - Acheter une bière
- `prestige` - Faire un prestige

## 🎯 Règles du jeu

### Objectif principal
Atteindre 420 bières pour gagner la partie !

### Mécaniques de jeu

1. **Couper des arbres** : Cliquez sur l'arbre pour le couper et obtenir du bois
2. **Améliorer sa hache** : Augmente les dégâts par clic
3. **Embaucher des ouvriers** : Ils coupent automatiquement les arbres
4. **Acheter des améliorations** : Bonus permanents de diverses natures
5. **Acheter des bières** : Donnent des bonus de production de bois
6. **Faire un prestige** : Recommencer avec des points de prestige permanents

### Système de prestige

- Disponible à partir de 1000 bières
- Remet à zéro la progression mais donne des points de prestige
- Les points de prestige donnent des bonus permanents :
  - +2% de dégâts par point
  - +5% de bois récolté par point

### Coups critiques

- 10% de chance de base (améliorable avec la Hache Dorée)
- Multiplient les dégâts par 2.5x (améliorable)

## 🛠️ Développement

### Ajouter de nouvelles fonctionnalités

1. **Nouvelle amélioration** : Modifier `internal/game/game.go`
2. **Nouveau endpoint** : Ajouter dans `internal/web/handlers.go`
3. **Tests** : Ajouter les tests correspondants

### Standards de code

- Pas de commentaires dans le code
- Tests complets requis
- Messages de commit en anglais US (Conventional Commits)
- Code en anglais US

### Commits

Format strict Conventional Commits v1.0.0 :

```
feat(game): add new upgrade system
fix(api): handle edge case in worker processing
docs(readme): update installation instructions
```

## 📊 Performances

Le serveur Go est optimisé pour :

- **Concurrent players** : Gestion thread-safe de plusieurs joueurs
- **Fast responses** : API REST rapide avec JSON
- **Memory efficient** : État de jeu optimisé en mémoire
- **Scalable** : Architecture modulaire extensible

## 🐛 Débogage

### Logs du serveur

Le serveur affiche des logs détaillés :

```
🌳 Valouniversaire server starting...
🌐 Server listening on http://localhost:8080
📋 Available endpoints:
   GET  /                 - Game interface
   GET  /api/state        - Get game state
   POST /api/action       - Perform game action
   ...
```

### Mode développement

Utilisez `--dev` pour des logs supplémentaires et des fonctionnalités de développement.

## 📝 Licence

Ce projet est développé comme une démonstration technique d'un jeu web moderne en Go.

## 🤝 Contribution

1. Vérifiez que tous les tests passent : `go test ./...`
2. Respectez les standards de code
3. Ajoutez des tests pour les nouvelles fonctionnalités
4. Utilisez des commits conventionnels