<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../src/auth.php';
require_once __DIR__ . '/../src/note.php';

// Verificar autenticación
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';
if (!preg_match('/Bearer (.+)/', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(['error' => 'Token de autenticación requerido']);
    exit;
}

$token = $matches[1];
$user = getUserFromToken($token);
if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Token inválido o expirado']);
    exit;
}

$userId = $user['id'];

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Listar notas del usuario
        $notes = getUserNotes($userId);
        echo json_encode(['success' => true, 'notes' => $notes]);
        break;

    case 'POST':
        // Crear nueva nota
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input || !isset($input['title']) || !isset($input['body'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Título y cuerpo requeridos']);
            exit;
        }

        $result = createNote($userId, $input['title'], $input['body']);
        if ($result['success']) {
            http_response_code(201);
        } else {
            http_response_code(500);
        }
        echo json_encode($result);
        break;

    case 'PUT':
        // Actualizar nota
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input || !isset($input['id']) || !isset($input['title']) || !isset($input['body'])) {
            http_response_code(400);
            echo json_encode(['error' => 'ID, título y cuerpo requeridos']);
            exit;
        }

        $result = updateNote($input['id'], $userId, $input['title'], $input['body']);
        if ($result['success']) {
            http_response_code(200);
        } else {
            http_response_code(404);
        }
        echo json_encode($result);
        break;

    case 'DELETE':
        // Eliminar nota
        $noteId = $_GET['id'] ?? null;
        if (!$noteId) {
            http_response_code(400);
            echo json_encode(['error' => 'ID de nota requerido']);
            exit;
        }

        $result = deleteNote($noteId, $userId);
        if ($result['success']) {
            http_response_code(200);
        } else {
            http_response_code(404);
        }
        echo json_encode($result);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
        break;
}
