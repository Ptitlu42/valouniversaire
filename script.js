console.log('Script loading...');

const DIFFICULTY_CONFIG = {
    prices: {
        axeUpgrade: 15,
        ptitLu: 25,
        mathieu: 100,
        vico: 300,
        beer: 4
    },
    priceMultipliers: {
        upgrade: 1.15,
        worker: 1.018,
        beer: 1.022
    },
    toolEfficiency: {
        manual: 1
    },
    workerEfficiency: {
        ptitLu: 0.5,
        mathieu: 2,
        vico: 5
    },
    workerSpeed: {
        ptitLu: 1200,
        mathieu: 600,
        vico: 400
    },
    tree: {
        baseHP: 10,
        minHP: 5,
        maxHP: 12,
        woodMin: 2,
        woodMax: 4
    },
    beer: {
        bonusPerBeer: 0.01,
        targetBeers: 420
    }
};

let gameState = {
    wood: 0,
    beer: 419,
    currentTool: 'manual',
    treeHP: 10,
    maxTreeHP: 10,
    axeLevel: 1,
    workers: {
        ptitLu: 200,
        mathieu: 200,
        vico: 200
    },
    stats: {
        totalTreesChopped: 0,
        totalWoodGained: 0,
        totalBeersConsumed: 0,
        totalClicks: 0,
        workersHired: 0,
        lastClickTime: Date.now(),
        clicksInLastSecond: 0,
        recentClicks: [],
        woodPerSecond: 0,
        woodGainHistory: []
    },
    playerName: '',
    gameStartTime: null,
    tutorial: {
        enabled: true,
        shownSteps: {
            start: false,
            beer: false,
            axe: false,
            workers: false
        }
    }
};

function calculatePrice(basePrice, quantity, type = 'worker') {
    if (type === 'upgrade') {
        return Math.floor(basePrice * Math.pow(DIFFICULTY_CONFIG.priceMultipliers.upgrade, quantity - 1));
    }
    if (type === 'beer') {
        return Math.floor(basePrice * Math.pow(DIFFICULTY_CONFIG.priceMultipliers.beer, quantity));
    }
    return Math.floor(basePrice * Math.pow(DIFFICULTY_CONFIG.priceMultipliers.worker, quantity));
}

function getCurrentPrices() {
    return {
        axeUpgrade: calculatePrice(DIFFICULTY_CONFIG.prices.axeUpgrade, gameState.axeLevel, 'upgrade'),
        ptitLu: calculatePrice(DIFFICULTY_CONFIG.prices.ptitLu, gameState.workers.ptitLu, 'worker'),
        mathieu: calculatePrice(DIFFICULTY_CONFIG.prices.mathieu, gameState.workers.mathieu, 'worker'),
        vico: calculatePrice(DIFFICULTY_CONFIG.prices.vico, gameState.workers.vico, 'worker'),
        beer: calculatePrice(DIFFICULTY_CONFIG.prices.beer, gameState.beer, 'beer')
    };
}

const toolEfficiency = DIFFICULTY_CONFIG.toolEfficiency;

const workerEfficiency = DIFFICULTY_CONFIG.workerEfficiency;

const workerSpeed = DIFFICULTY_CONFIG.workerSpeed;

let workerIntervals = {};

function createFallingParticles() {
    const particles = ['🪵', '🪵', '🍂', '🌿'];
    const container = document.querySelector('.main-game');
    if (!container) return;
    
    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'falling-particle';
        particle.textContent = particles[Math.floor(Math.random() * particles.length)];
        
        const startX = (Math.random() - 0.5) * 400;
        const startY = (Math.random() - 0.5) * 100;
        const rotation = Math.random() * 720 - 360;
        const scale = 0.8 + Math.random() * 0.8;
        
        particle.style.cssText = `
            left: calc(50% + ${startX}px);
            top: calc(50% + ${startY}px);
            font-size: ${1.5 * scale}rem;
            animation: fall ${2 + Math.random()}s ease-in forwards;
            animation-delay: ${i * 0.05}s;
            transform: rotate(${rotation}deg) scale(${scale});
        `;
        
        container.appendChild(particle);
        
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 3000 + (i * 50));
    }
}

function trackWoodGain(amount) {
    const now = Date.now();
    gameState.stats.woodGainHistory.push({
        amount: amount,
        timestamp: now
    });
    
    gameState.stats.woodGainHistory = gameState.stats.woodGainHistory.filter(
        entry => now - entry.timestamp < 3000
    );
}

