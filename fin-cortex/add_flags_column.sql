-- Add flags column to reimbursements table to store policy violation details
ALTER TABLE reimbursements 
ADD COLUMN IF NOT EXISTS flags JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN reimbursements.flags IS 'Array of policy violation objects: {code, message, severity}';
