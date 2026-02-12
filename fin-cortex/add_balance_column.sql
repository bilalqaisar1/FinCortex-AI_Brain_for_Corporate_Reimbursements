-- Add missing account_balance column to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS account_balance NUMERIC DEFAULT 0;

-- Optional: Comment out the line below if you want to initialize all companies with some balance for testing
-- UPDATE companies SET account_balance = 1000000 WHERE account_balance = 0;
