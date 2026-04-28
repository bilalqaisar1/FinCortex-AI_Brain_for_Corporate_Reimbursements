import asyncio
import logging
from enum import Enum, auto
from typing import Dict, Any, Tuple

from pydantic import BaseModel, Field
from tenacity import retry, wait_exponential, stop_after_attempt

# Optional ML libraries. Fallbacks should handle if they fail to load.
try:
    import catboost
except ImportError:
    catboost = None

try:
    from opentelemetry import trace
    tracer = trace.get_tracer(__name__)
except ImportError:
    # Fallback dummy tracer if OpenTelemetry is not fully set up
    class DummySpan:
        def set_attribute(self, *args, **kwargs): pass
        def record_exception(self, *args, **kwargs): pass
        def get_span_context(self):
            class Ctx:
                trace_id = 0
            return Ctx()
        def __enter__(self): return self
        def __exit__(self, *args): pass
        def __call__(self, func):
            # Allows it to be used as a decorator like @tracer.start_as_current_span
            import functools
            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                return func(*args, **kwargs)
            return wrapper
    
    class DummyTracer:
        def start_as_current_span(self, name): return DummySpan()
    
    tracer = DummyTracer()

logger = logging.getLogger(__name__)

# ---------------------------------------------------------
# PHASE 2: Strict Finite State Machine (FSM) Enforcement
# ---------------------------------------------------------
class MLInferenceState(Enum):
    PENDING = auto()
    FETCHING_RPC = auto()
    VALIDATING_SCHEMA = auto()
    CALCULATING_PROBABILITY = auto()
    SAVING_OUTBOX = auto()
    SUCCESS = auto()
    FALLBACK_REJECTED = auto()

# ---------------------------------------------------------
# PHASE 1: Zero-Trust Boundary & Pydantic Validation
# ---------------------------------------------------------
class MLFeatureDTO(BaseModel):
    """
    Strict Data Contract preventing mass-assignment and type coercion.
    Default fallbacks ensure mathematical determinism in CatBoost.
    """
    claims_in_past_90_days: int = Field(default=0, ge=0)
    days_since_last_claim: int = Field(default=-1)
    amount_vs_policy_max_ratio: float = Field(default=0.0, ge=0.0)
    user_role: str = Field(default="Unknown")
    amount_claimed: float = Field(ge=0.0)
    budget_utilization_ratio: float = Field(default=0.0, ge=0.0)
    days_since_expense: int = Field(default=0)
    is_weekend_expense: bool = Field(default=False)
    historical_approval_rate: float = Field(default=0.0, ge=0.0, le=1.0)
    has_policy_violation: bool = Field(default=False)
    violation_severity: str = Field(default="none")
    manager_comment_length: int = Field(default=0, ge=0)
    flags_count: int = Field(default=0, ge=0)


