# Restaurant Management Backend Setup

The backend uses the supplied `resturant_management` database and maps to its existing users, menu_items, restaurant_tables, reservations, orders, order_items, bills, attendance, chat_messages, and reviews tables.

## Run with XAMPP

1. Start **Apache** and **MySQL** in the XAMPP Control Panel.
2. If this database is not already loaded in phpMyAdmin, import the provided `resturant_management.sql` once.
3. The API defaults to MySQL at `127.0.0.1`, database `resturant_management`, username `root`, and an empty password. Change `RMS_DB_HOST`, `RMS_DB_NAME`, `RMS_DB_USER`, and `RMS_DB_PASSWORD` in the PHP/Apache environment if your XAMPP database uses different credentials.
4. Run `database_migrations.sql` in phpMyAdmin (selecting `resturant_management`) to ensure waiter assignment and review storage exist. It checks before adding the waiter column and can be rerun safely.
5. Open `http://localhost/resturent/RESTURENT-MANAGEMENT-SYSTEM-development/customer-login.html`. Do not open pages with a `file:///` URL; PHP endpoints need Apache.

The updated SQL dump includes `restaurant_tables.waiter_id` and `reviews`. Existing installations can use the migration above to add any missing schema objects.

The menu and table endpoints are public for browsing. Account, order, reservation, bill, chat, review moderation, and waiter actions use PHP sessions. Administrator actions and the statistics dashboard use the separate `api/admin.php` endpoint and an approved administrator account.

## Create Test Accounts

Customer signup intentionally creates a `pending` account because the project requirement says an administrator approves customers. Since the admin approval UI is outside the customer/waiter pages, approve a test signup in phpMyAdmin:

```sql
UPDATE users SET approved = 1 WHERE email = 'customer@example.com';
```

Waiters are staff accounts, not public signups. Generate a password hash with XAMPP PHP:

```powershell
& 'C:\xampp\php\php.exe' -r "echo password_hash('ChangeThisPassword', PASSWORD_DEFAULT), PHP_EOL;"
```

Insert a waiter using the hash printed by that command:

```sql
INSERT INTO users (name, email, password, role, approved)
VALUES ('Test Waiter', 'waiter@example.com', 'PASTE_HASH_HERE', 'waiter', 1);
```

Use the customer login page after approval and the waiter login page for the staff account. Waiters must clock in before claiming tables or adding orders. A waiter can deliver an order only after its status is `Ready`. The supplied order enum has no `Delivered` value, so the backend stores the existing `Served` state and labels that action “Delivered” in the waiter screen.

The supplied SQL seed includes the administrator account `admin@uiu.com` with password `admin123`; sign in from the Admin Dashboard. Change this demo password before using the system outside a local development environment. The admin endpoint upgrades this legacy seed password to a password hash after a successful login.

## What Is Connected

- Customer signup/login, browsing approved and available database menu items, cart order submission, order history, tax calculation, bill printing, future table reservation requests, and customer-to-restaurant chat.
- Waiter login, persistent shift clock-in/out, exclusive table assignment, order entry using database menu prices, and delivery of ready orders.
- Administrator login, live daily dashboard metrics, staff creation and shift visibility, pending customer approval, chef menu proposal approval/rejection, reservation management, review moderation, and sales analytics.
- Public review submission and approved review listing on the feedback/reviews pages.
- New passwords are stored with PHP `password_hash`; existing plaintext demo passwords are upgraded to hashes after a successful login. Waiter-entered notes are stored in existing order-item customization fields. Database queries use PDO prepared statements.

Reservations are stored as `pending` and are managed from the administrator dashboard. The system does not yet provide a staff reply screen for customer chat or payment processing. Printing the bill lets the user choose **Save as PDF** in the browser print dialog.