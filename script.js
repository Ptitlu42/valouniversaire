console.log('Script loading...');

let gameState = {
    wood: 0,
    beer: 0,
    currentTool: 'manual',
    treeHP: 10,
    maxTreeHP: 10,
    workers: {
        manual: 0,
        axe: 0,
        chainsaw: 0
    },
    tools: {
        axe: false,
        chainsaw: false
    },
    stats: {
        totalTreesChopped: 0,
        totalWoodGained: 0,
        totalBeersConsumed: 0,
        totalClicks: 0,
        workersHired: 0
    },
    playerName: '',
    gameStartTime: null
};

const basePrices = {
    axe: 10,
    chainsaw: 50,
    manualWorker: 25,
    axeWorker: 100,
    chainsawWorker: 300,
    beer: 4
};

function calculatePrice(basePrice, quantity, type = 'worker') {
    if (type === 'tool') return basePrice;
    if (type === 'beer') {
        return Math.floor(basePrice * Math.pow(1.1, quantity));
    }
    return Math.floor(basePrice * Math.pow(1.15, quantity));
}

function getCurrentPrices() {
    return {
        axe: basePrices.axe,
        chainsaw: basePrices.chainsaw,
        manualWorker: calculatePrice(basePrices.manualWorker, gameState.workers.manual, 'worker'),
        axeWorker: calculatePrice(basePrices.axeWorker, gameState.workers.axe, 'worker'),
        chainsawWorker: calculatePrice(basePrices.chainsawWorker, gameState.workers.chainsaw, 'worker'),
        beer: calculatePrice(basePrices.beer, gameState.beer, 'beer')
    };
}

const toolEfficiency = {
    manual: 1,
    axe: 2,
    chainsaw: 4
};

const workerSpeed = {
    manual: 800,
    axe: 500,
    chainsaw: 300
};

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

function chopTree() {
    console.log('Tree chopped!');
    const damage = toolEfficiency[gameState.currentTool];
    gameState.treeHP -= damage;
    gameState.stats.totalClicks++;
    
    const mainTree = document.getElementById('mainTree');
    if (mainTree) {
        mainTree.classList.add('chopping');
        setTimeout(() => {
            mainTree.classList.remove('chopping');
        }, 250);
    }
    
    createFallingParticles();
    showFloatingText(`-${damage}`, '#ff4757');
    updateTreeHP();

    if (gameState.treeHP <= 0) {
        harvestTree();
    }
    updateUI();
}

function harvestTree() {
    const woodGained = Math.floor(Math.random() * 3) + 2;
    gameState.wood += woodGained;
    gameState.stats.totalTreesChopped++;
    gameState.stats.totalWoodGained += woodGained;
    showFloatingText(`+${woodGained} 🪵`, '#66bb6a');
    respawnTree();
    updateUI();
}

