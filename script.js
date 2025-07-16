console.log('Script loading...');

let DIFFICULTY_CONFIG = null;
let toolEfficiency = null;
let workerEfficiency = null;
let workerSpeed = null;
let achievements = null;
let prestigeConfig = null;
let autoUpgrades = null;

async function loadGameConfig() {
    try {
        const response = await fetch('get_config.php');
        const data = await response.json();
        
        if (data.success) {
            DIFFICULTY_CONFIG = data.config;
            console.log('Configuration loaded successfully');
            
            toolEfficiency = DIFFICULTY_CONFIG.toolEfficiency;
            workerEfficiency = DIFFICULTY_CONFIG.workerEfficiency;
            workerSpeed = DIFFICULTY_CONFIG.workerSpeed;
            achievements = DIFFICULTY_CONFIG.achievements;
            prestigeConfig = DIFFICULTY_CONFIG.prestige;
            autoUpgrades = DIFFICULTY_CONFIG.autoUpgrades;
            
            return true;
        } else {
            console.error('Failed to load configuration:', data.message);
            return false;
        }
    } catch (error) {
        console.error('Error loading configuration:', error);
        return false;
    }
}

let gameState = {
    wood: 0,
    beer: 0,
    prestigePoints: 0,
    currentTool: 'manual',
    treeHP: 10,
    maxTreeHP: 10,
    axeLevel: 1,
    workers: {
        ptitLu: 0,
        mathieu: 0,
        vico: 0
    },
    upgrades: {
        autoClicker: 0,
        lumberjackSchool: 0,
        breweryBonus: 0,
        goldenAxe: 0
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
        woodGainHistory: [],
        criticalHits: 0,
        achievementsUnlocked: [],
        prestigeCount: 0
    },
    playerName: '',
    gameStartTime: null,
    tutorial: {
        enabled: true,
        shownSteps: {
            start: false,
            beer: false,
            axe: false,
            workers: false,
            achievements: false,
            prestige: false
        }
    },
    autoClickerActive: false,
    particles: []
};

let autoClickerInterval = null;
let particleAnimationFrame = null;

function calculatePrice(basePrice, quantity, type = 'worker') {
    if (!DIFFICULTY_CONFIG) return basePrice;
    
    if (type === 'upgrade') {
        return Math.floor(basePrice * Math.pow(DIFFICULTY_CONFIG.priceMultipliers.upgrade, quantity - 1));
    }
    if (type === 'beer') {
        return Math.floor(basePrice * Math.pow(DIFFICULTY_CONFIG.priceMultipliers.beer, quantity));
    }
    
    if (DIFFICULTY_CONFIG.priceMultipliers[type]) {
        return Math.floor(basePrice * Math.pow(DIFFICULTY_CONFIG.priceMultipliers[type], quantity));
    }
    
    return basePrice;
}

function getCurrentPrices() {
    if (!DIFFICULTY_CONFIG) return {};
    
    return {
        axeUpgrade: calculatePrice(DIFFICULTY_CONFIG.prices.axeUpgrade, gameState.axeLevel, 'upgrade'),
        ptitLu: calculatePrice(DIFFICULTY_CONFIG.prices.ptitLu, gameState.workers.ptitLu, 'ptitLu'),
        mathieu: calculatePrice(DIFFICULTY_CONFIG.prices.mathieu, gameState.workers.mathieu, 'mathieu'),
        vico: calculatePrice(DIFFICULTY_CONFIG.prices.vico, gameState.workers.vico, 'vico'),
        beer: calculatePrice(DIFFICULTY_CONFIG.prices.beer, gameState.beer, 'beer'),
        autoClicker: calculatePrice(DIFFICULTY_CONFIG.prices.autoClicker, gameState.upgrades.autoClicker, 'autoClicker'),
        lumberjackSchool: calculatePrice(DIFFICULTY_CONFIG.prices.lumberjackSchool, gameState.upgrades.lumberjackSchool, 'lumberjackSchool'),
        breweryBonus: calculatePrice(DIFFICULTY_CONFIG.prices.breweryBonus, gameState.upgrades.breweryBonus, 'breweryBonus'),
        goldenAxe: calculatePrice(DIFFICULTY_CONFIG.prices.goldenAxe, gameState.upgrades.goldenAxe, 'goldenAxe'),
        prestige: DIFFICULTY_CONFIG.prices.prestige
    };
}

let workerIntervals = {};

