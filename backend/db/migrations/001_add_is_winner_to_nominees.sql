-- Migration 001: Add is_winner column to nominees (not in original RAC schema)
USE gsc_database;
ALTER TABLE nominees ADD COLUMN IF NOT EXISTS is_winner TINYINT(1) NOT NULL DEFAULT 0 AFTER description;
