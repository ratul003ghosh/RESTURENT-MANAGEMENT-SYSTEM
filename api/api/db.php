<?php
declare(strict_types=1);

const APP_TIMEZONE = 'Asia/Dhaka';

const CHEF_CAN_MARK_SERVED = true;


const CHEF_CAN_CREATE_ORDERS = false;


date_default_timezone_set(APP_TIMEZONE);
session_set_cookie_params([
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function db()
{
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }
    try {
        $host = getenv('RMS_DB_HOST') ?: '127.0.0.1';
        $name = getenv('RMS_DB_NAME') ?: 'resturant_management';
        $user = getenv('RMS_DB_USER') ?: 'root';
        $password = getenv('RMS_DB_PASSWORD') ?: '';
        $pdo = new PDO(
            'mysql:host=' . $host . ';dbname=' . $name . ';charset=utf8mb4',
            $user,
            $password,
            [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]
        );
        $offset = (new DateTime('now', new DateTimeZone(APP_TIMEZONE)))->format('P');
        $pdo->exec("SET time_zone = '" . $offset . "'");
    } catch (Throwable $e) {
        json_out(['success' => false, 'message' => 'Database connection failed.'], 500);
    }
    return $pdo;
}

function json_out(array $data, int $code = 200)
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function read_json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function fail(string $message, int $code = 400)
{
    json_out(['success' => false, 'message' => $message], $code);
}

function require_chef(PDO $pdo): array
{
    $st = $pdo->prepare(
        "SELECT user_id, name, email, role FROM users
         WHERE user_id = ? AND role = 'chef' AND approved = 1"
    );
    $st->execute([(int) ($_SESSION['chef_id'] ?? 0)]);
    $chef = $st->fetch();
    if (!$chef) {
        unset($_SESSION['chef_id']);
        fail('Chef account not found or not approved.', 403);
    }
    return $chef;
}

function handle_exception(Throwable $e)
{
    error_log('[restaurant api] ' . $e->getMessage());
    json_out(['success' => false, 'message' => 'Server error.'], 500);
}
