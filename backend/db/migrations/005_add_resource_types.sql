-- Migration 005: Expand resource types for sustainability content
USE gsc_database;
ALTER TABLE resources MODIFY COLUMN type
  ENUM('framework','whitepaper','product','video','article','tool','news','report','policy') NOT NULL;
