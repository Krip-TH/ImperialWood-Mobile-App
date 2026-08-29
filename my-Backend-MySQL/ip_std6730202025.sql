-- phpMyAdmin SQL Dump
-- version 5.2.1deb3
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Aug 29, 2026 at 10:27 AM
-- Server version: 8.0.46-0ubuntu0.24.04.3
-- PHP Version: 8.3.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ip_std6730202025`
--

-- --------------------------------------------------------

--
-- Table structure for table `IW_Carts`
--

CREATE TABLE `IW_Carts` (
  `cart_id` int NOT NULL,
  `user_id` int NOT NULL,
  `cart_status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `IW_Carts`
--

INSERT INTO `IW_Carts` (`cart_id`, `user_id`, `cart_status`, `created_at`, `updated_at`) VALUES
(2, 2, 'ordered', '2026-07-29 08:35:55.329739', '2026-07-29 08:58:09.513561');

-- --------------------------------------------------------

--
-- Table structure for table `IW_Cart_Items`
--

CREATE TABLE `IW_Cart_Items` (
  `cart_item_id` int NOT NULL,
  `cart_id` int NOT NULL,
  `product_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `unit_price` decimal(12,2) NOT NULL DEFAULT '0.00',
  `created_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `IW_Categories`
--

CREATE TABLE `IW_Categories` (
  `category_id` int NOT NULL,
  `category_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_icon` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category_status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `IW_Categories`
--

INSERT INTO `IW_Categories` (`category_id`, `category_name`, `category_icon`, `category_status`, `created_at`) VALUES
(1, 'Classic Doors', 'classic-doors', 'active', '2026-07-29 05:34:14.815731'),
(2, 'Modern Doors', 'modern-doors', 'active', '2026-07-29 05:34:14.815731'),
(3, 'Glass Panel Doors', 'glass-panel-doors', 'active', '2026-07-29 05:34:14.815731'),
(4, 'Interior Doors', 'interior-doors', 'active', '2026-07-29 05:34:14.815731'),
(5, 'Solid Wood Doors', 'solid-wood-doors', 'active', '2026-07-29 05:34:14.815731'),
(6, 'Entrance Doors', 'entrance-doors', 'active', '2026-07-29 05:34:14.815731'),
(7, 'Door Frames', 'door-frames', 'active', '2026-07-29 05:34:14.815731'),
(8, 'Accessories', 'accessories', 'active', '2026-07-29 05:34:14.815731');

-- --------------------------------------------------------

--
-- Table structure for table `IW_Favorites`
--

CREATE TABLE `IW_Favorites` (
  `user_id` int NOT NULL,
  `product_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `IW_Favorites`
--

INSERT INTO `IW_Favorites` (`user_id`, `product_id`, `created_at`) VALUES
(2, 'imperial-classic-oak-door', '2026-07-29 05:34:14.815731'),
(2, 'minimal-ash-interior-door', '2026-08-13 18:23:26.000000'),
(2, 'premium-teak-glass-panel-door', '2026-08-13 17:38:03.000000');

-- --------------------------------------------------------

--
-- Table structure for table `IW_Orders`
--

CREATE TABLE `IW_Orders` (
  `order_id` int NOT NULL,
  `order_number` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int NOT NULL,
  `store_id` int DEFAULT NULL,
  `order_date` datetime(6) DEFAULT NULL,
  `subtotal` decimal(12,2) NOT NULL DEFAULT '0.00',
  `shipping_fee` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `payment_method` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `order_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recipient_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recipient_phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shipping_address` text COLLATE utf8mb4_unicode_ci,
  `tracking_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `IW_Orders`
--

INSERT INTO `IW_Orders` (`order_id`, `order_number`, `user_id`, `store_id`, `order_date`, `subtotal`, `shipping_fee`, `total_amount`, `payment_method`, `payment_status`, `order_status`, `recipient_name`, `recipient_phone`, `shipping_address`, `tracking_number`, `created_at`, `updated_at`) VALUES
(1, 'IW-ORD-0001', 2, 1, '2026-07-29 05:34:14.815731', 18900.00, 150.00, 19050.00, 'Cash on Delivery', 'pending', 'confirmed', 'ImperialWood Customer', '0812345678', 'Phuket, Thailand', NULL, '2026-07-29 05:34:14.815731', '2026-07-29 05:34:14.815731'),
(2, 'IW-20260729084838296', 2, NULL, '2026-07-29 08:48:38.293240', 18900.00, 0.00, 18900.00, NULL, 'pending', 'confirmed', 'ImperialWood Customer', '0812345678', 'Not provided', NULL, '2026-07-29 08:48:38.293240', '2026-07-29 08:48:38.293240'),
(3, 'IW-20260729085809517', 2, NULL, '2026-07-29 08:58:09.513561', 24500.00, 0.00, 24500.00, NULL, 'pending', 'confirmed', 'ImperialWood Customer', '0812345678', 'Not provided', NULL, '2026-07-29 08:58:09.513561', '2026-07-29 08:58:09.513561'),
(4, 'IW-1786619960585', 2, 1, '2026-08-13 18:19:20.586000', 8900.00, 0.00, 8900.00, 'cash_on_delivery', 'pending', 'confirmed', 'ImperialWood Customer', '0812345678', 'Store pickup', NULL, '2026-08-13 18:19:20.586000', '2026-08-13 18:19:20.586000'),
(5, 'IW-1787754077869', 2, 1, '2026-08-26 21:21:17.871000', 31900.00, 0.00, 31900.00, 'cash_on_delivery', 'pending', 'confirmed', 'ImperialWood Customer', '0812345678', 'Store pickup', NULL, '2026-08-26 21:21:17.871000', '2026-08-26 21:21:17.871000'),
(6, 'IW-1787754133255', 2, 1, '2026-08-26 21:22:13.256000', 15900.00, 0.00, 15900.00, 'cash_on_delivery', 'pending', 'confirmed', 'ImperialWood Customer', '0812345678', 'Store pickup', NULL, '2026-08-26 21:22:13.256000', '2026-08-26 21:22:13.256000');

-- --------------------------------------------------------

--
-- Table structure for table `IW_Order_Items`
--

CREATE TABLE `IW_Order_Items` (
  `order_item_id` int NOT NULL,
  `order_id` int NOT NULL,
  `product_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `unit_price` decimal(12,2) NOT NULL DEFAULT '0.00',
  `line_total` decimal(12,2) NOT NULL DEFAULT '0.00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `IW_Order_Items`
--

INSERT INTO `IW_Order_Items` (`order_item_id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `line_total`) VALUES
(1, 1, 'imperial-classic-oak-door', 'Imperial Classic Oak Door', 1, 18900.00, 18900.00),
(2, 2, 'imperial-classic-oak-door', 'Imperial Classic Oak Door', 1, 18900.00, 18900.00),
(3, 3, 'modern-walnut-entrance-door', 'Modern Walnut Entrance Door', 1, 24500.00, 24500.00),
(4, 4, 'premium-teak-door-frame', 'Premium Teak Door Frame', 1, 8900.00, 8900.00),
(5, 5, 'walnut-frosted-glass-door', 'Walnut Frosted Glass Door', 1, 31900.00, 31900.00),
(6, 6, 'minimal-ash-interior-door', 'Minimal Ash Interior Door', 1, 15900.00, 15900.00);

-- --------------------------------------------------------

--
-- Table structure for table `IW_Products`
--

CREATE TABLE `IW_Products` (
  `product_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `item_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_id` int NOT NULL,
  `product_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `material` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `size` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `finish` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_stock` int NOT NULL DEFAULT '0',
  `badge_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location_count` int NOT NULL DEFAULT '0',
  `location_text` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `image_url` text COLLATE utf8mb4_unicode_ci,
  `product_status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `IW_Products`
--

INSERT INTO `IW_Products` (`product_id`, `item_code`, `category_id`, `product_name`, `material`, `size`, `finish`, `price`, `total_stock`, `badge_status`, `location_count`, `location_text`, `description`, `image_url`, `product_status`, `created_at`, `updated_at`) VALUES
('grand-mahogany-entrance-door', 'IW-010', 6, 'Grand Mahogany Entrance Door', 'Mahogany', '110 x 220 cm', 'Premium dark mahogany', 45900.00, 4, 'Available', 2, 'Available at 2 stores', 'An oversized mahogany entrance door designed to give refined homes a grand welcome.', 'https://raw.githubusercontent.com/Krip-TH/ImperialWood-Mobile-App/refs/heads/main/assets/products/grand-mahogany-entrance-door.jpg', 'active', '2026-07-29 05:34:14.815731', '2026-07-29 05:34:14.815731'),
('heritage-mahogany-solid-door', 'IW-006', 5, 'Heritage Mahogany Solid Door', 'Mahogany', '90 x 210 cm', 'Deep mahogany satin', 34900.00, 3, 'Low Stock', 1, 'Available at 1 store', 'A rich solid mahogany door with heritage proportions and a deep satin finish.', 'https://raw.githubusercontent.com/Krip-TH/ImperialWood-Mobile-App/refs/heads/main/assets/products/heritage-mahogany-solid-door.jpg', 'active', '2026-07-29 05:34:14.815731', '2026-07-29 05:34:14.815731'),
('imperial-brass-door-handle-set', 'IW-015', 8, 'Imperial Brass Door Handle Set', 'Brass', 'Standard', 'Brushed gold', 3900.00, 24, 'Available', 3, 'Available at 3 stores', 'A substantial brushed-gold brass handle set created to complement ImperialWood doors.', 'https://raw.githubusercontent.com/Krip-TH/ImperialWood-Mobile-App/refs/heads/main/assets/products/imperial-brass-door-handle-set.jpg', 'active', '2026-07-29 05:34:14.815731', '2026-07-29 05:34:14.815731'),
('minimal-ash-interior-door', 'IW-004', 4, 'Minimal Ash Interior Door', 'Ash', '70 x 200 cm', 'Light ash natural', 15900.00, 12, 'Available', 0, 'Available online only', 'A minimal interior door with a calm ash finish for modern rooms.', 'https://raw.githubusercontent.com/Krip-TH/ImperialWood-Mobile-App/refs/heads/main/assets/products/minimal-ash-interior-door.jpg', 'active', '2026-07-29 05:34:14.815731', '2026-07-29 05:34:14.815731'),
('modern-walnut-entrance-door', 'IW-002', 2, 'Modern Walnut Entrance Door', 'Walnut', '90 x 200 cm', 'Dark walnut matte', 20000.00, 5, 'Low Stock', 1, 'Available at 1 store', 'A bold modern door with clean lines and rich walnut character.', 'https://raw.githubusercontent.com/Krip-TH/ImperialWood-Mobile-App/refs/heads/main/assets/products/modern-walnut-entrance-door.jpg', 'active', '2026-07-29 05:34:14.815731', '2026-08-13 14:41:54.000000'),
('ooppp', 'IW-018', 6, 'Nindam', 'Oak', '80 x 200 cm', 'oak', 3000.00, 10, 'Available', 0, 'Online only', 'test', 'https://cdn.britannica.com/47/125047-050-49DC94DE/door-Esfahan-Iran.jpg', 'active', '2026-08-13 17:03:13.000000', '2026-08-27 09:42:23.000000'),
('premium-soft-close-hinge-set', 'IW-016', 8, 'Premium Soft-Close Hinge Set', 'Stainless Steel', 'Standard', 'Matte black', 2500.00, 30, 'Available', 0, 'Available online only', 'A durable matte-black stainless steel hinge set engineered for smooth, quiet closing.', 'https://raw.githubusercontent.com/Krip-TH/ImperialWood-Mobile-App/refs/heads/main/assets/products/premium-soft-close-hinge-set.jpg', 'active', '2026-07-29 05:34:14.815731', '2026-07-29 05:34:14.815731'),
('premium-teak-door-frame', 'IW-013', 7, 'Premium Teak Door Frame', 'Teak', 'For 90 x 200 cm door', 'Natural teak', 8900.00, 15, 'Available', 3, 'Available at 3 stores', 'A precision-made natural teak frame for a seamless premium door installation.', 'https://raw.githubusercontent.com/Krip-TH/ImperialWood-Mobile-App/refs/heads/main/assets/products/premium-teak-door-frame.jpg', 'active', '2026-07-29 05:34:14.815731', '2026-07-29 05:34:14.815731'),
('premium-teak-glass-panel-door', 'IW-003', 3, 'Premium Teak Glass Panel Door', 'Teak', '90 x 200 cm', 'Natural teak with clear glass', 29000.00, 4, 'Low Stock', 3, 'Available at 3 stores', 'Premium teak construction paired with a glass panel for bright, elegant spaces.', 'https://raw.githubusercontent.com/Krip-TH/ImperialWood-Mobile-App/refs/heads/main/assets/products/premium-teak-glass-panel-door.jpg', 'active', '2026-07-29 05:34:14.815731', '2026-08-26 21:25:20.000000'),
('secure-teak-pivot-door', 'IW-011', 6, 'Secure Teak Pivot Door', 'Teak', '120 x 240 cm', 'Natural teak with black hardware', 52900.00, 2, 'Low Stock', 1, 'Available at 1 store', 'A wide architectural pivot door combining natural teak with confident black hardware.', 'https://raw.githubusercontent.com/Krip-TH/ImperialWood-Mobile-App/refs/heads/main/assets/products/secure-teak-pivot-door.jpg', 'active', '2026-07-29 05:34:14.815731', '2026-07-29 05:34:14.815731'),
('victorian-carved-teak-door', 'IW-008', 1, 'Victorian Carved Teak Door', 'Teak', '100 x 210 cm', 'Hand-carved natural teak', 38900.00, 2, 'Low Stock', 1, 'Available at 1 store', 'A hand-carved teak design inspired by graceful Victorian architectural details.', 'https://raw.githubusercontent.com/Krip-TH/ImperialWood-Mobile-App/refs/heads/main/assets/products/victorian-carved-teak-door.jpg', 'active', '2026-07-29 05:34:14.815731', '2026-07-29 05:34:14.815731'),
('walnut-adjustable-door-frame', 'IW-014', 7, 'Walnut Adjustable Door Frame', 'Walnut', 'Adjustable 80-100 cm', 'Dark walnut', 10500.00, 9, 'Available', 2, 'Available at 2 stores', 'An adaptable dark walnut frame designed for refined installations across varied openings.', 'https://raw.githubusercontent.com/Krip-TH/ImperialWood-Mobile-App/refs/heads/main/assets/products/walnut-adjustable-door-frame.jpg', 'active', '2026-07-29 05:34:14.815731', '2026-07-29 05:34:14.815731'),
('walnut-frosted-glass-door', 'IW-009', 3, 'Walnut Frosted Glass Door', 'Walnut', '90 x 200 cm', 'Dark walnut with frosted glass', 31900.00, 5, 'Available', 3, 'Available at 3 stores', 'Dark walnut surrounds softly frosted glass for privacy with diffused natural light.', 'https://raw.githubusercontent.com/Krip-TH/ImperialWood-Mobile-App/refs/heads/main/assets/products/walnut-frosted-glass-door.jpg', 'active', '2026-07-29 05:34:14.815731', '2026-07-29 05:34:14.815731'),
('white-oak-groove-interior-door', 'IW-012', 4, 'White Oak Groove Interior Door', 'Oak', '80 x 200 cm', 'Light white oak', 17900.00, 10, 'Available', 0, 'Available online only', 'Fine vertical grooves bring subtle rhythm to this bright white oak interior door.', 'https://raw.githubusercontent.com/Krip-TH/ImperialWood-Mobile-App/refs/heads/main/assets/products/white-oak-groove-interior-door.jpg', 'active', '2026-07-29 05:34:14.815731', '2026-07-29 05:34:14.815731');

-- --------------------------------------------------------

--
-- Table structure for table `IW_Stores`
--

CREATE TABLE `IW_Stores` (
  `store_id` int NOT NULL,
  `store_code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `store_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `country` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `business_days` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `opening_time` time DEFAULT NULL,
  `closing_time` time DEFAULT NULL,
  `closed_day` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `timezone` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `store_status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `employees` int DEFAULT NULL,
  `customer_satisfaction` decimal(5,2) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `IW_Stores`
--

INSERT INTO `IW_Stores` (`store_id`, `store_code`, `store_name`, `city`, `country`, `business_days`, `opening_time`, `closing_time`, `closed_day`, `timezone`, `store_status`, `employees`, `customer_satisfaction`, `created_at`, `updated_at`) VALUES
(1, 'PHK', 'ImperialWood Phuket', 'Phuket', 'Thailand', 'Monday - Saturday', '09:00:00', '18:00:00', 'Sunday', 'Asia/Bangkok', 'active', 17, 96.00, '2026-07-29 05:34:14.815731', '2026-08-06 16:02:58.537168'),
(2, 'MEL', 'ImperialWood Melbourne', 'Melbourne', 'Australia', 'Monday - Friday', '09:00:00', '17:30:00', 'Saturday and Sunday', 'Australia/Melbourne', 'active', 22, 94.00, '2026-07-29 05:34:14.815731', '2026-07-29 05:34:14.815731'),
(3, 'NYC', 'ImperialWood New York City', 'New York City', 'USA', 'Monday - Saturday', '10:00:00', '19:00:00', 'Sunday', 'America/New_York', 'active', 27, 92.00, '2026-07-29 05:34:14.815731', '2026-07-29 05:34:14.815731');

-- --------------------------------------------------------

--
-- Table structure for table `IW_Store_Inventory`
--

CREATE TABLE `IW_Store_Inventory` (
  `store_id` int NOT NULL,
  `product_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL DEFAULT '0',
  `inventory_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `IW_Store_Inventory`
--

INSERT INTO `IW_Store_Inventory` (`store_id`, `product_id`, `quantity`, `inventory_status`, `updated_at`) VALUES
(1, 'grand-mahogany-entrance-door', 2, 'low_stock', '2026-07-29 05:34:14.815731'),
(1, 'heritage-mahogany-solid-door', 3, 'available', '2026-07-29 05:34:14.815731'),
(1, 'imperial-brass-door-handle-set', 8, 'available', '2026-07-29 05:34:14.815731'),
(1, 'imperial-classic-oak-door', 4, 'available', '2026-07-29 05:34:14.815731'),
(1, 'modern-walnut-entrance-door', 5, 'available', '2026-07-29 05:34:14.815731'),
(1, 'premium-teak-door-frame', 5, 'available', '2026-07-29 05:34:14.815731'),
(1, 'premium-teak-glass-panel-door', 2, 'low_stock', '2026-07-29 05:34:14.815731'),
(1, 'secure-teak-pivot-door', 2, 'low_stock', '2026-07-29 05:34:14.815731'),
(1, 'victorian-carved-teak-door', 2, 'low_stock', '2026-07-29 05:34:14.815731'),
(1, 'walnut-adjustable-door-frame', 5, 'available', '2026-07-29 05:34:14.815731'),
(1, 'walnut-frosted-glass-door', 2, 'low_stock', '2026-07-29 05:34:14.815731'),
(2, 'grand-mahogany-entrance-door', 2, 'low_stock', '2026-07-29 05:34:14.815731'),
(2, 'imperial-brass-door-handle-set', 8, 'available', '2026-07-29 05:34:14.815731'),
(2, 'imperial-classic-oak-door', 4, 'available', '2026-07-29 05:34:14.815731'),
(2, 'premium-teak-door-frame', 5, 'available', '2026-07-29 05:34:14.815731'),
(2, 'premium-teak-glass-panel-door', 1, 'low_stock', '2026-07-29 05:34:14.815731'),
(2, 'walnut-adjustable-door-frame', 4, 'available', '2026-07-29 05:34:14.815731'),
(2, 'walnut-frosted-glass-door', 2, 'low_stock', '2026-07-29 05:34:14.815731'),
(3, 'imperial-brass-door-handle-set', 8, 'available', '2026-07-29 05:34:14.815731'),
(3, 'premium-teak-door-frame', 5, 'available', '2026-07-29 05:34:14.815731'),
(3, 'premium-teak-glass-panel-door', 1, 'low_stock', '2026-07-29 05:34:14.815731'),
(3, 'walnut-frosted-glass-door', 1, 'low_stock', '2026-07-29 05:34:14.815731');

-- --------------------------------------------------------

--
-- Table structure for table `IW_Store_Photos`
--

CREATE TABLE `IW_Store_Photos` (
  `photo_id` int NOT NULL,
  `store_id` int NOT NULL,
  `photo_url` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `IW_Store_Photos`
--

INSERT INTO `IW_Store_Photos` (`photo_id`, `store_id`, `photo_url`, `sort_order`, `created_at`) VALUES
(1, 1, 'assets/stores/phuket-1.jpg', 1, '2026-07-29 05:34:14.815731'),
(2, 1, 'assets/stores/phuket-2.jpg', 2, '2026-07-29 05:34:14.815731'),
(3, 1, 'assets/stores/phuket-3.jpg', 3, '2026-07-29 05:34:14.815731'),
(4, 2, 'assets/stores/melbourne-1.jpg', 1, '2026-07-29 05:34:14.815731'),
(5, 2, 'assets/stores/melbourne-2.jpg', 2, '2026-07-29 05:34:14.815731'),
(6, 2, 'assets/stores/melbourne-3.jpg', 3, '2026-07-29 05:34:14.815731'),
(7, 3, 'assets/stores/new-york-1.jpg', 1, '2026-07-29 05:34:14.815731'),
(8, 3, 'assets/stores/new-york-2.jpg', 2, '2026-07-29 05:34:14.815731'),
(9, 3, 'assets/stores/new-york-3.jpg', 3, '2026-07-29 05:34:14.815731');

-- --------------------------------------------------------

--
-- Table structure for table `IW_Users`
--

CREATE TABLE `IW_Users` (
  `user_id` int NOT NULL,
  `customer_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `full_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(190) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `auth_user_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `IW_Users`
--

INSERT INTO `IW_Users` (`user_id`, `customer_code`, `full_name`, `username`, `email`, `phone`, `password_hash`, `role`, `account_status`, `created_at`, `updated_at`, `auth_user_id`) VALUES
(1, NULL, 'Krip Topongkasem', 'Krip', 'krip@imperialwood.demo', NULL, '$2b$10$U6Q6vapJ.M0xM3/o0Au99uULgAfD3hY0g8Cbj8Cm5KjCB4HJylJCK', 'admin', 'active', '2026-07-29 05:34:14.815731', '2026-07-29 07:27:16.821047', 'ddbe72c9-f2f7-4bd6-a97b-54ea569f36c7'),
(2, 'CUS-001', 'ImperialWood Customer', 'customer', 'customer@imperialwood.demo', '0812345678', '$2a$06$o3fYyxLGl5JpoEVi//oeJORjGbUcFEw.wbFlxPm2g3ihtRebQ.JAy', 'client', 'active', '2026-07-29 05:34:14.815731', '2026-07-29 08:19:07.295416', '9fd60c6f-d921-4529-908d-1cb61ad9d7db');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `IW_Carts`
--
ALTER TABLE `IW_Carts`
  ADD PRIMARY KEY (`cart_id`),
  ADD KEY `idx_carts_user` (`user_id`);

--
-- Indexes for table `IW_Cart_Items`
--
ALTER TABLE `IW_Cart_Items`
  ADD PRIMARY KEY (`cart_item_id`),
  ADD UNIQUE KEY `uq_cart_product` (`cart_id`,`product_id`),
  ADD KEY `idx_cart_items_product` (`product_id`);

--
-- Indexes for table `IW_Categories`
--
ALTER TABLE `IW_Categories`
  ADD PRIMARY KEY (`category_id`);

--
-- Indexes for table `IW_Favorites`
--
ALTER TABLE `IW_Favorites`
  ADD PRIMARY KEY (`user_id`,`product_id`),
  ADD KEY `idx_favorites_product` (`product_id`);

--
-- Indexes for table `IW_Orders`
--
ALTER TABLE `IW_Orders`
  ADD PRIMARY KEY (`order_id`),
  ADD UNIQUE KEY `uq_orders_number` (`order_number`),
  ADD KEY `idx_orders_user` (`user_id`),
  ADD KEY `idx_orders_store` (`store_id`);

--
-- Indexes for table `IW_Order_Items`
--
ALTER TABLE `IW_Order_Items`
  ADD PRIMARY KEY (`order_item_id`),
  ADD KEY `idx_order_items_order` (`order_id`),
  ADD KEY `idx_order_items_product` (`product_id`);

--
-- Indexes for table `IW_Products`
--
ALTER TABLE `IW_Products`
  ADD PRIMARY KEY (`product_id`),
  ADD UNIQUE KEY `uq_products_item_code` (`item_code`),
  ADD KEY `idx_products_category_id` (`category_id`);

--
-- Indexes for table `IW_Stores`
--
ALTER TABLE `IW_Stores`
  ADD PRIMARY KEY (`store_id`),
  ADD UNIQUE KEY `uq_stores_code` (`store_code`);

--
-- Indexes for table `IW_Store_Inventory`
--
ALTER TABLE `IW_Store_Inventory`
  ADD PRIMARY KEY (`store_id`,`product_id`),
  ADD KEY `idx_inventory_product` (`product_id`);

--
-- Indexes for table `IW_Store_Photos`
--
ALTER TABLE `IW_Store_Photos`
  ADD PRIMARY KEY (`photo_id`),
  ADD KEY `idx_store_photos_store` (`store_id`);

--
-- Indexes for table `IW_Users`
--
ALTER TABLE `IW_Users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `uq_users_username` (`username`),
  ADD UNIQUE KEY `uq_users_email` (`email`),
  ADD UNIQUE KEY `uq_users_customer_code` (`customer_code`),
  ADD UNIQUE KEY `uq_users_auth_user_id` (`auth_user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `IW_Cart_Items`
--
ALTER TABLE `IW_Cart_Items`
  MODIFY `cart_item_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
