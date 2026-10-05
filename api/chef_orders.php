<?php

require __DIR__ . '/db.php';

const DB_TO_UI = [
    'Placed'     => 'queued',
    'In Kitchen' => 'prep',
    'Ready'      => 'ready',
    'Served'     => 'done',
    'Paid'       => 'done',
];

try {
    $pdo = db();
    require_chef($pdo, CURRENT_CHEF_ID);

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        list_orders($pdo);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $body   = read_json_body();
        $action = $body['action'] ?? '';

        if ($action === 'update_status') {
            update_status($pdo, $body);
        } elseif ($action === 'sync_all') {
            json_out(['success' => true, 'message' => 'sync_all ignored; orders are managed in the database.']);
        } elseif ($action === 'create_order') {
            if (!CHEF_CAN_CREATE_ORDERS) {
                json_out(['success' => false, 'message' => 'Chefs cannot create orders.'], 403);
            }
            fail('Order creation is not implemented.', 501);
        } else {
            fail('Unknown action.');
        }
    } else {
        fail('Method not allowed.', 405);
    }
} catch (Throwable $e) {
    handle_exception($e);
}

function list_orders(PDO $pdo)
{
    $orders = $pdo->query(
        "SELECT o.order_id, o.status,
                UNIX_TIMESTAMP(o.order_time) * 1000 AS start_ms,
                t.table_number
         FROM orders o
         LEFT JOIN restaurant_tables t ON t.table_id = o.table_id
         WHERE o.status IN ('Placed','In Kitchen','Ready','Served','Paid')
         ORDER BY o.order_time DESC
         LIMIT 200"
    )->fetchAll();

    $itemsByOrder = [];
    if ($orders) {
        $ids = array_column($orders, 'order_id');
        $in  = implode(',', array_fill(0, count($ids), '?'));
        $st  = $pdo->prepare(
            "SELECT oi.order_id, oi.quantity, oi.customization, m.item_name, m.category
             FROM order_items oi
             JOIN menu_items m ON m.item_id = oi.item_id
             WHERE oi.order_id IN ($in)
             ORDER BY oi.order_item_id"
        );
        $st->execute($ids);
        foreach ($st->fetchAll() as $row) {
            $item = [
                'qty'      => (int) $row['quantity'],
                'name'     => $row['item_name'],
                'category' => $row['category'],
            ];
            if ($row['customization'] !== null && $row['customization'] !== '') {
                $item['note'] = $row['customization'];
            }
            $itemsByOrder[(int) $row['order_id']][] = $item;
        }
    }

    $out = [];
    foreach ($orders as $o) {
        $id = (int) $o['order_id'];
        $out[] = [
            'id'        => $id,
            'table'     => $o['table_number'] !== null ? 'T' . $o['table_number'] : 'Takeaway',
            'area'      => 'Main',   // no area column in the database
            'rush'      => false,    // no rush column in the database
            'status'    => DB_TO_UI[$o['status']] ?? 'queued',
            'startTime' => (int) $o['start_ms'],
            'items'     => $itemsByOrder[$id] ?? [],
        ];
    }
    json_out(['success' => true, 'orders' => $out]);
}

function update_status(PDO $pdo, array $body)
{
    $id = (int) ($body['id'] ?? 0);
    $ui = (string) ($body['status'] ?? '');
    if ($id <= 0) {
        fail('Missing order id.');
    }

    $uiToDb = ['queued' => 'Placed', 'prep' => 'In Kitchen', 'ready' => 'Ready'];
    if (CHEF_CAN_MARK_SERVED) {
        $uiToDb['done'] = 'Served';
    }
    if (!isset($uiToDb[$ui])) {
        fail('Status not allowed for chefs.', 403);
    }
    $newStatus = $uiToDb[$ui];

    $pdo->beginTransaction();
    $st = $pdo->prepare('SELECT status FROM orders WHERE order_id = ? FOR UPDATE');
    $st->execute([$id]);
    $current = $st->fetchColumn();
    if ($current === false) {
        $pdo->rollBack();
        fail('Order not found.', 404);
    }
    // Served / Paid orders belong to the waiter and cashier side; leave them alone.
    if (!in_array($current, ['Placed', 'In Kitchen', 'Ready'], true)) {
        $pdo->rollBack();
        fail('This order is already finished and cannot be changed by the kitchen.', 409);
    }

    $up = $pdo->prepare('UPDATE orders SET status = ? WHERE order_id = ?');
    $up->execute([$newStatus, $id]);
    $pdo->commit();

    json_out(['success' => true, 'id' => $id, 'status' => $ui]);
}
