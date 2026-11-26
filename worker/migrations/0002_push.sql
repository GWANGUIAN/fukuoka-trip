CREATE TABLE push_subs (
  endpoint TEXT PRIMARY KEY,
  member TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  ua TEXT,
  created_at TEXT NOT NULL,
  last_ok TEXT,
  fail_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE push_sent (
  key TEXT PRIMARY KEY,
  sent_at TEXT NOT NULL
);
