-- Credential-based auth: password hash and unique email for form login

ALTER TABLE users
    ADD COLUMN password_hash VARCHAR(255) NOT NULL DEFAULT '';

-- Unique email for accounts with form login (empty email allowed for Telegram-only users)
CREATE UNIQUE INDEX idx_users_email_unique ON users (LOWER(email))
    WHERE email <> '';

CREATE INDEX idx_users_email ON users (LOWER(email))
    WHERE email <> '';
