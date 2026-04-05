-- ============================================================
-- Migration 001: Add consent columns to users table
-- Run AFTER schema.sql on your Neon database.
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS consent_data_processing boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS consent_voice boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS consent_photos boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS consented_at timestamptz;
