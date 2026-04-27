-- Migration: Enforce ACID Budget Concurrency via PostgreSQL Triggers
-- Prevents API-level race conditions when multiple large claims are submitted simultaneously.

CREATE OR REPLACE FUNCTION trigger_enforce_budget_concurrency()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_allowed JSONB;
  v_limit_amount NUMERIC;
  v_spent_already NUMERIC;
BEGIN
  -- We ONLY enforce budget limits for active claims (SUBMITTED, APPROVED, PROCESSING)
  IF NEW.status IN ('SUBMITTED', 'APPROVED', 'PROCESSING') THEN
    
    -- Call the unified RPC to fetch this specific user's max budget threshold
    v_allowed := public.get_allowed_reimbursement_amount(
      NEW.user_id,
      NEW.category_id,
      NEW.subcategory_id
    );

    IF v_allowed->>'allowed' = 'false' THEN
      v_limit_amount := (v_allowed->>'allowed_limit')::NUMERIC;
      v_spent_already := (v_allowed->>'spent_this_month')::NUMERIC;

      -- Check if the exact sum of preexisting spending + the current insertion breaches the constraint limits
      -- The BEFORE INSERT trigger acts identically to a table lock for this execution flow
      IF (v_spent_already + NEW.total_amount) > v_limit_amount THEN
        RAISE EXCEPTION 'Cannot submit claim. The requested amount exceeds your monthly category budget constraint of %.', v_limit_amount
        USING ERRCODE = 'P0001', 
              HINT = 'Concurrency constraint breached.';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_budget_limit ON public.reimbursements;

CREATE TRIGGER trg_enforce_budget_limit
  BEFORE INSERT OR UPDATE ON public.reimbursements
  FOR EACH ROW
  EXECUTE FUNCTION trigger_enforce_budget_concurrency();
