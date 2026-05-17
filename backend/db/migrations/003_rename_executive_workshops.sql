-- Migration 003: Rename executive_workshops -> expert_workshops
-- Only needed if migrating FROM an existing RAC database.
-- New installs use schema.sql which creates expert_workshops directly.
USE gsc_database;
RENAME TABLE executive_workshops TO expert_workshops;