function updateSpeedDisplays() {
    const now = Date.now();
    gameState.stats.recentClicks = gameState.stats.recentClicks.filter(time => now - time < 1000);
    
    const clicksPerSecond = gameState.stats.recentClicks.length;
    
    const woodInLast3Seconds = gameState.stats.woodGainHistory
        .filter(entry => now - entry.timestamp < 3000)
        .reduce((total, entry) => total + entry.amount, 0);
    
    const actualWoodPerSecond = woodInLast3Seconds / 3;
    
    const woodPerSecondElement = document.getElementById('woodPerSecond');
    const clicksPerSecondElement = document.getElementById('clicksPerSecond');
    
    if (woodPerSecondElement) woodPerSecondElement.textContent = actualWoodPerSecond.toFixed(1);
    if (clicksPerSecondElement) clicksPerSecondElement.textContent = clicksPerSecond.toFixed(1);
}

function showAperitifAnimation() {
    const animation = document.createElement('div');
    animation.className = 'aperitif-animation';
    animation.textContent = 'APEROOOO!';
    
    const isMobile = window.innerWidth <= 768;
    const isSmallMobile = window.innerWidth <= 480;
    
    let fontSize = '8rem';
    if (isSmallMobile) {
        fontSize = '3rem';
    } else if (isMobile) {
        fontSize = '5rem';
    }
    
    animation.style.fontSize = fontSize;
    
    document.body.appendChild(animation);
    
    for (let i = 0; i < 6; i++) {
        setTimeout(() => {
            const glougou = document.createElement('div');
            glougou.className = 'glougou';
            glougou.textContent = 'glou';
            
            const angle = (i * 60) + Math.random() * 30;
            const distance = 200 + Math.random() * 100;
            const x = Math.cos(angle * Math.PI / 180) * distance;
            const y = Math.sin(angle * Math.PI / 180) * distance;
            
            glougou.style.left = `calc(50% + ${x}px)`;
            glougou.style.top = `calc(50% + ${y}px)`;
            
            document.body.appendChild(glougou);
            
            setTimeout(() => {
                if (glougou.parentNode) {
                    glougou.parentNode.removeChild(glougou);
                }
            }, 2000);
        }, i * 100);
    }
    
    for (let i = 0; i < 8; i++) {
        setTimeout(() => {
            const beerEmoji = document.createElement('div');
            beerEmoji.className = 'beer-emoji';
            beerEmoji.textContent = '🍺';
            
            const angle = (i * 45) + Math.random() * 20;
            const distance = 150 + Math.random() * 80;
            const x = Math.cos(angle * Math.PI / 180) * distance;
            const y = Math.sin(angle * Math.PI / 180) * distance;
            
            beerEmoji.style.left = `calc(50% + ${x}px)`;
            beerEmoji.style.top = `calc(50% + ${y}px)`;
            
            document.body.appendChild(beerEmoji);
            
            setTimeout(() => {
                if (beerEmoji.parentNode) {
                    beerEmoji.parentNode.removeChild(beerEmoji);
                }
            }, 2500);
        }, i * 80);
    }
    
    setTimeout(() => {
        if (animation.parentNode) {
            animation.parentNode.removeChild(animation);
        }
    }, 2000);
}

function chopTree() {
    console.log('Tree chopped!');
    const damage = gameState.axeLevel;
    gameState.treeHP -= damage;
    gameState.stats.totalClicks++;
    gameState.stats.recentClicks.push(Date.now());
    
    const mainTree = document.getElementById('mainTree');
    const mainGame = document.querySelector('.main-game');
    
    if (mainTree) {
        mainTree.classList.add('chopping');
        mainTree.classList.add('chopping-cursor');
        setTimeout(() => {
            mainTree.classList.remove('chopping');
            mainTree.classList.remove('chopping-cursor');
        }, 250);
    }
    
    if (mainGame) {
        mainGame.classList.add('chopping-cursor');
        setTimeout(() => {
            mainGame.classList.remove('chopping-cursor');
        }, 150);
    }
    
    createFallingParticles();
    showFloatingText(`-${damage}`, '#ff4757');
    
    processTreeDamage();
    updateUI();
}

function processTreeDamage() {
    while (gameState.treeHP <= 0) {
        const excessDamage = Math.abs(gameState.treeHP);
        harvestTree();
        if (excessDamage > 0) {
            gameState.treeHP -= excessDamage;
        }
    }
    updateTreeHP();
}

function harvestTree() {
    const baseWood = Math.floor(Math.random() * (DIFFICULTY_CONFIG.tree.woodMax - DIFFICULTY_CONFIG.tree.woodMin + 1)) + DIFFICULTY_CONFIG.tree.woodMin;
    const beerBonus = 1 + (gameState.beer * DIFFICULTY_CONFIG.beer.bonusPerBeer);
    const woodGained = Math.floor(baseWood * beerBonus);
    
    gameState.wood += woodGained;
    gameState.stats.totalTreesChopped++;
    gameState.stats.totalWoodGained += woodGained;
    trackWoodGain(woodGained);
    showFloatingText(`+${woodGained} 🪵`, '#66bb6a');
    respawnTree();
    updateUI();
}

