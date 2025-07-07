<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

$DIFFICULTY_CONFIG = array(
    'prices' => array(
        'axeUpgrade' => 15,
        'ptitLu' => 35,
        'mathieu' => 120,
        'vico' => 400,
        'beer' => 4
    ),
    'priceMultipliers' => array(
        'upgrade' => 1.5,
        'ptitLu' => 1.8,
        'mathieu' => 1.6,
        'vico' => 1.4,
        'beer' => 1.1
    ),
    'toolEfficiency' => array(
        'baseDamage' => 1,
        'upgradeBonus' => 1.5
    ),
    'workerEfficiency' => array(
        'ptitLu' => 1.5,
        'mathieu' => 4,
        'vico' => 12
    ),
    'workerSpeed' => array(
        'ptitLu' => 3000,
        'mathieu' => 2500,
        'vico' => 2000
    ),
    'tree' => array(
        'minHP' => 3,
        'maxHP' => 8,
        'woodMin' => 1,
        'woodMax' => 3
    ),
    'beer' => array(
        'bonusPerBeer' => 0.02,
        'targetBeers' => 420
    )
);

echo json_encode(array(
    'success' => true,
    'config' => $DIFFICULTY_CONFIG
));
?> 