# Customer and Waiter Backend Setup

The backend uses the supplied `resturant_management` database and maps to its existing users, menu_items, restaurant_tables, reservations, orders, order_items, bills, attendance, and chat_messages tables.

## Run with XAMPP

1. Start **Apache** and **MySQL** in the XAMPP Control Panel.
2. If this database is not already loaded in phpMyAdmin, import the provided `resturant_management.sql` once.
3. The API defaults to MySQL at `127.0.0.1`, database `resturant_management`, username `root`, and an empty password. Change the `RMS_DB_HOST`, `RMS_DB_NAME`, `RMS_DB_USER`, and `RMS_DB_PASSWORD` environment values in the PHP/Apache environment if your XAMPP database uses different credentials.
4. Open `http://localhost/resturent/RESTURENT-MANAGEMENT-SYSTEM-development/customer-login.html`. Do not open the pages with a `file:///` URL; PHP endpoints need Apache.

Waiter table assignment uses the existing `restaurant_tables.waiter_id` column in the current XAMPP database. The supplied SQL dump does not include that column, so importing that dump into a fresh database will need a schema update before waiter table assignments can work.

No backend migration file is required for the current database. If you already ran an earlier version of this project that created `waiter_table_assignments` or `order_service_details`, those tables are no longer used by the PHP API; leave them in place if they contain records.

The menu and table endpoints are public for browsing. Account, order, reservation, bill, chat, and waiter actions use PHP sessions and require an authorized account.

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

## What Is Connected

- Customer signup/login, browsing approved and available database menu items, cart order submission, order history, tax calculation, bill printing, future table reservation requests, and customer-to-restaurant chat.
- Waiter login, persistent shift clock-in/out, exclusive table assignment, order entry using database menu prices, and delivery of ready orders.
- New passwords are stored with PHP `password_hash`; existing plaintext demo passwords are upgraded to hashes after a successful login. Waiter-entered notes are stored in existing order-item customization fields. Database queries use PDO prepared statements.

Reservations are stored as `pending`, matching the requested admin-approval workflow. The current project does not include an admin approval interface, a staff reply screen for customer chat, chef order-state integration, or payment processing; those actions still need integration by their respective role owners. Printing the bill lets the user choose **Save as PDF** in the browser print dialog.