function createAdvancedParticles(type = 'wood', count = 8) {
    const container = document.querySelector('.main-game');
    if (!container) return;
    
    const particleConfigs = {
        wood: { particles: ['🪵', '🍂', '🌿'], colors: ['#8B4513', '#228B22', '#32CD32'] },
        crit: { particles: ['💥', '⚡', '🔥'], colors: ['#FFD700', '#FF4500', '#FF6347'] },
        beer: { particles: ['🍺', '🥂', '✨'], colors: ['#FFD700', '#FFA500', '#FFFF00'] },
        achievement: { particles: ['🏆', '⭐', '🎉'], colors: ['#FFD700', '#FF69B4', '#00FA9A'] }
    };
    
    const config = particleConfigs[type] || particleConfigs.wood;
    
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = `falling-particle ${type}-particle`;
        particle.textContent = config.particles[Math.floor(Math.random() * config.particles.length)];
        
        const startX = (Math.random() - 0.5) * 400;
        const startY = (Math.random() - 0.5) * 100;
        const rotation = Math.random() * 720 - 360;
        const scale = 0.8 + Math.random() * 0.8;
        const color = config.colors[Math.floor(Math.random() * config.colors.length)];
        
        particle.style.cssText = `
            left: calc(50% + ${startX}px);
            top: calc(50% + ${startY}px);
            font-size: ${1.5 * scale}rem;
            color: ${color};
            animation: advancedFall ${2 + Math.random()}s ease-in forwards;
            animation-delay: ${i * 0.05}s;
            transform: rotate(${rotation}deg) scale(${scale});
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
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

function showEnhancedAnimation(type, text) {
    const animations = {
        beer: () => showBeerAnimation(text),
        achievement: () => showAchievementAnimation(text),
        prestige: () => showPrestigeAnimation(text),
        upgrade: () => showUpgradeAnimation(text, '#ffd93d')
    };
    
    if (animations[type]) {
        animations[type]();
    }
}

function showBeerAnimation(text = 'APEROOOO!') {
    const animation = document.createElement('div');
    animation.className = 'beer-celebration';
    animation.textContent = text;
    
    const isMobile = window.innerWidth <= 768;
    const fontSize = isMobile ? '3rem' : '6rem';
    animation.style.fontSize = fontSize;
    
    document.body.appendChild(animation);
    
    for (let i = 0; i < 12; i++) {
        setTimeout(() => {
            const bubble = document.createElement('div');
            bubble.className = 'beer-bubble';
            bubble.textContent = ['🍺', '🥂', '🍻', '🧡'][Math.floor(Math.random() * 4)];
            
            const angle = (i * 30) + Math.random() * 15;
            const distance = 150 + Math.random() * 100;
            const x = Math.cos(angle * Math.PI / 180) * distance;
            const y = Math.sin(angle * Math.PI / 180) * distance;
            
            bubble.style.left = `calc(50% + ${x}px)`;
            bubble.style.top = `calc(50% + ${y}px)`;
            
            document.body.appendChild(bubble);
            
            setTimeout(() => {
                if (bubble.parentNode) {
                    bubble.parentNode.removeChild(bubble);
                }
            }, 3000);
        }, i * 80);
    }
    
    setTimeout(() => {
        if (animation.parentNode) {
            animation.parentNode.removeChild(animation);
        }
    }, 3000);
}

function showAchievementAnimation(text) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
        <div class="achievement-icon">🏆</div>
        <div class="achievement-text">
            <div class="achievement-title">ACHIEVEMENT DÉBLOQUÉ !</div>
            <div class="achievement-desc">${text}</div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 4000);
}

function showPrestigeAnimation(text) {
    const animation = document.createElement('div');
    animation.className = 'prestige-animation';
    animation.textContent = text;
    
    document.body.appendChild(animation);
    
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            const star = document.createElement('div');
            star.className = 'prestige-star';
            star.textContent = '⭐';
            
            const angle = (i * 18) + Math.random() * 10;
            const distance = 200 + Math.random() * 150;
            const x = Math.cos(angle * Math.PI / 180) * distance;
            const y = Math.sin(angle * Math.PI / 180) * distance;
            
            star.style.left = `calc(50% + ${x}px)`;
            star.style.top = `calc(50% + ${y}px)`;
            
            document.body.appendChild(star);
            
            setTimeout(() => {
                if (star.parentNode) {
                    star.parentNode.removeChild(star);
                }
            }, 4000);
        }, i * 50);
    }
    
    setTimeout(() => {
        if (animation.parentNode) {
            animation.parentNode.removeChild(animation);
        }
    }, 4000);
}

function calculateCriticalHit() {
    let critChance = DIFFICULTY_CONFIG.tree.criticalChance;
    let critMultiplier = DIFFICULTY_CONFIG.tree.criticalMultiplier;
    
    if (gameState.upgrades.goldenAxe > 0) {
        critChance += autoUpgrades.goldenAxe.critChanceBonus * gameState.upgrades.goldenAxe;
        critMultiplier += autoUpgrades.goldenAxe.critMultiplierBonus * gameState.upgrades.goldenAxe;
    }
    
    if (Math.random() < critChance) {
        gameState.stats.criticalHits++;
        return {
            isCrit: true,
            multiplier: critMultiplier
        };
    }
    
    return { isCrit: false, multiplier: 1 };
}

function chopTree() {
    console.log('Tree chopped!');
    
    const crit = calculateCriticalHit();
    const baseDamage = gameState.axeLevel * (1 + gameState.prestigePoints * prestigeConfig.clickBonus);
    const damage = Math.floor(baseDamage * crit.multiplier);
    
    gameState.treeHP -= damage;
    gameState.stats.totalClicks++;
    gameState.stats.recentClicks.push(Date.now());
    
    const mainTree = document.getElementById('mainTree');
    const mainGame = document.querySelector('.main-game');
    
    if (mainTree) {
        mainTree.classList.add('chopping');
        if (crit.isCrit) {
            mainTree.classList.add('critical-hit');
        }
        setTimeout(() => {
            mainTree.classList.remove('chopping', 'critical-hit');
        }, 300);
    }
    
    if (mainGame) {
        mainGame.classList.add('chopping-cursor');
        setTimeout(() => {
            mainGame.classList.remove('chopping-cursor');
        }, 150);
    }
    
    if (crit.isCrit) {
        createAdvancedParticles('crit', 12);
        showFloatingText(`💥 CRITIQUE! -${damage}`, '#FFD700');
        screenShake(300);
    } else {
        createAdvancedParticles('wood', 6);
        showFloatingText(`-${damage}`, '#ff4757');
    }
    
    processTreeDamage();
    updateUI();
    checkAchievements();
}

function screenShake(duration = 300) {
    const gameContainer = document.querySelector('.game-container');
    if (gameContainer) {
        gameContainer.classList.add('screen-shake');
        setTimeout(() => {
            gameContainer.classList.remove('screen-shake');
        }, duration);
    }
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
    let beerBonus = 1 + (gameState.beer * DIFFICULTY_CONFIG.beer.bonusPerBeer);
    let prestigeBonus = 1 + (gameState.prestigePoints * prestigeConfig.woodBonus);
    
    if (gameState.upgrades.breweryBonus > 0) {
        beerBonus += autoUpgrades.breweryBonus.beerEfficiencyBonus * gameState.upgrades.breweryBonus;
    }
    
    const woodGained = Math.floor(baseWood * beerBonus * prestigeBonus);
    
    gameState.wood += woodGained;
    gameState.stats.totalTreesChopped++;
    gameState.stats.totalWoodGained += woodGained;
    trackWoodGain(woodGained);
    
    if (gameState.beer < DIFFICULTY_CONFIG.beer.targetBeers) {
        showFloatingText(`+${woodGained} 🪵`, '#66bb6a');
    }
    
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
        
        if (percentage > 60) {
            treeHpFill.style.background = 'linear-gradient(90deg, #66bb6a, #4caf50)';
        } else if (percentage > 30) {
            treeHpFill.style.background = 'linear-gradient(90deg, #ffa726, #ff9800)';
        } else {
            treeHpFill.style.background = 'linear-gradient(90deg, #ff4757, #f44336)';
        }
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
        animation: enhancedFloatUp 2s ease-out forwards;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    `;

    container.appendChild(element);
    
    setTimeout(() => {
        if (element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }, 2000);
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
        fontSize = '2rem';
        whiteSpace = 'normal';
        maxWidth = '85vw';
    } else if (isMobile) {
        fontSize = '2.5rem';
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
        animation: enhancedUpgradePopup 3s ease-out forwards;
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
    }, 3000);
}