function respawnTree() {
    gameState.maxTreeHP = Math.floor(Math.random() * (DIFFICULTY_CONFIG.tree.maxHP - DIFFICULTY_CONFIG.tree.minHP + 1)) + DIFFICULTY_CONFIG.tree.minHP;
    gameState.treeHP = gameState.maxTreeHP;
    updateTreeHP();
}

function updateTreeHP() {
    const percentage = (gameState.treeHP / gameState.maxTreeHP) * 100;
    const treeHpFill = document.querySelector('.tree-hp-fill');
    if (treeHpFill) {
        treeHpFill.style.width = `${percentage}%`;
    }
}

function showFloatingText(text, color = '#ffd93d') {
    const container = document.querySelector('.main-tree-container');
    if (!container) return;
    
    const element = document.createElement('div');
    element.textContent = text;
    element.style.cssText = `
        position: absolute;
        color: ${color};
        font-weight: bold;
        font-size: 1.8rem;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        pointer-events: none;
        z-index: 1000;
        animation: floatUp 1.5s ease-out forwards;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    `;

    container.appendChild(element);
    
    setTimeout(() => {
        if (element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }, 1500);
}

function showUpgradeAnimation(text, color = '#ffd93d') {
    const upgradeText = document.createElement('div');
    upgradeText.textContent = text;
    
    const isMobile = window.innerWidth <= 768;
    const isSmallMobile = window.innerWidth <= 480;
    
    let fontSize = '3rem';
    let whiteSpace = 'nowrap';
    let maxWidth = 'none';
    
    if (isSmallMobile) {
        fontSize = '1.2rem';
        whiteSpace = 'normal';
        maxWidth = '85vw';
    } else if (isMobile) {
        fontSize = '1.6rem';
        whiteSpace = 'normal';
        maxWidth = '90vw';
    }
    
    upgradeText.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: ${color};
        font-weight: bold;
        font-size: ${fontSize};
        text-shadow: 3px 3px 6px rgba(0,0,0,0.8);
        pointer-events: none;
        z-index: 2000;
        animation: upgradePopup 2.5s ease-out forwards;
        text-align: center;
        white-space: ${whiteSpace};
        max-width: ${maxWidth};
        line-height: 1.2;
        padding: 0 10px;
    `;
    
    document.body.appendChild(upgradeText);
    
    setTimeout(() => {
        if (upgradeText.parentNode) {
            upgradeText.parentNode.removeChild(upgradeText);
        }
    }, 2500);
}

function upgradeAxe() {
    const prices = getCurrentPrices();
    if (gameState.wood >= prices.axeUpgrade) {
        gameState.wood -= prices.axeUpgrade;
        gameState.axeLevel++;
        updateUI();
        
        const upgradeMessages = [
            '🪓 Hache améliorée ! Tu deviens un vrai bûcheron !',
            '🪓 Nouvelle hache ! Les arbres tremblent !',
            '🪓 Upgrade réussi ! Tu es de plus en plus fort !',
            '🪓 Hache de légende ! Vico serait fier !',
            '🪓 Niveau supérieur ! Tu maîtrises maintenant !'
        ];
        const randomMessage = upgradeMessages[Math.floor(Math.random() * upgradeMessages.length)];
        showUpgradeAnimation(randomMessage, '#ffd93d');
    }
}

function buyWorker(workerType) {
    const prices = getCurrentPrices();
    const price = prices[workerType];

    if (gameState.wood >= price) {
        gameState.wood -= price;
        gameState.workers[workerType]++;
        gameState.stats.workersHired++;
        
        createWorkerInterval(workerType);
        
        updateUI();
        const messages = {
            ptitLu: " +1 P'tit Lu ! (Il va faire de son mieux...)",
            mathieu: 'Un Mathieu rejoint l\'équipe ! (Solide recrue 👍)', 
            vico: 'UN VICO DE PLUS ! (Attention les arbres, la légende arrive! 🔥)'
        };
        showUpgradeAnimation(messages[workerType], '#ffd93d');
    }
}

function purchaseBeer() {
    const prices = getCurrentPrices();
    if (gameState.wood >= prices.beer) {
        gameState.wood -= prices.beer;
        gameState.beer++;
        gameState.stats.totalBeersConsumed++;
        
        showAperitifAnimation();
        updateUI();
        
        if (gameState.beer >= DIFFICULTY_CONFIG.beer.targetBeers) {
            showEndScreen();
        }
    }
}

function updateUI() {
    const woodCount = document.getElementById('woodCount');
    const beerCount = document.getElementById('beerCount');
    
    if (woodCount) woodCount.textContent = gameState.wood;
    if (beerCount) beerCount.textContent = gameState.beer;
    
    updateShopButtons();
    updateWorkerCounts();
    updateValouHappiness();
    updateStats();
    checkTutorialTriggers();
}

function updateShopButtons() {
    const prices = getCurrentPrices();
    const upgradeAxe = document.getElementById('upgradeAxe');
    const buyPtitLu = document.getElementById('buyPtitLu');
    const buyMathieu = document.getElementById('buyMathieu');
    const buyVico = document.getElementById('buyVico');
    const buyBeer = document.getElementById('buyBeer');

    if (upgradeAxe) {
        upgradeAxe.disabled = gameState.wood < prices.axeUpgrade;
        upgradeAxe.textContent = `🪓 Améliorer ta hache (niv.${gameState.axeLevel}) - ${prices.axeUpgrade} 🪵`;
    }
    
    if (buyPtitLu) {
        buyPtitLu.disabled = gameState.wood < prices.ptitLu;
        buyPtitLu.textContent = `😴 PtitLu (...pas oof) - ${prices.ptitLu} 🪵`;
    }
    
    if (buyMathieu) {
        buyMathieu.disabled = gameState.wood < prices.mathieu;
        buyMathieu.textContent = `😊 Mathieu (Du bon bucheron ça!) - ${prices.mathieu} 🪵`;
    }
    
    if (buyVico) {
        buyVico.disabled = gameState.wood < prices.vico;
        buyVico.textContent = `💪 Vico (la machine absolue!) - ${prices.vico} 🪵`;
    }
    
    if (buyBeer) {
        buyBeer.disabled = gameState.wood < prices.beer;
        const currentBonus = gameState.beer;
        const nextBonus = gameState.beer + 1;
        buyBeer.textContent = `🍺 Bière pour Valou (+${nextBonus}% bois) - ${prices.beer} 🪵`;
    }
}

function updateWorkerCounts() {
    const ptitLuCount = document.getElementById('ptitLuCount');
    const mathieuCount = document.getElementById('mathieuCount');
    const vicoCount = document.getElementById('vicoCount');
    
    if (ptitLuCount) ptitLuCount.textContent = gameState.workers.ptitLu;
    if (mathieuCount) mathieuCount.textContent = gameState.workers.mathieu;
    if (vicoCount) vicoCount.textContent = gameState.workers.vico;
}

function updateStats() {
    const totalTreesElement = document.getElementById('totalTrees');
    const totalWoodElement = document.getElementById('totalWood');
    const totalBeersElement = document.getElementById('totalBeers');
    const totalClicksElement = document.getElementById('totalClicks');
    const workersHiredElement = document.getElementById('workersHired');
    
    if (totalTreesElement) totalTreesElement.textContent = gameState.stats.totalTreesChopped;
    if (totalWoodElement) totalWoodElement.textContent = gameState.stats.totalWoodGained;
    if (totalBeersElement) totalBeersElement.textContent = gameState.stats.totalBeersConsumed;
    if (totalClicksElement) totalClicksElement.textContent = gameState.stats.totalClicks;
    if (workersHiredElement) workersHiredElement.textContent = gameState.stats.workersHired;
}

function updateValouHappiness() {
    const happinessPercentage = Math.min((gameState.beer / DIFFICULTY_CONFIG.beer.targetBeers) * 100, 100);
    const happinessFill = document.querySelector('.happiness-fill');
    const happinessText = document.querySelector('.happiness-text');
    
    if (happinessFill) happinessFill.style.width = `${happinessPercentage}%`;
    if (happinessText) happinessText.textContent = `${gameState.beer}/${DIFFICULTY_CONFIG.beer.targetBeers} 🍺`;
    
    const valouFace = document.querySelector('.valou-face');
    if (valouFace) {
        if (gameState.beer >= DIFFICULTY_CONFIG.beer.targetBeers) {
            valouFace.textContent = '🤩';
        } else if (gameState.beer >= 200) {
            valouFace.textContent = '😍';
        } else if (gameState.beer >= 50) {
            valouFace.textContent = '😊';
        } else if (gameState.beer >= 10) {
            valouFace.textContent = '🙂';
        } else {
            valouFace.textContent = '😐';
        }
    }
}

function workerChop(workerType) {
    const damage = workerEfficiency[workerType];
    gameState.treeHP -= damage;
    
    if (Math.random() < 0.3) {
        createFallingParticles();
    }
    
    processTreeDamage();
    updateUI();
}

function createWorkerInterval(workerType) {
    if (workerIntervals[workerType]) {
        clearInterval(workerIntervals[workerType]);
    }
    
    if (gameState.workers[workerType] > 0) {
        workerIntervals[workerType] = setInterval(() => {
            if (gameState.workers[workerType] > 0) {
                const totalDamage = workerEfficiency[workerType] * gameState.workers[workerType];
                gameState.treeHP -= totalDamage;
                
                if (Math.random() < 0.3) {
                    createFallingParticles();
                }
                
                processTreeDamage();
                updateUI();
            }
        }, workerSpeed[workerType]);
    }
}

function startWorkerLoop() {
    Object.keys(gameState.workers).forEach(workerType => {
        createWorkerInterval(workerType);
    });
}

function bindEvents() {
    console.log('Binding events...');
    
    const mainTree = document.getElementById('mainTree');
    console.log('Main tree element:', mainTree);
    
    if (mainTree) {
        mainTree.addEventListener('click', function(e) {
            console.log('Tree clicked!');
            e.preventDefault();
            e.stopPropagation();
            chopTree();
        });
        
        mainTree.addEventListener('touchstart', function(e) {
            console.log('Tree touched!');
            e.preventDefault();
            chopTree();
        });
        
        console.log('Tree events bound successfully');
    } else {
        console.error('Could not find main tree element!');
    }
    
    const upgradeAxeBtn = document.getElementById('upgradeAxe');
    if (upgradeAxeBtn) upgradeAxeBtn.addEventListener('click', () => upgradeAxe());
    
    const buyPtitLuBtn = document.getElementById('buyPtitLu');
    if (buyPtitLuBtn) buyPtitLuBtn.addEventListener('click', () => buyWorker('ptitLu'));
    
    const buyMathieuBtn = document.getElementById('buyMathieu');
    if (buyMathieuBtn) buyMathieuBtn.addEventListener('click', () => buyWorker('mathieu'));
    
    const buyVicoBtn = document.getElementById('buyVico');
    if (buyVicoBtn) buyVicoBtn.addEventListener('click', () => buyWorker('vico'));
    
    const buyBeerBtn = document.getElementById('buyBeer');
    if (buyBeerBtn) buyBeerBtn.addEventListener('click', () => purchaseBeer());
}

function initGame() {
    console.log('Initializing game...');
    
    bindEvents();
    updateUI();
    startWorkerLoop();
    respawnTree();
    
    setInterval(updateSpeedDisplays, 1);
    setInterval(updateUI, 50);
    
    console.log('Game initialized!');
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, starting game...');
    initGame();
});

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('Document already ready, starting game immediately...');
    initGame();
}

console.log('Script loaded successfully');

function startGame() {
    const playerNameInput = document.getElementById('playerName');
    const playerName = playerNameInput.value.trim();
    const skipTutorial = document.getElementById('skipTutorial').checked;
    
    if (!playerName) {
        alert('Tu dois entrer ton nom, brave bûcheron !');
        return;
    }
    
    if (playerName.length < 2) {
        alert('Ton nom doit faire au moins 2 caractères !');
        return;
    }
    
    gameState.playerName = playerName;
    gameState.gameStartTime = Date.now();
    gameState.tutorial.enabled = !skipTutorial;
    
    document.getElementById('welcomeModal').style.display = 'none';
    document.querySelector('.game-container').style.display = 'flex';
    
    startGameTimer();
    
    if (gameState.tutorial.enabled) {
        setTimeout(() => showTutorialStep('start'), 500);
    }
    
    console.log('Game started for player:', playerName);
}

function startGameTimer() {
    setInterval(() => {
        if (gameState.gameStartTime) {
            const elapsed = Date.now() - gameState.gameStartTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            document.getElementById('gameTime').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

function showEndScreen() {
    const elapsed = Date.now() - gameState.gameStartTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    const woodPerMinute = elapsed > 0 ? Math.round((gameState.stats.totalWoodGained / elapsed) * 60000) : 0;
    
    saveGameResults(elapsed, woodPerMinute);
    
    document.querySelector('.game-container').style.display = 'none';
    
    const endModal = document.createElement('div');
    endModal.className = 'modal-overlay';
    endModal.innerHTML = `
        <div class="modal end-screen">
            <h2>🎉 GG mon reuf ! 🎉</h2>
            <p>Tu as réussi à faire boire Valou comme un chef ! 🍺</p>
            <p class="beer-emoji">🍺</p>
            <p><strong>C'est la valoute !</strong></p>
            
            <div class="stats-table">
                <h3>📊 Ton tableau de bord de BG</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">⏱️</div>
                        <div class="stat-value">${minutes}m ${seconds}s</div>
                        <div class="stat-label">Temps de jeu</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🌳</div>
                        <div class="stat-value">${gameState.stats.totalTreesChopped}</div>
                        <div class="stat-label">Arbres massacrés</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🪵</div>
                        <div class="stat-value">${gameState.stats.totalWoodGained}</div>
                        <div class="stat-label">Bois récupéré</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🍺</div>
                        <div class="stat-value">${gameState.stats.totalBeersConsumed}</div>
                        <div class="stat-label">Bières pour Valou</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">👆</div>
                        <div class="stat-value">${gameState.stats.totalClicks}</div>
                        <div class="stat-label">Clics de warrior</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">👥</div>
                        <div class="stat-value">${gameState.stats.workersHired}</div>
                        <div class="stat-label">Potes embauchés</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🪓</div>
                        <div class="stat-value">${gameState.axeLevel}</div>
                        <div class="stat-label">Niveau de hache</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">⚡</div>
                        <div class="stat-value">${woodPerMinute}</div>
                        <div class="stat-label">Bois/min (efficacité)</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🏆</div>
                        <div class="stat-value">${gameState.beer >= 420 ? 'LÉGENDE' : 'CHAMPION'}</div>
                        <div class="stat-label">Statut final</div>
                    </div>
                </div>
            </div>
            
            <div class="social-share">
                <div class="share-buttons">
                    <button class="share-btn-main" onclick="shareResults()">Partager mon score !</button>
                    <button class="restart-btn" onclick="restartGame()">Recommencer une partie</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(endModal);
}

function saveGameResults(gameTimeMs, woodPerMinute) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR');
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const uniquePlayerName = `${gameState.playerName}_${dateStr.replace(/\//g, '-')}_${timeStr.replace(/:/g, 'h')}`;
    
    const gameResult = {
        playerInfo: {
            originalName: gameState.playerName,
            uniqueName: uniquePlayerName,
            gameDate: now.toISOString(),
            gameStartTime: new Date(gameState.gameStartTime).toISOString()
        },
        gameStats: {
            totalGameTime: {
                milliseconds: gameTimeMs,
                minutes: Math.floor(gameTimeMs / 60000),
                seconds: Math.floor((gameTimeMs % 60000) / 1000),
                formatted: `${Math.floor(gameTimeMs / 60000)}:${Math.floor((gameTimeMs % 60000) / 1000).toString().padStart(2, '0')}`
            },
            resources: {
                finalWood: gameState.wood,
                finalBeers: gameState.beer,
                totalWoodGained: gameState.stats.totalWoodGained,
                totalBeersConsumed: gameState.stats.totalBeersConsumed,
                woodPerMinute: woodPerMinute
            },
            actions: {
                totalClicks: gameState.stats.totalClicks,
                totalTreesChopped: gameState.stats.totalTreesChopped,
                workersHired: gameState.stats.workersHired
            },
            upgrades: {
                finalAxeLevel: gameState.axeLevel,
                workers: {
                    ptitLu: gameState.workers.ptitLu,
                    mathieu: gameState.workers.mathieu,
                    vico: gameState.workers.vico,
                    totalWorkers: gameState.workers.ptitLu + gameState.workers.mathieu + gameState.workers.vico
                }
            },
            efficiency: {
                woodPerMinute: woodPerMinute,
                clicksPerMinute: Math.round((gameState.stats.totalClicks / gameTimeMs) * 60000),
                treesPerMinute: Math.round((gameState.stats.totalTreesChopped / gameTimeMs) * 60000),
                beersPerMinute: Math.round((gameState.stats.totalBeersConsumed / gameTimeMs) * 60000),
                averageWoodPerTree: gameState.stats.totalTreesChopped > 0 ? (gameState.stats.totalWoodGained / gameState.stats.totalTreesChopped).toFixed(2) : 0,
                averageWoodPerClick: gameState.stats.totalClicks > 0 ? (gameState.stats.totalWoodGained / gameState.stats.totalClicks).toFixed(2) : 0
            },
            completion: {
                targetReached: gameState.beer >= 420,
                completionPercentage: Math.round((gameState.beer / 420) * 100),
                finalStatus: gameState.beer >= 420 ? 'LÉGENDE' : 'CHAMPION'
            },
            tutorial: {
                tutorialEnabled: gameState.tutorial.enabled,
                tutorialStepsShown: gameState.tutorial.shownSteps
            }
        }
    };
    
    downloadGameResult(gameResult, uniquePlayerName);
}

