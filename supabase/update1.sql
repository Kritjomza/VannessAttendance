-- =============================================
-- Update 1: Add admin_password to settings
-- Run this if you already have the settings table
-- =============================================

-- Add admin_password column (skips if already exists)
ALTER TABLE settings ADD COLUMN IF NOT EXISTS admin_password TEXT NOT NULL DEFAULT 'admin123';
