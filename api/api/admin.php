<?php
declare(strict_types=1);

require __DIR__ . '/db.php';

function admin_response(array $data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function admin_error(string $message, int $status = 400): void
{
    admin_response(['success' => false, 'message' => $message], $status);
}

function require_admin(PDO $pdo): array
{
    $statement = $pdo->prepare(
        "SELECT user_id, name, email FROM users
         WHERE user_id = ? AND role = 'admin' AND approved = 1"
    );
    $statement->execute([(int)($_SESSION['admin_id'] ?? 0)]);
    $admin = $statement->fetch();
    if (!$admin) {
        unset($_SESSION['admin_id']);
        admin_error('Sign in with an approved administrator account.', 401);
    }
    return $admin;
}

try {
    $pdo = db();
    $action = (string)($_GET['action'] ?? '');
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $body = $method === 'POST' ? read_json_body() : [];

    if ($action === 'login' && $method === 'POST') {
        $email = strtolower(trim((string)($body['email'] ?? '')));
        $password = (string)($body['password'] ?? '');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
            admin_error('Enter a valid administrator email and password.', 422);
        }
        $statement = $pdo->prepare(
            "SELECT user_id, name, email, password FROM users
             WHERE email = ? AND role = 'admin' AND approved = 1 LIMIT 1"
        );
        $statement->execute([$email]);
        $user = $statement->fetch();
        $passwordValid = false;
        if ($user) {
            if (password_get_info($user['password'])['algo'] !== null) {
                $passwordValid = password_verify($password, $user['password']);
            } else {
                $passwordValid = hash_equals((string)$user['password'], $password);
                if ($passwordValid) {
                    $pdo->prepare('UPDATE users SET password = ? WHERE user_id = ?')
                        ->execute([password_hash($password, PASSWORD_DEFAULT), $user['user_id']]);
                }
            }
        }
        if (!$user || !$passwordValid) {
            admin_error('Administrator email or password is incorrect.', 401);
        }
        session_regenerate_id(true);
        $_SESSION['admin_id'] = (int)$user['user_id'];
        admin_response(['success' => true, 'admin' => [
            'id' => (int)$user['user_id'],
            'name' => $user['name'],
            'email' => $user['email'],
        ]]);
    }

    if ($action === 'logout' && $method === 'POST') {
        unset($_SESSION['admin_id']);
        admin_response(['success' => true]);
    }

    if ($action === 'me' && $method === 'GET') {
        admin_response(['success' => true, 'admin' => require_admin($pdo)]);
    }

    if ($action === 'published_reviews' && $method === 'GET') {
        $statement = $pdo->query(
            "SELECT review_id AS id, reviewer_name AS name, category, rating,
                    review_text AS comment, created_at
             FROM reviews WHERE approved = 1 ORDER BY created_at DESC LIMIT 30"
        );
        admin_response(['success' => true, 'reviews' => $statement->fetchAll()]);
    }

    if ($action === 'submit_review' && $method === 'POST') {
        $name = trim((string)($body['name'] ?? ''));
        $email = strtolower(trim((string)($body['email'] ?? '')));
        $category = (string)($body['category'] ?? '');
        $rating = filter_var($body['rating'] ?? null, FILTER_VALIDATE_INT);
        $comment = trim((string)($body['comment'] ?? ''));
        if ($name === '' || mb_strlen($name) > 100 || !filter_var($email, FILTER_VALIDATE_EMAIL)
            || !in_array($category, ['food', 'service', 'booking', 'ambience'], true)
            || !in_array($rating, [3, 4, 5], true) || $comment === '' || mb_strlen($comment) > 2000) {
            admin_error('Enter your name, a valid email, a rating, category, and review (up to 2000 characters).', 422);
        }

        $customerId = null;
        if (isset($_SESSION['user']) && ($_SESSION['user']['role'] ?? '') === 'customer') {
            $customerId = (int)$_SESSION['user']['id'];
            $name = (string)$_SESSION['user']['name'];
            $email = (string)$_SESSION['user']['email'];
        }
        $statement = $pdo->prepare(
            'INSERT INTO reviews (customer_id, reviewer_name, email, category, rating, review_text, approved)
             VALUES (?, ?, ?, ?, ?, ?, 0)'
        );
        $statement->execute([$customerId, $name, $email, $category, $rating, $comment]);
        admin_response(['success' => true, 'message' => 'Thank you. Your review has been submitted for approval.'], 201);
    }

    require_admin($pdo);

    if ($action === 'summary' && $method === 'GET') {
        $summary = [
            'today_revenue' => (float)$pdo->query(
                "SELECT COALESCE(SUM(total), 0) FROM bills
                 WHERE payment_status = 'paid' AND DATE(created_at) = CURDATE()"
            )->fetchColumn(),
            'today_orders' => (int)$pdo->query(
                'SELECT COUNT(*) FROM orders WHERE DATE(order_time) = CURDATE()'
            )->fetchColumn(),
            'pending_kitchen' => (int)$pdo->query(
                "SELECT COUNT(*) FROM orders WHERE status IN ('Placed', 'In Kitchen')"
            )->fetchColumn(),
            'occupied_tables' => (int)$pdo->query(
                "SELECT COUNT(*) FROM restaurant_tables WHERE status = 'occupied'"
            )->fetchColumn(),
            'table_count' => (int)$pdo->query('SELECT COUNT(*) FROM restaurant_tables')->fetchColumn(),
            'staff_on_shift' => (int)$pdo->query(
                'SELECT COUNT(DISTINCT employee_id) FROM attendance WHERE clock_out IS NULL'
            )->fetchColumn(),
        ];
        admin_response(['success' => true, 'summary' => $summary]);
    }

    if ($action === 'staff' && $method === 'GET') {
        $staff = $pdo->query(
            "SELECT u.user_id AS id, u.name, u.email, u.role, u.approved,
                    MAX(a.clock_in) AS shift_started
             FROM users u
             LEFT JOIN attendance a ON a.employee_id = u.user_id AND a.clock_out IS NULL
             WHERE u.role IN ('waiter', 'chef')
             GROUP BY u.user_id, u.name, u.email, u.role, u.approved
             ORDER BY u.role, u.name"
        )->fetchAll();
        admin_response(['success' => true, 'staff' => $staff]);
    }

    if ($action === 'staff' && $method === 'POST') {
        $name = trim((string)($body['name'] ?? ''));
        $email = strtolower(trim((string)($body['email'] ?? '')));
        $password = (string)($body['password'] ?? '');
        $role = (string)($body['role'] ?? '');
        if ($name === '' || mb_strlen($name) > 100 || !filter_var($email, FILTER_VALIDATE_EMAIL)
            || strlen($password) < 8 || !in_array($role, ['waiter', 'chef'], true)) {
            admin_error('Provide a name, valid email, waiter or chef role, and password of at least 8 characters.', 422);
        }
        try {
            $statement = $pdo->prepare(
                'INSERT INTO users (name, email, password, role, approved) VALUES (?, ?, ?, ?, 1)'
            );
            $statement->execute([$name, $email, password_hash($password, PASSWORD_DEFAULT), $role]);
        } catch (PDOException $error) {
            if ($error->getCode() === '23000') {
                admin_error('An account with that email already exists.', 409);
            }
            throw $error;
        }
        admin_response(['success' => true, 'message' => 'Staff account created.'], 201);
    }

    if ($action === 'customers' && $method === 'GET') {
        $customers = $pdo->query(
            "SELECT user_id AS id, name, email, created_at
             FROM users WHERE role = 'customer' AND approved = 0 ORDER BY created_at"
        )->fetchAll();
        admin_response(['success' => true, 'customers' => $customers]);
    }

    if ($action === 'customers' && $method === 'POST') {
        $customerId = filter_var($body['customer_id'] ?? null, FILTER_VALIDATE_INT);
        if (!$customerId) {
            admin_error('Choose a valid customer account.', 422);
        }
        $statement = $pdo->prepare(
            "UPDATE users SET approved = 1 WHERE user_id = ? AND role = 'customer' AND approved = 0"
        );
        $statement->execute([$customerId]);
        if ($statement->rowCount() !== 1) {
            admin_error('That pending customer account was not found.', 404);
        }
        admin_response(['success' => true, 'message' => 'Customer account approved.']);
    }

    if ($action === 'menu' && $method === 'GET') {
        $items = $pdo->query(
            "SELECT m.item_id AS id, m.item_name AS name, m.category, m.description, m.price,
                    u.name AS chef_name
             FROM menu_items m
             LEFT JOIN recipes r ON r.item_id = m.item_id
             LEFT JOIN users u ON u.user_id = r.chef_id
             WHERE m.approved = 0 ORDER BY m.item_id DESC"
        )->fetchAll();
        admin_response(['success' => true, 'items' => $items]);
    }

    if ($action === 'menu' && $method === 'POST') {
        $itemId = filter_var($body['item_id'] ?? null, FILTER_VALIDATE_INT);
        $decision = (string)($body['decision'] ?? '');
        if (!$itemId || !in_array($decision, ['approve', 'reject'], true)) {
            admin_error('Choose a menu item and a valid approval decision.', 422);
        }
        if ($decision === 'approve') {
            $price = filter_var($body['price'] ?? null, FILTER_VALIDATE_FLOAT);
            if ($price === false || $price <= 0 || $price > 100000) {
                admin_error('Enter an approval price greater than zero.', 422);
            }
            $statement = $pdo->prepare(
                'UPDATE menu_items SET price = ?, approved = 1, available = 1 WHERE item_id = ? AND approved = 0'
            );
            $statement->execute([$price, $itemId]);
        } else {
            $pdo->beginTransaction();
            $item = $pdo->prepare('SELECT item_id FROM menu_items WHERE item_id = ? AND approved = 0 FOR UPDATE');
            $item->execute([$itemId]);
            if (!$item->fetch()) {
                $pdo->rollBack();
                admin_error('That pending menu item was not found.', 404);
            }
            $used = $pdo->prepare('SELECT COUNT(*) FROM order_items WHERE item_id = ?');
            $used->execute([$itemId]);
            if ((int)$used->fetchColumn() === 0) {
                $pdo->prepare('DELETE FROM recipes WHERE item_id = ?')->execute([$itemId]);
                $statement = $pdo->prepare('DELETE FROM menu_items WHERE item_id = ? AND approved = 0');
                $statement->execute([$itemId]);
            } else {
                $statement = $pdo->prepare(
                    'UPDATE menu_items SET approved = 1, available = 0 WHERE item_id = ? AND approved = 0'
                );
                $statement->execute([$itemId]);
            }
            $pdo->commit();
        }
        if ($statement->rowCount() !== 1) {
            admin_error('That pending menu item was not found.', 404);
        }
        admin_response(['success' => true, 'message' => $decision === 'approve' ? 'Menu item approved.' : 'Menu proposal rejected.']);
    }

    if ($action === 'reservations' && $method === 'GET') {
        $reservations = $pdo->query(
            "SELECT r.reservation_id AS id, r.reservation_date, r.reservation_time, r.guests,
                    r.status, u.name AS customer_name, u.email, t.table_number
             FROM reservations r
             JOIN users u ON u.user_id = r.customer_id
             JOIN restaurant_tables t ON t.table_id = r.table_id
             ORDER BY FIELD(r.status, 'pending', 'confirmed', 'completed', 'cancelled'),
                      r.reservation_date, r.reservation_time"
        )->fetchAll();
        admin_response(['success' => true, 'reservations' => $reservations]);
    }

    if ($action === 'reservations' && $method === 'POST') {
        $reservationId = filter_var($body['reservation_id'] ?? null, FILTER_VALIDATE_INT);
        $status = (string)($body['status'] ?? '');
        if (!$reservationId || !in_array($status, ['confirmed', 'cancelled', 'completed'], true)) {
            admin_error('Choose a reservation and valid status.', 422);
        }
        $statement = $pdo->prepare(
            "UPDATE reservations SET status = ? WHERE reservation_id = ? AND status IN ('pending', 'confirmed')"
        );
        $statement->execute([$status, $reservationId]);
        if ($statement->rowCount() !== 1) {
            admin_error('That active reservation was not found.', 404);
        }
        admin_response(['success' => true, 'message' => 'Reservation updated.']);
    }

    if ($action === 'reviews' && $method === 'GET') {
        $reviews = $pdo->query(
            'SELECT review_id AS id, reviewer_name AS name, category, rating,
                    review_text AS comment, created_at
             FROM reviews WHERE approved = 0 ORDER BY created_at DESC'
        )->fetchAll();
        admin_response(['success' => true, 'reviews' => $reviews]);
    }

    if ($action === 'reviews' && $method === 'POST') {
        $reviewId = filter_var($body['review_id'] ?? null, FILTER_VALIDATE_INT);
        $decision = (string)($body['decision'] ?? '');
        if (!$reviewId || !in_array($decision, ['approve', 'reject'], true)) {
            admin_error('Choose a review and valid moderation decision.', 422);
        }
        $statement = $decision === 'approve'
            ? $pdo->prepare('UPDATE reviews SET approved = 1 WHERE review_id = ? AND approved = 0')
            : $pdo->prepare('DELETE FROM reviews WHERE review_id = ? AND approved = 0');
        $statement->execute([$reviewId]);
        if ($statement->rowCount() !== 1) {
            admin_error('That pending review was not found.', 404);
        }
        admin_response(['success' => true, 'message' => $decision === 'approve' ? 'Review approved.' : 'Review rejected.']);
    }

    if ($action === 'stats' && $method === 'GET') {
        $categorySales = $pdo->query(
            "SELECT COALESCE(m.category, 'Other') AS category, SUM(oi.unit_price * oi.quantity) AS revenue
             FROM order_items oi
             JOIN orders o ON o.order_id = oi.order_id
             JOIN bills b ON b.order_id = o.order_id AND b.payment_status = 'paid'
             JOIN menu_items m ON m.item_id = oi.item_id
             WHERE o.order_time >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
             GROUP BY m.category ORDER BY revenue DESC"
        )->fetchAll();
        $weekly = $pdo->query(
            "SELECT DATE(b.created_at) AS day, SUM(b.total) AS revenue
             FROM bills b WHERE b.payment_status = 'paid'
               AND b.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
             GROUP BY DATE(b.created_at) ORDER BY day"
        )->fetchAll();
        admin_response(['success' => true, 'category_sales' => $categorySales, 'weekly_revenue' => $weekly]);
    }

    admin_error('Unknown admin API action.', 404);
} catch (Throwable $error) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('[admin api] ' . $error->getMessage());
    admin_error('The server could not complete the request. Check the PHP and MySQL configuration.', 500);
}
