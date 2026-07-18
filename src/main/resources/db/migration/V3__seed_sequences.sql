-- Reconciles each id sequence against the actual data in its table.
--
-- Fixes a confirmed bug in the old CRaC afterRestore code: it did
-- `CREATE SEQUENCE IF NOT EXISTS ... START WITH 1 INCREMENT BY 50`, which is only safe on a
-- truly empty table. If a sequence object was ever missing/dropped/recreated while its table
-- already had rows (e.g. a previous restore against a populated DB), START WITH 1 would hand
-- out ids that already exist, causing primary key collisions on insert.
--
-- setval(seq, GREATEST(current_max_id, 1)) with the default is_called=true means the *next*
-- nextval() call returns at least current_max_id + increment (50), i.e. a full allocation
-- block strictly beyond every id already in the table - safe regardless of exactly how
-- Hibernate's pooled sequence optimizer maps sequence values to entity ids.
-- CREATE SEQUENCE IF NOT EXISTS in V1 is a no-op when the sequence already exists (the
-- normal prod case), so this reconciliation is what actually protects against collisions;
-- V1 alone would not.

-- The extra `last_value` term keeps this from ever moving a sequence BACKWARD: during a
-- rolling deploy an old instance may still be handing out ids from its already-allocated
-- block above MAX(id) (e.g. prod's question_seq at 351 with MAX(id)=341), and rewinding
-- the sequence would let a new instance re-allocate that same range.
SELECT setval('question_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM question), (SELECT last_value FROM question_seq), 1));
SELECT setval('statistics_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM statistics), (SELECT last_value FROM statistics_seq), 1));
SELECT setval('archived_question_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM archived_question), (SELECT last_value FROM archived_question_seq), 1));
