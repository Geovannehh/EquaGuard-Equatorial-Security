CREATE TABLE IF NOT EXISTS learners (
    id TEXT PRIMARY KEY,
    profile TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS attempts (
    id INTEGER PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES learners(id),
    kind TEXT NOT NULL,
    item TEXT NOT NULL,
    topic TEXT NOT NULL,
    correct INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS awards (
    user_id TEXT NOT NULL REFERENCES learners(id),
    item TEXT NOT NULL,
    xp INTEGER NOT NULL,
    PRIMARY KEY(user_id,item)
);

CREATE TABLE IF NOT EXISTS assessments (
    id INTEGER PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES learners(id),
    phase TEXT NOT NULL,
    score INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recommendations (
    user_id TEXT NOT NULL REFERENCES learners(id),
    lesson TEXT NOT NULL,
    offered INTEGER NOT NULL DEFAULT 1,
    used INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(user_id,lesson)
);
CREATE INDEX IF NOT EXISTS attempts_user ON attempts(user_id
);

CREATE TABLE IF NOT EXISTS escape_runs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES learners(id),
    team TEXT NOT NULL,
    members INTEGER NOT NULL,
    duration INTEGER NOT NULL,
    started REAL NOT NULL,
    deadline REAL NOT NULL,
    stage INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    mistakes INTEGER NOT NULL DEFAULT 0,
    hints TEXT NOT NULL DEFAULT '[]',
    last_feedback TEXT NOT NULL DEFAULT '',
    finished REAL,
    xp INTEGER NOT NULL DEFAULT 0

);
CREATE INDEX IF NOT EXISTS escape_user ON escape_runs(user_id,started
);
