USE gsc_database;
INSERT INTO app_settings (key_name, value, description) VALUES
  ("platform_name",       "Global Sustainability Council", "Platform display name"),
  ("platform_short_name", "GSC",                           "Short acronym"),
  ("platform_tagline",    "Advancing Sustainable Business Worldwide", "Hero tagline"),
  ("contact_email",       "hello@globalsustainabilitycouncil.com", "Main contact email"),
  ("news_fetch_enabled",  "true", "Toggle automated news fetching cron"),
  ("membership_enabled",  "true", "Toggle membership applications"),
  ("nominations_enabled", "true", "Toggle award nominations and voting");
