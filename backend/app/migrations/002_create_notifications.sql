-- Create in_app_notifications table for notification center
-- This supports the in-app alerts feature (User Story 5.2)

CREATE TABLE IF NOT EXISTS public.in_app_notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info', -- info, success, warning, error, action_required
    category VARCHAR(50) DEFAULT 'general', -- claim, approval, system, reminder
    is_read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(500), -- Optional link for notification action
    related_id UUID, -- Reference to related entity (reimbursement_id, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.in_app_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.in_app_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.in_app_notifications(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.in_app_notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON public.in_app_notifications
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications" ON public.in_app_notifications
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Service role can manage all notifications
CREATE POLICY "Service role full access" ON public.in_app_notifications
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE public.in_app_notifications IS 'In-app notification center for user alerts';
