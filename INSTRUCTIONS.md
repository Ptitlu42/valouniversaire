# 🎮 Instructions de Démarrage - Valouniversaire

## 🚀 Démarrage Ultra-Rapide

### Option 1: Script Automatique (RECOMMANDÉ) ⭐
```bash
./start.sh
```

### Option 2: Makefile
```bash
make quick-start
```

### Option 3: Test Puis Jeu
```bash
./quick-test.sh    # Test que tout fonctionne
./start.sh         # Démarrage du jeu
```

## 🌐 Accès au Jeu

Une fois le serveur démarré, ouvrez votre navigateur :

- **🎮 Jeu Principal** : http://localhost:8080
- **🔧 Mode Debug** : http://localhost:8080/debug  
- **⚕️ Santé API** : http://localhost:8080/api/health

## 🐛 Si le Jeu Reste en Loading

1. **Ouvrez la Console** (F12)
2. **Allez en Mode Debug** : http://localhost:8080/debug
3. **Vérifiez les Logs** dans la console
4. **Testez l'API** avec le bouton "Tester API"

## 📁 Structure du Projet

```
valouniversaire/
├── 🎯 DÉMARRAGE
│   ├── start.sh              # Script principal ⭐
│   ├── quick-test.sh         # Test rapide
│   ├── Makefile              # Commandes make
│   └── INSTRUCTIONS.md       # Ce fichier
│
├── 🎮 JEU
│   ├── templates/
│   │   ├── index.html        # Interface principale
│   │   └── debug.html        # Interface debug
│   └── static/
│       ├── game.js           # JavaScript principal
│       ├── game-debug.js     # JavaScript debug
│       └── style.css         # Styles
│
├── 🔧 SERVEUR
│   ├── cmd/server/main.go    # Serveur principal
│   ├── internal/game/        # Logique de jeu
│   ├── internal/web/         # API REST
│   └── valouniversaire-server # Binaire
│
└── 📚 DOCUMENTATION
    ├── README.md             # Documentation complète
    ├── PROJECT_STRUCTURE.md  # Structure détaillée
    └── TESTS_SUMMARY.md      # Résumé des tests
```

## 🔧 Commandes Utiles

### Développement
```bash
make dev           # Mode développement
make build         # Compilation
make run           # Lancer
make restart       # Redémarrer
make stop          # Arrêter
```

### Tests et Debug
```bash
make test          # Tous les tests
make test-coverage # Avec couverture
make check         # Santé du serveur
./quick-test.sh    # Test rapide
```

### Maintenance
```bash
make clean         # Nettoyer
make help          # Aide complète
```

## 🎯 Résolution de Problèmes

### Problème: Jeu en Loading Infini ⏳
**Solution:**
1. Ouvrez http://localhost:8080/debug
2. Appuyez F12 pour la console
3. Regardez les messages d'erreur
4. Testez l'API avec le bouton

### Problème: Port Déjà Utilisé 🚫
**Solution:**
```bash
make stop          # Arrête l'ancien serveur
make run           # Redémarre
```

### Problème: Erreur de Compilation ❌
**Solution:**
```bash
make clean         # Nettoyage
make install       # Réinstalle les dépendances
make build         # Recompile
```

### Problème: Fichiers Manquants 📂
**Solution:**
```bash
ls templates/      # Vérifiez les templates
ls static/         # Vérifiez les fichiers statiques
```

## 🎮 Comment Jouer

1. **Démarrez** le serveur avec `./start.sh`
2. **Ouvrez** http://localhost:8080
3. **Entrez** votre nom de joueur
4. **Cliquez** "Commencer"
5. **Coupez** des arbres en cliquant 🌳
6. **Achetez** des améliorations avec le bois
7. **Embauchez** des workers pour automatiser
8. **Brassez** de la bière pour gagner des bonus
9. **Atteignez** 100 bières pour gagner !

## 🏆 Fonctionnalités

- ✅ **Jeu Complet** : Clics, workers, upgrades, prestige
- ✅ **Interface Moderne** : Responsive, animations
- ✅ **API REST** : Sauvegarde automatique
- ✅ **Mode Debug** : Console détaillée
- ✅ **Tests Complets** : 400+ tests automatisés
- ✅ **Sécurité** : Protection XSS, SQL injection
- ✅ **Performance** : 18M+ ops/sec

## 📞 Support

### Logs Détaillés
```bash
make logs          # Voir les logs du serveur
```

### Test de Santé
```bash
curl http://localhost:8080/api/health
```

### Mode Verbose
```bash
./valouniversaire-server -v
```

## 🎉 Prêt à Jouer !

Votre jeu Valouniversaire est maintenant **parfaitement configuré** !

**Pour commencer :**
```bash
./start.sh
```

**Puis ouvrez :** http://localhost:8080

**Amusez-vous bien ! 🌳🍺⭐**