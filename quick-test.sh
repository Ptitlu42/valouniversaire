#!/bin/bash

echo "🧪 Test Rapide de Valouniversaire"
echo "================================"

# Démarrage du serveur
echo "🚀 Démarrage du serveur..."
./valouniversaire-server &
SERVER_PID=$!

# Attente du démarrage
echo "⏳ Attente du serveur..."
sleep 3

# Tests de base
echo "🔍 Tests de connectivité..."

echo -n "   ✓ API Health: "
if curl -s http://localhost:8080/api/health > /dev/null; then
    echo "OK"
else
    echo "ERREUR"
fi

echo -n "   ✓ Page principale: "
if curl -s http://localhost:8080/ > /dev/null; then
    echo "OK"
else
    echo "ERREUR"
fi

echo -n "   ✓ Page debug: "
if curl -s http://localhost:8080/debug > /dev/null; then
    echo "OK"
else
    echo "ERREUR"
fi

echo -n "   ✓ Fichiers statiques: "
if curl -s http://localhost:8080/static/game.js > /dev/null; then
    echo "OK"
else
    echo "ERREUR"
fi

echo -n "   ✓ API State: "
if curl -s "http://localhost:8080/api/state?player_name=test" > /dev/null; then
    echo "OK"
else
    echo "ERREUR"
fi

# Arrêt du serveur
echo "🛑 Arrêt du serveur de test..."
kill $SERVER_PID 2>/dev/null

echo ""
echo "✅ Test terminé !"
echo ""
echo "🎮 Pour jouer:"
echo "   ./start.sh"
echo "   Puis ouvrez http://localhost:8080"
echo ""
echo "🐛 Pour débugger:"
echo "   Ouvrez http://localhost:8080/debug"
echo "   Consultez la console (F12)"