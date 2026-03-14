-- =============================================
-- Migration: Add settings table & simplify users
-- Run this ONLY if you already have the original schema
-- =============================================

-- 1. Remove location columns from users (no longer per-user)
ALTER TABLE users DROP COLUMN IF EXISTS location_lat;
ALTER TABLE users DROP COLUMN IF EXISTS location_lng;

-- 2. Create settings table (if not exists)
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL DEFAULT 'My Company',
  company_lat DOUBLE PRECISION NOT NULL DEFAULT 13.7563,
  company_lng DOUBLE PRECISION NOT NULL DEFAULT 100.5018,
  allowed_distance INTEGER NOT NULL DEFAULT 200,
  admin_password TEXT NOT NULL DEFAULT 'admin123'
);

-- 3. If settings already exists but lacks admin_password column, add it
ALTER TABLE settings ADD COLUMN IF NOT EXISTS admin_password TEXT NOT NULL DEFAULT 'admin123';

-- 4. Enable RLS on settings
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Allow public update settings" ON settings FOR UPDATE USING (true);

-- 5. Seed default settings row (only if empty)
INSERT INTO settings (company_name, company_lat, company_lng, allowed_distance, admin_password)
SELECT 'My Company', 13.7563, 100.5018, 200, 'admin123'
WHERE NOT EXISTS (SELECT 1 FROM settings);
