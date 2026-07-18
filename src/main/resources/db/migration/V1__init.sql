-- Baseline schema, written to match exactly what Hibernate's ddl-auto=update has been
-- creating in prod up to now (verified by reverse-engineering the actual DDL Hibernate
-- generates for these entities - see the dump of the local dev H2 database, which uses
-- the same Spring Boot default physical naming strategy as prod's PostgreSQL schema).
--
-- IMPORTANT: this migration is NOT a pure no-op guard against baselineOnMigrate. Flyway's
-- baselineOnMigrate only stops it from refusing to run against a non-empty schema; with
-- baseline-version=0, V1/V2/V3 (versions 1/2/3) all still execute against the already
-- populated prod database. Every statement below is therefore written idempotently
-- (IF NOT EXISTS / existence checks) so it is safe to run against both a brand-new,
-- empty database (fresh training-boot run) and the existing populated prod database.

CREATE SEQUENCE IF NOT EXISTS question_seq START WITH 1 INCREMENT BY 50;
CREATE SEQUENCE IF NOT EXISTS statistics_seq START WITH 1 INCREMENT BY 50;
CREATE SEQUENCE IF NOT EXISTS archived_question_seq START WITH 1 INCREMENT BY 50;

CREATE TABLE IF NOT EXISTS room (
    code         INTEGER NOT NULL PRIMARY KEY,
    date_created TIMESTAMP WITH TIME ZONE,
    language     VARCHAR(255),
    is_paid      BOOLEAN
);

CREATE TABLE IF NOT EXISTS question (
    id            BIGINT NOT NULL PRIMARY KEY,
    date_added    TIMESTAMP WITH TIME ZONE,
    is_predefined BOOLEAN NOT NULL,
    question      VARCHAR(255),
    room_code     INTEGER NOT NULL,
    was_shown     BOOLEAN NOT NULL
);

CREATE TABLE IF NOT EXISTS statistics (
    id                    BIGINT NOT NULL PRIMARY KEY,
    creation_date         TIMESTAMP WITH TIME ZONE,
    questions_predefined  INTEGER NOT NULL,
    questions_shown       INTEGER NOT NULL,
    questions_total       INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS archived_question (
    id            BIGINT NOT NULL PRIMARY KEY,
    date_archived TIMESTAMP WITH TIME ZONE,
    language      VARCHAR(255),
    question      TEXT,
    room_code     INTEGER
);

-- Question carries a @Table(uniqueConstraints = [UniqueConstraint(columnNames = ["question", "roomCode"])]).
-- Hibernate auto-names this constraint via a deterministic hash of table+columns
-- (observed locally as "uk1s78fox0mifjeo354kykx4apd"), independent of SQL dialect, so an
-- existing prod database created by ddl-auto=update should already carry this exact name.
-- Rather than relying on that name matching prod's DB perfectly, guard by column set
-- (via to_regclass, which itself respects search_path/currentSchema) so this is safe
-- whether or not the name lines up, and a no-op if a matching unique constraint already
-- exists under any name.
DO $$
DECLARE
    tbl_oid oid := to_regclass('question')::oid;
BEGIN
    IF tbl_oid IS NOT NULL AND NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        WHERE c.conrelid = tbl_oid
          AND c.contype = 'u'
          AND (
              SELECT array_agg(a.attname ORDER BY a.attname)
              FROM unnest(c.conkey) WITH ORDINALITY AS k(attnum, ord)
              JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
          ) = ARRAY['question', 'room_code']::name[]
    ) THEN
        ALTER TABLE question ADD CONSTRAINT uk1s78fox0mifjeo354kykx4apd UNIQUE (question, room_code);
    END IF;
END $$;
