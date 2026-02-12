-- Add department_id to company_budgets table
ALTER TABLE company_budgets 
ADD COLUMN IF NOT EXISTS department_id BIGINT REFERENCES departments(department_id);

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_company_budgets_department_id ON company_budgets(department_id);

-- Comment
COMMENT ON COLUMN company_budgets.department_id IS 'Optional department scope for this budget allocation';
