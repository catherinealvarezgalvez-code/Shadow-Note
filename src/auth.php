<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/jwt.php';

function registerUser(string $email, string $password): array
{
    $pdo = getDatabaseConnection();

    // Validar email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return ['success' => false, 'error' => 'Email inválido'];
    }

    // Validar contraseña (mínimo 6 caracteres)
    if (strlen($password) < 6) {
        return ['success' => false, 'error' => 'La contraseña debe tener al menos 6 caracteres'];
    }

    // Verificar si el email ya existe
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        return ['success' => false, 'error' => 'El email ya está registrado'];
    }

    // Hash de la contraseña
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    // Insertar usuario
    $stmt = $pdo->prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)');
    $stmt->execute([$email, $passwordHash]);

    $userId = $pdo->lastInsertId();

    // Generar JWT
    $token = generateJWT(['user_id' => $userId, 'email' => $email]);

    return ['success' => true, 'token' => $token, 'user_id' => $userId];
}

function loginUser(string $email, string $password): array
{
    $pdo = getDatabaseConnection();

    // Buscar usuario por email
    $stmt = $pdo->prepare('SELECT id, password_hash FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        return ['success' => false, 'error' => 'Credenciales incorrectas'];
    }

    // Generar JWT
    $token = generateJWT(['user_id' => $user['id'], 'email' => $email]);

    return ['success' => true, 'token' => $token, 'user_id' => $user['id']];
}

function getUserFromToken(string $token): ?array
{
    $payload = verifyJWT($token);
    if (!$payload) {
        return null;
    }

    $pdo = getDatabaseConnection();
    $stmt = $pdo->prepare('SELECT id, email, created_at FROM users WHERE id = ?');
    $stmt->execute([$payload['user_id']]);
    return $stmt->fetch();
}

function logoutUser(): void
{
    // En este caso, el logout se maneja eliminando el token del frontend
    // No necesitamos hacer nada en el backend
}
