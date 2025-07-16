class ValouniversaireGame {
    constructor() {
        console.log('🎮 Initialisation du jeu Valouniversaire...');
        this.playerName = '';
        this.gameState = null;
        this.updateInterval = null;
        this.initializeElements();
        this.bindEvents();
        this.showLoading();
        
        // Test de connexion API au démarrage
        this.testAPIConnection();
    }

    async testAPIConnection() {
        try {
            console.log('🔌 Test de connexion API...');
            const response = await fetch('/api/health');
            const data = await response.json();
            console.log('✅ API connectée:', data);
        } catch (error) {
            console.error('❌ Erreur de connexion API:', error);
            this.showNotification('Erreur de connexion au serveur', 'error');
        }
    }

    initializeElements() {
        console.log('🔧 Initialisation des éléments...');
        this.elements = {
            loading: document.getElementById('loading'),
            gameContainer: document.getElementById('game-container'),
            gameArea: document.getElementById('game-area'),
            playerNameInput: document.getElementById('player-name'),
            startGameBtn: document.getElementById('start-game'),
            
            woodCount: document.getElementById('wood-count'),
            beerCount: document.getElementById('beer-count'),
            prestigeCount: document.getElementById('prestige-count'),
            gameDuration: document.getElementById('game-duration'),
            
            treeButton: document.getElementById('tree-button'),
            treeHpFill: document.getElementById('tree-hp-fill'),
            treeHpText: document.getElementById('tree-hp-text'),
            axeLevel: document.getElementById('axe-level'),
            upgradeAxe: document.getElementById('upgrade-axe'),
            axeCost: document.getElementById('axe-cost'),
            
            woodGained: document.getElementById('wood-gained'),
            criticalHit: document.getElementById('critical-hit'),
            
            buyBeer: document.getElementById('buy-beer'),
            beerCost: document.getElementById('beer-cost'),
            
            prestigeSection: document.getElementById('prestige-section'),
            prestigeButton: document.getElementById('prestige-button'),
            
            victoryScreen: document.getElementById('victory-screen'),
            continuePlayingBtn: document.getElementById('continue-playing'),
            resetGameBtn: document.getElementById('reset-game'),
            
            notificationContainer: document.getElementById('notification-container')
        };

        // Vérification des éléments manquants
        const missingElements = [];
        for (const [key, element] of Object.entries(this.elements)) {
            if (!element) {
                missingElements.push(key);
            }
        }
        
        if (missingElements.length > 0) {
            console.warn('⚠️ Éléments manquants:', missingElements);
        } else {
            console.log('✅ Tous les éléments trouvés');
        }

        this.workerElements = {
            'ptit_lu': {
                button: document.getElementById('buy-ptit-lu'),
                count: document.getElementById('ptit-lu-count'),
                cost: document.getElementById('ptit-lu-cost')
            },
            'mathieu': {
                button: document.getElementById('buy-mathieu'),
                count: document.getElementById('mathieu-count'),
                cost: document.getElementById('mathieu-cost')
            },
            'vico': {
                button: document.getElementById('buy-vico'),
                count: document.getElementById('vico-count'),
                cost: document.getElementById('vico-cost')
            }
        };

        this.upgradeElements = {
            'auto_clicker': {
                button: document.getElementById('buy-auto-clicker'),
                level: document.getElementById('auto-clicker-level'),
                cost: document.getElementById('auto-clicker-cost')
            },
            'lumberjack_school': {
                button: document.getElementById('buy-lumberjack-school'),
                level: document.getElementById('lumberjack-school-level'),
                cost: document.getElementById('lumberjack-school-cost')
            },
            'brewery_bonus': {
                button: document.getElementById('buy-brewery-bonus'),
                level: document.getElementById('brewery-bonus-level'),
                cost: document.getElementById('brewery-bonus-cost')
            },
            'golden_axe': {
                button: document.getElementById('buy-golden-axe'),
                level: document.getElementById('golden-axe-level'),
                cost: document.getElementById('golden-axe-cost')
            }
        };
    }

    bindEvents() {
        console.log('🎯 Liaison des événements...');
        
        if (this.elements.startGameBtn) {
            this.elements.startGameBtn.addEventListener('click', () => this.startGame());
        }
        
        if (this.elements.playerNameInput) {
            this.elements.playerNameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.startGame();
            });
        }

        if (this.elements.treeButton) {
            this.elements.treeButton.addEventListener('click', () => this.chopTree());
        }
        
        console.log('✅ Événements liés');
    }

    showLoading() {
        console.log('⏳ Affichage du loading...');
        if (this.elements.loading) {
            this.elements.loading.style.display = 'flex';
        }
        if (this.elements.gameContainer) {
            this.elements.gameContainer.style.display = 'none';
        }
    }

    hideLoading() {
        console.log('✅ Masquage du loading...');
        if (this.elements.loading) {
            this.elements.loading.style.display = 'none';
        }
        if (this.elements.gameContainer) {
            this.elements.gameContainer.style.display = 'block';
        }
    }

    async startGame() {
        console.log('🚀 Démarrage du jeu...');
        
        const playerName = this.elements.playerNameInput ? this.elements.playerNameInput.value.trim() : '';
        if (!playerName) {
            console.warn('⚠️ Nom de joueur manquant');
            this.showNotification('Veuillez entrer votre nom', 'error');
            return;
        }

        console.log('👤 Joueur:', playerName);
        this.playerName = playerName;
        
        try {
            this.hideLoading();
            if (this.elements.gameArea) {
                this.elements.gameArea.style.display = 'block';
            }
            
            await this.loadGameState();
            this.startUpdateLoop();
            console.log('✅ Jeu démarré avec succès');
        } catch (error) {
            console.error('❌ Erreur au démarrage:', error);
            this.showNotification('Erreur au démarrage du jeu', 'error');
        }
    }

    async loadGameState() {
        console.log('📥 Chargement de l\'état du jeu...');
        try {
            const response = await this.apiCall('GET', `/api/state?player_name=${encodeURIComponent(this.playerName)}`);
            console.log('📦 Réponse API:', response);
            
            if (response.success) {
                this.gameState = response.data;
                this.updateUI();
                console.log('✅ État du jeu chargé');
            } else {
                throw new Error(response.error || 'Réponse API invalide');
            }
        } catch (error) {
            console.error('❌ Erreur lors du chargement:', error);
            throw error;
        }
    }

    updateUI() {
        if (!this.gameState) {
            console.warn('⚠️ Pas d\'état de jeu pour la mise à jour UI');
            return;
        }

        console.log('🎨 Mise à jour de l\'interface...');
        
        // Mise à jour basique des compteurs
        if (this.elements.woodCount) {
            this.elements.woodCount.textContent = this.gameState.wood || 0;
        }
        if (this.elements.beerCount) {
            this.elements.beerCount.textContent = this.gameState.beer || 0;
        }
        if (this.elements.prestigeCount) {
            this.elements.prestigeCount.textContent = this.gameState.prestige_points || 0;
        }
    }

    async chopTree() {
        console.log('🪓 Coupe de l\'arbre...');
        try {
            const response = await this.apiCall('POST', '/api/action', {
                player_name: this.playerName,
                action: 'chop'
            });
            
            if (response.success) {
                this.gameState = response.data;
                this.updateUI();
                console.log('✅ Arbre coupé');
            }
        } catch (error) {
            console.error('❌ Erreur lors de la coupe:', error);
        }
    }

    startUpdateLoop() {
        console.log('🔄 Démarrage de la boucle de mise à jour...');
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        this.updateInterval = setInterval(async () => {
            try {
                await this.loadGameState();
            } catch (error) {
                console.error('❌ Erreur dans la boucle de mise à jour:', error);
            }
        }, 1000);
    }

    stopUpdateLoop() {
        console.log('🛑 Arrêt de la boucle de mise à jour...');
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    showNotification(message, type = 'info') {
        console.log(`📢 Notification (${type}):`, message);
        
        // Créer une notification simple
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background: ${type === 'error' ? '#ff4444' : '#44ff44'};
            color: white;
            border-radius: 5px;
            z-index: 1000;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    async apiCall(method, url, data = null) {
        console.log(`🌐 API Call: ${method} ${url}`, data);
        
        try {
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            if (data) {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(url, options);
            const result = await response.json();
            
            console.log(`📡 API Response:`, result);
            return result;
        } catch (error) {
            console.error(`❌ API Error:`, error);
            throw error;
        }
    }
}

// Version de debug - initialisation immédiate
console.log('🎮 Chargement de Valouniversaire (version debug)...');

document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM chargé, initialisation du jeu...');
    window.game = new ValouniversaireGame();
});

window.addEventListener('beforeunload', () => {
    console.log('👋 Fermeture du jeu...');
    if (window.game) {
        window.game.stopUpdateLoop();
    }
});