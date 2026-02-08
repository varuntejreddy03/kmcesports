-- Create admin_audit_logs table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id TEXT NOT NULL, -- The hall_ticket or ID of the admin performing the action
    action TEXT NOT NULL,   -- e.g., 'TEAM_APPROVED', 'TEAM_REJECTED', 'TEAM_DELETED'
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Dynamic policy for admins only (assuming hall_ticket 'ADMIN' check)
CREATE POLICY "Admins can see all logs" 
ON public.admin_audit_logs 
FOR SELECT 
USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'hall_ticket' = 'ADMIN'
));

-- Insert policy for the server/API
CREATE POLICY "Server can insert logs" 
ON public.admin_audit_logs 
FOR INSERT 
WITH CHECK (true);
