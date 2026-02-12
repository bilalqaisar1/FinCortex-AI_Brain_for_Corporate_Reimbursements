-- Add category support to company_budgets
ALTER TABLE company_budgets ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES expense_categories(category_id);

-- Add unique constraint to ensure one budget per category per company
-- This prevents multiple budget entries for the same category for a single company
-- Note: If you have existing duplicate company entries, this might fail unless cleaned up.
ALTER TABLE company_budgets ADD CONSTRAINT unique_company_category UNIQUE (company_id, category_id);
