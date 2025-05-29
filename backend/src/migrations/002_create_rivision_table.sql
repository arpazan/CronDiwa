-- Create revision table
DROP TABLE IF EXISTS revisions;
CREATE TABLE IF NOT EXISTS revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name VARCHAR NOT NULL,
  record_id INTEGER NOT NULL,
  "action" VARCHAR NOT NULL,
  "snapshot" TEXT NOT NULL,
  changed_by VARCHAR,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