function upgradeAxe() {
    const prices = getCurrentPrices();
    if (gameState.wood >= prices.axeUpgrade) {
        gameState.wood -= prices.axeUpgrade;
        gameState.axeLevel++;
        updateUI();
        
        const upgradeMessages = [
            '🪓 Hache améliorée ! Tu deviens redoutable !',
            '🪓 Nouvelle hache ! Les arbres tremblent !',
            '🪓 Upgrade réussi ! Ta puissance augmente !',
            '🪓 Hache de légende ! Vico serait fier !',
            '🪓 Niveau supérieur ! Tu maîtrises l\'art !'
        ];
        const randomMessage = upgradeMessages[Math.floor(Math.random() * upgradeMessages.length)];
        showUpgradeAnimation(randomMessage, '#ffd93d');
        createAdvancedParticles('achievement', 8);
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
            ptitLu: "+1 P'tit Lu ! (Il va faire de son mieux...)",
            mathieu: 'Un Mathieu rejoint l\'équipe ! (Solide recrue 👍)', 
            vico: 'UN VICO DE PLUS ! (Attention les arbres ! 🔥)'
        };
        showUpgradeAnimation(messages[workerType], '#ffd93d');
        checkAchievements();
    }
}

function buyUpgrade(upgradeType) {
    const prices = getCurrentPrices();
    const price = prices[upgradeType];
    
    if (gameState.wood >= price) {
        gameState.wood -= price;
        gameState.upgrades[upgradeType]++;
        
        const messages = {
            autoClicker: '🤖 Auto-Clicker activé ! La machine travaille !',
            lumberjackSchool: '🎓 École de bûcherons ! Tes workers sont plus forts !',
            breweryBonus: '🍺 Bonus brasserie ! Plus d\'efficacité bière !',
            goldenAxe: '✨ Hache dorée ! Critiques plus fréquents !'
        };
        
        if (upgradeType === 'autoClicker') {
            startAutoClicker();
        }
        
        showUpgradeAnimation(messages[upgradeType], '#FFD700');
        createAdvancedParticles('achievement', 10);
        updateUI();
    }
}

