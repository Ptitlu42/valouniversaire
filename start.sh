#!/bin/bash

echo "🌳 Démarrage de Valouniversaire..."

# Vérification que le binaire existe
if [ ! -f "./valouniversaire-server" ]; then
    echo "❌ Binaire introuvable. Compilation en cours..."
    go build -o valouniversaire-server ./cmd/server
    if [ $? -ne 0 ]; then
        echo "❌ Erreur de compilation"
        exit 1
    fi
    echo "✅ Compilation terminée"
fi

# Arrêt des processus existants
pkill -f valouniversaire-server 2>/dev/null

# Démarrage du serveur
echo "🚀 Lancement du serveur..."
./valouniversaire-server &
SERVER_PID=$!

# Attente que le serveur soit prêt
echo "⏳ Attente du démarrage du serveur..."
for i in {1..10}; do
    if curl -s http://localhost:8080/api/health > /dev/null 2>&1; then
        echo "✅ Serveur prêt !"
        break
    fi
    sleep 1
done

# Vérification finale
if curl -s http://localhost:8080/api/health > /dev/null 2>&1; then
    echo ""
    echo "🎮 Valouniversaire est prêt !"
    echo "🌐 Ouvrez votre navigateur à l'adresse : http://localhost:8080"
    echo "📊 API Health : http://localhost:8080/api/health"
    echo "🛑 Pour arrêter : kill $SERVER_PID"
    echo ""
    echo "Le serveur tourne en arrière-plan (PID: $SERVER_PID)"
else
    echo "❌ Erreur : Le serveur ne répond pas"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi