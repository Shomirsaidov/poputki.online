CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    surname VARCHAR(255),
    age INTEGER,
    sex VARCHAR(10),
    phone VARCHAR(20) UNIQUE, -- Note: This is now practically nullable as Telegram logins don't guarantee phone
    rating DECIMAL(2,1) DEFAULT 5.0,
    role VARCHAR(20) DEFAULT 'passenger',
    preferences JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    password VARCHAR(255),
    telegram_id BIGINT UNIQUE,
    photo_url TEXT,
    username TEXT
);

-- We need to make phone nullable if it isn't already, but in PostgreSQL, if we don't specify NOT NULL, it is nullable by default.
-- However, we have a UNIQUE constraint on it. A UNIQUE constraint allows multiple NULL values in PostgreSQL.
-- So we just need to add the new columns.

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS telegram_id BIGINT UNIQUE,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS username TEXT;
