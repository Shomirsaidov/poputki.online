-- 02_add_user_passwords.sql
-- Add password column to users table for bus driver authentication

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- Create a comment for the column
COMMENT ON COLUMN public.users.password IS 'Password for bus_driver role to access mini admin panel';
