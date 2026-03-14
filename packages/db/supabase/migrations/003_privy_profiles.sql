-- 003: Privy auth support - allow profiles without Supabase Auth
-- Profiles are synced from Privy; id is our internal UUID, privy_id links to Privy user.

-- Add privy_id for lookup (Supabase Cloud - public schema)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS privy_id text UNIQUE;

-- Drop FK to auth.users so we can insert Privy users (Supabase Cloud)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