function startAutoClicker() {
    if (autoClickerInterval) clearInterval(autoClickerInterval);
    
    if (gameState.upgrades.autoClicker > 0) {
        gameState.autoClickerActive = true;
        autoClickerInterval = setInterval(() => {
            const damage = Math.floor(autoUpgrades.autoClicker.efficiency * gameState.upgrades.autoClicker);
            gameState.treeHP -= damage;
            
            if (Math.random() < 0.2) {
                createAdvancedParticles('wood', 3);
            }
            
            processTreeDamage();
            updateUI();
        }, autoUpgrades.autoClicker.speed);
    }
}

function purchaseBeer() {
    const prices = getCurrentPrices();
    if (gameState.wood >= prices.beer) {
        gameState.wood -= prices.beer;
        gameState.beer++;
        gameState.stats.totalBeersConsumed++;
        
        showBeerAnimation();
        createAdvancedParticles('beer', 10);
        updateUI();
        checkAchievements();
        
        if (gameState.beer >= DIFFICULTY_CONFIG.beer.targetBeers) {
            showEndScreen();
        }
    }
}

function checkAchievements() {
    if (!achievements) return;
    
    const achievementChecks = {
        firstClick: () => gameState.stats.totalClicks >= 1,
        firstBeer: () => gameState.stats.totalBeersConsumed >= 1,
        firstWorker: () => gameState.stats.workersHired >= 1,
        speedDemon: () => {
            const now = Date.now();
            const recent = gameState.stats.recentClicks.filter(time => now - time < 10000);
            return recent.length >= 100;
        },
        lumberjack: () => gameState.stats.totalTreesChopped >= 100,
        beerLover: () => gameState.stats.totalBeersConsumed >= 50,
        teamLeader: () => gameState.stats.workersHired >= 10,
        valouteMaster: () => gameState.beer >= DIFFICULTY_CONFIG.beer.targetBeers
    };
    
    Object.keys(achievementChecks).forEach(achievementKey => {
        if (!gameState.stats.achievementsUnlocked.includes(achievementKey) && achievementChecks[achievementKey]()) {
            unlockAchievement(achievementKey);
        }
    });
}

function unlockAchievement(achievementKey) {
    if (!achievements[achievementKey]) return;
    
    gameState.stats.achievementsUnlocked.push(achievementKey);
    const achievement = achievements[achievementKey];
    
    gameState.wood += achievement.reward;
    
    showAchievementAnimation(`${achievement.name}: ${achievement.desc} (+${achievement.reward} 🪵)`);
    createAdvancedParticles('achievement', 15);
    
    if (!gameState.tutorial.shownSteps.achievements) {
        setTimeout(() => showTutorialStep('achievements'), 1000);
    }
    
    console.log(`Achievement unlocked: ${achievement.name}`);
}

function canPrestige() {
    return gameState.beer >= DIFFICULTY_CONFIG.beer.prestigeBeers;
}

function doPrestige() {
    if (!canPrestige()) return;
    
    const prestigePointsGained = Math.floor(gameState.beer / 100);
    gameState.prestigePoints += prestigePointsGained;
    gameState.stats.prestigeCount++;
    
    gameState.wood = 0;
    gameState.beer = 0;
    gameState.axeLevel = 1;
    gameState.treeHP = 10;
    gameState.maxTreeHP = 10;
    gameState.workers = { ptitLu: 0, mathieu: 0, vico: 0 };
    gameState.upgrades = { autoClicker: 0, lumberjackSchool: 0, breweryBonus: 0, goldenAxe: 0 };
    gameState.autoClickerActive = false;
    
    if (autoClickerInterval) {
        clearInterval(autoClickerInterval);
        autoClickerInterval = null;
    }
    
    Object.keys(workerIntervals).forEach(key => {
        if (workerIntervals[key]) clearInterval(workerIntervals[key]);
    });
    workerIntervals = {};
    
    showPrestigeAnimation(`🌟 PRESTIGE! +${prestigePointsGained} Points de Prestige! 🌟`);
    
    if (!gameState.tutorial.shownSteps.prestige) {
        setTimeout(() => showTutorialStep('prestige'), 2000);
    }
    
    updateUI();
    respawnTree();
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
    updatePrestigeDisplay();
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
        upgradeAxe.textContent = `🪓 Améliorer hache (niv.${gameState.axeLevel}) - ${prices.axeUpgrade} 🪵`;
    }
    
    if (buyPtitLu) {
        buyPtitLu.disabled = gameState.wood < prices.ptitLu;
        buyPtitLu.textContent = `😴 P'tit Lu (faible) - ${prices.ptitLu} 🪵`;
    }
    
    if (buyMathieu) {
        buyMathieu.disabled = gameState.wood < prices.mathieu;
        buyMathieu.textContent = `😊 Mathieu (solide) - ${prices.mathieu} 🪵`;
    }
    
    if (buyVico) {
        buyVico.disabled = gameState.wood < prices.vico;
        buyVico.textContent = `💪 Vico (machine) - ${prices.vico} 🪵`;
    }
    
    if (buyBeer) {
        buyBeer.disabled = gameState.wood < prices.beer;
        const currentBonus = Math.round(gameState.beer * DIFFICULTY_CONFIG.beer.bonusPerBeer * 100);
        const nextBonus = Math.round((gameState.beer + 1) * DIFFICULTY_CONFIG.beer.bonusPerBeer * 100);
        buyBeer.textContent = `🍺 Bière (+${nextBonus}% bois) - ${prices.beer} 🪵`;
    }
    
    updateAdvancedShopButtons();
}

