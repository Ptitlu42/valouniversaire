<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

$DIFFICULTY_CONFIG = [
    'prices' => [
        'axeUpgrade' => 15,
        'ptitLu' => 25,
        'mathieu' => 100,
        'vico' => 300,
        'beer' => 4
    ],
    'priceMultipliers' => [
        'upgrade' => 1.15,
        'worker' => 1.018,
        'beer' => 1.022
    ],
    'toolEfficiency' => [
        'manual' => 1
    ],
    'workerEfficiency' => [
        'ptitLu' => 0.5,
        'mathieu' => 2,
        'vico' => 5
    ],
    'workerSpeed' => [
        'ptitLu' => 1200,
        'mathieu' => 600,
        'vico' => 400
    ],
    'tree' => [
        'baseHP' => 10,
        'minHP' => 5,
        'maxHP' => 12,
        'woodMin' => 2,
        'woodMax' => 4
    ],
    'beer' => [
        'bonusPerBeer' => 0.01,
        'targetBeers' => 420
    ]
];

echo json_encode([
    'success' => true,
    'config' => $DIFFICULTY_CONFIG
]);
?> 