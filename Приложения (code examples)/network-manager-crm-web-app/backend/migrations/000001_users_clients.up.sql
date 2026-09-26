-- Users and clients

CREATE TYPE user_role AS ENUM ('manager', 'worker', 'supervisor');
CREATE TYPE user_status AS ENUM ('pending', 'active', 'blocked', 'rejected');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id BIGINT UNIQUE,
    role user_role NOT NULL DEFAULT 'worker',
    status user_status NOT NULL DEFAULT 'pending',
    first_name VARCHAR(100) NOT NULL DEFAULT '',
    last_name VARCHAR(100) NOT NULL DEFAULT '',
    phone VARCHAR(32) NOT NULL DEFAULT '',
    email VARCHAR(255) NOT NULL DEFAULT '',
    position VARCHAR(120) NOT NULL DEFAULT '',
    specialization VARCHAR(120) NOT NULL DEFAULT '',
    hourly_rate NUMERIC(15, 2) NOT NULL DEFAULT 0,
    language VARCHAR(8) NOT NULL DEFAULT 'ru',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_telegram_id ON users (telegram_id);
CREATE INDEX idx_users_status ON users (status);
CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_specialization ON users (specialization);

CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT '',
    city VARCHAR(100) NOT NULL DEFAULT '',
    contact_person VARCHAR(150) NOT NULL DEFAULT '',
    phone VARCHAR(32) NOT NULL DEFAULT '',
    email VARCHAR(255) NOT NULL DEFAULT '',
    comment TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_clients_name ON clients (name);
CREATE INDEX idx_clients_country_city ON clients (country, city);
