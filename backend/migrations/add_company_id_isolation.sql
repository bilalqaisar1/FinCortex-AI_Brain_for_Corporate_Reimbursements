-- Multi-Tenant Data Isolation Migration
-- Run this in Supabase SQL Editor BEFORE deploying code changes.

-- 1. Add company_id to departments table
ALTER TABLE public.departments 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(company_id);

-- 2. Add company_id to expense_categories table  
ALTER TABLE public.expense_categories 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(company_id);

-- 3. Create indexes for query performance
CREATE INDEX IF NOT EXISTS idx_departments_company_id ON public.departments(company_id);
CREATE INDEX IF NOT EXISTS idx_expense_categories_company_id ON public.expense_categories(company_id);