function downloadGameResult(gameResult, fileName) {
    const jsonString = JSON.stringify(gameResult, null, 2);
    
    fetch('save_game_result.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            fileName: `valouniversaire_${fileName}.json`,
            data: gameResult
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Résultats sauvegardés avec succès:', data.message);
        } else {
            console.error('Erreur lors de la sauvegarde:', data.error);
        }
    })
    .catch(error => {
        console.error('Erreur lors de l\'envoi:', error);
    });
    
    console.log('Résultats préparés pour sauvegarde:', gameResult);
}

function shareResults() {
    const statsTable = document.querySelector('.stats-table');
    if (!statsTable) {
        console.error('Stats table not found');
        return;
    }
    
    console.log('Capturing stats table...');
    captureStatsTable(statsTable).then(blob => {
        console.log('Image captured, attempting to share...');
        
        if (navigator.share) {
            const file = new File([blob], 'valouniversaire-stats.png', { type: 'image/png' });
            
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                navigator.share({
                    title: 'Mon score Valouniversaire !',
                    text: '🎉 J\'ai terminé le Valouniversaire ! 🍺',
                    files: [file]
                }).then(() => {
                    console.log('Partage réussi !');
                }).catch((error) => {
                    console.log('Erreur lors du partage fichier:', error);
                    shareImageAsDataUrl(blob);
                });
            } else {
                shareImageAsDataUrl(blob);
            }
        } else {
            console.log('API de partage non disponible');
            shareImageAsDataUrl(blob);
        }
    }).catch(error => {
        console.error('Erreur lors de la capture:', error);
        fallbackTextShare();
    });
}

