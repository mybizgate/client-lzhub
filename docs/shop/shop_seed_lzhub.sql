-- ---------------------------------------------------------------------------
-- Lz Success Enterprise (lzhub) — initial shop data for client-api.
--
-- Source : clients/client-lzhub/src/config/clients/lzhub.ts and src/data/seed/*
--          (SHOP_DESIGN.md §11). Generated 2026-10-31.
-- Run    : AFTER client-api/database/schema/00_shop_schema_2026-10-31.sql, on the
--          client-api database (mybizgat_platform locally). Safe to re-run: every
--          insert is skipped when the row already exists.
--
-- Section A creates the lzhub `clients` + `sites` rows ONLY when the client code
-- is absent. The values marked <<edit>> are placeholders from site.config.yml;
-- correct them before running on production, or create the client/site through
-- the platform first and section A will do nothing.
-- The owner login is NOT created here (passwords never go in SQL). After the
-- backend is deployed run:  php artisan shop:user lzhub --role=owner
-- ---------------------------------------------------------------------------

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 1;

-- A. client + site (no-op when lzhub exists) -------------------------------
INSERT INTO `clients` (`client_code`, `business_name`, `registration_no`, `business_nature`, `contact_person`, `email`,
  `phone_primary`, `phone_secondary`, `address_line1`, `address_line2`, `city`, `state`, `postcode`, `country`, `remarks`,
  `created_at`, `updated_at`)
SELECT 'lzhub', 'Lz Success Enterprise', NULL, 'Pengedar Produk IKS Tempatan', 'Lz Success Enterprise', 'lzsuccess007@gmail.com',
  '+60192857371', '+60175050885', '27 Jalan Melati 13', 'Taman Melati', 'Kuala Lumpur', 'Wilayah Persekutuan Kuala Lumpur', '53100', 'MY',
  'contact_person <<edit>>', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `clients` WHERE `client_code` = 'lzhub');

SET @client_id := (SELECT `id` FROM `clients` WHERE `client_code` = 'lzhub');

INSERT INTO `sites` (`client_id`, `site_name`, `domain`, `domain_type`, `site_type`, `package_name`, `first_year_price`,
  `renewal_price`, `billing_months`, `start_date`, `expiry_date`, `status`, `status_reason`, `remarks`, `created_at`, `updated_at`)
SELECT @client_id, 'Lz Success Enterprise', 'lzhub.mybizgate.com', 'subdomain', 'web_application', 'supplier/catalogue-simple <<edit>>',
  0.00, 0.00, 12, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 12 MONTH), 'active', NULL, 'package_name and prices <<edit>>', NOW(), NOW()
WHERE @client_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `sites` WHERE `client_id` = @client_id);

SET @site_id := (SELECT `id` FROM `sites` WHERE `client_id` = @client_id);

-- B. settings (SHOP_DESIGN.md §11; money in sen) ---------------------------
INSERT INTO `shop_settings` (`site_id`, `currency`, `minimum_order_minor`, `delivery_fee_minor`, `free_delivery_from_minor`,
  `allow_whatsapp_order`, `deduct_stock_on_confirm`, `reference_prefix`, `next_order_number`, `created_at`, `updated_at`)
SELECT @site_id, 'MYR', 15000, 1500, 50000, 1, 0, 'LZ', 1, NOW(), NOW()
WHERE @site_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `shop_settings` WHERE `site_id` = @site_id);

-- C. quantity discount tiers (5 → 2 %, 10 → 4 %) ---------------------------
INSERT INTO `shop_discount_tiers` (`site_id`, `minimum_quantity`, `discount_basis_points`, `is_active`, `created_at`, `updated_at`)
SELECT @site_id, 5, 200, 1, NOW(), NOW()
WHERE @site_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `shop_discount_tiers` WHERE `site_id` = @site_id AND `minimum_quantity` = 5);
INSERT INTO `shop_discount_tiers` (`site_id`, `minimum_quantity`, `discount_basis_points`, `is_active`, `created_at`, `updated_at`)
SELECT @site_id, 10, 400, 1, NOW(), NOW()
WHERE @site_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `shop_discount_tiers` WHERE `site_id` = @site_id AND `minimum_quantity` = 10);

-- D. payment methods (labels must equal paymentOptions in lzhub.ts) --------
INSERT INTO `shop_payment_methods` (`site_id`, `code`, `label`, `instructions`, `sort_order`, `is_active`, `created_at`, `updated_at`)
SELECT @site_id, 'cod', 'Tunai semasa terima barang', NULL, 1, 1, NOW(), NOW()
WHERE @site_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `shop_payment_methods` WHERE `site_id` = @site_id AND `code` = 'cod');
INSERT INTO `shop_payment_methods` (`site_id`, `code`, `label`, `instructions`, `sort_order`, `is_active`, `created_at`, `updated_at`)
SELECT @site_id, 'bank_transfer', 'Pindahan bank selepas disahkan', NULL, 2, 1, NOW(), NOW()
WHERE @site_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `shop_payment_methods` WHERE `site_id` = @site_id AND `code` = 'bank_transfer');

-- E. categories (src/data/seed/categories.ts) ------------------------------
INSERT INTO `shop_categories` (`site_id`, `parent_id`, `name`, `slug`, `description`, `sort_order`, `status`, `created_at`, `updated_at`)
SELECT @site_id, NULL, 'Rempah & Perencah', 'rempah-perencah', NULL, 1, 'active', NOW(), NOW()
WHERE @site_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `shop_categories` WHERE `site_id` = @site_id AND `slug` = 'rempah-perencah');
INSERT INTO `shop_categories` (`site_id`, `parent_id`, `name`, `slug`, `description`, `sort_order`, `status`, `created_at`, `updated_at`)
SELECT @site_id, NULL, 'Sos & Kicap', 'sos-kicap', NULL, 2, 'active', NOW(), NOW()
WHERE @site_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `shop_categories` WHERE `site_id` = @site_id AND `slug` = 'sos-kicap');
INSERT INTO `shop_categories` (`site_id`, `parent_id`, `name`, `slug`, `description`, `sort_order`, `status`, `created_at`, `updated_at`)
SELECT @site_id, NULL, 'Minyak Masak', 'minyak-masak', NULL, 3, 'active', NOW(), NOW()
WHERE @site_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `shop_categories` WHERE `site_id` = @site_id AND `slug` = 'minyak-masak');
INSERT INTO `shop_categories` (`site_id`, `parent_id`, `name`, `slug`, `description`, `sort_order`, `status`, `created_at`, `updated_at`)
SELECT @site_id, NULL, 'Beras & Tepung', 'beras-tepung', NULL, 4, 'active', NOW(), NOW()
WHERE @site_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `shop_categories` WHERE `site_id` = @site_id AND `slug` = 'beras-tepung');
INSERT INTO `shop_categories` (`site_id`, `parent_id`, `name`, `slug`, `description`, `sort_order`, `status`, `created_at`, `updated_at`)
SELECT @site_id, NULL, 'Gula & Garam', 'gula-garam', NULL, 5, 'active', NOW(), NOW()
WHERE @site_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `shop_categories` WHERE `site_id` = @site_id AND `slug` = 'gula-garam');
INSERT INTO `shop_categories` (`site_id`, `parent_id`, `name`, `slug`, `description`, `sort_order`, `status`, `created_at`, `updated_at`)
SELECT @site_id, NULL, 'Santan & Tin', 'santan-tin', NULL, 6, 'active', NOW(), NOW()
WHERE @site_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `shop_categories` WHERE `site_id` = @site_id AND `slug` = 'santan-tin');
INSERT INTO `shop_categories` (`site_id`, `parent_id`, `name`, `slug`, `description`, `sort_order`, `status`, `created_at`, `updated_at`)
SELECT @site_id, NULL, 'Mi & Bihun', 'mi-bihun', NULL, 7, 'active', NOW(), NOW()
WHERE @site_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `shop_categories` WHERE `site_id` = @site_id AND `slug` = 'mi-bihun');
INSERT INTO `shop_categories` (`site_id`, `parent_id`, `name`, `slug`, `description`, `sort_order`, `status`, `created_at`, `updated_at`)
SELECT @site_id, NULL, 'Bahan Kering', 'bahan-kering', NULL, 8, 'active', NOW(), NOW()
WHERE @site_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `shop_categories` WHERE `site_id` = @site_id AND `slug` = 'bahan-kering');

-- F. products (src/data/seed/products.ts; sort_order = seed position = "Pilihan kami") ----
INSERT INTO `shop_products` (`site_id`, `category_id`, `sku`, `name`, `slug`, `short_description`, `description`, `brand`, `selling_unit`,
  `pack_quantity`, `pack_size`, `selling_price_minor`, `compare_at_price_minor`, `minimum_order_quantity`, `stock_quantity`, `unlimited_stock`,
  `low_stock_threshold`, `sort_order`, `is_featured`, `status`, `placeholder_art_json`, `published_at`, `created_at`, `updated_at`)
SELECT @site_id, (SELECT `id` FROM `shop_categories` WHERE `site_id` = @site_id AND `slug` = 'rempah-perencah'), 'LZ-0001', 'Serbuk Kari Daging', 'serbuk-kari-daging-1kg', NULL, NULL,
  'Lz Success Enterprise', 'karton', 12, '1kg', 14520, 15900, 1, 32, 0, 10, 1, 1, 'active', '{"shape": "pouch", "color": "#de9731", "motif": "spice", "label": "KARI DAGING"}', NOW(), NOW(), NOW()
WHERE @site_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `shop_products` WHERE `site_id` = @site_id AND `slug` = 'serbuk-kari-daging-1kg');
INSERT INTO `shop_products` (`site_id`, `category_id`, `sku`, `name`, `slug`, `short_description`, `description`, `brand`, `selling_unit`,
  `pack_quantity`, `pack_size`, `selling_price_minor`, `compare_at_price_minor`, `minimum_order_quantity`, `stock_quantity`, `unlimited_stock`,
  `low_stock_threshold`, `sort_order`, `is_featured`, `status`, `placeholder_art_json`, `published_at`, `created_at`, `updated_at`)
SELECT @site_id, (SELECT `id` FROM `shop_categories` WHERE `site_id` = @site_id AND `slug` = 'sos-kicap'), 'LZ-0002', 'Kicap Manis Premium', 'kicap-manis-premium-650ml', NULL, NULL,
  'Lz Success Enterprise', 'karton', 12, '650ml', 8800, NULL, 2, 46, 0, 10, 2, 1, 'active', '{"shape": "bottle", "color": "#623125", "motif": "soy", "label": "KICAP MANIS"}', NOW(), NOW(), NOW()
WHERE @site_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `shop_products` WHERE `site_id` = @site_id AND `slug` = 'kicap-manis-premium-650ml');
INSERT INTO `shop_products` (`site_id`, `category_id`, `sku`, `name`, `slug`, `short_description`, `description`, `brand`, `selling_unit`,
  `pack_quantity`, `pack_size`, `selling_price_minor`, `compare_at_price_minor`, `minimum_order_quantity`, `stock_quantity`, `unlimited_stock`,
  `low_stock_threshold`, `sort_order`, `is_featured`, `status`, `placeholder_art_json`, `published_at`, `created_at`, `updated_at`)
SELECT @site_id, (SELECT `id` FROM `shop_categories` WHERE `site_id` = @site_id AND `slug` = 'minyak-masak'), 'LZ-0003', 'Minyak Masak Tulen', 'minyak-masak-tulen-5kg', NULL, NULL,
  'Lz Success Enterprise', 'karton', 4, '5kg', 12500, 13900, 1, 18, 0, 10, 3, 1, 'active', '{"shape": "jug", "color": "#efb931", "motif": "leaf", "label": "MINYAK MASAK"}', NOW(), NOW(), NOW()
WHERE @site_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `shop_products` WHERE `site_id` = @site_id AND `slug` = 'minyak-masak-tulen-5kg');
INSERT INTO `shop_products` (`site_id`, `category_id`, `sku`, `name`, `slug`, `short_description`, `description`, `brand`, `selling_unit`,
  `pack_quantity`, `pack_size`, `selling_price_minor`, `compare_at_price_minor`, `minimum_order_quantity`, `stock_quantity`, `unlimited_stock`,
  `low_stock_threshold`, `sort_order`, `is_featured`, `status`, `placeholder_art_json`, `published_at`, `created_at`, `updated_at`)
SELECT @site_id, (SELECT `id` FROM `shop_categories` WHERE `site_id` = @site_id AND `slug` = 'beras-tepung'), 'LZ-0004', 'Beras Wangi', 'beras-wangi-10kg', NULL, NULL,
  'Lz Success Enterprise', 'guni', 1, '10kg', 5590, NULL, 2, 60, 0, 10, 4, 1, 'active', '{"shape": "rice", "color": "#519779", "motif": "rice", "label": "BERAS WANGI"}', NOW(), NOW(), NOW()
WHERE @site_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `shop_products` WHERE `site_id` = @site_id AND `slug` = 'beras-wangi-10kg');
INSERT INTO `shop_products` (`site_id`, `category_id`, `sku`, `name`, `slug`, `short_description`, `description`, `brand`, `selling_unit`,
  `pack_quantity`, `pack_size`, `selling_price_minor`, `compare_at_price_minor`, `minimum_order_quantity`, `stock_quantity`, `unlimited_stock`,
  `low_stock_threshold`, `sort_order`, `is_featured`, `status`, `placeholder_art_json`, `published_at`, `created_at`, `updated_at`)
SELECT @site_id, (SELECT `id` FROM `shop_categories` WHERE `site_id` = @site_id AND `slug` = 'rempah-perencah'), 'LZ-0005', 'Serbuk Cili', 'serbuk-cili-1kg', NULL, NULL,
  'Lz Success Enterprise', 'karton', 10, '1kg', 11900, NULL, 1, 55, 0, 10, 5, 0, 'active', '{"shape": "pouch", "color": "#c94332", "motif": "chili", "label": "SERBUK CILI"}', NOW(), NOW(), NOW()
WHERE @site_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `shop_products` WHERE `site_id` = @site_id AND `slug` = 'serbuk-cili-1kg');
INSERT INTO `shop_products` (`site_id`, `category_id`, `sku`, `name`, `slug`, `short_description`, `description`, `brand`, `selling_unit`,
  `pack_quantity`, `pack_size`, `selling_price_minor`, `compare_at_price_minor`, `minimum_order_quantity`, `stock_quantity`, `unlimited_stock`,
  `low_stock_threshold`, `sort_order`, `is_featured`, `status`, `placeholder_art_json`, `published_at`, `created_at`, `updated_at`)
SELECT @site_id, (SELECT `id` FROM `shop_categories` WHERE `site_id` = @site_id AND `slug` = 'sos-kicap'), 'LZ-0006', 'Sos Cili Asli', 'sos-cili-asli-1kg', NULL, NULL,
  'Lz Success Enterprise', 'karton', 12, '1kg', 6720, 7440, 1, 25, 0, 10, 6, 0, 'active', '{"shape": "bottle", "color": "#c34a31", "motif": "chili", "label": "SOS CILI"}', NOW(), NOW(), NOW()
WHERE @site_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `shop_products` WHERE `site_id` = @site_id AND `slug` = 'sos-cili-asli-1kg');
INSERT INTO `shop_products` (`site_id`, `category_id`, `sku`, `name`, `slug`, `short_description`, `description`, `brand`, `selling_unit`,
  `pack_quantity`, `pack_size`, `selling_price_minor`, `compare_at_price_minor`, `minimum_order_quantity`, `stock_quantity`, `unlimited_stock`,
  `low_stock_threshold`, `sort_order`, `is_featured`, `status`, `placeholder_art_json`, `published_at`, `created_at`, `updated_at`)
SELECT @site_id, (SELECT `id` FROM `shop_categories` WHERE `site_id` = @site_id AND `slug` = 'santan-tin'), 'LZ-0007', 'Santan Kelapa', 'santan-kelapa-200ml', NULL, NULL,
  'Lz Success Enterprise', 'karton', 24, '200ml', 7200, NULL, 1, 14, 0, 10, 7, 0, 'active', '{"shape": "carton", "color": "#347f64", "motif": "coconut", "label": "SANTAN"}', NOW(), NOW(), NOW()
WHERE @site_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `shop_products` WHERE `site_id` = @site_id AND `slug` = 'santan-kelapa-200ml');
INSERT INTO `shop_products` (`site_id`, `category_id`, `sku`, `name`, `slug`, `short_description`, `description`, `brand`, `selling_unit`,
  `pack_quantity`, `pack_size`, `selling_price_minor`, `compare_at_price_minor`, `minimum_order_quantity`, `stock_quantity`, `unlimited_stock`,
  `low_stock_threshold`, `sort_order`, `is_featured`, `status`, `placeholder_art_json`, `published_at`, `created_at`, `updated_at`)
SELECT @site_id, (SELECT `id` FROM `shop_categories` WHERE `site_id` = @site_id AND `slug` = 'beras-tepung'), 'LZ-0008', 'Tepung Gandum', 'tepung-gandum-1kg', NULL, NULL,
  'Lz Success Enterprise', 'karton', 10, '1kg', 3150, NULL, 2, 0, 0, 10, 8, 0, 'active', '{"shape": "pouch", "color": "#5080a6", "motif": "wheat", "label": "TEPUNG GANDUM"}', NOW(), NOW(), NOW()
WHERE @site_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `shop_products` WHERE `site_id` = @site_id AND `slug` = 'tepung-gandum-1kg');
INSERT INTO `shop_products` (`site_id`, `category_id`, `sku`, `name`, `slug`, `short_description`, `description`, `brand`, `selling_unit`,
  `pack_quantity`, `pack_size`, `selling_price_minor`, `compare_at_price_minor`, `minimum_order_quantity`, `stock_quantity`, `unlimited_stock`,
  `low_stock_threshold`, `sort_order`, `is_featured`, `status`, `placeholder_art_json`, `published_at`, `created_at`, `updated_at`)
SELECT @site_id, (SELECT `id` FROM `shop_categories` WHERE `site_id` = @site_id AND `slug` = 'rempah-perencah'), 'LZ-0009', 'Serbuk Kunyit', 'serbuk-kunyit-500g', NULL, NULL,
  'Lz Success Enterprise', 'karton', 12, '500g', 7560, NULL, 1, 38, 0, 10, 9, 0, 'active', '{"shape": "pouch", "color": "#dfb234", "motif": "spice", "label": "KUNYIT"}', NOW(), NOW(), NOW()
WHERE @site_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `shop_products` WHERE `site_id` = @site_id AND `slug` = 'serbuk-kunyit-500g');
INSERT INTO `shop_products` (`site_id`, `category_id`, `sku`, `name`, `slug`, `short_description`, `description`, `brand`, `selling_unit`,
  `pack_quantity`, `pack_size`, `selling_price_minor`, `compare_at_price_minor`, `minimum_order_quantity`, `stock_quantity`, `unlimited_stock`,
  `low_stock_threshold`, `sort_order`, `is_featured`, `status`, `placeholder_art_json`, `published_at`, `created_at`, `updated_at`)
SELECT @site_id, (SELECT `id` FROM `shop_categories` WHERE `site_id` = @site_id AND `slug` = 'gula-garam'), 'LZ-0010', 'Gula Pasir Putih', 'gula-pasir-putih-1kg', NULL, NULL,
  'Lz Success Enterprise', 'karton', 12, '1kg', 4140, NULL, 2, 40, 0, 10, 10, 0, 'active', '{"shape": "pouch", "color": "#7097af", "motif": "sugar", "label": "GULA PASIR"}', NOW(), NOW(), NOW()
WHERE @site_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `shop_products` WHERE `site_id` = @site_id AND `slug` = 'gula-pasir-putih-1kg');
INSERT INTO `shop_products` (`site_id`, `category_id`, `sku`, `name`, `slug`, `short_description`, `description`, `brand`, `selling_unit`,
  `pack_quantity`, `pack_size`, `selling_price_minor`, `compare_at_price_minor`, `minimum_order_quantity`, `stock_quantity`, `unlimited_stock`,
  `low_stock_threshold`, `sort_order`, `is_featured`, `status`, `placeholder_art_json`, `published_at`, `created_at`, `updated_at`)
SELECT @site_id, (SELECT `id` FROM `shop_categories` WHERE `site_id` = @site_id AND `slug` = 'sos-kicap'), 'LZ-0011', 'Sos Tiram', 'sos-tiram-510g', NULL, NULL,
  'Lz Success Enterprise', 'karton', 12, '510g', 7920, NULL, 1, 6, 0, 10, 11, 0, 'active', '{"shape": "bottle", "color": "#283d42", "motif": "soy", "label": "SOS TIRAM"}', NOW(), NOW(), NOW()
WHERE @site_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `shop_products` WHERE `site_id` = @site_id AND `slug` = 'sos-tiram-510g');
INSERT INTO `shop_products` (`site_id`, `category_id`, `sku`, `name`, `slug`, `short_description`, `description`, `brand`, `selling_unit`,
  `pack_quantity`, `pack_size`, `selling_price_minor`, `compare_at_price_minor`, `minimum_order_quantity`, `stock_quantity`, `unlimited_stock`,
  `low_stock_threshold`, `sort_order`, `is_featured`, `status`, `placeholder_art_json`, `published_at`, `created_at`, `updated_at`)
SELECT @site_id, (SELECT `id` FROM `shop_categories` WHERE `site_id` = @site_id AND `slug` = 'mi-bihun'), 'LZ-0012', 'Bihun Beras', 'bihun-beras-400g', NULL, NULL,
  'Lz Success Enterprise', 'karton', 20, '400g', 6400, NULL, 2, 28, 0, 10, 12, 0, 'active', '{"shape": "packet", "color": "#e37840", "motif": "noodle", "label": "BIHUN BERAS"}', NOW(), NOW(), NOW()
WHERE @site_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `shop_products` WHERE `site_id` = @site_id AND `slug` = 'bihun-beras-400g');
INSERT INTO `shop_products` (`site_id`, `category_id`, `sku`, `name`, `slug`, `short_description`, `description`, `brand`, `selling_unit`,
  `pack_quantity`, `pack_size`, `selling_price_minor`, `compare_at_price_minor`, `minimum_order_quantity`, `stock_quantity`, `unlimited_stock`,
  `low_stock_threshold`, `sort_order`, `is_featured`, `status`, `placeholder_art_json`, `published_at`, `created_at`, `updated_at`)
SELECT @site_id, (SELECT `id` FROM `shop_categories` WHERE `site_id` = @site_id AND `slug` = 'rempah-perencah'), 'LZ-0013', 'Lada Hitam Kisar', 'lada-hitam-kisar-250g', NULL, NULL,
  'Lz Success Enterprise', 'karton', 12, '250g', 10800, 12000, 1, 22, 0, 10, 13, 0, 'active', '{"shape": "jar", "color": "#485543", "motif": "pepper", "label": "LADA HITAM"}', NOW(), NOW(), NOW()
WHERE @site_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `shop_products` WHERE `site_id` = @site_id AND `slug` = 'lada-hitam-kisar-250g');
INSERT INTO `shop_products` (`site_id`, `category_id`, `sku`, `name`, `slug`, `short_description`, `description`, `brand`, `selling_unit`,
  `pack_quantity`, `pack_size`, `selling_price_minor`, `compare_at_price_minor`, `minimum_order_quantity`, `stock_quantity`, `unlimited_stock`,
  `low_stock_threshold`, `sort_order`, `is_featured`, `status`, `placeholder_art_json`, `published_at`, `created_at`, `updated_at`)
SELECT @site_id, (SELECT `id` FROM `shop_categories` WHERE `site_id` = @site_id AND `slug` = 'minyak-masak'), 'LZ-0014', 'Minyak Jagung', 'minyak-jagung-1l', NULL, NULL,
  'Lz Success Enterprise', 'karton', 6, '1L', 8700, NULL, 1, 20, 0, 10, 14, 0, 'active', '{"shape": "bottle", "color": "#d8a82a", "motif": "leaf", "label": "MINYAK JAGUNG"}', NOW(), NOW(), NOW()
WHERE @site_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `shop_products` WHERE `site_id` = @site_id AND `slug` = 'minyak-jagung-1l');
INSERT INTO `shop_products` (`site_id`, `category_id`, `sku`, `name`, `slug`, `short_description`, `description`, `brand`, `selling_unit`,
  `pack_quantity`, `pack_size`, `selling_price_minor`, `compare_at_price_minor`, `minimum_order_quantity`, `stock_quantity`, `unlimited_stock`,
  `low_stock_threshold`, `sort_order`, `is_featured`, `status`, `placeholder_art_json`, `published_at`, `created_at`, `updated_at`)
SELECT @site_id, (SELECT `id` FROM `shop_categories` WHERE `site_id` = @site_id AND `slug` = 'beras-tepung'), 'LZ-0015', 'Tepung Jagung', 'tepung-jagung-400g', NULL, NULL,
  'Lz Success Enterprise', 'karton', 24, '400g', 6960, NULL, 1, 24, 0, 10, 15, 0, 'active', '{"shape": "pouch", "color": "#d19d46", "motif": "wheat", "label": "TEPUNG JAGUNG"}', NOW(), NOW(), NOW()
WHERE @site_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `shop_products` WHERE `site_id` = @site_id AND `slug` = 'tepung-jagung-400g');
INSERT INTO `shop_products` (`site_id`, `category_id`, `sku`, `name`, `slug`, `short_description`, `description`, `brand`, `selling_unit`,
  `pack_quantity`, `pack_size`, `selling_price_minor`, `compare_at_price_minor`, `minimum_order_quantity`, `stock_quantity`, `unlimited_stock`,
  `low_stock_threshold`, `sort_order`, `is_featured`, `status`, `placeholder_art_json`, `published_at`, `created_at`, `updated_at`)
SELECT @site_id, (SELECT `id` FROM `shop_categories` WHERE `site_id` = @site_id AND `slug` = 'gula-garam'), 'LZ-0016', 'Garam Halus', 'garam-halus-500g', NULL, NULL,
  'Lz Success Enterprise', 'karton', 20, '500g', 2400, NULL, 3, 45, 0, 10, 16, 0, 'active', '{"shape": "pouch", "color": "#659c9e", "motif": "sugar", "label": "GARAM HALUS"}', NOW(), NOW(), NOW()
WHERE @site_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `shop_products` WHERE `site_id` = @site_id AND `slug` = 'garam-halus-500g');
INSERT INTO `shop_products` (`site_id`, `category_id`, `sku`, `name`, `slug`, `short_description`, `description`, `brand`, `selling_unit`,
  `pack_quantity`, `pack_size`, `selling_price_minor`, `compare_at_price_minor`, `minimum_order_quantity`, `stock_quantity`, `unlimited_stock`,
  `low_stock_threshold`, `sort_order`, `is_featured`, `status`, `placeholder_art_json`, `published_at`, `created_at`, `updated_at`)
SELECT @site_id, (SELECT `id` FROM `shop_categories` WHERE `site_id` = @site_id AND `slug` = 'santan-tin'), 'LZ-0017', 'Sardin Sos Tomato', 'sardin-sos-tomato-425g', NULL, NULL,
  'Lz Success Enterprise', 'karton', 24, '425g', 15840, 17280, 1, 35, 0, 10, 17, 0, 'active', '{"shape": "can", "color": "#bc4833", "motif": "fish", "label": "SARDIN"}', NOW(), NOW(), NOW()
WHERE @site_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `shop_products` WHERE `site_id` = @site_id AND `slug` = 'sardin-sos-tomato-425g');
INSERT INTO `shop_products` (`site_id`, `category_id`, `sku`, `name`, `slug`, `short_description`, `description`, `brand`, `selling_unit`,
  `pack_quantity`, `pack_size`, `selling_price_minor`, `compare_at_price_minor`, `minimum_order_quantity`, `stock_quantity`, `unlimited_stock`,
  `low_stock_threshold`, `sort_order`, `is_featured`, `status`, `placeholder_art_json`, `published_at`, `created_at`, `updated_at`)
SELECT @site_id, (SELECT `id` FROM `shop_categories` WHERE `site_id` = @site_id AND `slug` = 'mi-bihun'), 'LZ-0018', 'Mi Kuning Kering', 'mi-kuning-kering-500g', NULL, NULL,
  'Lz Success Enterprise', 'karton', 20, '500g', 7000, NULL, 1, 17, 0, 10, 18, 0, 'active', '{"shape": "packet", "color": "#cba23e", "motif": "noodle", "label": "MI KERING"}', NOW(), NOW(), NOW()
WHERE @site_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `shop_products` WHERE `site_id` = @site_id AND `slug` = 'mi-kuning-kering-500g');
INSERT INTO `shop_products` (`site_id`, `category_id`, `sku`, `name`, `slug`, `short_description`, `description`, `brand`, `selling_unit`,
  `pack_quantity`, `pack_size`, `selling_price_minor`, `compare_at_price_minor`, `minimum_order_quantity`, `stock_quantity`, `unlimited_stock`,
  `low_stock_threshold`, `sort_order`, `is_featured`, `status`, `placeholder_art_json`, `published_at`, `created_at`, `updated_at`)
SELECT @site_id, (SELECT `id` FROM `shop_categories` WHERE `site_id` = @site_id AND `slug` = 'bahan-kering'), 'LZ-0019', 'Kacang Dal', 'kacang-dal-10kg', NULL, NULL,
  'Lz Success Enterprise', 'guni', 1, '10kg', 7800, NULL, 1, 19, 0, 10, 19, 0, 'active', '{"shape": "rice", "color": "#c47d41", "motif": "beans", "label": "KACANG DAL"}', NOW(), NOW(), NOW()
WHERE @site_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `shop_products` WHERE `site_id` = @site_id AND `slug` = 'kacang-dal-10kg');
INSERT INTO `shop_products` (`site_id`, `category_id`, `sku`, `name`, `slug`, `short_description`, `description`, `brand`, `selling_unit`,
  `pack_quantity`, `pack_size`, `selling_price_minor`, `compare_at_price_minor`, `minimum_order_quantity`, `stock_quantity`, `unlimited_stock`,
  `low_stock_threshold`, `sort_order`, `is_featured`, `status`, `placeholder_art_json`, `published_at`, `created_at`, `updated_at`)
SELECT @site_id, (SELECT `id` FROM `shop_categories` WHERE `site_id` = @site_id AND `slug` = 'bahan-kering'), 'LZ-0020', 'Asam Jawa', 'asam-jawa-200g', NULL, NULL,
  'Lz Success Enterprise', 'karton', 24, '200g', 4800, NULL, 2, 30, 0, 10, 20, 0, 'active', '{"shape": "pouch", "color": "#8b593a", "motif": "beans", "label": "ASAM JAWA"}', NOW(), NOW(), NOW()
WHERE @site_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `shop_products` WHERE `site_id` = @site_id AND `slug` = 'asam-jawa-200g');
INSERT INTO `shop_products` (`site_id`, `category_id`, `sku`, `name`, `slug`, `short_description`, `description`, `brand`, `selling_unit`,
  `pack_quantity`, `pack_size`, `selling_price_minor`, `compare_at_price_minor`, `minimum_order_quantity`, `stock_quantity`, `unlimited_stock`,
  `low_stock_threshold`, `sort_order`, `is_featured`, `status`, `placeholder_art_json`, `published_at`, `created_at`, `updated_at`)
SELECT @site_id, (SELECT `id` FROM `shop_categories` WHERE `site_id` = @site_id AND `slug` = 'gula-garam'), 'LZ-0021', 'Gula Perang', 'gula-perang-1kg', NULL, NULL,
  'Lz Success Enterprise', 'karton', 12, '1kg', 6240, NULL, 1, 12, 0, 10, 21, 0, 'active', '{"shape": "pouch", "color": "#b98350", "motif": "sugar", "label": "GULA PERANG"}', NOW(), NOW(), NOW()
WHERE @site_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `shop_products` WHERE `site_id` = @site_id AND `slug` = 'gula-perang-1kg');
INSERT INTO `shop_products` (`site_id`, `category_id`, `sku`, `name`, `slug`, `short_description`, `description`, `brand`, `selling_unit`,
  `pack_quantity`, `pack_size`, `selling_price_minor`, `compare_at_price_minor`, `minimum_order_quantity`, `stock_quantity`, `unlimited_stock`,
  `low_stock_threshold`, `sort_order`, `is_featured`, `status`, `placeholder_art_json`, `published_at`, `created_at`, `updated_at`)
SELECT @site_id, (SELECT `id` FROM `shop_categories` WHERE `site_id` = @site_id AND `slug` = 'santan-tin'), 'LZ-0022', 'Kacang Panggang', 'kacang-panggang-425g', NULL, NULL,
  'Lz Success Enterprise', 'karton', 24, '425g', 8640, NULL, 1, 0, 0, 10, 22, 0, 'active', '{"shape": "can", "color": "#aa4834", "motif": "beans", "label": "KACANG PANGGANG"}', NOW(), NOW(), NOW()
WHERE @site_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `shop_products` WHERE `site_id` = @site_id AND `slug` = 'kacang-panggang-425g');
INSERT INTO `shop_products` (`site_id`, `category_id`, `sku`, `name`, `slug`, `short_description`, `description`, `brand`, `selling_unit`,
  `pack_quantity`, `pack_size`, `selling_price_minor`, `compare_at_price_minor`, `minimum_order_quantity`, `stock_quantity`, `unlimited_stock`,
  `low_stock_threshold`, `sort_order`, `is_featured`, `status`, `placeholder_art_json`, `published_at`, `created_at`, `updated_at`)
SELECT @site_id, (SELECT `id` FROM `shop_categories` WHERE `site_id` = @site_id AND `slug` = 'mi-bihun'), 'LZ-0023', 'Spageti', 'spageti-500g', NULL, NULL,
  'Lz Success Enterprise', 'karton', 20, '500g', 7900, 8800, 1, 26, 0, 10, 23, 0, 'active', '{"shape": "packet", "color": "#9a763e", "motif": "noodle", "label": "SPAGETI"}', NOW(), NOW(), NOW()
WHERE @site_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `shop_products` WHERE `site_id` = @site_id AND `slug` = 'spageti-500g');
INSERT INTO `shop_products` (`site_id`, `category_id`, `sku`, `name`, `slug`, `short_description`, `description`, `brand`, `selling_unit`,
  `pack_quantity`, `pack_size`, `selling_price_minor`, `compare_at_price_minor`, `minimum_order_quantity`, `stock_quantity`, `unlimited_stock`,
  `low_stock_threshold`, `sort_order`, `is_featured`, `status`, `placeholder_art_json`, `published_at`, `created_at`, `updated_at`)
SELECT @site_id, (SELECT `id` FROM `shop_categories` WHERE `site_id` = @site_id AND `slug` = 'bahan-kering'), 'LZ-0024', 'Bawang Goreng', 'bawang-goreng-500g', NULL, NULL,
  'Lz Success Enterprise', 'karton', 12, '500g', 9600, NULL, 1, 8, 0, 10, 24, 0, 'active', '{"shape": "jar", "color": "#a8743c", "motif": "onion", "label": "BAWANG GORENG"}', NOW(), NOW(), NOW()
WHERE @site_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `shop_products` WHERE `site_id` = @site_id AND `slug` = 'bawang-goreng-500g');

-- G. opening stock movements (one per product with stock > 0; skipped when the product already has a movement) ----
INSERT INTO `shop_inventory_movements` (`site_id`, `product_id`, `order_id`, `movement_type`, `quantity_delta`, `balance_after`, `note`, `created_by_user_id`, `created_at`)
SELECT @site_id, p.`id`, NULL, 'opening', 32, 32, 'Stok permulaan (seed)', NULL, NOW()
FROM `shop_products` p WHERE p.`site_id` = @site_id AND p.`slug` = 'serbuk-kari-daging-1kg'
  AND NOT EXISTS (SELECT 1 FROM `shop_inventory_movements` m WHERE m.`product_id` = p.`id`);
INSERT INTO `shop_inventory_movements` (`site_id`, `product_id`, `order_id`, `movement_type`, `quantity_delta`, `balance_after`, `note`, `created_by_user_id`, `created_at`)
SELECT @site_id, p.`id`, NULL, 'opening', 46, 46, 'Stok permulaan (seed)', NULL, NOW()
FROM `shop_products` p WHERE p.`site_id` = @site_id AND p.`slug` = 'kicap-manis-premium-650ml'
  AND NOT EXISTS (SELECT 1 FROM `shop_inventory_movements` m WHERE m.`product_id` = p.`id`);
INSERT INTO `shop_inventory_movements` (`site_id`, `product_id`, `order_id`, `movement_type`, `quantity_delta`, `balance_after`, `note`, `created_by_user_id`, `created_at`)
SELECT @site_id, p.`id`, NULL, 'opening', 18, 18, 'Stok permulaan (seed)', NULL, NOW()
FROM `shop_products` p WHERE p.`site_id` = @site_id AND p.`slug` = 'minyak-masak-tulen-5kg'
  AND NOT EXISTS (SELECT 1 FROM `shop_inventory_movements` m WHERE m.`product_id` = p.`id`);
INSERT INTO `shop_inventory_movements` (`site_id`, `product_id`, `order_id`, `movement_type`, `quantity_delta`, `balance_after`, `note`, `created_by_user_id`, `created_at`)
SELECT @site_id, p.`id`, NULL, 'opening', 60, 60, 'Stok permulaan (seed)', NULL, NOW()
FROM `shop_products` p WHERE p.`site_id` = @site_id AND p.`slug` = 'beras-wangi-10kg'
  AND NOT EXISTS (SELECT 1 FROM `shop_inventory_movements` m WHERE m.`product_id` = p.`id`);
INSERT INTO `shop_inventory_movements` (`site_id`, `product_id`, `order_id`, `movement_type`, `quantity_delta`, `balance_after`, `note`, `created_by_user_id`, `created_at`)
SELECT @site_id, p.`id`, NULL, 'opening', 55, 55, 'Stok permulaan (seed)', NULL, NOW()
FROM `shop_products` p WHERE p.`site_id` = @site_id AND p.`slug` = 'serbuk-cili-1kg'
  AND NOT EXISTS (SELECT 1 FROM `shop_inventory_movements` m WHERE m.`product_id` = p.`id`);
INSERT INTO `shop_inventory_movements` (`site_id`, `product_id`, `order_id`, `movement_type`, `quantity_delta`, `balance_after`, `note`, `created_by_user_id`, `created_at`)
SELECT @site_id, p.`id`, NULL, 'opening', 25, 25, 'Stok permulaan (seed)', NULL, NOW()
FROM `shop_products` p WHERE p.`site_id` = @site_id AND p.`slug` = 'sos-cili-asli-1kg'
  AND NOT EXISTS (SELECT 1 FROM `shop_inventory_movements` m WHERE m.`product_id` = p.`id`);
INSERT INTO `shop_inventory_movements` (`site_id`, `product_id`, `order_id`, `movement_type`, `quantity_delta`, `balance_after`, `note`, `created_by_user_id`, `created_at`)
SELECT @site_id, p.`id`, NULL, 'opening', 14, 14, 'Stok permulaan (seed)', NULL, NOW()
FROM `shop_products` p WHERE p.`site_id` = @site_id AND p.`slug` = 'santan-kelapa-200ml'
  AND NOT EXISTS (SELECT 1 FROM `shop_inventory_movements` m WHERE m.`product_id` = p.`id`);
INSERT INTO `shop_inventory_movements` (`site_id`, `product_id`, `order_id`, `movement_type`, `quantity_delta`, `balance_after`, `note`, `created_by_user_id`, `created_at`)
SELECT @site_id, p.`id`, NULL, 'opening', 38, 38, 'Stok permulaan (seed)', NULL, NOW()
FROM `shop_products` p WHERE p.`site_id` = @site_id AND p.`slug` = 'serbuk-kunyit-500g'
  AND NOT EXISTS (SELECT 1 FROM `shop_inventory_movements` m WHERE m.`product_id` = p.`id`);
INSERT INTO `shop_inventory_movements` (`site_id`, `product_id`, `order_id`, `movement_type`, `quantity_delta`, `balance_after`, `note`, `created_by_user_id`, `created_at`)
SELECT @site_id, p.`id`, NULL, 'opening', 40, 40, 'Stok permulaan (seed)', NULL, NOW()
FROM `shop_products` p WHERE p.`site_id` = @site_id AND p.`slug` = 'gula-pasir-putih-1kg'
  AND NOT EXISTS (SELECT 1 FROM `shop_inventory_movements` m WHERE m.`product_id` = p.`id`);
INSERT INTO `shop_inventory_movements` (`site_id`, `product_id`, `order_id`, `movement_type`, `quantity_delta`, `balance_after`, `note`, `created_by_user_id`, `created_at`)
SELECT @site_id, p.`id`, NULL, 'opening', 6, 6, 'Stok permulaan (seed)', NULL, NOW()
FROM `shop_products` p WHERE p.`site_id` = @site_id AND p.`slug` = 'sos-tiram-510g'
  AND NOT EXISTS (SELECT 1 FROM `shop_inventory_movements` m WHERE m.`product_id` = p.`id`);
INSERT INTO `shop_inventory_movements` (`site_id`, `product_id`, `order_id`, `movement_type`, `quantity_delta`, `balance_after`, `note`, `created_by_user_id`, `created_at`)
SELECT @site_id, p.`id`, NULL, 'opening', 28, 28, 'Stok permulaan (seed)', NULL, NOW()
FROM `shop_products` p WHERE p.`site_id` = @site_id AND p.`slug` = 'bihun-beras-400g'
  AND NOT EXISTS (SELECT 1 FROM `shop_inventory_movements` m WHERE m.`product_id` = p.`id`);
INSERT INTO `shop_inventory_movements` (`site_id`, `product_id`, `order_id`, `movement_type`, `quantity_delta`, `balance_after`, `note`, `created_by_user_id`, `created_at`)
SELECT @site_id, p.`id`, NULL, 'opening', 22, 22, 'Stok permulaan (seed)', NULL, NOW()
FROM `shop_products` p WHERE p.`site_id` = @site_id AND p.`slug` = 'lada-hitam-kisar-250g'
  AND NOT EXISTS (SELECT 1 FROM `shop_inventory_movements` m WHERE m.`product_id` = p.`id`);
INSERT INTO `shop_inventory_movements` (`site_id`, `product_id`, `order_id`, `movement_type`, `quantity_delta`, `balance_after`, `note`, `created_by_user_id`, `created_at`)
SELECT @site_id, p.`id`, NULL, 'opening', 20, 20, 'Stok permulaan (seed)', NULL, NOW()
FROM `shop_products` p WHERE p.`site_id` = @site_id AND p.`slug` = 'minyak-jagung-1l'
  AND NOT EXISTS (SELECT 1 FROM `shop_inventory_movements` m WHERE m.`product_id` = p.`id`);
INSERT INTO `shop_inventory_movements` (`site_id`, `product_id`, `order_id`, `movement_type`, `quantity_delta`, `balance_after`, `note`, `created_by_user_id`, `created_at`)
SELECT @site_id, p.`id`, NULL, 'opening', 24, 24, 'Stok permulaan (seed)', NULL, NOW()
FROM `shop_products` p WHERE p.`site_id` = @site_id AND p.`slug` = 'tepung-jagung-400g'
  AND NOT EXISTS (SELECT 1 FROM `shop_inventory_movements` m WHERE m.`product_id` = p.`id`);
INSERT INTO `shop_inventory_movements` (`site_id`, `product_id`, `order_id`, `movement_type`, `quantity_delta`, `balance_after`, `note`, `created_by_user_id`, `created_at`)
SELECT @site_id, p.`id`, NULL, 'opening', 45, 45, 'Stok permulaan (seed)', NULL, NOW()
FROM `shop_products` p WHERE p.`site_id` = @site_id AND p.`slug` = 'garam-halus-500g'
  AND NOT EXISTS (SELECT 1 FROM `shop_inventory_movements` m WHERE m.`product_id` = p.`id`);
INSERT INTO `shop_inventory_movements` (`site_id`, `product_id`, `order_id`, `movement_type`, `quantity_delta`, `balance_after`, `note`, `created_by_user_id`, `created_at`)
SELECT @site_id, p.`id`, NULL, 'opening', 35, 35, 'Stok permulaan (seed)', NULL, NOW()
FROM `shop_products` p WHERE p.`site_id` = @site_id AND p.`slug` = 'sardin-sos-tomato-425g'
  AND NOT EXISTS (SELECT 1 FROM `shop_inventory_movements` m WHERE m.`product_id` = p.`id`);
INSERT INTO `shop_inventory_movements` (`site_id`, `product_id`, `order_id`, `movement_type`, `quantity_delta`, `balance_after`, `note`, `created_by_user_id`, `created_at`)
SELECT @site_id, p.`id`, NULL, 'opening', 17, 17, 'Stok permulaan (seed)', NULL, NOW()
FROM `shop_products` p WHERE p.`site_id` = @site_id AND p.`slug` = 'mi-kuning-kering-500g'
  AND NOT EXISTS (SELECT 1 FROM `shop_inventory_movements` m WHERE m.`product_id` = p.`id`);
INSERT INTO `shop_inventory_movements` (`site_id`, `product_id`, `order_id`, `movement_type`, `quantity_delta`, `balance_after`, `note`, `created_by_user_id`, `created_at`)
SELECT @site_id, p.`id`, NULL, 'opening', 19, 19, 'Stok permulaan (seed)', NULL, NOW()
FROM `shop_products` p WHERE p.`site_id` = @site_id AND p.`slug` = 'kacang-dal-10kg'
  AND NOT EXISTS (SELECT 1 FROM `shop_inventory_movements` m WHERE m.`product_id` = p.`id`);
INSERT INTO `shop_inventory_movements` (`site_id`, `product_id`, `order_id`, `movement_type`, `quantity_delta`, `balance_after`, `note`, `created_by_user_id`, `created_at`)
SELECT @site_id, p.`id`, NULL, 'opening', 30, 30, 'Stok permulaan (seed)', NULL, NOW()
FROM `shop_products` p WHERE p.`site_id` = @site_id AND p.`slug` = 'asam-jawa-200g'
  AND NOT EXISTS (SELECT 1 FROM `shop_inventory_movements` m WHERE m.`product_id` = p.`id`);
INSERT INTO `shop_inventory_movements` (`site_id`, `product_id`, `order_id`, `movement_type`, `quantity_delta`, `balance_after`, `note`, `created_by_user_id`, `created_at`)
SELECT @site_id, p.`id`, NULL, 'opening', 12, 12, 'Stok permulaan (seed)', NULL, NOW()
FROM `shop_products` p WHERE p.`site_id` = @site_id AND p.`slug` = 'gula-perang-1kg'
  AND NOT EXISTS (SELECT 1 FROM `shop_inventory_movements` m WHERE m.`product_id` = p.`id`);
INSERT INTO `shop_inventory_movements` (`site_id`, `product_id`, `order_id`, `movement_type`, `quantity_delta`, `balance_after`, `note`, `created_by_user_id`, `created_at`)
SELECT @site_id, p.`id`, NULL, 'opening', 26, 26, 'Stok permulaan (seed)', NULL, NOW()
FROM `shop_products` p WHERE p.`site_id` = @site_id AND p.`slug` = 'spageti-500g'
  AND NOT EXISTS (SELECT 1 FROM `shop_inventory_movements` m WHERE m.`product_id` = p.`id`);
INSERT INTO `shop_inventory_movements` (`site_id`, `product_id`, `order_id`, `movement_type`, `quantity_delta`, `balance_after`, `note`, `created_by_user_id`, `created_at`)
SELECT @site_id, p.`id`, NULL, 'opening', 8, 8, 'Stok permulaan (seed)', NULL, NOW()
FROM `shop_products` p WHERE p.`site_id` = @site_id AND p.`slug` = 'bawang-goreng-500g'
  AND NOT EXISTS (SELECT 1 FROM `shop_inventory_movements` m WHERE m.`product_id` = p.`id`);

-- H. summary --------------------------------------------------------------
SELECT (SELECT COUNT(*) FROM `shop_categories` WHERE `site_id` = @site_id) AS categories,
       (SELECT COUNT(*) FROM `shop_products` WHERE `site_id` = @site_id) AS products,
       (SELECT COUNT(*) FROM `shop_inventory_movements` WHERE `site_id` = @site_id) AS movements,
       (SELECT COUNT(*) FROM `shop_payment_methods` WHERE `site_id` = @site_id) AS payment_methods,
       (SELECT COUNT(*) FROM `shop_discount_tiers` WHERE `site_id` = @site_id) AS tiers;
