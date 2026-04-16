<?php
require_once __DIR__ . '/../config.php';

function getDatabaseConnection(): PDO
{
    if (!is_dir(dirname(DB_FILE))) {
        mkdir(dirname(DB_FILE), 0777, true);
    }

    $dsn = 'sqlite:' . DB_FILE;
    $pdo = new PDO($dsn, null, null, PDO_OPTIONS);
    $pdo->exec('PRAGMA foreign_keys = ON;');

    return $pdo;
}

function ensureDatabaseExists(): void
{
    if (!file_exists(DB_FILE)) {
        getDatabaseConnection();
    }
}