function shareImageAsDataUrl(blob) {
    const reader = new FileReader();
    reader.onload = function() {
        const dataUrl = reader.result;
        
        if (navigator.share) {
            navigator.share({
                title: 'Mon score Valouniversaire !',
                text: '🎉 J\'ai terminé le Valouniversaire ! 🍺',
                url: dataUrl
            }).then(() => {
                console.log('Partage URL réussi !');
            }).catch((error) => {
                console.log('Erreur partage URL:', error);
                copyImageToClipboard(blob);
            });
        } else {
            copyImageToClipboard(blob);
        }
    };
    reader.readAsDataURL(blob);
}

function copyImageToClipboard(blob) {
    if (navigator.clipboard && window.ClipboardItem) {
        const item = new ClipboardItem({ 'image/png': blob });
        navigator.clipboard.write([item]).then(() => {
            alert('🎉 Image copiée ! Colle-la dans ton app de partage !');
        }).catch(() => {
            downloadImage(blob);
        });
    } else {
        downloadImage(blob);
    }
}

function captureStatsTable(element) {
    return new Promise((resolve, reject) => {
        try {
            // Get all stats cards with their actual content
            const statsCards = element.querySelectorAll('.stat-card');
            console.log('Found', statsCards.length, 'stat cards');
            
            if (statsCards.length === 0) {
                reject(new Error('No stat cards found'));
                return;
            }
            
            // Create canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set canvas size - INCREASED SIZE
            const padding = 50;
            const cardWidth = 220;
            const cardHeight = 140;
            const cardsPerRow = 3;
            const rows = Math.ceil(statsCards.length / cardsPerRow);
            
            canvas.width = cardsPerRow * cardWidth + (cardsPerRow + 1) * 40;
            canvas.height = 140 + rows * cardHeight + (rows + 1) * 40;
            
            // Fill background
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#2d4a2d');
            gradient.addColorStop(1, '#1a3a1a');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw border
            ctx.strokeStyle = '#ffd93d';
            ctx.lineWidth = 4;
            drawRoundRect(ctx, 10, 10, canvas.width - 20, canvas.height - 20, 15);
            ctx.stroke();
            
            // Draw title
            ctx.fillStyle = '#ffd93d';
            ctx.font = 'bold 28px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('📊 Tableau de bord final', canvas.width / 2, 60);
            
            // Draw each stat card
            statsCards.forEach((card, index) => {
                const row = Math.floor(index / cardsPerRow);
                const col = index % cardsPerRow;
                const x = 40 + col * (cardWidth + 40);
                const y = 110 + row * (cardHeight + 40);
                
                // Get card content
                const iconElement = card.querySelector('.stat-icon');
                const valueElement = card.querySelector('.stat-value');
                const labelElement = card.querySelector('.stat-label');
                
                if (!iconElement || !valueElement || !labelElement) {
                    console.warn('Missing elements in card', index);
                    return;
                }
                
                const icon = iconElement.textContent;
                const value = valueElement.textContent;
                const label = labelElement.textContent;
                
                console.log(`Card ${index}: ${icon} ${value} ${label}`);
                
                // Draw card background
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                drawRoundRect(ctx, x, y, cardWidth, cardHeight, 12);
                ctx.fill();
                
                // Draw card border
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 2;
                drawRoundRect(ctx, x, y, cardWidth, cardHeight, 12);
                ctx.stroke();
                
                // Draw icon
                ctx.font = '32px Arial';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#fff';
                ctx.fillText(icon, x + cardWidth/2, y + 45);
                
                // Draw value
                ctx.font = 'bold 22px Arial';
                ctx.fillStyle = '#ffd93d';
                ctx.fillText(value, x + cardWidth/2, y + 80);
                
                // Draw label
                ctx.font = '14px Arial';
                ctx.fillStyle = '#ccc';
                ctx.fillText(label.toUpperCase(), x + cardWidth/2, y + 105);
            });
            
            // Add watermark
            ctx.font = '18px Arial';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.textAlign = 'center';
            ctx.fillText('#Valouniversaire', canvas.width / 2, canvas.height - 25);
            
            // Convert to blob
            canvas.toBlob((blob) => {
                if (blob) {
                    console.log('Canvas converted to blob successfully');
                    resolve(blob);
                } else {
                    reject(new Error('Failed to convert canvas to blob'));
                }
            }, 'image/png', 0.9);
            
        } catch (error) {
            console.error('Error in captureStatsTable:', error);
            reject(error);
        }
    });
}

function drawRoundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

function downloadImage(blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'valouniversaire-stats.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('🎉 Ton tableau de stats a été téléchargé ! Partage-le où tu veux !');
}

function fallbackTextShare() {
    const elapsed = Date.now() - gameState.gameStartTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    const totalDamageDealt = gameState.stats.totalClicks * gameState.axeLevel + 
        (gameState.workers.ptitLu * 0.5 + gameState.workers.mathieu * 2 + gameState.workers.vico * 5) * (elapsed / 1000);
    
    const shareText = `🎉 J'ai terminé le Valouniversaire ! 🎉\n🍺 420 bières pour Valou en ${timeText} !\n🌳 ${gameState.stats.totalTreesChopped} arbres coupés\n🪵 ${gameState.stats.totalWoodGained} bois récoltés\n👆 ${gameState.stats.totalClicks} clics\n👷 ${gameState.stats.workersHired} workers embauchés\n⚔️ ${Math.floor(totalDamageDealt)} dégâts infligés\n\n#Valouniversaire #Achievement`;
    
    fallbackShare(shareText);
}

function fallbackShare(text) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            alert('🎉 Ton score a été copié ! Colle-le où tu veux pour le partager !');
        }).catch(() => {
            promptFallback(text);
        });
    } else {
        promptFallback(text);
    }
}

