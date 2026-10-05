<?php

require __DIR__ . '/db.php';

const STALE_OPEN_SHIFT_HOURS = 16;   // an open row older than this is treated as forgotten

try {
    $pdo = db();
    $chef = require_chef($pdo);
    $chefId = (int) $chef['user_id'];

    $body   = $_SERVER['REQUEST_METHOD'] === 'POST' ? read_json_body() : [];
    $requestedChefId = (int) ($body['chef_id'] ?? $_GET['chef_id'] ?? $chefId);
    if ($requestedChefId !== $chefId) {
        fail('Not allowed.', 403);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        history($pdo, $chefId);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $action = $body['action'] ?? '';
        if ($action === 'clock_in') {
            clock_in($pdo, $chefId);
        } elseif ($action === 'clock_out') {
            clock_out($pdo, $chefId);
        } else {
            fail('Unknown action.');
        }
    } else {
        fail('Method not allowed.', 405);
    }
} catch (Throwable $e) {
    handle_exception($e);
}

function latest_open(PDO $pdo, int $chefId)
{
    $st = $pdo->prepare(
        'SELECT attendance_id, TIMESTAMPDIFF(HOUR, clock_in, NOW()) AS hours_open
         FROM attendance
         WHERE employee_id = ? AND clock_out IS NULL
         ORDER BY clock_in DESC LIMIT 1 FOR UPDATE'
    );
    $st->execute([$chefId]);
    return $st->fetch();
}

function clock_in(PDO $pdo, int $chefId)
{
    $pdo->beginTransaction();
    $open = latest_open($pdo, $chefId);
    if ($open && (int) $open['hours_open'] < STALE_OPEN_SHIFT_HOURS) {
        $pdo->commit();
        json_out(['success' => true, 'message' => 'Already clocked in.', 'attendance_id' => (int) $open['attendance_id']]);
    }
    $pdo->prepare('INSERT INTO attendance (employee_id, clock_in) VALUES (?, NOW())')->execute([$chefId]);
    $id = (int) $pdo->lastInsertId();
    $pdo->commit();
    json_out(['success' => true, 'attendance_id' => $id]);
}

function clock_out(PDO $pdo, int $chefId)
{
    $pdo->beginTransaction();
    $open = latest_open($pdo, $chefId);
    if (!$open) {
        $pdo->commit();
        json_out(['success' => true, 'message' => 'No open shift.']);
    }
    $pdo->prepare('UPDATE attendance SET clock_out = NOW() WHERE attendance_id = ? AND employee_id = ?')
        ->execute([$open['attendance_id'], $chefId]);
    $pdo->commit();
    json_out(['success' => true, 'attendance_id' => (int) $open['attendance_id']]);
}

function history(PDO $pdo, int $chefId)
{
    $st = $pdo->prepare(
        'SELECT attendance_id,
                UNIX_TIMESTAMP(clock_in)  * 1000 AS clock_in_ms,
                UNIX_TIMESTAMP(clock_out) * 1000 AS clock_out_ms
         FROM attendance WHERE employee_id = ?
         ORDER BY clock_in DESC LIMIT 30'
    );
    $st->execute([$chefId]);

    $shifts = [];
    $open   = null;
    foreach ($st->fetchAll() as $r) {
        $in  = (int) $r['clock_in_ms'];
        $out = $r['clock_out_ms'] !== null ? (int) $r['clock_out_ms'] : null;
        if ($out === null) {
            if ($open === null) $open = $in;
            continue;
        }
        $shifts[] = ['clockIn' => $in, 'clockOut' => $out, 'durationMs' => $out - $in];
    }
    json_out(['success' => true, 'active_start' => $open, 'shifts' => $shifts]);
}
