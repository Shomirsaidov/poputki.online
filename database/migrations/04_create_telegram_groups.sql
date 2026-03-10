-- Create telegram_groups table to store dynamically broadcasted groups
CREATE TABLE IF NOT EXISTS telegram_groups (
    id SERIAL PRIMARY KEY,
    chat_id TEXT UNIQUE NOT NULL,
    title TEXT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: No RLS required out of the box unless the UI needs to display them to users.
