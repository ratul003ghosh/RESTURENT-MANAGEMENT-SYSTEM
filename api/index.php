<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
session_set_cookie_params([
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_start();

function respond(array $data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_SLASHES);
    exit;
}

function input(): array
{
    $data = json_decode(file_get_contents('php://input'), true);
    return is_array($data) ? $data : [];
}

function db(): PDO
{
    static $pdo;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = getenv('RMS_DB_HOST') ?: '127.0.0.1';
    $name = getenv('RMS_DB_NAME') ?: 'resturant_management';
    $user = getenv('RMS_DB_USER') ?: 'root';
    $password = getenv('RMS_DB_PASSWORD') ?: '';
    $pdo = new PDO(
        "mysql:host={$host};dbname={$name};charset=utf8mb4",
        $user,
        $password,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
    return $pdo;
}

function requireRole(string ...$roles): array
{
    $user = $_SESSION['user'] ?? null;
    if (!$user || !in_array($user['role'], $roles, true)) {
        respond(['error' => 'Please sign in with an authorized account.'], 401);
    }
    return $user;
}

function requireActiveShift(PDO $pdo, int $waiterId): void
{
    $statement = $pdo->prepare('SELECT attendance_id FROM attendance WHERE employee_id = ? AND clock_out IS NULL LIMIT 1');
    $statement->execute([$waiterId]);
    if (!$statement->fetch()) {
        respond(['error' => 'Clock in before taking tables or adding orders.'], 409);
    }
}

function createOrder(PDO $pdo, ?int $customerId, ?int $waiterId, ?int $tableId, string $customerName, array $items, string $notes): int
{
    if (!$items || count($items) > 30) {
        respond(['error' => 'Select between 1 and 30 menu items.'], 422);
    }

    $pdo->beginTransaction();
    try {
        if ($customerId === null && strcasecmp($customerName, 'Walk-in') !== 0) {
            $customerLookup = $pdo->prepare("SELECT user_id FROM users WHERE role = 'customer' AND approved = 1 AND name = ? LIMIT 1");
            $customerLookup->execute([$customerName]);
            $matchedCustomer = $customerLookup->fetch();
            if ($matchedCustomer) {
                $customerId = (int)$matchedCustomer['user_id'];
            }
        }
        $findItem = $pdo->prepare('SELECT item_id, item_name, price, is_customizable FROM menu_items WHERE item_name = ? AND available = 1 AND approved = 1');
        $optionPrices = [
            'size' => ['Regular' => 0, 'Large' => 100, 'Extra Large' => 200],
            'base' => ['Regular' => 0, 'Thin Crust' => 0, 'Stuffed Crust' => 50],
            'topping' => ['None' => 0, 'Mushrooms' => 40, 'Olives' => 30, 'Pepperoni' => 50, 'Extra Cheese' => 60, 'Chicken' => 100],
            'sauce' => ['Tomato sauce' => 0, 'White sauce' => 0, 'Barbecue sauce' => 0],
        ];
        $normalized = [];
        $subtotal = 0.0;
        foreach ($items as $item) {
            $name = trim((string)($item['name'] ?? ''));
            $quantity = filter_var($item['quantity'] ?? null, FILTER_VALIDATE_INT);
            if ($name === '' || $quantity === false || $quantity < 1 || $quantity > 50) {
                throw new InvalidArgumentException('Each item needs a valid name and quantity.');
            }
            $findItem->execute([$name]);
            $menuItem = $findItem->fetch();
            if (!$menuItem) {
                throw new InvalidArgumentException("{$name} is not currently available.");
            }
            $customizations = is_array($item['customizations'] ?? null) ? $item['customizations'] : [];
            $extraPrice = 0.0;
            $customizationText = [];
            foreach ($customizations as $group => $choice) {
                if (!is_string($choice) || !(int)$menuItem['is_customizable'] || !isset($optionPrices[$group][$choice])) {
                    throw new InvalidArgumentException("That {$group} choice is not available for {$name}.");
                }
                $extraPrice += (float)$optionPrices[$group][$choice];
                $customizationText[] = ucfirst((string)$group) . ': ' . (string)$choice;
            }
            if ($notes !== '') {
                $customizationText[] = 'Notes: ' . mb_substr($notes, 0, 300);
            }
            $unitPrice = (float)$menuItem['price'] + $extraPrice;
            $lineTotal = $unitPrice * $quantity;
            $subtotal += $lineTotal;
            $normalized[] = [$menuItem, $quantity, $unitPrice, implode(', ', $customizationText)];
        }

        $tax = round($subtotal * 0.05, 2);
        $statement = $pdo->prepare("INSERT INTO orders (customer_id, waiter_id, table_id, status, total_amount) VALUES (?, ?, ?, 'Placed', ?)");
        $statement->execute([$customerId, $waiterId, $tableId, $subtotal]);
        $orderId = (int)$pdo->lastInsertId();
        $insertLine = $pdo->prepare('INSERT INTO order_items (order_id, item_id, quantity, unit_price, customization) VALUES (?, ?, ?, ?, ?)');
        foreach ($normalized as [$menuItem, $quantity, $unitPrice, $customization]) {
            $insertLine->execute([$orderId, $menuItem['item_id'], $quantity, $unitPrice, mb_substr($customization, 0, 500)]);
        }
        $pdo->prepare("INSERT INTO bills (order_id, subtotal, tax, total, payment_status) VALUES (?, ?, ?, ?, 'pending')")
            ->execute([$orderId, $subtotal, $tax, $subtotal + $tax]);
        $pdo->commit();
        return $orderId;
    } catch (Throwable $error) {
        $pdo->rollBack();
        throw $error;
    }
}

try {
    $pdo = db();
    $action = $_GET['action'] ?? '';
    $body = input();

    if ($action === 'register' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $first = trim((string)($body['first_name'] ?? ''));
        $last = trim((string)($body['last_name'] ?? ''));
        $name = trim($first . ' ' . $last);
        $email = strtolower(trim((string)($body['email'] ?? '')));
        $password = (string)($body['password'] ?? '');
        if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 8) {
            respond(['error' => 'Enter your name, a valid email, and a password of at least 8 characters.'], 422);
        }
        $statement = $pdo->prepare("INSERT INTO users (name, email, password, role, approved) VALUES (?, ?, ?, 'customer', 0)");
        try {
            $statement->execute([$name, $email, password_hash($password, PASSWORD_DEFAULT)]);
        } catch (PDOException $error) {
            if ($error->getCode() === '23000') {
                respond(['error' => 'An account with that email already exists.'], 409);
            }
            throw $error;
        }
        respond(['message' => 'Account created. An administrator must approve it before you can sign in.'], 201);
    }

    if ($action === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $email = strtolower(trim((string)($body['email'] ?? '')));
        $password = (string)($body['password'] ?? '');
        $role = ($body['role'] ?? 'customer') === 'waiter' ? 'waiter' : 'customer';
        $statement = $pdo->prepare('SELECT user_id, name, email, password, role, approved FROM users WHERE email = ? AND role = ? LIMIT 1');
        $statement->execute([$email, $role]);
        $user = $statement->fetch();
        $passwordValid = $user && password_verify($password, $user['password']);
        if ($user && !$passwordValid && hash_equals((string)$user['password'], $password)) {
            $pdo->prepare('UPDATE users SET password = ? WHERE user_id = ?')->execute([password_hash($password, PASSWORD_DEFAULT), $user['user_id']]);
            $passwordValid = true;
        }
        if (!$user || !$passwordValid) {
            respond(['error' => 'Email or password is incorrect.'], 401);
        }
        if (!(int)$user['approved']) {
            respond(['error' => $role === 'customer' ? 'Your account is waiting for administrator approval.' : 'This account is not approved.'], 403);
        }
        session_regenerate_id(true);
        $parts = preg_split('/\s+/', trim($user['name']), 2);
        $user = [
            'id' => (int)$user['user_id'],
            'role' => $user['role'],
            'name' => $user['name'],
            'first_name' => $parts[0] ?? '',
            'last_name' => $parts[1] ?? '',
            'email' => $user['email'],
        ];
        $_SESSION['user'] = $user;
        respond(['user' => $user]);
    }

    if ($action === 'me') {
        respond(['user' => $_SESSION['user'] ?? null]);
    }

    if ($action === 'logout' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $_SESSION = [];
        session_destroy();
        respond(['message' => 'Signed out.']);
    }

    if ($action === 'menu') {
        $items = $pdo->query('SELECT item_id AS id, item_name AS name, category, description, image, price, is_customizable FROM menu_items WHERE available = 1 AND approved = 1 ORDER BY category, item_name')->fetchAll();
        respond(['items' => $items]);
    }

    if ($action === 'tables') {
        $tables = $pdo->query("SELECT table_id AS id, CONCAT('Table ', table_number) AS table_number, capacity AS seats, status, waiter_id FROM restaurant_tables ORDER BY table_number")->fetchAll();
        respond(['tables' => $tables]);
    }

    if ($action === 'availability') {
        $date = (string)($_GET['date'] ?? '');
        $time = (string)($_GET['time'] ?? '');
        $parsedDate = DateTime::createFromFormat('Y-m-d', $date);
        if (!$parsedDate || $parsedDate->format('Y-m-d') !== $date || !preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', $time)) {
            respond(['error' => 'Choose a valid date and time slot.'], 422);
        }
        $statement = $pdo->prepare("SELECT t.table_id AS id, CONCAT('Table ', t.table_number) AS table_number, t.capacity AS seats, NOT EXISTS (SELECT 1 FROM reservations r WHERE r.table_id = t.table_id AND r.reservation_date = ? AND r.reservation_time = ? AND r.status IN ('pending', 'confirmed')) AS available FROM restaurant_tables t ORDER BY t.table_number");
        $statement->execute([$date, $time . ':00']);
        respond(['tables' => $statement->fetchAll()]);
    }

    if ($action === 'reservations' && $_SERVER['REQUEST_METHOD'] === 'GET') {
        $user = requireRole('customer');
        $statement = $pdo->prepare("SELECT r.reservation_id AS id, r.guests AS guest_count, r.reservation_date, r.reservation_time AS time_slot, r.status, CONCAT('Table ', t.table_number) AS table_number FROM reservations r JOIN restaurant_tables t ON t.table_id = r.table_id WHERE r.customer_id = ? ORDER BY r.reservation_date DESC, r.reservation_time DESC");
        $statement->execute([$user['id']]);
        respond(['reservations' => $statement->fetchAll()]);
    }

    if ($action === 'reservations' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $user = requireRole('customer');
        $tableId = filter_var($body['table_id'] ?? null, FILTER_VALIDATE_INT);
        $guests = filter_var($body['guest_count'] ?? null, FILTER_VALIDATE_INT);
        $date = (string)($body['date'] ?? '');
        $time = (string)($body['time'] ?? '');
        $parsedDate = DateTime::createFromFormat('Y-m-d', $date);
        if (!$tableId || !$guests || !$parsedDate || $parsedDate->format('Y-m-d') !== $date || $date <= date('Y-m-d') || !preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', $time)) {
            respond(['error' => 'Choose a future date, a valid time slot, a table, and a guest count.'], 422);
        }
        $pdo->beginTransaction();
        $tableQuery = $pdo->prepare('SELECT capacity AS seats FROM restaurant_tables WHERE table_id = ? FOR UPDATE');
        $tableQuery->execute([$tableId]);
        $table = $tableQuery->fetch();
        if (!$table || $guests > (int)$table['seats']) {
            $pdo->rollBack();
            respond(['error' => 'That table cannot accommodate the selected number of guests.'], 422);
        }
        $check = $pdo->prepare("SELECT reservation_id FROM reservations WHERE table_id = ? AND reservation_date = ? AND reservation_time = ? AND status IN ('pending', 'confirmed') FOR UPDATE");
        $check->execute([$tableId, $date, $time . ':00']);
        if ($check->fetch()) {
            $pdo->rollBack();
            respond(['error' => 'That table is already reserved for this slot. Please choose another.'], 409);
        }
        $insert = $pdo->prepare("INSERT INTO reservations (customer_id, table_id, guests, reservation_date, reservation_time, status) VALUES (?, ?, ?, ?, ?, 'pending')");
        $insert->execute([$user['id'], $tableId, $guests, $date, $time . ':00']);
        $pdo->commit();
        respond(['message' => 'Reservation request submitted and is waiting for approval.'], 201);
    }

    if ($action === 'orders' && $_SERVER['REQUEST_METHOD'] === 'GET') {
        $user = requireRole('customer');
        $statement = $pdo->prepare("SELECT o.order_id AS id, CASE WHEN b.payment_status = 'paid' THEN 'Paid' ELSE o.status END AS status, COALESCE(b.payment_status, IF(o.status = 'Paid', 'paid', 'pending')) AS payment_status, COALESCE(b.subtotal, o.total_amount) AS subtotal, COALESCE(b.tax, ROUND(o.total_amount * 0.05, 2)) AS tax, COALESCE(b.total, o.total_amount + ROUND(o.total_amount * 0.05, 2)) AS total, o.order_time AS created_at, CONCAT('Table ', t.table_number) AS table_number, GROUP_CONCAT(CONCAT(m.item_name, ' x ', oi.quantity) ORDER BY oi.order_item_id SEPARATOR ', ') AS item_summary FROM orders o LEFT JOIN bills b ON b.order_id = o.order_id LEFT JOIN restaurant_tables t ON t.table_id = o.table_id JOIN order_items oi ON oi.order_id = o.order_id JOIN menu_items m ON m.item_id = oi.item_id WHERE o.customer_id = ? GROUP BY o.order_id ORDER BY o.order_time DESC");
        $statement->execute([$user['id']]);
        respond(['orders' => $statement->fetchAll()]);
    }

    if ($action === 'orders' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $user = requireRole('customer');
        $items = is_array($body['items'] ?? null) ? $body['items'] : [];
        $id = createOrder($pdo, (int)$user['id'], null, null, $user['name'], $items, (string)($body['notes'] ?? ''));
        respond(['message' => 'Order placed.', 'order_id' => $id], 201);
    }

    if ($action === 'bill') {
        $user = requireRole('customer');
        $orderId = filter_var($_GET['order_id'] ?? null, FILTER_VALIDATE_INT);
        $statement = $pdo->prepare("SELECT o.order_id AS id, u.name AS customer_name, CONCAT('Table ', t.table_number) AS table_number, o.status, COALESCE(b.payment_status, IF(o.status = 'Paid', 'paid', 'pending')) AS payment_status, COALESCE(b.subtotal, o.total_amount) AS subtotal, COALESCE(b.tax, ROUND(o.total_amount * 0.05, 2)) AS tax, COALESCE(b.total, o.total_amount + ROUND(o.total_amount * 0.05, 2)) AS total, o.order_time AS created_at FROM orders o JOIN users u ON u.user_id = o.customer_id LEFT JOIN restaurant_tables t ON t.table_id = o.table_id LEFT JOIN bills b ON b.order_id = o.order_id WHERE o.customer_id = ? AND (? IS NULL OR o.order_id = ?) ORDER BY o.order_time DESC LIMIT 1");
        $statement->execute([$user['id'], $orderId ?: null, $orderId ?: null]);
        $order = $statement->fetch();
        if (!$order) {
            respond(['order' => null, 'items' => []]);
        }
        $items = $pdo->prepare('SELECT m.item_name, oi.unit_price, oi.quantity, oi.customization, oi.unit_price * oi.quantity AS line_total FROM order_items oi JOIN menu_items m ON m.item_id = oi.item_id WHERE oi.order_id = ? ORDER BY oi.order_item_id');
        $items->execute([$order['id']]);
        respond(['order' => $order, 'items' => $items->fetchAll()]);
    }

    if ($action === 'chat' && $_SERVER['REQUEST_METHOD'] === 'GET') {
        $user = requireRole('customer');
        $statement = $pdo->prepare("SELECT message_id AS id, IF(sender_id = ?, 'customer', 'staff') AS sender_role, message, sent_at AS created_at FROM chat_messages WHERE sender_id = ? OR receiver_id = ? ORDER BY sent_at, message_id");
        $statement->execute([$user['id'], $user['id'], $user['id']]);
        respond(['messages' => $statement->fetchAll()]);
    }

    if ($action === 'chat' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $user = requireRole('customer');
        $message = trim((string)($body['message'] ?? ''));
        if ($message === '' || mb_strlen($message) > 2000) {
            respond(['error' => 'Messages must be between 1 and 2000 characters.'], 422);
        }
        $statement = $pdo->prepare('INSERT INTO chat_messages (sender_id, receiver_id, message) VALUES (?, NULL, ?)');
        $statement->execute([$user['id'], $message]);
        respond(['message' => ['id' => (int)$pdo->lastInsertId(), 'sender_role' => 'customer', 'message' => $message, 'created_at' => date('Y-m-d H:i:s')]], 201);
    }

    if ($action === 'waiter_clock' && $_SERVER['REQUEST_METHOD'] === 'GET') {
        $user = requireRole('waiter');
        $current = $pdo->prepare('SELECT attendance_id AS id, clock_in FROM attendance WHERE employee_id = ? AND clock_out IS NULL ORDER BY clock_in DESC LIMIT 1');
        $current->execute([$user['id']]);
        respond(['shift' => $current->fetch() ?: null]);
    }

    if ($action === 'waiter_clock' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $user = requireRole('waiter');
        if (!in_array($body['mode'] ?? '', ['in', 'out'], true)) {
            respond(['error' => 'Choose clock in or clock out.'], 422);
        }
        $current = $pdo->prepare('SELECT attendance_id AS id, clock_in FROM attendance WHERE employee_id = ? AND clock_out IS NULL ORDER BY clock_in DESC LIMIT 1');
        $current->execute([$user['id']]);
        $shift = $current->fetch();
        if (($body['mode'] ?? '') === 'in' && !$shift) {
            $pdo->prepare('INSERT INTO attendance (employee_id, clock_in) VALUES (?, NOW())')->execute([$user['id']]);
        } elseif (($body['mode'] ?? '') === 'out' && $shift) {
            $pdo->prepare('UPDATE attendance SET clock_out = NOW() WHERE attendance_id = ?')->execute([$shift['id']]);
            $pdo->prepare("UPDATE restaurant_tables SET waiter_id = NULL, status = 'available' WHERE waiter_id = ?")->execute([$user['id']]);
        }
        $current->execute([$user['id']]);
        respond(['shift' => $current->fetch() ?: null]);
    }

    if ($action === 'waiter_tables' && $_SERVER['REQUEST_METHOD'] === 'GET') {
        $user = requireRole('waiter');
        $statement = $pdo->query("SELECT table_id AS id, CONCAT('Table ', table_number) AS table_number, capacity AS seats, waiter_id, status FROM restaurant_tables ORDER BY table_number");
        respond(['tables' => $statement->fetchAll()]);
    }

    if ($action === 'waiter_tables' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $user = requireRole('waiter');
        requireActiveShift($pdo, (int)$user['id']);
        $tableId = filter_var($body['table_id'] ?? null, FILTER_VALIDATE_INT);
        $mode = $body['mode'] ?? '';
        if (!$tableId || !in_array($mode, ['take', 'release'], true)) {
            respond(['error' => 'Invalid table assignment request.'], 422);
        }
        $pdo->beginTransaction();
        $tableQuery = $pdo->prepare('SELECT waiter_id, status FROM restaurant_tables WHERE table_id = ? FOR UPDATE');
        $tableQuery->execute([$tableId]);
        $table = $tableQuery->fetch();
        if ($mode === 'take' && $table && $table['status'] === 'available' && !$table['waiter_id']) {
            $pdo->prepare("UPDATE restaurant_tables SET waiter_id = ?, status = 'occupied' WHERE table_id = ?")->execute([$user['id'], $tableId]);
        } elseif ($mode === 'release' && $table && (int)$table['waiter_id'] === (int)$user['id']) {
            $pdo->prepare("UPDATE restaurant_tables SET waiter_id = NULL, status = 'available' WHERE table_id = ?")->execute([$tableId]);
        } else {
            $pdo->rollBack();
            respond(['error' => 'That table assignment has changed. Refresh and try again.'], 409);
        }
        $pdo->commit();
        respond(['message' => 'Table assignment updated.']);
    }

    if ($action === 'waiter_orders' && $_SERVER['REQUEST_METHOD'] === 'GET') {
        $user = requireRole('waiter');
        $statement = $pdo->prepare("SELECT o.order_id AS id, COALESCE(u.name, 'Walk-in') AS customer_name, o.status, o.order_time AS created_at, t.table_id, CONCAT('Table ', t.table_number) AS table_number, GROUP_CONCAT(CONCAT(m.item_name, ' x ', oi.quantity) ORDER BY oi.order_item_id SEPARATOR ', ') AS item_summary FROM orders o LEFT JOIN users u ON u.user_id = o.customer_id LEFT JOIN restaurant_tables t ON t.table_id = o.table_id JOIN order_items oi ON oi.order_id = o.order_id JOIN menu_items m ON m.item_id = oi.item_id WHERE o.waiter_id = ? GROUP BY o.order_id ORDER BY o.order_time DESC");
        $statement->execute([$user['id']]);
        respond(['orders' => $statement->fetchAll()]);
    }

    if ($action === 'waiter_orders' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $user = requireRole('waiter');
        requireActiveShift($pdo, (int)$user['id']);
        $tableId = filter_var($body['table_id'] ?? null, FILTER_VALIDATE_INT);
        $tableCheck = $pdo->prepare("SELECT table_id FROM restaurant_tables WHERE table_id = ? AND waiter_id = ? AND status = 'occupied'");
        $tableCheck->execute([$tableId, $user['id']]);
        if (!$tableId || !$tableCheck->fetch()) {
            respond(['error' => 'Take the selected table before adding an order.'], 422);
        }
        $customerName = trim((string)($body['customer_name'] ?? 'Walk-in'));
        if ($customerName === '') {
            $customerName = 'Walk-in';
        }
        $id = createOrder($pdo, null, (int)$user['id'], $tableId, $customerName, is_array($body['items'] ?? null) ? $body['items'] : [], (string)($body['notes'] ?? ''));
        respond(['message' => 'Order added.', 'order_id' => $id], 201);
    }

    if ($action === 'waiter_deliver' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $user = requireRole('waiter');
        $orderId = filter_var($body['order_id'] ?? null, FILTER_VALIDATE_INT);
        $statement = $pdo->prepare("UPDATE orders SET status = 'Served' WHERE order_id = ? AND waiter_id = ? AND status = 'Ready'");
        $statement->execute([$orderId, $user['id']]);
        if ($statement->rowCount() !== 1) {
            respond(['error' => 'Only a ready order assigned to you can be marked delivered.'], 409);
        }
        respond(['message' => 'Order marked as delivered.']);
    }

    respond(['error' => 'Unknown API action.'], 404);
} catch (InvalidArgumentException $error) {
    respond(['error' => $error->getMessage()], 422);
} catch (Throwable $error) {
    error_log($error->__toString());
    respond(['error' => 'The server could not complete the request. Check the PHP and MySQL configuration.'], 500);
}