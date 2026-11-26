CREATE TABLE photos (
  id TEXT PRIMARY KEY,
  member TEXT NOT NULL,
  day INTEGER,
  item_id TEXT,
  place_id TEXT,
  taken_at TEXT,
  caption TEXT,
  w INTEGER,
  h INTEGER,
  thumb_key TEXT NOT NULL,
  orig_key TEXT,
  orig_name TEXT,
  orig_size INTEGER,
  created_at TEXT NOT NULL
);
CREATE INDEX photos_day ON photos(day, taken_at);

CREATE TABLE expenses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('JPY', 'KRW')),
  payer TEXT NOT NULL,
  participants TEXT NOT NULL,
  day INTEGER,
  place_id TEXT,
  settled INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
INSERT INTO settings (key, value) VALUES ('rate', '9.3');

-- 일일 사용량 제한 (번역·사진 업로드·로그인 실패)
CREATE TABLE usage (
  subject TEXT NOT NULL,
  bucket TEXT NOT NULL,
  kind TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (subject, bucket, kind)
);
