ALTER TABLE users RENAME COLUMN discord_id TO provider_id;
--> statement-breakpoint
DROP INDEX users_discord_id_unique;
--> statement-breakpoint
CREATE UNIQUE INDEX users_provider_id_unique ON users(provider_id);
--> statement-breakpoint
UPDATE users SET provider_id = 'legacy:' || provider_id WHERE provider_id NOT LIKE 'dev:%';
--> statement-breakpoint
-- Retire sessions issued by the removed identity provider; keep accounts and results.
DELETE FROM user_sessions WHERE user_id IN (SELECT id FROM users WHERE provider_id LIKE 'legacy:%');