function promptFallback(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
        document.execCommand('copy');
        alert('🎉 Ton score a été copié ! Colle-le où tu veux pour le partager !');
    } catch (err) {
        prompt('📋 Copie ce texte pour partager ton score :', text);
    }
    
    document.body.removeChild(textArea);
}

function restartGame() {
    const playerName = gameState.playerName;
    
    gameState = {
        wood: 0,
        beer: 0,
        currentTool: 'manual',
        treeHP: 10,
        maxTreeHP: 10,
        axeLevel: 1,
        workers: {
            ptitLu: 0,
            mathieu: 0,
            vico: 0
        },
        stats: {
            totalTreesChopped: 0,
            totalWoodGained: 0,
            totalBeersConsumed: 0,
            totalClicks: 0,
            workersHired: 0,
            lastClickTime: Date.now(),
            clicksInLastSecond: 0,
            recentClicks: [],
            woodPerSecond: 0,
            woodGainHistory: []
        },
        playerName: playerName,
        gameStartTime: Date.now(),
        tutorial: {
            enabled: false,
            shownSteps: {
                start: false,
                beer: false,
                axe: false,
                workers: false
            }
        }
    };
    
    document.querySelector('.modal-overlay:last-child').remove();
    document.querySelector('.game-container').style.display = 'flex';
    
    updateUI();
    updateStats();
    respawnTree();
    updateTreeHP();
}

