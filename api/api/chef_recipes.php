<?php

require __DIR__ . '/db.php';

try {
    $pdo = db();
    $chef = require_chef($pdo);
    $chefId = (int) $chef['user_id'];

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        list_recipes($pdo, $chefId);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $body   = read_json_body();
        $action = $body['action'] ?? '';
        if ($action === 'sync_all') {
            sync_recipes($pdo, $chefId, $body['recipes'] ?? []);
        } elseif ($action === 'delete') {
            delete_recipe($pdo, $chefId, (int) ($body['id'] ?? 0));
        } else {
            fail('Unknown action.');
        }
    } else {
        fail('Method not allowed.', 405);
    }
} catch (Throwable $e) {
    if (db()->inTransaction()) {
        db()->rollBack();
    }
    handle_exception($e);
}

function difficulty_from_minutes(int $m): string
{
    if ($m <= 15) return 'Easy';
    if ($m <= 25) return 'Medium';
    return 'Hard';
}

/** UI category (plural) -> value stored in menu_items.category for NEW proposals. */
function db_category(string $ui): string
{
    $map = [
        'appetizers' => 'Appetizer', 'pizza' => 'Pizza', 'drinks' => 'Drinks',
        'desserts' => 'Dessert', 'burgers' => 'Burger', 'mains' => 'Main Course',
    ];
    return $map[strtolower(trim($ui))] ?? 'Main Course';
}

function list_recipes(PDO $pdo, int $chefId)
{
    $st = $pdo->prepare(
        "SELECT r.recipe_id, r.item_id, r.chef_id, r.instructions, r.preparation_time,
                m.item_name, m.category, m.image, m.approved
         FROM recipes r
         JOIN menu_items m ON m.item_id = r.item_id
         WHERE r.chef_id = ?
         ORDER BY m.category, m.item_name"
    );
    $st->execute([$chefId]);

    $out = [];
    foreach ($st->fetchAll() as $r) {
        $minutes = (int) $r['preparation_time'];
        $image   = (string) $r['image'];
        $out[] = [
            'id'         => (int) $r['recipe_id'],
            'item_id'    => (int) $r['item_id'],
            'chef_id'    => (int) $r['chef_id'],
            'name'       => $r['item_name'],
            'category'   => $r['category'],          // the JS normalises this
            'approved'   => (int) $r['approved'],
            'difficulty' => difficulty_from_minutes($minutes),
            'minutes'    => $minutes,
            'notes'      => (string) $r['instructions'],
            // Only real URLs are sent; otherwise the JS picks its own picture.
            'image'      => preg_match('#^https?://#i', $image) ? $image : '',
        ];
    }
    json_out(['success' => true, 'recipes' => $out]);
}

function sync_recipes(PDO $pdo, int $chefId, $list)
{
    if (!is_array($list)) {
        fail('recipes must be a list.');
    }

    $pdo->beginTransaction();

    $findOwn    = $pdo->prepare(
        'SELECT r.recipe_id, r.item_id, m.approved
         FROM recipes r JOIN menu_items m ON m.item_id = r.item_id
         WHERE r.recipe_id = ? AND r.chef_id = ? FOR UPDATE'
    );
    $updRecipe  = $pdo->prepare('UPDATE recipes SET instructions = ?, preparation_time = ? WHERE recipe_id = ? AND chef_id = ?');
    $updItem    = $pdo->prepare('UPDATE menu_items SET item_name = ?, category = ?, description = ? WHERE item_id = ? AND approved = 0');
    $findByName = $pdo->prepare(
        'SELECT m.item_id,
                (SELECT COUNT(*) FROM recipes x WHERE x.item_id = m.item_id) AS recipe_count
         FROM menu_items m WHERE LOWER(m.item_name) = LOWER(?) ORDER BY m.item_id LIMIT 1'
    );
    $insItem    = $pdo->prepare(
        "INSERT INTO menu_items (item_name, description, price, category, image, is_customizable, approved, available)
         VALUES (?, ?, 0.00, ?, NULL, 0, 0, 0)"
    );
    $insRecipe  = $pdo->prepare('INSERT INTO recipes (item_id, chef_id, instructions, preparation_time) VALUES (?, ?, ?, ?)');

    foreach ($list as $r) {
        if (!is_array($r)) continue;

        $name    = trim((string) ($r['name'] ?? ''));
        $notes   = trim((string) ($r['notes'] ?? ''));
        $minutes = max(1, min(600, (int) ($r['minutes'] ?? 10)));
        $uiCat   = (string) ($r['category'] ?? 'Mains');
        $id      = (int) ($r['id'] ?? 0);
        if ($name === '' || mb_strlen($name) > 100) continue;

        $instructions = $notes === '' ? null : $notes;
        $description  = $notes === '' ? null : mb_substr($notes, 0, 250);

        // 1) existing recipe of THIS chef -> update
        $findOwn->execute([$id, $chefId]);
        $own = $id > 0 ? $findOwn->fetch() : false;
        if ($own) {
            $updRecipe->execute([$instructions, $minutes, $own['recipe_id'], $chefId]);
            if ((int) $own['approved'] === 0) {
                // chef's own proposal: name/category may still be edited
                $updItem->execute([$name, db_category($uiCat), $description, $own['item_id']]);
            }
            continue;
        }

        // 2) a menu item with this name already exists
        $findByName->execute([$name]);
        $existing = $findByName->fetch();
        if ($existing) {
            if ((int) $existing['recipe_count'] === 0) {
                $insRecipe->execute([$existing['item_id'], $chefId, $instructions, $minutes]);
            }
            // already has a recipe (maybe another chef's) -> leave it alone
            continue;
        }

        // 3) brand new dish -> unapproved proposal for the admin
        $insItem->execute([$name, $description, db_category($uiCat)]);
        $newItemId = (int) $pdo->lastInsertId();
        $insRecipe->execute([$newItemId, $chefId, $instructions, $minutes]);
    }

    $pdo->commit();
    json_out(['success' => true]);
}

function delete_recipe(PDO $pdo, int $chefId, int $id)
{
    if ($id <= 0) {
        fail('Missing recipe id.');
    }
    $pdo->beginTransaction();

    $st = $pdo->prepare(
        'SELECT r.item_id, m.approved, m.available
         FROM recipes r JOIN menu_items m ON m.item_id = r.item_id
         WHERE r.recipe_id = ? AND r.chef_id = ? FOR UPDATE'
    );
    $st->execute([$id, $chefId]);
    $row = $st->fetch();
    if (!$row) {
        $pdo->rollBack();
        fail('Recipe not found.', 404);
    }

    $pdo->prepare('DELETE FROM recipes WHERE recipe_id = ? AND chef_id = ?')->execute([$id, $chefId]);

    // Remove the menu item only if it was this chef's unapproved proposal and is unused.
    if ((int) $row['approved'] === 0 && (int) $row['available'] === 0) {
        $used = $pdo->prepare(
            'SELECT (SELECT COUNT(*) FROM order_items WHERE item_id = ?) +
                    (SELECT COUNT(*) FROM recipes WHERE item_id = ?)'
        );
        $used->execute([$row['item_id'], $row['item_id']]);
        if ((int) $used->fetchColumn() === 0) {
            $pdo->prepare('DELETE FROM menu_items WHERE item_id = ? AND approved = 0')->execute([$row['item_id']]);
        }
    }

    $pdo->commit();
    json_out(['success' => true]);
}
