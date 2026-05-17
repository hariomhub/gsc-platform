-- Migration 002: Add sustainability-specific source fields to news
USE gsc_database;
ALTER TABLE news
  ADD COLUMN IF NOT EXISTS source_type ENUM('climate','esg','csrd','carbon','biodiversity','general') NOT NULL DEFAULT 'general' AFTER link,
  ADD COLUMN IF NOT EXISTS source_name VARCHAR(255) AFTER source_type,
  ADD COLUMN IF NOT EXISTS image_url   VARCHAR(500) AFTER source_name,
  ADD COLUMN IF NOT EXISTS is_trending TINYINT(1) NOT NULL DEFAULT 0 AFTER image_url;
