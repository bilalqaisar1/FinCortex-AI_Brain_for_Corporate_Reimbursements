-- Add monthly_limit column to company_budgets table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_budgets' AND column_name = 'monthly_limit') THEN
        ALTER TABLE company_budgets ADD COLUMN monthly_limit numeric DEFAULT 0;
    END IF;
END $$;
