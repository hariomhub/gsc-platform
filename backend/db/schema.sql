-- ═══════════════════════════════════════════════════════════════════════════
-- Global Sustainability Council (GSC) — Core Schema
-- Run order: 1) schema.sql  2) framework_schema.sql  3) seeds/
-- MySQL 8.0+  |  utf8mb4
-- ═══════════════════════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS gsc_database
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gsc_database;
SET FOREIGN_KEY_CHECKS = 0;

-- ─────────────────────────────────────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id                       INT AUTO_INCREMENT PRIMARY KEY,
  name                     VARCHAR(255) NOT NULL,
  email                    VARCHAR(255) UNIQUE NOT NULL,
  password_hash            VARCHAR(255),
  role                     ENUM('founding_member','council_member','professional') NOT NULL DEFAULT 'professional',
  professional_sub_type    ENUM('working_professional','final_year_undergrad') NULL DEFAULT NULL,
  status                   ENUM('pending','approved','rejected') DEFAULT 'pending',
  membership_expires_at    DATETIME NULL DEFAULT NULL COMMENT 'NULL=lifetime. 2yr council_member, 1yr professional.',
  bio                      TEXT,
  photo_url                VARCHAR(500),
  linkedin_url             VARCHAR(500),
  linkedin_id              VARCHAR(255),
  auth_provider            ENUM('local','linkedin') NOT NULL DEFAULT 'local',
  organization_name        VARCHAR(255),
  monthly_downloads        INT NOT NULL DEFAULT 0,
  monthly_downloads_reset  DATE,
  pending_sub_type_upgrade TINYINT(1) NOT NULL DEFAULT 0,
  sub_type_upgrade_status  ENUM('none','pending','approved','rejected') DEFAULT 'none',
  profile_badge            VARCHAR(100),
  created_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_users_email  ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role   ON users(role);

