ALTER TABLE users
    DROP COLUMN IF EXISTS internal_comment,
    DROP COLUMN IF EXISTS telegram_username;