function respawnTree() {
    gameState.maxTreeHP = Math.floor(Math.random() * 8) + 5;
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

function buyTool(tool) {
    const prices = getCurrentPrices();
    if (gameState.wood >= prices[tool] && !gameState.tools[tool]) {
        gameState.wood -= prices[tool];
        gameState.tools[tool] = true;
        gameState.currentTool = tool;
        updateUI();
        showFloatingText(`🪓 ${tool === 'axe' ? 'Hache' : 'Tronçonneuse'} achetée !`, '#ffd93d');
    }
}

function buyWorker(workerType) {
    const prices = getCurrentPrices();
    const price = prices[workerType + 'Worker'];
    const canBuy = workerType === 'manual' || 
                  (workerType === 'axe' && gameState.tools.axe) ||
                  (workerType === 'chainsaw' && gameState.tools.chainsaw);

    if (gameState.wood >= price && canBuy) {
        gameState.wood -= price;
        gameState.workers[workerType]++;
        gameState.stats.workersHired++;
        updateUI();
        showFloatingText(`👷 Bûcheron ${workerType} embauché !`, '#ffd93d');
    }
}

function purchaseBeer() {
    const prices = getCurrentPrices();
    if (gameState.wood >= prices.beer) {
        gameState.wood -= prices.beer;
        gameState.beer++;
        gameState.stats.totalBeersConsumed++;
        updateUI();
        showFloatingText('🍺 Bière achetée !', '#ffd93d');
        
        if (gameState.beer >= 420) {
            setTimeout(() => {
                showEndScreen();
            }, 1000);
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
    const buyAxe = document.getElementById('buyAxe');
    const buyChainsaw = document.getElementById('buyChainsaw');
    const buyManualWorker = document.getElementById('buyManualWorker');
    const buyAxeWorker = document.getElementById('buyAxeWorker');
    const buyChainsawWorker = document.getElementById('buyChainsawWorker');
    const buyBeer = document.getElementById('buyBeer');

    if (buyAxe) {
        buyAxe.disabled = gameState.wood < prices.axe || gameState.tools.axe;
        if (gameState.tools.axe) {
            buyAxe.textContent = '🪓 Hache - Acheté ✓';
        } else {
            buyAxe.textContent = `🪓 Hache - ${prices.axe} 🪵`;
        }
    }
    
    if (buyChainsaw) {
        buyChainsaw.disabled = gameState.wood < prices.chainsaw || !gameState.tools.axe || gameState.tools.chainsaw;
        if (gameState.tools.chainsaw) {
            buyChainsaw.textContent = '🔧 Tronçonneuse - Acheté ✓';
        } else {
            buyChainsaw.textContent = `🔧 Tronçonneuse - ${prices.chainsaw} 🪵`;
        }
    }
    
    if (buyManualWorker) {
        buyManualWorker.disabled = gameState.wood < prices.manualWorker;
        buyManualWorker.textContent = `👷 Bûcheron manuel - ${prices.manualWorker} 🪵`;
    }
    
    if (buyAxeWorker) {
        buyAxeWorker.disabled = gameState.wood < prices.axeWorker || !gameState.tools.axe;
        buyAxeWorker.textContent = `🪓👷 Bûcheron hache - ${prices.axeWorker} 🪵`;
    }
    
    if (buyChainsawWorker) {
        buyChainsawWorker.disabled = gameState.wood < prices.chainsawWorker || !gameState.tools.chainsaw;
        buyChainsawWorker.textContent = `🔧👷 Bûcheron tronçonneuse - ${prices.chainsawWorker} 🪵`;
    }
    
    if (buyBeer) {
        buyBeer.disabled = gameState.wood < prices.beer;
        buyBeer.textContent = `🍺 Bière - ${prices.beer} 🪵`;
    }
}

function updateWorkerCounts() {
    const manualWorkerCount = document.getElementById('manualWorkerCount');
    const axeWorkerCount = document.getElementById('axeWorkerCount');
    const chainsawWorkerCount = document.getElementById('chainsawWorkerCount');
    
    if (manualWorkerCount) manualWorkerCount.textContent = gameState.workers.manual;
    if (axeWorkerCount) axeWorkerCount.textContent = gameState.workers.axe;
    if (chainsawWorkerCount) chainsawWorkerCount.textContent = gameState.workers.chainsaw;
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
    const happinessPercentage = Math.min((gameState.beer / 420) * 100, 100);
    const happinessFill = document.querySelector('.happiness-fill');
    const happinessText = document.querySelector('.happiness-text');
    
    if (happinessFill) happinessFill.style.width = `${happinessPercentage}%`;
    if (happinessText) happinessText.textContent = `${gameState.beer}/420 🍺`;
    
    const valouFace = document.querySelector('.valou-face');
    if (valouFace) {
        if (gameState.beer >= 420) {
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
    const damage = toolEfficiency[workerType] * gameState.workers[workerType];
    gameState.treeHP -= damage;
    
    if (Math.random() < 0.3) {
        createFallingParticles();
    }
    
    updateTreeHP();

    if (gameState.treeHP <= 0) {
        harvestTree();
    }
}

function createWorkerInterval(workerType) {
    if (workerIntervals[workerType]) {
        clearInterval(workerIntervals[workerType]);
    }
    
    workerIntervals[workerType] = setInterval(() => {
        if (gameState.workers[workerType] > 0) {
            workerChop(workerType);
        }
    }, workerSpeed[workerType]);
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
    
    const buyAxe = document.getElementById('buyAxe');
    if (buyAxe) buyAxe.addEventListener('click', () => buyTool('axe'));
    
    const buyChainsaw = document.getElementById('buyChainsaw');
    if (buyChainsaw) buyChainsaw.addEventListener('click', () => buyTool('chainsaw'));
    
    const buyManualWorker = document.getElementById('buyManualWorker');
    if (buyManualWorker) buyManualWorker.addEventListener('click', () => buyWorker('manual'));
    
    const buyAxeWorker = document.getElementById('buyAxeWorker');
    if (buyAxeWorker) buyAxeWorker.addEventListener('click', () => buyWorker('axe'));
    
    const buyChainsawWorker = document.getElementById('buyChainsawWorker');
    if (buyChainsawWorker) buyChainsawWorker.addEventListener('click', () => buyWorker('chainsaw'));
    
    const buyBeerBtn = document.getElementById('buyBeer');
    if (buyBeerBtn) buyBeerBtn.addEventListener('click', () => purchaseBeer());
}

function initGame() {
    console.log('Initializing game...');
    
    bindEvents();
    updateUI();
    startWorkerLoop();
    respawnTree();
    
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
    
    document.getElementById('displayPlayerName').textContent = playerName;
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
        tools: {
            axe: 0,
            chainsaw: 0
        },
        workers: {
            manual: 0,
            axe: 0,
            chainsaw: 0
        },
        stats: {
            totalTrees: 0,
            totalWood: 0,
            totalBeers: 0,
            totalClicks: 0,
            workersHired: 0
        },
        playerName: playerName,
        gameStartTime: Date.now()
    };
    
    document.querySelector('.modal-overlay:last-child').remove();
    document.querySelector('.game-container').style.display = 'flex';
    
    updateDisplay();
    updateStats();
    currentTree.hp = 10;
    updateTreeHP();
} 