function showTutorialStep(step) {
    if (!gameState.tutorial.enabled || gameState.tutorial.shownSteps[step]) {
        return;
    }
    
    gameState.tutorial.shownSteps[step] = true;
    
    const tutorials = {
        start: {
            title: ' Premier contact !',
            text: 'Clique sur l\'arbre 🌳 pour le couper et récupérer du bois ! Plus tu cliques, plus tu deviens fort ! '
        },
        beer: {
            title: ' Première bière !',
            text: 'Bravo ! Tu peux maintenant acheter une bière pour Valou ! Chaque bière augmente tes gains de bois ! '
        },
        axe: {
            title: ' Upgrade time !',
            text: 'Tu peux améliorer ta hache ! Plus elle est forte, plus tu fais de dégâts par clic ! '
        },
        workers: {
            title: ' Recrute tes potes !',
            text: 'Embauche des copains pour t\'aider ! PtitLu est pas ouf, Mathieu est solide, Vico est une légende ! '
        }
    };
    
    const tutorial = tutorials[step];
    if (!tutorial) return;
    
    const modal = document.createElement('div');
    modal.className = 'tutorial-modal';
    modal.innerHTML = `
        <div class="tutorial-content">
            <h3>${tutorial.title}</h3>
            <p>${tutorial.text}</p>
            <button class="tutorial-btn" onclick="closeTutorial(this)">Compris ! 👍</button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeTutorial(button) {
    const modal = button.closest('.tutorial-modal');
    if (modal) {
        modal.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }
}

function checkTutorialTriggers() {
    if (!gameState.tutorial.enabled) return;
    
    if (gameState.wood >= 4 && !gameState.tutorial.shownSteps.beer) {
        showTutorialStep('beer');
    } else if (gameState.wood >= 15 && !gameState.tutorial.shownSteps.axe) {
        showTutorialStep('axe');
    } else if (gameState.wood >= 25 && !gameState.tutorial.shownSteps.workers) {
        showTutorialStep('workers');
    }
} 