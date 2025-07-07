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
        upgrade: 1.2,
        worker: 1.025,
        beer: 1.025
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
        ptitLu: 400,
        mathieu: 400,
        vico: 400
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
    gameStartTime: null
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

function upgradeAxe() {
    const prices = getCurrentPrices();
    if (gameState.wood >= prices.axeUpgrade) {
        gameState.wood -= prices.axeUpgrade;
        gameState.axeLevel++;
        updateUI();
        showFloatingText(`🪓 Hache niveau ${gameState.axeLevel} !`, '#ffd93d');
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
        const names = {
            ptitLu: 'Ptit Lu',
            mathieu: 'Mathieu', 
            vico: 'Vico'
        };
        showFloatingText(`${names[workerType]} embauché !`, '#ffd93d');
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
        showFloatingText('🍺 Bière achetée !', '#ffd93d');
        
        if (gameState.beer >= DIFFICULTY_CONFIG.beer.targetBeers) {
            setTimeout(() => {
                showEndScreen();
            }, 2500);
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
        upgradeAxe.textContent = `🪓 Améliorer ma hache (niv.${gameState.axeLevel}) - ${prices.axeUpgrade} 🪵`;
    }
    
    if (buyPtitLu) {
        buyPtitLu.disabled = gameState.wood < prices.ptitLu;
        buyPtitLu.textContent = `😴 Ptit Lu (nul) - ${prices.ptitLu} 🪵`;
    }
    
    if (buyMathieu) {
        buyMathieu.disabled = gameState.wood < prices.mathieu;
        buyMathieu.textContent = `😐 Mathieu (moyen) - ${prices.mathieu} 🪵`;
    }
    
    if (buyVico) {
        buyVico.disabled = gameState.wood < prices.vico;
        buyVico.textContent = `💪 Vico (fort) - ${prices.vico} 🪵`;
    }
    
    if (buyBeer) {
        buyBeer.disabled = gameState.wood < prices.beer;
        const currentBonus = gameState.beer;
        const nextBonus = gameState.beer + 1;
        buyBeer.textContent = `🍺 Bière (+${nextBonus}% bois) - ${prices.beer} 🪵`;
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

function showFloatingText(text, color) {
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
    
    document.getElementById('welcomeModal').style.display = 'none';
    document.querySelector('.game-container').style.display = 'flex';
    
    startGameTimer();
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
    
    document.querySelector('.game-container').style.display = 'none';
    
    const endModal = document.createElement('div');
    endModal.className = 'modal-overlay';
    endModal.innerHTML = `
        <div class="modal end-screen">
            <h1>C'est la valoute !</h1>
            <p>🎉 Félicitations ${gameState.playerName} ! 🎉<br>
            Tu as réussi à faire boire 420 bières à Valou !<br><br>
            🎯 Mission accomplie en ${timeText} ! 🎯</p>
            <div class="time">⏱️ Temps de jeu : ${timeText}</div>
            <button onclick="restartGame()">RECOMMENCER L'AVENTURE !</button>
        </div>
    `;
    
    document.body.appendChild(endModal);
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
        gameStartTime: Date.now()
    };
    
    document.querySelector('.modal-overlay:last-child').remove();
    document.querySelector('.game-container').style.display = 'flex';
    
    updateUI();
    updateStats();
    respawnTree();
    updateTreeHP();
} 