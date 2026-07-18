-- Replaces the old DatabaseMigration CommandLineRunner, which ran this exact backfill as
-- an unversioned, swallowed-exception step on every single instance start (including every
-- CRaC restore). Now it runs exactly once, tracked by Flyway.
--
-- Backfill historical rows with no language set, then enforce NOT NULL + DEFAULT so future
-- rows can never leave it null again. This matches the Room/ArchivedQuestion entity change
-- (plain `val language: String = "ru"` instead of the private-nullable-field + getter
-- workaround), which requires ddl-auto=validate to see a NOT NULL column here.

UPDATE room SET language = 'ru' WHERE language IS NULL;
UPDATE archived_question SET language = 'ru' WHERE language IS NULL;

ALTER TABLE room ALTER COLUMN language SET DEFAULT 'ru';
ALTER TABLE room ALTER COLUMN language SET NOT NULL;

ALTER TABLE archived_question ALTER COLUMN language SET DEFAULT 'ru';
ALTER TABLE archived_question ALTER COLUMN language SET NOT NULL;