-- ─────────────────────────────────────────────────────────────────────────────
-- AUTH & VERIFICATION
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE email_verifications (
  email      VARCHAR(255) NOT NULL PRIMARY KEY,
  otp        VARCHAR(6)   NOT NULL,
  expires_at DATETIME     NOT NULL,
  verified   TINYINT(1)   DEFAULT 0,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE push_tokens (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT  NOT NULL,
  token      TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_push_tokens_user ON push_tokens(user_id);

CREATE TABLE waitlist (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  email      VARCHAR(255) UNIQUE NOT NULL,
  name       VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- MEMBERSHIP APPLICATIONS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE membership_applications (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  user_id             INT NOT NULL,
  requested_role      ENUM('council_member','founding_member') NOT NULL,
  full_name           VARCHAR(255) NOT NULL,
  email               VARCHAR(255) NOT NULL,
  organization_name   VARCHAR(255),
  job_title           VARCHAR(255),
  linkedin_url        VARCHAR(500),
  phone               VARCHAR(50),
  payment_reference   VARCHAR(100),
  amount_paid         DECIMAL(10,2),
  professional_bio    TEXT,
  areas_of_expertise  VARCHAR(1000),
  why_founding_member TEXT,
  website_url         VARCHAR(500),
  twitter_url         VARCHAR(500),
  status              ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  admin_notes         TEXT,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at        DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_membership_user   ON membership_applications(user_id);
CREATE INDEX idx_membership_status ON membership_applications(status);

-- ─────────────────────────────────────────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE notifications (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  type       VARCHAR(100) NOT NULL,
  title      VARCHAR(255) NOT NULL,
  body       TEXT,
  data       JSON,
  is_read    TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_notifications_user    ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

CREATE TABLE notification_reads (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  notification_id INT NOT NULL,
  read_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_notif_read (user_id, notification_id),
  FOREIGN KEY (user_id)         REFERENCES users(id)         ON DELETE CASCADE,
  FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notification_digest_log (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  sent_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_digest_log_user ON notification_digest_log(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- EVENTS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE events (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  title          VARCHAR(255) NOT NULL,
  date           DATETIME NOT NULL,
  location       VARCHAR(255),
  description    TEXT,
  link           VARCHAR(500),
  event_category ENUM('webinar','seminar','workshop','podcast') NOT NULL,
  is_upcoming    BOOLEAN DEFAULT TRUE,
  is_published   BOOLEAN NOT NULL DEFAULT TRUE,
  recording_url  VARCHAR(500),
  banner_image   VARCHAR(500),
  created_by     INT NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_events_category  ON events(event_category);
CREATE INDEX idx_events_upcoming  ON events(is_upcoming);
CREATE INDEX idx_events_published ON events(is_published);

CREATE TABLE event_registrations (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  event_id         INT NOT NULL,
  user_id          INT NOT NULL,
  name             VARCHAR(255) NOT NULL,
  email            VARCHAR(255) NOT NULL,
  organization     VARCHAR(255),
  phone            VARCHAR(50),
  notes            TEXT,
  consent_to_share TINYINT(1) NOT NULL DEFAULT 0,
  registered_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_event_user (event_id, user_id),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_event_reg_event ON event_registrations(event_id);
CREATE INDEX idx_event_reg_user  ON event_registrations(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- EXPERT WORKSHOPS  (was executive_workshops)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE expert_workshops (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  title         VARCHAR(255) NOT NULL,
  date          DATETIME NOT NULL,
  location      VARCHAR(255),
  description   TEXT,
  speaker       VARCHAR(255),
  agenda        TEXT,
  recording_url VARCHAR(500),
  banner_image  VARCHAR(500),
  is_published  BOOLEAN DEFAULT TRUE,
  is_upcoming   BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_workshops_upcoming  ON expert_workshops(is_upcoming);
CREATE INDEX idx_workshops_published ON expert_workshops(is_published);

-- ─────────────────────────────────────────────────────────────────────────────
-- RESOURCES / ESG KNOWLEDGE HUB
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE resources (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  abstract    TEXT,
  file_url    VARCHAR(500),
  demo_url    VARCHAR(500),
  type        ENUM('framework','whitepaper','product','video','article','tool','news','report','policy') NOT NULL,
  status      ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved',
  uploader_id INT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_resources_type   ON resources(type);
CREATE INDEX idx_resources_status ON resources(status);

CREATE TABLE resource_reviews (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  resource_id INT NOT NULL,
  user_id     INT NOT NULL,
  rating      TINYINT NOT NULL,
  comment     TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_resource_user (resource_id, user_id),
  FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_resource_reviews ON resource_reviews(resource_id);

CREATE TABLE resource_review_upvotes (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  review_id INT NOT NULL,
  user_id   INT NOT NULL,
  UNIQUE KEY uq_review_upvote (review_id, user_id),
  FOREIGN KEY (review_id) REFERENCES resource_reviews(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)   REFERENCES users(id)            ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- NEWS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE news (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  summary     TEXT,
  link        VARCHAR(2000),
  source_type ENUM('climate','esg','csrd','carbon','biodiversity','general') NOT NULL DEFAULT 'general',
  source_name VARCHAR(255),
  image_url   VARCHAR(500),
  is_trending TINYINT(1) NOT NULL DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_news_source_type ON news(source_type);
CREATE INDEX idx_news_trending    ON news(is_trending);

-- ─────────────────────────────────────────────────────────────────────────────
-- TEAM MEMBERS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE team_members (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  role          VARCHAR(255),
  photo_url     VARCHAR(500),
  linkedin_url  VARCHAR(500),
  bio           TEXT,
  display_order INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- COMMUNITY FEED
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE feed_posts (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  author_id        INT NOT NULL,
  post_type        ENUM('esg_product','poll','event','case_study','general') NOT NULL DEFAULT 'general',
  content          TEXT NOT NULL,
  tags             JSON,
  poll_options     JSON,
  poll_ends_at     DATETIME,
  event_link       VARCHAR(500),
  reaction_counts  JSON,
  is_hidden        TINYINT(1)    NOT NULL DEFAULT 0,
  is_edited        TINYINT(1)    NOT NULL DEFAULT 0,
  like_count       INT           NOT NULL DEFAULT 0,
  comment_count    INT           NOT NULL DEFAULT 0,
  save_count       INT           NOT NULL DEFAULT 0,
  score            DECIMAL(10,4) NOT NULL DEFAULT 0,
  score_updated_at TIMESTAMP,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_feed_posts_author ON feed_posts(author_id);
CREATE INDEX idx_feed_posts_type   ON feed_posts(post_type);
CREATE INDEX idx_feed_posts_score  ON feed_posts(score DESC);

CREATE TABLE feed_post_media (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  post_id       INT NOT NULL,
  url           VARCHAR(500) NOT NULL,
  type          ENUM('image','video') NOT NULL DEFAULT 'image',
  display_order INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES feed_posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_feed_post_media ON feed_post_media(post_id);

CREATE TABLE feed_comments (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  post_id    INT NOT NULL,
  author_id  INT NOT NULL,
  parent_id  INT NULL DEFAULT NULL,
  content    TEXT NOT NULL,
  is_hidden  TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id)   REFERENCES feed_posts(id)    ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id)         ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES feed_comments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_feed_comments_post   ON feed_comments(post_id);
CREATE INDEX idx_feed_comments_author ON feed_comments(author_id);
CREATE INDEX idx_feed_comments_parent ON feed_comments(parent_id);

CREATE TABLE feed_likes (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  post_id    INT NOT NULL,
  user_id    INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_feed_like (post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES feed_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)      ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE feed_reactions (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  post_id       INT NOT NULL,
  user_id       INT NOT NULL,
  reaction_type VARCHAR(30) NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_reaction (post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES feed_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)      ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE feed_saves (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  post_id    INT NOT NULL,
  user_id    INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_feed_save (post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES feed_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)      ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE feed_poll_votes (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  post_id      INT     NOT NULL,
  user_id      INT     NOT NULL,
  option_index TINYINT NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_poll_vote (post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES feed_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)      ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE feed_like_digest_log (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  post_id   INT NOT NULL,
  author_id INT NOT NULL,
  sent_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_like_digest (post_id, author_id),
  FOREIGN KEY (post_id)   REFERENCES feed_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id)      ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE saved_posts (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  post_id    INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_saved_post (user_id, post_id),
  FOREIGN KEY (user_id) REFERENCES users(id)      ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES feed_posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- Q&A
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE qna_posts (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(255) NOT NULL,
  body         TEXT NOT NULL,
  tags         VARCHAR(500),
  author_id    INT NOT NULL,
  vote_count   INT DEFAULT 0,
  answer_count INT DEFAULT 0,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_qna_author ON qna_posts(author_id);

CREATE TABLE qna_answers (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  post_id    INT NOT NULL,
  author_id  INT NOT NULL,
  body       TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id)   REFERENCES qna_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id)     ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_answers_post ON qna_answers(post_id);

CREATE TABLE qna_votes (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  post_id    INT NOT NULL,
  user_id    INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_qna_vote (post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES qna_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)     ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- ESG SOLUTION REVIEWS  (was Product Reviews)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE products (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  name              VARCHAR(255) NOT NULL,
  vendor            VARCHAR(255) NOT NULL,
  category          VARCHAR(255),
  portal_url        VARCHAR(500),
  short_description TEXT,
  overview          TEXT,
  version_tested    VARCHAR(100),
  key_features      JSON,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_products_vendor   ON products(vendor);
CREATE INDEX idx_products_category ON products(category);

CREATE TABLE product_feature_tests (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  product_id    INT NOT NULL,
  feature_name  VARCHAR(255) NOT NULL,
  test_method   TEXT,
  result        TEXT,
  score         DECIMAL(4,1),
  comments      TEXT,
  display_order INT DEFAULT 0,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_feature_tests_product ON product_feature_tests(product_id);

CREATE TABLE product_media (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  product_id    INT NOT NULL,
  type          ENUM('image','video') NOT NULL,
  url           VARCHAR(500) NOT NULL,
  label         VARCHAR(255),
  display_order INT DEFAULT 0,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_product_media ON product_media(product_id);

CREATE TABLE product_evidences (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  product_id      INT NOT NULL,
  feature_test_id INT NULL,
  file_url        VARCHAR(500) NOT NULL,
  file_name       VARCHAR(255),
  file_type       VARCHAR(100),
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id)      REFERENCES products(id)              ON DELETE CASCADE,
  FOREIGN KEY (feature_test_id) REFERENCES product_feature_tests(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_product_evidences ON product_evidences(product_id);

CREATE TABLE product_user_reviews (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  user_id    INT NOT NULL,
  rating     TINYINT NOT NULL,
  comment    TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_product_user_review (product_id, user_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_user_reviews_product ON product_user_reviews(product_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- AWARDS & NOMINATIONS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE awards (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  is_active   BOOLEAN   DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE award_categories (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  award_id   INT NOT NULL,
  name       VARCHAR(255) NOT NULL,
  timeline   ENUM('quarterly','half-yearly','yearly') NOT NULL DEFAULT 'yearly',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (award_id) REFERENCES awards(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_award_categories ON award_categories(award_id);

CREATE TABLE nominees (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  award_id     INT NOT NULL,
  category_id  INT NOT NULL,
  name         VARCHAR(255) NOT NULL,
  designation  VARCHAR(255),
  company      VARCHAR(255),
  photo_url    VARCHAR(500),
  linkedin_url VARCHAR(500),
  achievements TEXT,
  description  TEXT,
  is_winner    TINYINT(1) NOT NULL DEFAULT 0,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (award_id)    REFERENCES awards(id)           ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES award_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_nominees_award    ON nominees(award_id);
CREATE INDEX idx_nominees_category ON nominees(category_id);

CREATE TABLE votes (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  nominee_id  INT NOT NULL,
  category_id INT NOT NULL,
  award_id    INT NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_vote_per_category (user_id, category_id),
  FOREIGN KEY (user_id)     REFERENCES users(id)            ON DELETE CASCADE,
  FOREIGN KEY (nominee_id)  REFERENCES nominees(id)         ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES award_categories(id) ON DELETE CASCADE,
  FOREIGN KEY (award_id)    REFERENCES awards(id)           ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_votes_user    ON votes(user_id);
CREATE INDEX idx_votes_nominee ON votes(nominee_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- APP SETTINGS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE app_settings (
  key_name    VARCHAR(100) NOT NULL PRIMARY KEY,
  value       VARCHAR(500) NOT NULL,
  description TEXT,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
