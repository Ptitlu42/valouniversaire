<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['fileName']) || !isset($data['data'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid data format']);
    exit;
}

$fileName = $data['fileName'];
$gameData = $data['data'];

$fileName = preg_replace('/[^a-zA-Z0-9_\-.]/', '', $fileName);
if (!preg_match('/\.json$/', $fileName)) {
    $fileName .= '.json';
}

$resultsDir = 'game_results';
if (!is_dir($resultsDir)) {
    if (!mkdir($resultsDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Cannot create results directory']);
        exit;
    }
}

$filePath = $resultsDir . '/' . $fileName;

$jsonContent = json_encode($gameData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

if (file_put_contents($filePath, $jsonContent) !== false) {
    echo json_encode([
        'success' => true, 
        'message' => 'Game result saved successfully',
        'fileName' => $fileName,
        'filePath' => $filePath
    ]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to save file']);
}
?> 