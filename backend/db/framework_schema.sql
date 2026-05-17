-- ═══════════════════════════════════════════════════════════════════════════
-- GSC — Sustainability Framework CMS Schema
-- Run after schema.sql. Requires users table with id=1 admin to exist.
-- ═══════════════════════════════════════════════════════════════════════════
USE gsc_database;

CREATE TABLE framework_pillars (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  title         VARCHAR(255) NOT NULL,
  description   TEXT NOT NULL,
  tags          JSON COMMENT 'e.g. ["GRI","CSRD","TCFD"]',
  insight       TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  status        ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  created_by    INT NOT NULL,
  updated_by    INT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_framework_pillars_status ON framework_pillars(status);
CREATE INDEX idx_framework_pillars_order  ON framework_pillars(display_order);

CREATE TABLE framework_maturity_levels (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  level           TINYINT NOT NULL,
  name            VARCHAR(100) NOT NULL,
  color           VARCHAR(7) NOT NULL DEFAULT '#64748B',
  light_bg        VARCHAR(7) NOT NULL DEFAULT '#F8FAFC',
  border_color    VARCHAR(7) NOT NULL DEFAULT '#E2E8F0',
  description     TEXT NOT NULL,
  characteristics JSON NOT NULL,
  actions         JSON NOT NULL,
  percentage      INT NOT NULL DEFAULT 25,
  status          ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  created_by      INT NOT NULL,
  updated_by      INT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_maturity_level (level),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE framework_implementation_phases (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  phase_number  TINYINT NOT NULL,
  phase_label   VARCHAR(50) NOT NULL,
  title         VARCHAR(255) NOT NULL,
  duration      VARCHAR(50) NOT NULL,
  icon          VARCHAR(10) DEFAULT '🌱',
  display_order INT NOT NULL DEFAULT 0,
  status        ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  created_by    INT NOT NULL,
  updated_by    INT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_phase_number (phase_number),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE framework_implementation_steps (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  phase_id      INT NOT NULL,
  step_number   VARCHAR(10) NOT NULL,
  title         VARCHAR(255) NOT NULL,
  description   TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  status        ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  created_by    INT NOT NULL,
  updated_by    INT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (phase_id)   REFERENCES framework_implementation_phases(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_impl_steps_phase  ON framework_implementation_steps(phase_id);
CREATE INDEX idx_impl_steps_status ON framework_implementation_steps(status);

CREATE TABLE framework_audit_templates (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  template_id   VARCHAR(20) NOT NULL,
  title         VARCHAR(255) NOT NULL,
  category      VARCHAR(100) NOT NULL,
  format        VARCHAR(100) NOT NULL,
  description   TEXT NOT NULL,
  fields        JSON NOT NULL,
  file_url      VARCHAR(500),
  file_name     VARCHAR(255),
  file_type     VARCHAR(100),
  file_size     INT,
  display_order INT NOT NULL DEFAULT 0,
  status        ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  created_by    INT NOT NULL,
  updated_by    INT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_template_id (template_id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_audit_templates_category ON framework_audit_templates(category);
CREATE INDEX idx_audit_templates_status   ON framework_audit_templates(status);

-- Sustainability Tools (was framework_security_tools)
CREATE TABLE framework_sustainability_tools (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  name                VARCHAR(255) NOT NULL,
  company             VARCHAR(255) NOT NULL,
  category            VARCHAR(255) NOT NULL COMMENT 'Carbon Accounting, ESG Reporting, Climate Risk, Supply Chain...',
  color               VARCHAR(7) NOT NULL DEFAULT '#1A4731',
  description         TEXT NOT NULL,
  capabilities        JSON NOT NULL,
  framework_alignment TEXT NOT NULL COMMENT 'GRI, CSRD, TCFD, GHG Protocol alignment',
  website_url         VARCHAR(500),
  display_order       INT NOT NULL DEFAULT 0,
  status              ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  created_by          INT NOT NULL,
  updated_by          INT,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_sustainability_tools_category ON framework_sustainability_tools(category);
CREATE INDEX idx_sustainability_tools_status   ON framework_sustainability_tools(status);
