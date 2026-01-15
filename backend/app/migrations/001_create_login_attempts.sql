-- Create login_attempts table for tracking failed login attempts
-- This supports the account lockout feature (User Story 1.1.1)

CREATE TABLE IF NOT EXISTS public.login_attempts (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    failed_attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON public.login_attempts(email);

-- Enable Row Level Security (RLS)
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage login attempts
CREATE POLICY "Service role can manage login attempts" ON public.login_attempts
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE public.login_attempts IS 'Tracks failed login attempts for account lockout feature';
