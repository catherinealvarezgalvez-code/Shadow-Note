<?php
// Configuración global de la aplicación Shadow Note

// Nombre y URL base de la app
define('APP_NAME', 'Shadow Note');
define('BASE_URL', '/Shadow-Note');

// Archivo SQLite local
define('DB_FILE', __DIR__ . '/data/database.sqlite');

// JWT simple para sesiones (cámbialo por una clave larga y secreta en producción)
define('JWT_SECRET', 'shadow_note_secret_2026');
define('JWT_EXPIRY', 60 * 60 * 24 * 7); // 7 días

// Nombre de la cookie donde se puede guardar el token JWT
define('AUTH_COOKIE', 'shadow_note_auth');

// Opciones de PDO
define('PDO_OPTIONS', [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
]);

// Habilitar el reporte de errores en desarrollo
ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);
