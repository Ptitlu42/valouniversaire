<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

$resultsDir = 'game_results';

if (!is_dir($resultsDir)) {
    echo json_encode(['success' => true, 'scores' => []]);
    exit;
}

$scores = [];
$files = glob($resultsDir . '/*.json');

foreach ($files as $file) {
    $content = file_get_contents($file);
    $data = json_decode($content, true);
    
    if ($data && isset($data['gameStats'])) {
        $gameStats = $data['gameStats'];
        
        if (isset($gameStats['completion']['targetReached']) && $gameStats['completion']['targetReached']) {
            $scores[] = [
                'playerName' => $data['playerInfo']['originalName'] ?? 'Anonyme',
                'gameDate' => $data['playerInfo']['gameDate'] ?? '',
                'gameTime' => $gameStats['totalGameTime']['milliseconds'] ?? 0,
                'gameTimeFormatted' => $gameStats['totalGameTime']['formatted'] ?? '0:00',
                'totalWood' => $gameStats['resources']['totalWoodGained'] ?? 0,
                'totalClicks' => $gameStats['actions']['totalClicks'] ?? 0,
                'workersHired' => $gameStats['actions']['workersHired'] ?? 0,
                'finalAxeLevel' => $gameStats['upgrades']['finalAxeLevel'] ?? 1,
                'woodPerMinute' => $gameStats['efficiency']['woodPerMinute'] ?? 0,
                'finalStatus' => $gameStats['completion']['finalStatus'] ?? 'CHAMPION'
            ];
        }
    }
}

usort($scores, function($a, $b) {
    return $a['gameTime'] - $b['gameTime'];
});

$scores = array_slice($scores, 0, 20);

foreach ($scores as $index => &$score) {
    $score['rank'] = $index + 1;
}

echo json_encode(['success' => true, 'scores' => $scores]);
?> 