<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

$DIFFICULTY_CONFIG = array(
    'prices' => array(
        'axeUpgrade' => 15,
        'ptitLu' => 25,
        'mathieu' => 100,
        'vico' => 300,
        'beer' => 4,
        'autoClicker' => 75,
        'lumberjackSchool' => 500,
        'breweryBonus' => 200,
        'goldenAxe' => 1000,
        'prestige' => 50000
    ),
    'priceMultipliers' => array(
        'upgrade' => 1.3,
        'ptitLu' => 1.6,
        'mathieu' => 1.5,
        'vico' => 1.35,
        'beer' => 1.08,
        'autoClicker' => 1.4,
        'lumberjackSchool' => 1.8,
        'breweryBonus' => 2.0,
        'goldenAxe' => 1.2,
        'prestige' => 1.5
    ),
    'toolEfficiency' => array(
        'baseDamage' => 1,
        'upgradeBonus' => 1.2
    ),
    'workerEfficiency' => array(
        'ptitLu' => 0.8,
        'mathieu' => 2.5,
        'vico' => 8
    ),
    'workerSpeed' => array(
        'ptitLu' => 3500,
        'mathieu' => 2800,
        'vico' => 2200
    ),
    'tree' => array(
        'minHP' => 2,
        'maxHP' => 6,
        'woodMin' => 1,
        'woodMax' => 3,
        'criticalChance' => 0.1,
        'criticalMultiplier' => 2.5
    ),
    'beer' => array(
        'bonusPerBeer' => 0.015,
        'targetBeers' => 420,
        'prestigeBeers' => 1000
    ),
    'achievements' => array(
        'firstClick' => array('name' => 'Premier coup !', 'desc' => 'Couper ton premier arbre', 'reward' => 5),
        'firstBeer' => array('name' => 'Première bière !', 'desc' => 'Acheter ta première bière', 'reward' => 10),
        'firstWorker' => array('name' => 'Patron !', 'desc' => 'Embaucher ton premier worker', 'reward' => 15),
        'speedDemon' => array('name' => 'Machine à cliquer !', 'desc' => '100 clics en 10 secondes', 'reward' => 25),
        'lumberjack' => array('name' => 'Vrai bûcheron !', 'desc' => 'Couper 100 arbres', 'reward' => 30),
        'beerLover' => array('name' => 'Amateur de bière !', 'desc' => '50 bières achetées', 'reward' => 40),
        'teamLeader' => array('name' => 'Chef d\'équipe !', 'desc' => '10 workers embauchés', 'reward' => 50),
        'valouteMaster' => array('name' => 'Maître de la Valoute !', 'desc' => 'Terminer le jeu', 'reward' => 100)
    ),
    'prestige' => array(
        'beerMultiplier' => 0.1,
        'woodBonus' => 0.05,
        'clickBonus' => 0.02
    ),
    'autoUpgrades' => array(
        'autoClicker' => array(
            'efficiency' => 0.5,
            'speed' => 1500
        ),
        'lumberjackSchool' => array(
            'workerBonus' => 0.25
        ),
        'breweryBonus' => array(
            'beerEfficiencyBonus' => 0.5
        ),
        'goldenAxe' => array(
            'critChanceBonus' => 0.15,
            'critMultiplierBonus' => 1.0
        )
    )
);

echo json_encode(array(
    'success' => true,
    'config' => $DIFFICULTY_CONFIG
));
?> 