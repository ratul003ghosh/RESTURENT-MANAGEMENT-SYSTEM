<?php

require __DIR__ . '/db.php';

try {
    $pdo = db();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $chef = require_chef($pdo);
        json_out([
            'success' => true,
            'chef' => [
                'id' => (int) $chef['user_id'],
                'name' => $chef['name'],
                'email' => $chef['email'],
            ],
        ]);
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        fail('Method not allowed.', 405);
    }

    $body = read_json_body();
    $action = (string) ($body['action'] ?? 'login');

    if ($action === 'logout') {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', [
                'expires' => time() - 42000,
                'path' => $params['path'],
                'domain' => $params['domain'],
                'secure' => $params['secure'],
                'httponly' => $params['httponly'],
                'samesite' => $params['samesite'] ?? 'Lax',
            ]);
        }
        session_destroy();
        json_out(['success' => true]);
    }

    if ($action !== 'login') {
        fail('Unknown action.');
    }

    $email = strtolower(trim((string) ($body['email'] ?? '')));
    $password = (string) ($body['password'] ?? '');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
        fail('Enter a valid email and password.');
    }

    $st = $pdo->prepare(
        "SELECT user_id, name, email, password
         FROM users
         WHERE email = ? AND role = 'chef' AND approved = 1
         LIMIT 1"
    );
    $st->execute([$email]);
    $user = $st->fetch();

    $validPassword = false;
    if ($user) {
        $passwordInfo = password_get_info($user['password']);
        if ($passwordInfo['algo'] !== null) {
            $validPassword = password_verify($password, $user['password']);
        } else {
            $validPassword = hash_equals((string) $user['password'], $password);
            if ($validPassword) {
                $upgrade = $pdo->prepare('UPDATE users SET password = ? WHERE user_id = ?');
                $upgrade->execute([password_hash($password, PASSWORD_DEFAULT), $user['user_id']]);
            }
        }
    }

    if (!$user || !$validPassword) {
        fail('Invalid chef email or password.', 401);
    }

    session_regenerate_id(true);
    $_SESSION['chef_id'] = (int) $user['user_id'];
    json_out([
        'success' => true,
        'chef' => [
            'id' => (int) $user['user_id'],
            'name' => $user['name'],
            'email' => $user['email'],
        ],
    ]);
} catch (Throwable $e) {
    handle_exception($e);
}
