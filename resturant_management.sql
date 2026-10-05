-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 05, 2026 at 08:54 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `resturant_management`
--

-- --------------------------------------------------------

--
-- Table structure for table `attendance`
--

CREATE TABLE `attendance` (
  `attendance_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `clock_in` datetime NOT NULL,
  `clock_out` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `attendance`
--

INSERT INTO `attendance` (`attendance_id`, `employee_id`, `clock_in`, `clock_out`) VALUES
(1, 2, '2026-10-01 10:00:00', '2026-10-01 18:00:00'),
(2, 3, '2026-10-01 09:00:00', '2026-10-01 17:00:00'),
(3, 2, '2026-10-02 10:00:00', '2026-10-01 18:32:52'),
(4, 3, '2026-10-02 09:00:00', '2026-10-05 22:12:06'),
(5, 2, '2026-10-01 18:32:53', '2026-10-01 19:29:58'),
(6, 2, '2026-10-01 19:30:01', '2026-10-01 19:30:02'),
(7, 2, '2026-10-01 19:30:03', '2026-10-01 19:30:04'),
(8, 2, '2026-10-01 19:34:49', '2026-10-01 19:34:50'),
(9, 2, '2026-10-01 19:46:38', '2026-10-01 19:47:04'),
(10, 2, '2026-10-01 19:47:07', '2026-10-01 19:48:31'),
(11, 2, '2026-10-01 19:50:02', '2026-10-05 22:16:05'),
(12, 3, '2026-10-05 22:12:07', NULL),
(13, 2, '2026-10-05 22:16:09', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `bills`
--

CREATE TABLE `bills` (
  `bill_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `tax` decimal(10,2) NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `payment_status` enum('pending','paid') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `bills`
--

INSERT INTO `bills` (`bill_id`, `order_id`, `subtotal`, `tax`, `total`, `payment_status`, `created_at`) VALUES
(1, 1, 870.00, 43.50, 913.50, 'pending', '2026-10-01 07:41:20'),
(2, 3, 580.00, 29.00, 609.00, 'paid', '2026-10-01 07:41:20'),
(3, 4, 780.00, 39.00, 819.00, 'pending', '2026-10-01 12:33:23'),
(4, 5, 1470.00, 73.50, 1543.50, 'pending', '2026-10-01 13:02:26'),
(5, 6, 180.00, 9.00, 189.00, 'pending', '2026-10-01 13:02:37'),
(6, 7, 450.00, 22.50, 472.50, 'pending', '2026-10-01 13:15:12'),
(7, 8, 2250.00, 112.50, 2362.50, 'pending', '2026-10-01 13:22:56'),
(8, 9, 840.00, 42.00, 882.00, 'pending', '2026-10-01 13:24:53'),
(9, 10, 120.00, 6.00, 126.00, 'pending', '2026-10-01 13:29:54'),
(10, 11, 840.00, 42.00, 882.00, 'pending', '2026-10-01 13:47:57'),
(11, 12, 1870.00, 93.50, 1963.50, 'pending', '2026-10-01 13:50:46'),
(12, 13, 420.00, 21.00, 441.00, 'pending', '2026-10-01 14:14:37'),
(13, 14, 180.00, 9.00, 189.00, 'pending', '2026-10-01 14:22:42'),
(14, 15, 420.00, 21.00, 441.00, 'pending', '2026-10-05 15:42:44');

-- --------------------------------------------------------

--
-- Table structure for table `chat_messages`
--

CREATE TABLE `chat_messages` (
  `message_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) DEFAULT NULL,
  `message` text NOT NULL,
  `sent_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `chat_messages`
--

INSERT INTO `chat_messages` (`message_id`, `sender_id`, `receiver_id`, `message`, `sent_at`) VALUES
(1, 4, 1, 'Hello! I have a question about my reservation.', '2026-10-01 07:41:20'),
(2, 1, 4, 'Hello! How can we help you today?', '2026-10-01 07:41:20'),
(3, 4, 1, 'Can I change my reservation time to 8:30 PM?', '2026-10-01 07:41:20'),
(4, 1, 4, 'Yes, we can check the available tables for you.', '2026-10-01 07:41:20');

-- --------------------------------------------------------

--
-- Table structure for table `menu_items`
--

CREATE TABLE `menu_items` (
  `item_id` int(11) NOT NULL,
  `item_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `category` varchar(50) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `is_customizable` tinyint(1) DEFAULT 0,
  `approved` tinyint(1) DEFAULT 0,
  `available` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `menu_items`
--

INSERT INTO `menu_items` (`item_id`, `item_name`, `description`, `price`, `category`, `image`, `is_customizable`, `approved`, `available`) VALUES
(1, 'Margherita Pizza', 'Prepare dough, add tomato sauce, mozzarella and basil. Bake until crispy.', 450.00, 'Pizza', 'pizza.jpg', 1, 1, 1),
(2, 'Beef Burger', 'Grill beef patty, prepare bun and vegetables, add cheese and assemble burger.', 420.00, 'Burger', 'burger.jpg', 1, 1, 1),
(3, 'Chicken Alfredo', 'Cook pasta, prepare Alfredo sauce and add grilled chicken.', 420.00, 'Pasta', 'alfredo.jpg', 0, 1, 1),
(4, 'Chicken Biryani', 'Prepare rice and chicken separately, then cook together with spices.', 280.00, 'Main Course', 'biryani.jpg', 0, 1, 1),
(5, 'Chocolate Cake', 'Soft chocolate cake with chocolate frosting.', 180.00, 'Dessert', 'cake.jpg', 0, 1, 1),
(6, 'Mango Juice', 'Fresh mango juice.', 120.00, 'Drinks', 'mango-juice.jpg', 0, 1, 1),
(7, 'New Special Pizza', 'Special pizza awaiting admin approval.', 550.00, 'Pizza', 'special-pizza.jpg', 1, 1, 1),
(8, 'meow burger', 'nope', 0.00, 'Burger', NULL, 1, 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `order_id` int(11) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `waiter_id` int(11) DEFAULT NULL,
  `table_id` int(11) DEFAULT NULL,
  `order_time` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('Placed','In Kitchen','Ready','Served','Delivered','Paid') DEFAULT 'Placed',
  `total_amount` decimal(10,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`order_id`, `customer_id`, `waiter_id`, `table_id`, `order_time`, `status`, `total_amount`) VALUES
(1, 4, 2, 4, '2026-10-01 07:41:20', 'In Kitchen', 870.00),
(2, 4, NULL, NULL, '2026-10-01 07:41:20', 'In Kitchen', 420.00),
(3, 5, 2, 2, '2026-10-01 07:41:20', 'Served', 580.00),
(4, NULL, 2, 2, '2026-10-01 12:33:23', 'In Kitchen', 780.00),
(5, 4, NULL, NULL, '2026-10-01 13:02:26', 'Placed', 1470.00),
(6, 4, NULL, NULL, '2026-10-01 13:02:37', 'Placed', 180.00),
(7, 4, NULL, NULL, '2026-10-01 13:15:12', 'Placed', 450.00),
(8, 4, NULL, NULL, '2026-10-01 13:22:56', 'Placed', 2250.00),
(9, 4, NULL, NULL, '2026-10-01 13:24:53', 'Placed', 840.00),
(10, NULL, 2, 2, '2026-10-01 13:29:54', 'Placed', 120.00),
(11, NULL, 2, 5, '2026-10-01 13:47:57', 'Placed', 840.00),
(12, 4, 2, NULL, '2026-10-01 13:50:46', 'Placed', 1870.00),
(13, 4, NULL, NULL, '2026-10-01 14:14:37', 'Placed', 420.00),
(14, 4, NULL, NULL, '2026-10-01 14:22:42', 'Placed', 180.00),
(15, 4, NULL, NULL, '2026-10-05 15:42:44', 'Placed', 420.00);

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `order_item_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `unit_price` decimal(10,2) NOT NULL,
  `customization` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`order_item_id`, `order_id`, `item_id`, `quantity`, `unit_price`, `customization`) VALUES
(1, 1, 1, 1, 450.00, NULL),
(2, 1, 2, 1, 420.00, 'Extra cheese'),
(3, 2, 2, 1, 420.00, NULL),
(4, 3, 4, 1, 280.00, NULL),
(5, 3, 5, 1, 180.00, NULL),
(6, 3, 6, 1, 120.00, NULL),
(7, 4, 5, 3, 180.00, ''),
(8, 4, 6, 2, 120.00, ''),
(9, 5, 2, 2, 420.00, ''),
(10, 5, 1, 1, 450.00, ''),
(11, 5, 5, 1, 180.00, ''),
(12, 6, 5, 1, 180.00, ''),
(13, 7, 1, 1, 450.00, ''),
(14, 8, 1, 5, 450.00, ''),
(15, 9, 2, 1, 420.00, ''),
(16, 9, 2, 1, 420.00, 'Size: Regular, Base: Regular, Topping: None, Sauce: Tomato sauce'),
(17, 10, 6, 1, 120.00, ''),
(18, 11, 2, 1, 420.00, ''),
(19, 11, 3, 1, 420.00, ''),
(20, 12, 2, 1, 420.00, NULL),
(21, 12, 5, 1, 180.00, NULL),
(22, 12, 6, 1, 120.00, NULL),
(23, 12, 4, 1, 280.00, NULL),
(24, 12, 3, 1, 420.00, NULL),
(25, 12, 1, 1, 450.00, NULL),
(26, 13, 2, 1, 420.00, ''),
(27, 14, 5, 1, 180.00, ''),
(28, 15, 2, 1, 420.00, '');

-- --------------------------------------------------------

--
-- Table structure for table `order_service_details`
--

CREATE TABLE `order_service_details` (
  `order_id` int(11) NOT NULL,
  `customer_name` varchar(160) NOT NULL DEFAULT 'Walk-in',
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_service_details`
--

INSERT INTO `order_service_details` (`order_id`, `customer_name`, `notes`) VALUES
(4, 'eedf', ''),
(5, 'Alex', ''),
(6, 'Alex', '');

-- --------------------------------------------------------

--
-- Table structure for table `recipes`
--

CREATE TABLE `recipes` (
  `recipe_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `chef_id` int(11) NOT NULL,
  `instructions` text DEFAULT NULL,
  `preparation_time` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `recipes`
--

INSERT INTO `recipes` (`recipe_id`, `item_id`, `chef_id`, `instructions`, `preparation_time`) VALUES
(1, 1, 3, 'Prepare dough, add tomato sauce, mozzarella and basil. Bake until crispy.', 20),
(2, 2, 3, 'Grill beef patty, prepare bun and vegetables, add cheese and assemble burger.', 15),
(3, 3, 3, 'Cook pasta, prepare Alfredo sauce and add grilled chicken.', 18),
(4, 4, 3, 'Prepare rice and chicken separately, then cook together with spices.', 30),
(5, 8, 3, 'nope', 12);

-- --------------------------------------------------------

--
-- Table structure for table `reservations`
--

CREATE TABLE `reservations` (
  `reservation_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `table_id` int(11) NOT NULL,
  `reservation_date` date NOT NULL,
  `reservation_time` time NOT NULL,
  `guests` int(11) NOT NULL,
  `status` enum('pending','confirmed','cancelled','completed') DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `reservations`
--

INSERT INTO `reservations` (`reservation_id`, `customer_id`, `table_id`, `reservation_date`, `reservation_time`, `guests`, `status`) VALUES
(1, 4, 4, '2026-10-02', '20:00:00', 4, 'confirmed'),
(2, 5, 2, '2026-10-03', '19:30:00', 3, 'pending'),
(3, 4, 2, '2026-10-02', '20:00:00', 2, 'pending');

-- --------------------------------------------------------

--
-- Table structure for table `restaurant_tables`
--

CREATE TABLE `restaurant_tables` (
  `table_id` int(11) NOT NULL,
  `table_number` int(11) NOT NULL,
  `capacity` int(11) NOT NULL,
  `waiter_id` int(11) DEFAULT NULL,
  `status` enum('available','occupied') DEFAULT 'available'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `restaurant_tables`
--

INSERT INTO `restaurant_tables` (`table_id`, `table_number`, `capacity`, `waiter_id`, `status`) VALUES
(1, 1, 2, NULL, 'available'),
(2, 2, 4, NULL, 'occupied'),
(3, 3, 4, NULL, 'occupied'),
(4, 4, 4, NULL, 'available'),
(5, 5, 6, NULL, 'occupied'),
(6, 6, 8, NULL, 'available');

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `review_id` int(11) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `reviewer_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `category` varchar(30) NOT NULL,
  `rating` tinyint(3) UNSIGNED NOT NULL,
  `review_text` text NOT NULL,
  `approved` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','waiter','chef','customer') NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `approved` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `name`, `email`, `password`, `role`, `phone`, `approved`, `created_at`) VALUES
(1, 'Ratul', 'admin@uiu.com', '$2y$10$9yUrdUCu6ssY9R0TcjGU1exA76K7f3PVKGgBbwgWiFvrOpoXogffi', 'admin', '01711111111', 1, '2026-10-01 07:41:20'),
(2, 'Rahim Ahmed', 'waiter@uiu.com', '$2y$10$fL2nw1xf4om/R5AzQTFn0euqnRN.G5EeTuUHaZbasRU1SJajxCzgK', 'waiter', '01722222222', 1, '2026-10-01 07:41:20'),
(3, 'Karim Hasan', 'chef@uiu.com', '$2y$10$fhmODVWw2jpRyEHLxNx6D.Fxbi/PJpUEm5aDDB60qEuYstGBE0w5O', 'chef', '01733333333', 1, '2026-10-01 07:41:20'),
(4, 'Alex', 'alex@gmail.com', '$2y$10$HMc9YmKrQ7Gy6aqUEIDGyeTnU3xADWl/ZgGcBm4ZS4Og0J2UPG7i6', 'customer', '01744444444', 1, '2026-10-01 07:41:20'),
(5, 'Nusrat Jahan', 'nusrat@gmail.com', 'nusrat123', 'customer', '01755555555', 0, '2026-10-01 07:41:20'),
(7, 'sami mazid', 'mazid@gmail.com', '$2y$10$sG2wQ5B9Jeclc5m6bMwboOkyDbYpVV.XqWFNV97ErgeDPfJn6cI6S', 'customer', NULL, 1, '2026-10-01 14:00:44'),
(8, 'sami', 'sami@gmail.com', '$2y$10$8JwHQcp7NZ3IgNXX7JsE7eL3mAqKhyJp.7KPNVUuKsmDnqhsnFhT2', 'waiter', NULL, 1, '2026-10-05 17:42:15');

-- --------------------------------------------------------

--
-- Table structure for table `waiter_table_assignments`
--

CREATE TABLE `waiter_table_assignments` (
  `assignment_id` int(10) UNSIGNED NOT NULL,
  `table_id` int(11) NOT NULL,
  `waiter_id` int(11) NOT NULL,
  `assigned_at` datetime NOT NULL DEFAULT current_timestamp(),
  `released_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `waiter_table_assignments`
--

INSERT INTO `waiter_table_assignments` (`assignment_id`, `table_id`, `waiter_id`, `assigned_at`, `released_at`) VALUES
(1, 2, 2, '2026-10-01 18:33:19', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `attendance`
--
ALTER TABLE `attendance`
  ADD PRIMARY KEY (`attendance_id`),
  ADD KEY `employee_id` (`employee_id`);

--
-- Indexes for table `bills`
--
ALTER TABLE `bills`
  ADD PRIMARY KEY (`bill_id`),
  ADD UNIQUE KEY `order_id` (`order_id`);

--
-- Indexes for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`message_id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `receiver_id` (`receiver_id`);

--
-- Indexes for table `menu_items`
--
ALTER TABLE `menu_items`
  ADD PRIMARY KEY (`item_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`order_id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `waiter_id` (`waiter_id`),
  ADD KEY `table_id` (`table_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`order_item_id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `item_id` (`item_id`);

--
-- Indexes for table `order_service_details`
--
ALTER TABLE `order_service_details`
  ADD PRIMARY KEY (`order_id`);

--
-- Indexes for table `recipes`
--
ALTER TABLE `recipes`
  ADD PRIMARY KEY (`recipe_id`),
  ADD KEY `item_id` (`item_id`),
  ADD KEY `chef_id` (`chef_id`);

--
-- Indexes for table `reservations`
--
ALTER TABLE `reservations`
  ADD PRIMARY KEY (`reservation_id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `table_id` (`table_id`);

--
-- Indexes for table `restaurant_tables`
--
ALTER TABLE `restaurant_tables`
  ADD PRIMARY KEY (`table_id`),
  ADD UNIQUE KEY `table_number` (`table_number`),
  ADD KEY `fk_table_waiter` (`waiter_id`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`review_id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `approved_created_at` (`approved`,`created_at`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `waiter_table_assignments`
--
ALTER TABLE `waiter_table_assignments`
  ADD PRIMARY KEY (`assignment_id`),
  ADD KEY `idx_open_table_assignment` (`table_id`,`released_at`),
  ADD KEY `idx_open_waiter_assignment` (`waiter_id`,`released_at`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `attendance`
--
ALTER TABLE `attendance`
  MODIFY `attendance_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `bills`
--
ALTER TABLE `bills`
  MODIFY `bill_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `chat_messages`
--
ALTER TABLE `chat_messages`
  MODIFY `message_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `menu_items`
--
ALTER TABLE `menu_items`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `order_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `order_item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `recipes`
--
ALTER TABLE `recipes`
  MODIFY `recipe_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `reservations`
--
ALTER TABLE `reservations`
  MODIFY `reservation_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `restaurant_tables`
--
ALTER TABLE `restaurant_tables`
  MODIFY `table_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `review_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `waiter_table_assignments`
--
ALTER TABLE `waiter_table_assignments`
  MODIFY `assignment_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `attendance`
--
ALTER TABLE `attendance`
  ADD CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `bills`
--
ALTER TABLE `bills`
  ADD CONSTRAINT `bills_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`);

--
-- Constraints for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD CONSTRAINT `chat_messages_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `chat_messages_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`waiter_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `orders_ibfk_3` FOREIGN KEY (`table_id`) REFERENCES `restaurant_tables` (`table_id`);

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`),
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `menu_items` (`item_id`);

--
-- Constraints for table `order_service_details`
--
ALTER TABLE `order_service_details`
  ADD CONSTRAINT `fk_order_service_details_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE;

--
-- Constraints for table `recipes`
--
ALTER TABLE `recipes`
  ADD CONSTRAINT `recipes_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `menu_items` (`item_id`),
  ADD CONSTRAINT `recipes_ibfk_2` FOREIGN KEY (`chef_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `reservations`
--
ALTER TABLE `reservations`
  ADD CONSTRAINT `reservations_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `reservations_ibfk_2` FOREIGN KEY (`table_id`) REFERENCES `restaurant_tables` (`table_id`);

--
-- Constraints for table `restaurant_tables`
--
ALTER TABLE `restaurant_tables`
  ADD CONSTRAINT `fk_table_waiter` FOREIGN KEY (`waiter_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `waiter_table_assignments`
--
ALTER TABLE `waiter_table_assignments`
  ADD CONSTRAINT `fk_waiter_assignment_table` FOREIGN KEY (`table_id`) REFERENCES `restaurant_tables` (`table_id`),
  ADD CONSTRAINT `fk_waiter_assignment_user` FOREIGN KEY (`waiter_id`) REFERENCES `users` (`user_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