function updateAdvancedShopButtons() {
    const prices = getCurrentPrices();
    
    const upgradeButtons = {
        autoClicker: document.getElementById('buyAutoClicker'),
        lumberjackSchool: document.getElementById('buyLumberjackSchool'),
        breweryBonus: document.getElementById('buyBreweryBonus'),
        goldenAxe: document.getElementById('buyGoldenAxe')
    };
    
    const buttonTexts = {
        autoClicker: `🤖 Auto-Clicker (${gameState.upgrades.autoClicker}) - ${prices.autoClicker} 🪵`,
        lumberjackSchool: `🎓 École bûcherons (${gameState.upgrades.lumberjackSchool}) - ${prices.lumberjackSchool} 🪵`,
        breweryBonus: `🍺 Bonus brasserie (${gameState.upgrades.breweryBonus}) - ${prices.breweryBonus} 🪵`,
        goldenAxe: `✨ Hache dorée (${gameState.upgrades.goldenAxe}) - ${prices.goldenAxe} 🪵`
    };
    
    Object.keys(upgradeButtons).forEach(key => {
        const button = upgradeButtons[key];
        if (button) {
            button.disabled = gameState.wood < prices[key];
            button.textContent = buttonTexts[key];
        }
    });
    
    const prestigeButton = document.getElementById('prestigeButton');
    if (prestigeButton) {
        prestigeButton.disabled = !canPrestige();
        const prestigePoints = Math.floor(gameState.beer / 100);
        prestigeButton.textContent = `🌟 PRESTIGE (+${prestigePoints} PP) - ${DIFFICULTY_CONFIG.beer.prestigeBeers} 🍺`;
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
    const criticalHitsElement = document.getElementById('criticalHits');
    const achievementsCountElement = document.getElementById('achievementsCount');
    
    if (totalTreesElement) totalTreesElement.textContent = gameState.stats.totalTreesChopped;
    if (totalWoodElement) totalWoodElement.textContent = gameState.stats.totalWoodGained;
    if (totalBeersElement) totalBeersElement.textContent = gameState.stats.totalBeersConsumed;
    if (totalClicksElement) totalClicksElement.textContent = gameState.stats.totalClicks;
    if (workersHiredElement) workersHiredElement.textContent = gameState.stats.workersHired;
    if (criticalHitsElement) criticalHitsElement.textContent = gameState.stats.criticalHits;
    if (achievementsCountElement) achievementsCountElement.textContent = gameState.stats.achievementsUnlocked.length;
    
    const achievementsCountStatsElement = document.getElementById('achievementsCountStats');
    if (achievementsCountStatsElement) achievementsCountStatsElement.textContent = gameState.stats.achievementsUnlocked.length;
}

function updatePrestigeDisplay() {
    const prestigePointsElement = document.getElementById('prestigePoints');
    const prestigeCountElement = document.getElementById('prestigeCount');
    const prestigePointsInvElement = document.getElementById('prestigePointsInv');
    const autoClickerStatusElement = document.getElementById('autoClickerStatus');
    
    if (prestigePointsElement) prestigePointsElement.textContent = gameState.prestigePoints;
    if (prestigeCountElement) prestigeCountElement.textContent = gameState.stats.prestigeCount;
    if (prestigePointsInvElement) prestigePointsInvElement.textContent = gameState.prestigePoints;
    if (autoClickerStatusElement) {
        autoClickerStatusElement.textContent = gameState.autoClickerActive ? '✅' : '❌';
    }
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
        } else if (gameState.beer >= 300) {
            valouFace.textContent = '😍';
        } else if (gameState.beer >= 200) {
            valouFace.textContent = '😊';
        } else if (gameState.beer >= 100) {
            valouFace.textContent = '🙂';
        } else if (gameState.beer >= 50) {
            valouFace.textContent = '😐';
        } else {
            valouFace.textContent = '😕';
        }
    }
}

