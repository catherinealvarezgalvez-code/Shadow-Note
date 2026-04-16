<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../src/auth.php';

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'JSON inválido']);
    exit;
}

$action = $input['action'] ?? '';

switch ($action) {
    case 'register':
        $result = registerUser($input['email'] ?? '', $input['password'] ?? '');
        if ($result['success']) {
            http_response_code(201);
        } else {
            http_response_code(400);
        }
        echo json_encode($result);
        break;

    case 'login':
        $result = loginUser($input['email'] ?? '', $input['password'] ?? '');
        if ($result['success']) {
            http_response_code(200);
        } else {
            http_response_code(401);
        }
        echo json_encode($result);
        break;

    default:
        http_response_code(400);
        echo json_encode(['error' => 'Acción no válida']);
        break;
}