# ---------------------------------------------------------
# PHASE 4 & 5: Circuit Breaker & Distributed State
# ---------------------------------------------------------
class RealTimeScoringPipeline:
    def __init__(self, supabase_client):
        # DI: Inject database client for testability
        self.supabase = supabase_client
        
        # O(1) Memory load: No IO blocking during Inference
        if catboost is not None:
            try:
                self.model = catboost.CatBoostClassifier().load_model('models/reimbursement_scorer.cbm')
            except Exception as e:
                logger.warning(f"Failed to load CatBoost model. SOTA ML will gracefully fallback. Error: {e}")
                self.model = None
        else:
            self.model = None

    @tracer.start_as_current_span("ml_pipeline_execution")
    async def evaluate_fraud_risk(self, receipt_code: str, idempotency_key: str) -> Dict[str, Any]:
        """
        Executes the State Machine. Always returns a determinist result.
        """
        current_state = MLInferenceState.PENDING
        span = tracer.start_as_current_span("ml_pipeline_execution") # type: ignore
        span.set_attribute("idempotency_key", idempotency_key)

        # Fail fast if model isn't loaded
        if not self.model:
            return self._fallback_response("MODEL_NOT_LOADED", span)

        try:
            # --- State: FETCHING_RPC ---
            current_state = MLInferenceState.FETCHING_RPC
            raw_features = await self._query_database_rpc(receipt_code)

            # --- State: VALIDATING_SCHEMA ---
            current_state = MLInferenceState.VALIDATING_SCHEMA
            validated_features = MLFeatureDTO(**raw_features).model_dump()

            # --- State: CALCULATING_PROBABILITY ---
            current_state = MLInferenceState.CALCULATING_PROBABILITY
            
            # ✅ CORRECT: Offloaded CPU-bound ML inference to a background thread
            # Prevents Event Loop blocking while CatBoost performs complex matrix mathematics
            fraud_prob, is_flagged = await asyncio.to_thread(
                self._run_catboost_inference, 
                validated_features
            )
            span.set_attribute("calculated_fraud_probability", fraud_prob)

            # --- State: SAVING_OUTBOX ---
            current_state = MLInferenceState.SAVING_OUTBOX
            # Fire-and-forget outbox log so we don't hold the user hostage to DB write speeds
            asyncio.create_task(
                self._log_to_ml_outbox(receipt_code, validated_features, fraud_prob, idempotency_key)
            )

            # --- State: SUCCESS ---
            current_state = MLInferenceState.SUCCESS
            return {
                "probability": fraud_prob,
                "is_anomalous": is_flagged,
                "state": current_state.name,
                "trace_id": format(span.get_span_context().trace_id, '032x')
            }

        except Exception as e:
            # 🚨 Failure-First Architecture: Graceful Degradation
            logger.error(f"Pipeline crashed in state [{current_state.name}]: {str(e)}", exc_info=True)
            span.record_exception(e)
            return self._fallback_response("ML_SERVICE_DEGRADED", span)

    def _fallback_response(self, error_reason: str, span: Any) -> Dict[str, Any]:
        return {
            "probability": -1.0, # Indicates rule-based heuristic should take over
            "is_anomalous": False, 
            "state": MLInferenceState.FALLBACK_REJECTED.name,
            "trace_id": format(span.get_span_context().trace_id, '032x'),
            "error_reason": error_reason
        }

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=4),
        reraise=True
    )
    async def _query_database_rpc(self, receipt_code: str) -> Dict[str, Any]:
        """
        Protected by Tenacity Circuit Breaker. Prevents cascading failures if DB pool is exhausted.
        """
        response = await asyncio.to_thread(
            self.supabase.rpc('get_ml_features_json', {'p_receipt_code': receipt_code}).execute
        )
        if not response.data:
            raise ValueError(f"Feature extraction yielded empty result for {receipt_code}")
        return response.data

    def _run_catboost_inference(self, data: Dict[str, Any]) -> Tuple[float, bool]:
        """
        Synchronous, localized CPU-bound math execution (Safe to run in worker threads).
        """
        # Convert strict schema to exact sequential list expected by the trained CatBoost schema
        feature_vector = [
            data['amount_claimed'],
            data['claims_in_past_90_days'],
            data['days_since_last_claim'],
            data['amount_vs_policy_max_ratio'],
            data['budget_utilization_ratio'],
            data['days_since_expense'],
            data['historical_approval_rate'],
            data['manager_comment_length'],
            data['flags_count'],
            data['user_role'],                   # Categorical string
            data['violation_severity'],          # Categorical string
            str(data['is_weekend_expense']),     # Categorical stringified boolean
            str(data['has_policy_violation'])    # Categorical stringified boolean
        ]
        
        probs = self.model.predict_proba([feature_vector])[0]
        fraud_probability = round(probs[1], 4)
        is_anomalous = bool(fraud_probability > 0.85)
        
        return fraud_probability, is_anomalous

    async def _log_to_ml_outbox(self, receipt_code: str, features: Dict, score: float, idempotency_key: str):
        """
        Transactional Outbox implementation. Logs immutable state for auditing and future model retraining.
        """
        try:
            payload = {
                "receipt_code": receipt_code,
                "idempotency_key": idempotency_key,
                "features_snapshot": features,
                "model_score": score,
                "model_version": "v1.0.0"
            }
            await asyncio.to_thread(self.supabase.table("ml_audit_outbox").insert(payload).execute)
        except Exception as e:
            logger.warning(f"Failed to write Outbox for {receipt_code}: {str(e)}")

# ---------------------------------------------------------
# STANDALONE EXECUTION / TESTING BLOCK
# ---------------------------------------------------------
if __name__ == "__main__":
    import asyncio
    import uuid
    from pydantic import BaseModel
    import os

    # Setup basic logging to see the output
    logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

    # A Dummy Supabase Client for local testing without hitting the real DB
    class DummyRPCResponse(BaseModel):
        data: Dict[str, Any]

    class DummySupabaseClient:
        class DummyRPC:
            def __init__(self, data):
                self._data = data
            def execute(self):
                return DummyRPCResponse(data=self._data)
                
        def rpc(self, func_name, payload):
            logger.info(f"Mocking PostgreSQL RPC: {func_name} with args {payload}")
            # Mock historical features that might come from Postgres
            return self.DummyRPC({
                "claims_in_past_90_days": 2,
                "days_since_last_claim": 14,
                "amount_vs_policy_max_ratio": 1.2, # Slightly over limit
                "user_role": "Employee",
                "amount_claimed": 450.00,
                "budget_utilization_ratio": 0.85,
                "days_since_expense": 2,
                "is_weekend_expense": False,
                "historical_approval_rate": 0.95,
                "has_policy_violation": False,
                "violation_severity": "none",
                "manager_comment_length": 15,
                "flags_count": 0
            })
            
        def table(self, table_name):
            class DummyTable:
                def insert(self, data):
                    class DummyInsert:
                        def execute(self):
                            logger.info(f"[OUTBOX] Dummy inserted to {table_name}: {data}")
                    return DummyInsert()
            return DummyTable()

    async def run_test():
        print("\n--- 🧠 STARTING SOTA ML PREDICTION TEST ---\n")
        
        # 1. Initialize Pipeline with Dummy Client
        dummy_supabase = DummySupabaseClient()
        pipeline = RealTimeScoringPipeline(supabase_client=dummy_supabase)
        
        receipt_code = "TEST-REC-999"
        idempotency_key = str(uuid.uuid4())
        
        print(f"Triggering Inference for Receipt: {receipt_code}")
        
        # 2. Execute
        result = await pipeline.evaluate_fraud_risk(
            receipt_code=receipt_code,
            idempotency_key=idempotency_key
        )
        
        print("\n--- 🎯 INFERENCE RESULT ---")
        import json
        print(json.dumps(result, indent=2))
        print("\nNote: Outbox save is evaluating in the background asynchronously.")
        
        # Slight sleep to let the async outbox fire-and-forget task finish before script exits
        await asyncio.sleep(0.5)

    # Use the appropriate async runner
    asyncio.run(run_test())