function workerChop(workerType) {
    let efficiency = workerEfficiency[workerType];
    
    if (gameState.upgrades.lumberjackSchool > 0) {
        efficiency *= (1 + autoUpgrades.lumberjackSchool.workerBonus * gameState.upgrades.lumberjackSchool);
    }
    
    const damage = Math.floor(efficiency * (1 + gameState.prestigePoints * prestigeConfig.clickBonus));
    gameState.treeHP -= damage;
    
    if (Math.random() < 0.3) {
        createAdvancedParticles('wood', 3);
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
                let totalEfficiency = workerEfficiency[workerType] * gameState.workers[workerType];
                
                if (gameState.upgrades.lumberjackSchool > 0) {
                    totalEfficiency *= (1 + autoUpgrades.lumberjackSchool.workerBonus * gameState.upgrades.lumberjackSchool);
                }
                
                const totalDamage = Math.floor(totalEfficiency * (1 + gameState.prestigePoints * prestigeConfig.clickBonus));
                gameState.treeHP -= totalDamage;
                
                if (Math.random() < 0.3) {
                    createAdvancedParticles('wood', 2);
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
    
    if (gameState.upgrades.autoClicker > 0) {
        startAutoClicker();
    }
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
    
    const buyAutoClickerBtn = document.getElementById('buyAutoClicker');
    if (buyAutoClickerBtn) buyAutoClickerBtn.addEventListener('click', () => buyUpgrade('autoClicker'));
    
    const buyLumberjackSchoolBtn = document.getElementById('buyLumberjackSchool');
    if (buyLumberjackSchoolBtn) buyLumberjackSchoolBtn.addEventListener('click', () => buyUpgrade('lumberjackSchool'));
    
    const buyBreweryBonusBtn = document.getElementById('buyBreweryBonus');
    if (buyBreweryBonusBtn) buyBreweryBonusBtn.addEventListener('click', () => buyUpgrade('breweryBonus'));
    
    const buyGoldenAxeBtn = document.getElementById('buyGoldenAxe');
    if (buyGoldenAxeBtn) buyGoldenAxeBtn.addEventListener('click', () => buyUpgrade('goldenAxe'));
    
    const prestigeBtn = document.getElementById('prestigeButton');
    if (prestigeBtn) prestigeBtn.addEventListener('click', () => doPrestige());
}

async function initGame() {
    console.log('Initializing game...');
    
    const configLoaded = await loadGameConfig();
    if (!configLoaded) {
        console.error('Failed to load game configuration');
        alert('Error while loading game configuration');
        return;
    }
    
    bindEvents();
    updateUI();
    startWorkerLoop();
    respawnTree();
    
    setInterval(updateSpeedDisplays, 1);
    setInterval(updateUI, 100);
    setInterval(checkAchievements, 500);
    
    console.log('Game initialized!');
}

document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM loaded, starting game...');
    await initGame();
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
            <h2>🎉 VALOUTE LÉGENDAIRE ! 🎉</h2>
            <p>Tu as réussi la quête ultime !</p>
            <p class="beer-emoji">🍺</p>
            <p><strong>FÉLICITATIONS CHAMPION !</strong></p>
            
            <div class="stats-table">
                <h3>📊 Tableau de bord final</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">⏱️</div>
                        <div class="stat-value">${minutes}m ${seconds}s</div>
                        <div class="stat-label">Temps total</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🌳</div>
                        <div class="stat-value">${gameState.stats.totalTreesChopped}</div>
                        <div class="stat-label">Arbres abattus</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🪵</div>
                        <div class="stat-value">${gameState.stats.totalWoodGained}</div>
                        <div class="stat-label">Bois collecté</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🍺</div>
                        <div class="stat-value">${gameState.stats.totalBeersConsumed}</div>
                        <div class="stat-label">Bières servies</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">👆</div>
                        <div class="stat-value">${gameState.stats.totalClicks}</div>
                        <div class="stat-label">Clics puissants</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">👥</div>
                        <div class="stat-value">${gameState.stats.workersHired}</div>
                        <div class="stat-label">Équipiers recrutés</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🪓</div>
                        <div class="stat-value">${gameState.axeLevel}</div>
                        <div class="stat-label">Niveau de hache</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">💥</div>
                        <div class="stat-value">${gameState.stats.criticalHits}</div>
                        <div class="stat-label">Coups critiques</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">⚡</div>
                        <div class="stat-value">${woodPerMinute}</div>
                        <div class="stat-label">Bois/min</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🏆</div>
                        <div class="stat-value">${gameState.stats.achievementsUnlocked.length}/8</div>
                        <div class="stat-label">Achievements</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🌟</div>
                        <div class="stat-value">${gameState.prestigePoints}</div>
                        <div class="stat-label">Points Prestige</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">👑</div>
                        <div class="stat-value">LÉGENDE</div>
                        <div class="stat-label">Statut final</div>
                    </div>
                </div>
            </div>
            
            <div class="social-share">
                <div class="share-buttons">
                    <button class="share-btn-main" onclick="shareResults()">📱 Partager mon score</button>
                    <button class="scores-btn-end" onclick="showScoresModal()">🏆 SCORES</button>
                    <button class="restart-btn" onclick="restartGame()">🔄 Recommencer</button>
                    ${canPrestige() ? '<button class="prestige-btn-end" onclick="doPrestige()">🌟 PRESTIGE</button>' : ''}
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
                workersHired: gameState.stats.workersHired,
                criticalHits: gameState.stats.criticalHits
            },
            upgrades: {
                finalAxeLevel: gameState.axeLevel,
                workers: {
                    ptitLu: gameState.workers.ptitLu,
                    mathieu: gameState.workers.mathieu,
                    vico: gameState.workers.vico,
                    totalWorkers: gameState.workers.ptitLu + gameState.workers.mathieu + gameState.workers.vico
                },
                special: gameState.upgrades
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
                finalStatus: 'LÉGENDE',
                achievementsUnlocked: gameState.stats.achievementsUnlocked.length,
                prestigePoints: gameState.prestigePoints
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
                    title: 'Mon score Valouniversaire LÉGENDAIRE !',
                    text: '🎉 J\'ai conquis le Valouniversaire ! 🍺👑',
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
                title: 'Mon score Valouniversaire LÉGENDAIRE !',
                text: '🎉 J\'ai conquis le Valouniversaire ! 🍺👑',
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
            const statsCards = element.querySelectorAll('.stat-card');
            console.log('Found', statsCards.length, 'stat cards');
            
            if (statsCards.length === 0) {
                reject(new Error('No stat cards found'));
                return;
            }
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            const padding = 50;
            const cardWidth = 220;
            const cardHeight = 140;
            const cardsPerRow = 3;
            const rows = Math.ceil(statsCards.length / cardsPerRow);
            
            canvas.width = cardsPerRow * cardWidth + (cardsPerRow + 1) * 40;
            canvas.height = 140 + rows * cardHeight + (rows + 1) * 40;
            
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#2d4a2d');
            gradient.addColorStop(1, '#1a3a1a');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.strokeStyle = '#ffd93d';
            ctx.lineWidth = 4;
            drawRoundRect(ctx, 10, 10, canvas.width - 20, canvas.height - 20, 15);
            ctx.stroke();
            
            ctx.fillStyle = '#ffd93d';
            ctx.font = 'bold 28px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🏆 Tableau de bord LÉGENDAIRE', canvas.width / 2, 60);
            
            statsCards.forEach((card, index) => {
                const row = Math.floor(index / cardsPerRow);
                const col = index % cardsPerRow;
                const x = 40 + col * (cardWidth + 40);
                const y = 110 + row * (cardHeight + 40);
                
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
                
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                drawRoundRect(ctx, x, y, cardWidth, cardHeight, 12);
                ctx.fill();
                
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 2;
                drawRoundRect(ctx, x, y, cardWidth, cardHeight, 12);
                ctx.stroke();
                
                ctx.font = '32px Arial';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#fff';
                ctx.fillText(icon, x + cardWidth/2, y + 45);
                
                ctx.font = 'bold 22px Arial';
                ctx.fillStyle = '#ffd93d';
                ctx.fillText(value, x + cardWidth/2, y + 80);
                
                ctx.font = '14px Arial';
                ctx.fillStyle = '#ccc';
                ctx.fillText(label.toUpperCase(), x + cardWidth/2, y + 105);
            });
            
            ctx.font = '18px Arial';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.textAlign = 'center';
            ctx.fillText('#Valouniversaire #LÉGENDE', canvas.width / 2, canvas.height - 25);
            
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
    a.download = 'valouniversaire-LEGENDE.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('🎉 Ton tableau de LÉGENDE a été téléchargé !');
}

