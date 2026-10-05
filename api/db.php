<?php



const DB_HOST = '127.0.0.1';
const DB_NAME = 'resturant_management';   // spelled exactly like in your .sql file
const DB_USER = 'root';
const DB_PASS = '';                        // XAMPP default is empty
const APP_TIMEZONE = 'Asia/Dhaka';


const CURRENT_CHEF_ID = 3;


const CHEF_CAN_MARK_SERVED = true;


const CHEF_CAN_CREATE_ORDERS = false;


date_default_timezone_set(APP_TIMEZONE);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function db()
{
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }
    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
            DB_USER,
            DB_PASS,
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

function require_chef(PDO $pdo, int $chefId): array
{
    $st = $pdo->prepare(
        "SELECT user_id, name, email, role FROM users
         WHERE user_id = ? AND role = 'chef' AND approved = 1"
    );
    $st->execute([$chefId]);
    $chef = $st->fetch();
    if (!$chef) {
        fail('Chef account not found or not approved.', 403);
    }
    return $chef;
}

function handle_exception(Throwable $e)
{
    // Keep details out of the browser; check your PHP/Apache error log instead.
    error_log('[chef api] ' . $e->getMessage());
    json_out(['success' => false, 'message' => 'Server error.'], 500);
}
