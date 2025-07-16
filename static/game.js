class ValouniversaireGame {
    constructor() {
        this.playerName = '';
        this.gameState = null;
        this.updateInterval = null;
        this.initializeElements();
        this.bindEvents();
        this.showLoading();
    }

    initializeElements() {
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
                count: document.getElementById('auto-clicker-count'),
                cost: document.getElementById('auto-clicker-cost')
            },
            'lumberjack_school': {
                button: document.getElementById('buy-lumberjack-school'),
                count: document.getElementById('lumberjack-school-count'),
                cost: document.getElementById('lumberjack-school-cost')
            },
            'brewery_bonus': {
                button: document.getElementById('buy-brewery-bonus'),
                count: document.getElementById('brewery-bonus-count'),
                cost: document.getElementById('brewery-bonus-cost')
            },
            'golden_axe': {
                button: document.getElementById('buy-golden-axe'),
                count: document.getElementById('golden-axe-count'),
                cost: document.getElementById('golden-axe-cost')
            }
        };

        this.statElements = {
            treesChopped: document.getElementById('trees-chopped'),
            totalWood: document.getElementById('total-wood'),
            totalBeers: document.getElementById('total-beers'),
            totalClicks: document.getElementById('total-clicks'),
            criticalHits: document.getElementById('critical-hits'),
            workersHired: document.getElementById('workers-hired')
        };
    }

    bindEvents() {
        this.elements.startGameBtn.addEventListener('click', () => this.startGame());
        this.elements.playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.startGame();
        });

        this.elements.treeButton.addEventListener('click', () => this.chopTree());
        this.elements.upgradeAxe.addEventListener('click', () => this.upgradeAxe());
        this.elements.buyBeer.addEventListener('click', () => this.buyBeer());
        this.elements.prestigeButton.addEventListener('click', () => this.prestige());

        Object.keys(this.workerElements).forEach(workerType => {
            this.workerElements[workerType].button.addEventListener('click', () => this.buyWorker(workerType));
        });

        Object.keys(this.upgradeElements).forEach(upgradeType => {
            this.upgradeElements[upgradeType].button.addEventListener('click', () => this.buyUpgrade(upgradeType));
        });

        this.elements.continuePlayingBtn.addEventListener('click', () => this.hideVictoryScreen());
        this.elements.resetGameBtn.addEventListener('click', () => this.resetGame());
    }

    showLoading() {
        this.elements.loading.style.display = 'flex';
        this.elements.gameContainer.style.display = 'none';
    }

    hideLoading() {
        this.elements.loading.style.display = 'none';
        this.elements.gameContainer.style.display = 'block';
    }

    async startGame() {
        const playerName = this.elements.playerNameInput.value.trim();
        if (!playerName) {
            this.showNotification('Veuillez entrer votre nom', 'error');
            return;
        }

        this.playerName = playerName;
        this.hideLoading();
        this.elements.gameArea.style.display = 'block';
        
        await this.loadGameState();
        this.startUpdateLoop();
    }

    async loadGameState() {
        try {
            const response = await this.apiCall('GET', `/api/state?player_name=${encodeURIComponent(this.playerName)}`);
            if (response.success) {
                this.gameState = response.data;
                this.updateUI();
            }
        } catch (error) {
            this.showNotification('Erreur de chargement du jeu', 'error');
        }
    }

    async performAction(action, target = null) {
        try {
            const response = await this.apiCall('POST', '/api/action', {
                player_name: this.playerName,
                action: action,
                target: target
            });

            if (response.success) {
                this.gameState = response.data.game_state;
                this.updateUI();
                return response.data.action_result;
            } else {
                this.showNotification(response.error, 'error');
                return null;
            }
        } catch (error) {
            this.showNotification('Erreur lors de l\'action', 'error');
            return null;
        }
    }

    async chopTree() {
        const result = await this.performAction('chop');
        if (result) {
            this.animateTreeChop(result.wood_gained, result.is_critical);
        }
    }

    async upgradeAxe() {
        await this.performAction('upgrade_axe');
    }

    async buyWorker(workerType) {
        await this.performAction('buy_worker', workerType);
    }

    async buyUpgrade(upgradeType) {
        await this.performAction('buy_upgrade', upgradeType);
    }

    async buyBeer() {
        await this.performAction('buy_beer');
    }

    async prestige() {
        if (confirm('Êtes-vous sûr de vouloir faire un prestige? Cela remettra à zéro votre progression actuelle.')) {
            const result = await this.performAction('prestige');
            if (result) {
                this.showNotification('Prestige activé! Vous avez gagné des points de prestige permanents!');
            }
        }
    }

    async resetGame() {
        if (confirm('Êtes-vous sûr de vouloir recommencer le jeu?')) {
            try {
                const response = await this.apiCall('POST', `/api/reset?player_name=${encodeURIComponent(this.playerName)}`);
                if (response.success) {
                    this.gameState = response.data;
                    this.updateUI();
                    this.hideVictoryScreen();
                    this.showNotification('Jeu remis à zéro!');
                }
            } catch (error) {
                this.showNotification('Erreur lors de la remise à zéro', 'error');
            }
        }
    }

    updateUI() {
        if (!this.gameState) return;

        this.elements.woodCount.textContent = this.gameState.wood.toLocaleString();
        this.elements.beerCount.textContent = this.gameState.beer.toLocaleString();
        this.elements.prestigeCount.textContent = this.gameState.prestige_points.toLocaleString();
        this.elements.gameDuration.textContent = this.gameState.game_duration;

        const treeHpPercent = (this.gameState.tree_hp / this.gameState.max_tree_hp) * 100;
        this.elements.treeHpFill.style.width = `${treeHpPercent}%`;
        this.elements.treeHpText.textContent = `${this.gameState.tree_hp}/${this.gameState.max_tree_hp}`;

        this.elements.axeLevel.textContent = this.gameState.axe_level;
        this.elements.axeCost.textContent = this.gameState.prices.axe_upgrade.toLocaleString();

        this.elements.beerCost.textContent = this.gameState.prices.beer.toLocaleString();

        Object.keys(this.workerElements).forEach(workerType => {
            const workerCount = this.gameState.workers[workerType] || 0;
            this.workerElements[workerType].count.textContent = workerCount;
            this.workerElements[workerType].cost.textContent = this.gameState.prices[workerType].toLocaleString();
        });

        Object.keys(this.upgradeElements).forEach(upgradeType => {
            const upgradeLevel = this.gameState.upgrades[upgradeType] || 0;
            this.upgradeElements[upgradeType].count.textContent = upgradeLevel;
            this.upgradeElements[upgradeType].cost.textContent = this.gameState.prices[upgradeType].toLocaleString();
        });

        this.statElements.treesChopped.textContent = this.gameState.stats.total_trees_chopped.toLocaleString();
        this.statElements.totalWood.textContent = this.gameState.stats.total_wood_gained.toLocaleString();
        this.statElements.totalBeers.textContent = this.gameState.stats.total_beers_consumed.toLocaleString();
        this.statElements.totalClicks.textContent = this.gameState.stats.total_clicks.toLocaleString();
        this.statElements.criticalHits.textContent = this.gameState.stats.critical_hits.toLocaleString();
        this.statElements.workersHired.textContent = this.gameState.stats.workers_hired.toLocaleString();

        this.updateButtonStates();
        this.updatePrestigeSection();
        this.checkVictory();
    }

    updateButtonStates() {
        if (!this.gameState) return;

        const wood = this.gameState.wood;

        this.elements.upgradeAxe.disabled = wood < this.gameState.prices.axe_upgrade;
        this.elements.buyBeer.disabled = wood < this.gameState.prices.beer;

        Object.keys(this.workerElements).forEach(workerType => {
            const button = this.workerElements[workerType].button;
            const canAfford = wood >= this.gameState.prices[workerType];
            button.disabled = !canAfford;
            button.classList.toggle('affordable', canAfford);
        });

        Object.keys(this.upgradeElements).forEach(upgradeType => {
            const button = this.upgradeElements[upgradeType].button;
            const canAfford = wood >= this.gameState.prices[upgradeType];
            button.disabled = !canAfford;
            button.classList.toggle('affordable', canAfford);
        });
    }

    updatePrestigeSection() {
        if (!this.gameState) return;

        if (this.gameState.can_prestige) {
            this.elements.prestigeSection.style.display = 'block';
        } else {
            this.elements.prestigeSection.style.display = 'none';
        }
    }

    checkVictory() {
        if (this.gameState && this.gameState.is_game_won && this.elements.victoryScreen.style.display === 'none') {
            this.showVictoryScreen();
        }
    }

    showVictoryScreen() {
        this.elements.victoryScreen.style.display = 'flex';
    }

    hideVictoryScreen() {
        this.elements.victoryScreen.style.display = 'none';
    }

    animateTreeChop(woodGained, isCritical) {
        this.elements.treeButton.classList.add('animate');
        
        setTimeout(() => {
            this.elements.treeButton.classList.remove('animate');
        }, 600);

        if (isCritical) {
            this.elements.treeButton.classList.add('critical');
            this.elements.criticalHit.textContent = 'CRITIQUE!';
            this.elements.criticalHit.classList.add('show');
            
            setTimeout(() => {
                this.elements.criticalHit.classList.remove('show');
                this.elements.treeButton.classList.remove('critical');
            }, 1500);
        }

        if (woodGained > 0) {
            this.elements.woodGained.textContent = `+${woodGained} 🪵`;
            this.elements.woodGained.classList.add('show');
            
            setTimeout(() => {
                this.elements.woodGained.classList.remove('show');
            }, 1500);
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        this.elements.notificationContainer.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    startUpdateLoop() {
        this.updateInterval = setInterval(async () => {
            await this.loadGameState();
        }, 2000);
    }

    stopUpdateLoop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    async apiCall(method, url, data = null) {
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
        return await response.json();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.game = new ValouniversaireGame();
});

window.addEventListener('beforeunload', () => {
    if (window.game) {
        window.game.stopUpdateLoop();
    }
});