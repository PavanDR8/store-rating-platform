-- Rollex Store Rating Platform - PostgreSQL schema (idempotent: safe to run more than once)

CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(60)  NOT NULL CHECK (char_length(name) BETWEEN 20 AND 60),
  email       VARCHAR(255) NOT NULL,
  password    VARCHAR(255) NOT NULL,                      -- bcrypt hash, never plain text
  address     VARCHAR(400) NOT NULL,
  role        VARCHAR(20)  NOT NULL DEFAULT 'USER' CHECK (role IN ('ADMIN', 'USER', 'STORE_OWNER')),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT users_email_key UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS stores (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(60)  NOT NULL CHECK (char_length(name) BETWEEN 3 AND 60),
  email       VARCHAR(255) NOT NULL,
  address     VARCHAR(400) NOT NULL,
  owner_id    INTEGER      NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT stores_email_key UNIQUE (email),
  CONSTRAINT stores_owner_id_key UNIQUE (owner_id)         -- one store per owner account
);

CREATE TABLE IF NOT EXISTS ratings (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER     NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  store_id    INTEGER     NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  rating      INTEGER     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ratings_user_store_key UNIQUE (user_id, store_id)   -- one rating per user per store
);

CREATE INDEX IF NOT EXISTS idx_users_role        ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_name        ON users(name);
CREATE INDEX IF NOT EXISTS idx_stores_name       ON stores(name);
CREATE INDEX IF NOT EXISTS idx_ratings_store_id  ON ratings(store_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id   ON ratings(user_id);

-- Keep updated_at fresh on every UPDATE
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at   ON users;
CREATE TRIGGER trg_users_updated_at   BEFORE UPDATE ON users   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_stores_updated_at  ON stores;
CREATE TRIGGER trg_stores_updated_at  BEFORE UPDATE ON stores  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_ratings_updated_at ON ratings;
CREATE TRIGGER trg_ratings_updated_at BEFORE UPDATE ON ratings FOR EACH ROW EXECUTE FUNCTION set_updated_at();
