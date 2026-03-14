-- =============================================
-- Attendance Check-in System — Database Schema
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. Create users table (simple — no location per user)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  face_descriptor TEXT
);

-- 2. Create company settings table (location is company-wide)
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL DEFAULT 'My Company',
  company_lat DOUBLE PRECISION NOT NULL DEFAULT 13.7563,
  company_lng DOUBLE PRECISION NOT NULL DEFAULT 100.5018,
  allowed_distance INTEGER NOT NULL DEFAULT 200,
  admin_password TEXT NOT NULL DEFAULT 'admin123'
);

-- 3. Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  check_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION
);

-- 4. Create indexes
CREATE INDEX idx_attendance_created_at ON attendance(created_at DESC);
CREATE INDEX idx_attendance_user_id ON attendance(user_id);

-- 5. Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies — allow public access (no auth for this simple app)
CREATE POLICY "Allow public read users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public read attendance" ON attendance FOR SELECT USING (true);
CREATE POLICY "Allow public insert attendance" ON attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Allow public update settings" ON settings FOR UPDATE USING (true);

-- 7. Seed sample users
INSERT INTO users (name) VALUES ('Thanakrit'), ('Somchai'), ('Suda');

-- 8. Seed default settings (Update lat/lng to your workplace)
INSERT INTO settings (company_name, company_lat, company_lng, allowed_distance, admin_password)
VALUES ('My Company', 13.7563, 100.5018, 200, 'admin123');
