<?php
require_once __DIR__ . '/../config.php';

function generateJWT(array $payload): string
{
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $headerEncoded = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));

    $payload['iat'] = time();
    $payload['exp'] = time() + JWT_EXPIRY;
    $payloadEncoded = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(json_encode($payload)));

    $signature = hash_hmac('sha256', $headerEncoded . "." . $payloadEncoded, JWT_SECRET, true);
    $signatureEncoded = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

    return $headerEncoded . "." . $payloadEncoded . "." . $signatureEncoded;
}

function verifyJWT(string $jwt): ?array
{
    $parts = explode('.', $jwt);
    if (count($parts) !== 3) {
        return null;
    }

    [$headerEncoded, $payloadEncoded, $signatureEncoded] = $parts;

    // Verificar firma
    $expectedSignature = hash_hmac('sha256', $headerEncoded . "." . $payloadEncoded, JWT_SECRET, true);
    $expectedSignatureEncoded = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($expectedSignature));

    if (!hash_equals($expectedSignatureEncoded, $signatureEncoded)) {
        return null;
    }

    // Decodificar payload
    $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $payloadEncoded)), true);

    // Verificar expiración
    if ($payload['exp'] < time()) {
        return null;
    }

    return $payload;
}
