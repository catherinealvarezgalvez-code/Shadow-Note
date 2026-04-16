<?php
require_once __DIR__ . '/db.php';

function getUserNotes(int $userId): array
{
    $pdo = getDatabaseConnection();
    $stmt = $pdo->prepare('SELECT id, title, body, updated_at, created_at FROM notes WHERE user_id = ? ORDER BY updated_at DESC');
    $stmt->execute([$userId]);
    return $stmt->fetchAll();
}

function getNote(int $noteId, int $userId): ?array
{
    $pdo = getDatabaseConnection();
    $stmt = $pdo->prepare('SELECT id, title, body, updated_at, created_at FROM notes WHERE id = ? AND user_id = ?');
    $stmt->execute([$noteId, $userId]);
    return $stmt->fetch();
}

function createNote(int $userId, string $title, string $body): array
{
    $pdo = getDatabaseConnection();
    $stmt = $pdo->prepare('INSERT INTO notes (user_id, title, body) VALUES (?, ?, ?)');
    $stmt->execute([$userId, $title, $body]);

    $noteId = $pdo->lastInsertId();
    return ['success' => true, 'note_id' => $noteId];
}

function updateNote(int $noteId, int $userId, string $title, string $body): array
{
    $pdo = getDatabaseConnection();
    $stmt = $pdo->prepare('UPDATE notes SET title = ?, body = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?');
    $stmt->execute([$title, $body, $noteId, $userId]);

    if ($stmt->rowCount() === 0) {
        return ['success' => false, 'error' => 'Nota no encontrada o no tienes permisos'];
    }

    return ['success' => true];
}

function deleteNote(int $noteId, int $userId): array
{
    $pdo = getDatabaseConnection();
    $stmt = $pdo->prepare('DELETE FROM notes WHERE id = ? AND user_id = ?');
    $stmt->execute([$noteId, $userId]);

    if ($stmt->rowCount() === 0) {
        return ['success' => false, 'error' => 'Nota no encontrada o no tienes permisos'];
    }

    return ['success' => true];
}
