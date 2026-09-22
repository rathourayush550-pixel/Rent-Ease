-- ====================================================================
-- RentEase: Complete Rental & Property Management System
-- Normalized MySQL 8.0 Relational Database Schema
-- Suitable for College Project Evaluation & Production Deployment
-- ====================================================================

CREATE DATABASE IF NOT EXISTS `rentease_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `rentease_db`;

-- 1. USERS TABLE
-- Handles Tenants, Owners/Landlords, and Administrators
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('tenant', 'owner', 'admin') NOT NULL DEFAULT 'tenant',
  `phone` VARCHAR(20) NULL,
  `avatar` VARCHAR(500) NULL,
  `bio` TEXT NULL,
  `is_verified` BOOLEAN NOT NULL DEFAULT FALSE,
  `is_blocked` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB;

-- 2. PROPERTIES TABLE
CREATE TABLE IF NOT EXISTS `properties` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `owner_id` INT NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT NOT NULL,
  `address` VARCHAR(255) NOT NULL,
  `city` VARCHAR(100) NOT NULL,
  `state` VARCHAR(100) NOT NULL,
  `zip_code` VARCHAR(20) NOT NULL,
  `property_type` ENUM('Apartment', 'House', 'Villa', 'Studio', 'Condo', 'Townhouse') NOT NULL DEFAULT 'Apartment',
  `monthly_rent` DECIMAL(10, 2) NOT NULL,
  `security_deposit` DECIMAL(10, 2) NOT NULL,
  `furnished_status` ENUM('Furnished', 'Semi-Furnished', 'Unfurnished') NOT NULL DEFAULT 'Furnished',
  `bedrooms` INT NOT NULL DEFAULT 1,
  `bathrooms` INT NOT NULL DEFAULT 1,
  `area_sqft` INT NOT NULL DEFAULT 600,
  `is_available` BOOLEAN NOT NULL DEFAULT TRUE,
  `approval_status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved',
  `rejection_reason` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_prop_city` (`city`),
  INDEX `idx_prop_type` (`property_type`),
  INDEX `idx_prop_price` (`monthly_rent`),
  INDEX `idx_prop_approval` (`approval_status`)
) ENGINE=InnoDB;

-- 3. PROPERTY IMAGES TABLE
CREATE TABLE IF NOT EXISTS `property_images` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `property_id` INT NOT NULL,
  `image_url` VARCHAR(500) NOT NULL,
  `is_primary` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE CASCADE,
  INDEX `idx_img_property` (`property_id`)
) ENGINE=InnoDB;

-- 4. AMENITIES TABLE
CREATE TABLE IF NOT EXISTS `amenities` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(80) NOT NULL UNIQUE,
  `icon` VARCHAR(50) NOT NULL DEFAULT 'CheckCircle',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 5. PROPERTY_AMENITIES JUNCTION TABLE (Normalized M:N)
CREATE TABLE IF NOT EXISTS `property_amenities` (
  `property_id` INT NOT NULL,
  `amenity_id` INT NOT NULL,
  PRIMARY KEY (`property_id`, `amenity_id`),
  FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`amenity_id`) REFERENCES `amenities`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. BOOKINGS TABLE (Rental Booking Requests)
CREATE TABLE IF NOT EXISTS `bookings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `property_id` INT NOT NULL,
  `tenant_id` INT NOT NULL,
  `move_in_date` DATE NOT NULL,
  `lease_duration_months` INT NOT NULL DEFAULT 12,
  `occupants_count` INT NOT NULL DEFAULT 1,
  `status` ENUM('pending', 'accepted', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
  `message` TEXT NULL,
  `rejection_note` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tenant_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_booking_tenant` (`tenant_id`),
  INDEX `idx_booking_status` (`status`)
) ENGINE=InnoDB;

-- 7. RENTALS TABLE (Active & Past Tenancies)
CREATE TABLE IF NOT EXISTS `rentals` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `booking_id` INT NOT NULL UNIQUE,
  `property_id` INT NOT NULL,
  `tenant_id` INT NOT NULL,
  `owner_id` INT NOT NULL,
  `monthly_rent` DECIMAL(10, 2) NOT NULL,
  `security_deposit` DECIMAL(10, 2) NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `status` ENUM('active', 'completed', 'terminated') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tenant_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_rentals_status` (`status`)
) ENGINE=InnoDB;

-- 8. PAYMENTS TABLE (Rent Tracking & Security Deposits)
CREATE TABLE IF NOT EXISTS `payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `rental_id` INT NOT NULL,
  `tenant_id` INT NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `payment_type` ENUM('Rent', 'Security Deposit', 'Maintenance Fee', 'Other') NOT NULL DEFAULT 'Rent',
  `month_year` VARCHAR(20) NOT NULL,
  `payment_method` ENUM('Credit Card', 'Bank Transfer', 'UPI', 'Debit Card', 'Cash') NOT NULL DEFAULT 'Bank Transfer',
  `transaction_ref` VARCHAR(100) NOT NULL,
  `status` ENUM('paid', 'pending', 'overdue') NOT NULL DEFAULT 'paid',
  `paid_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`rental_id`) REFERENCES `rentals`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tenant_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_payments_rental` (`rental_id`),
  INDEX `idx_payments_status` (`status`)
) ENGINE=InnoDB;

-- 9. MAINTENANCE REQUESTS TABLE
CREATE TABLE IF NOT EXISTS `maintenance_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `rental_id` INT NOT NULL,
  `property_id` INT NOT NULL,
  `tenant_id` INT NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `description` TEXT NOT NULL,
  `category` ENUM('Plumbing', 'Electrical', 'Appliance', 'HVAC', 'Carpentry', 'Other') NOT NULL DEFAULT 'Plumbing',
  `priority` ENUM('low', 'medium', 'high', 'emergency') NOT NULL DEFAULT 'medium',
  `status` ENUM('pending', 'in_progress', 'resolved') NOT NULL DEFAULT 'pending',
  `image_url` VARCHAR(500) NULL,
  `resolution_notes` TEXT NULL,
  `resolved_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`rental_id`) REFERENCES `rentals`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tenant_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_maint_status` (`status`)
) ENGINE=InnoDB;

-- 10. REVIEWS TABLE (Ratings and Testimonials)
CREATE TABLE IF NOT EXISTS `reviews` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `property_id` INT NOT NULL,
  `tenant_id` INT NOT NULL,
  `rating` INT NOT NULL CHECK (`rating` BETWEEN 1 AND 5),
  `comment` TEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tenant_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_reviews_prop` (`property_id`)
) ENGINE=InnoDB;

-- 11. MESSAGES TABLE (Chat between Tenant & Owner)
CREATE TABLE IF NOT EXISTS `messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sender_id` INT NOT NULL,
  `receiver_id` INT NOT NULL,
  `property_id` INT NULL,
  `message` TEXT NOT NULL,
  `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`receiver_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE SET NULL,
  INDEX `idx_msg_sender_receiver` (`sender_id`, `receiver_id`)
) ENGINE=InnoDB;

-- 12. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `message` TEXT NOT NULL,
  `type` ENUM('booking', 'rental', 'payment', 'maintenance', 'system') NOT NULL DEFAULT 'system',
  `link` VARCHAR(255) NULL,
  `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_notif_user` (`user_id`)
) ENGINE=InnoDB;
