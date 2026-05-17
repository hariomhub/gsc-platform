-- Migration 004: Update feed_posts post_type enum for GSC
-- ai_product -> esg_product, troubleshooting -> case_study
USE gsc_database;
ALTER TABLE feed_posts MODIFY COLUMN post_type
  ENUM('esg_product','poll','event','case_study','general') NOT NULL DEFAULT 'general';