function fallbackTextShare() {
    const elapsed = Date.now() - gameState.gameStartTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    const shareText = `🏆 VALOUNIVERSAIRE CONQUIS ! 🏆\n🍺 420 bières pour Valou en ${timeText} !\n🌳 ${gameState.stats.totalTreesChopped} arbres massacrés\n🪵 ${gameState.stats.totalWoodGained} bois récoltés\n👆 ${gameState.stats.totalClicks} clics puissants\n💥 ${gameState.stats.criticalHits} coups critiques\n👷 ${gameState.stats.workersHired} workers embauchés\n🏆 ${gameState.stats.achievementsUnlocked.length}/8 achievements\n🌟 ${gameState.prestigePoints} points prestige\n\n#Valouniversaire #LÉGENDE #Champion`;
    
    fallbackShare(shareText);
}

function fallbackShare(text) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            alert('🎉 Ton score LÉGENDAIRE a été copié !');
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
        alert('🎉 Ton score LÉGENDAIRE a été copié !');
    } catch (err) {
        prompt('📋 Copie ce texte pour partager ton score LÉGENDAIRE :', text);
    }
    
    document.body.removeChild(textArea);
}

function restartGame() {
    const playerName = gameState.playerName;
    
    gameState = {
        wood: 0,
        beer: 0,
        prestigePoints: 0,
        currentTool: 'manual',
        treeHP: 10,
        maxTreeHP: 10,
        axeLevel: 1,
        workers: {
            ptitLu: 0,
            mathieu: 0,
            vico: 0
        },
        upgrades: {
            autoClicker: 0,
            lumberjackSchool: 0,
            breweryBonus: 0,
            goldenAxe: 0
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
            woodGainHistory: [],
            criticalHits: 0,
            achievementsUnlocked: [],
            prestigeCount: 0
        },
        playerName: playerName,
        gameStartTime: Date.now(),
        tutorial: {
            enabled: false,
            shownSteps: {
                start: false,
                beer: false,
                axe: false,
                workers: false,
                achievements: false,
                prestige: false
            }
        },
        autoClickerActive: false,
        particles: []
    };
    
    if (autoClickerInterval) {
        clearInterval(autoClickerInterval);
        autoClickerInterval = null;
    }
    
    Object.keys(workerIntervals).forEach(key => {
        if (workerIntervals[key]) clearInterval(workerIntervals[key]);
    });
    workerIntervals = {};
    
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
            title: '🌳 Premier contact !',
            text: 'Clique sur l\'arbre pour le couper ! Plus tu cliques, plus tu deviens puissant !'
        },
        beer: {
            title: '🍺 Première bière !',
            text: 'Excellent ! Chaque bière booste tes gains de bois ! Continue comme ça !'
        },
        axe: {
            title: '🪓 Upgrade time !',
            text: 'Améliore ta hache pour faire plus de dégâts ! Les arbres n\'ont qu\'à bien se tenir !'
        },
        workers: {
            title: '👥 Recrute tes potes !',
            text: 'Embauche des copains ! P\'tit Lu est faible, Mathieu solide, Vico légendaire !'
        },
        achievements: {
            title: '🏆 Achievements !',
            text: 'Tu débloques des achievements ! Ils donnent du bois bonus ! Continue à jouer !'
        },
        prestige: {
            title: '🌟 Système de Prestige !',
            text: 'Le prestige remet à zéro mais donne des bonus permanents ! Pour les vrais champions !'
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
    } else if (gameState.wood >= 35 && !gameState.tutorial.shownSteps.workers) {
        showTutorialStep('workers');
    }
}

