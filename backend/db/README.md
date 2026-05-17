# GSC Database

## Run Order (fresh install)

```bash
mysql -u root -p < schema.sql
mysql -u root -p < framework_schema.sql

# Create admin user first (run backend script: npm run create-admin)
# Then run seeds:
mysql -u root -p < seeds/01_app_settings.sql
mysql -u root -p < seeds/02_awards.sql
mysql -u root -p < seeds/03_framework.sql
```

## Migrations (existing RAC → GSC)

Run migrations in numbered order only if migrating from an existing RAC database:

```bash
mysql -u root -p < migrations/001_add_is_winner_to_nominees.sql
mysql -u root -p < migrations/002_add_source_fields_to_news.sql
mysql -u root -p < migrations/003_rename_executive_workshops.sql
mysql -u root -p < migrations/004_update_feed_post_types.sql
mysql -u root -p < migrations/005_add_resource_types.sql
```

## Tables (44 total)

| Group | Tables |
|---|---|
| Auth & Users | users, email_verifications, push_tokens, waitlist |
| Membership | membership_applications |
| Notifications | notifications, notification_reads, notification_digest_log |
| Events | events, event_registrations, expert_workshops |
| Knowledge Hub | resources, resource_reviews, resource_review_upvotes |
| News | news |
| Feed | feed_posts, feed_post_media, feed_comments, feed_likes, feed_reactions, feed_saves, feed_poll_votes, feed_like_digest_log, saved_posts |
| Q&A | qna_posts, qna_answers, qna_votes |
| ESG Solutions | products, product_feature_tests, product_media, product_evidences, product_user_reviews |
| Awards | awards, award_categories, nominees, votes |
| Team | team_members |
| Framework CMS | framework_pillars, framework_maturity_levels, framework_implementation_phases, framework_implementation_steps, framework_audit_templates, framework_sustainability_tools |
| Config | app_settings |
