-- Run against the selected resturant_management database. This is safe to rerun.
SET @database_name = DATABASE();
SET @has_waiter_id = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @database_name
    AND table_name = 'restaurant_tables'
    AND column_name = 'waiter_id'
);
SET @migration_sql = IF(
  @has_waiter_id = 0,
  'ALTER TABLE restaurant_tables ADD COLUMN waiter_id INT(11) DEFAULT NULL, ADD KEY waiter_id (waiter_id)',
  'SELECT ''restaurant_tables.waiter_id already exists'''
);
PREPARE migration_statement FROM @migration_sql;
EXECUTE migration_statement;
DEALLOCATE PREPARE migration_statement;

CREATE TABLE IF NOT EXISTS reviews (
  review_id INT(11) NOT NULL AUTO_INCREMENT,
  customer_id INT(11) DEFAULT NULL,
  reviewer_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  category VARCHAR(30) NOT NULL,
  rating TINYINT(3) UNSIGNED NOT NULL,
  review_text TEXT NOT NULL,
  approved TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (review_id),
  KEY customer_id (customer_id),
  KEY approved_created_at (approved, created_at),
  CONSTRAINT reviews_ibfk_1 FOREIGN KEY (customer_id) REFERENCES users (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