function showScoresModal() {
    fetch('get_scores.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayScoresModal(data.scores);
            } else {
                console.error('Erreur lors du chargement des scores');
                displayScoresModal([]);
            }
        })
        .catch(error => {
            console.error('Erreur lors de la récupération des scores:', error);
            displayScoresModal([]);
        });
}

function displayScoresModal(scores) {
    const modal = document.createElement('div');
    modal.className = 'scores-modal';
    
    let scoresHTML = '';
    
    if (scores.length === 0) {
        scoresHTML = '<div class="no-scores">Aucun score enregistré pour le moment.<br>Sois le premier à Valouté ! 🏆</div>';
    } else {
        scoresHTML = `
            <div class="scores-header">
                <div>Rank</div>
                <div>Joueur</div>
                <div>Temps</div>
                <div>Date</div>
            </div>
            <div class="scores-list">
        `;
        
        scores.forEach((score, index) => {
            const rankClass = (index + 1) <= 3 ? `rank-${index + 1}` : '';
            const dateObj = new Date(score.gameDate);
            const dateFormatted = dateObj.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric'
            });
            const timeFormatted = dateObj.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
            });
            const dateTimeFormatted = `${dateFormatted} ${timeFormatted}`;
            const rankEmoji = getRankEmoji(index + 1);
            
            scoresHTML += `
                <div class="score-item ${rankClass}">
                    <div class="score-rank">${rankEmoji}${index + 1}</div>
                    <div class="score-name">${score.playerName}</div>
                    <div class="score-time">${score.gameTimeFormatted}</div>
                    <div class="score-date">${dateTimeFormatted}</div>
                </div>
            `;
        });
        
        scoresHTML += '</div>';
    }
    
    modal.innerHTML = `
        <div class="scores-content">
            <h2>🏆 HALL OF FAME 🏆</h2>
            <p>Les légendes de la VALOUTE !</p>
            ${scoresHTML}
            <button class="close-scores-btn" onclick="closeScoresModal()">Fermer</button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function getRankEmoji(rank) {
    switch (rank) {
        case 1: return '🥇 ';
        case 2: return '🥈 ';
        case 3: return '🥉 ';
        default: return '';
    }
}

function closeScoresModal() {
    const modal = document.querySelector('.scores-modal');
    if (modal) {
        modal.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }
} 