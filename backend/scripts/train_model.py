import pandas as pd
from catboost import CatBoostClassifier
from sklearn.model_selection import train_test_split
import os

print("Loading dataset...")
df = pd.read_csv('/media/mahroz/volumeS/git/FinCortex-AI_Brain_for_Corporate_Reimbursements/reimbursement_fraud_data.csv')

# Feature order EXACTLY as in ml_prob_prediction_service.py
features_order = [
    'amount_claimed',
    'claims_in_past_90_days',
    'days_since_last_claim',
    'amount_vs_policy_max_ratio',
    'budget_utilization_ratio',
    'days_since_expense',
    'historical_approval_rate',
    'manager_comment_length',
    'flags_count',
    'user_role',
    'violation_severity',
    'is_weekend_expense',
    'has_policy_violation'
]

print("Preprocessing data...")
# Ensure categorical boolean columns are strings so CatBoost natively recognizes them
df['is_weekend_expense'] = df['is_weekend_expense'].astype(str)
df['has_policy_violation'] = df['has_policy_violation'].astype(str)

X = df[features_order]
y = df['is_fraud']

# Use feature names instead of indices for robust categorical handling
cat_features = [
    'user_role', 
    'violation_severity', 
    'is_weekend_expense', 
    'has_policy_violation'
]

# Stratify ensures both train and test sets maintain the 85/15 ratio
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# --- THE OPTIMAL SETTINGS ---
params = {
    'iterations': 2000,                 # High ceiling; lets the model keep learning from the massive 50k dataset
    'learning_rate': 0.03,              # Slower, steady learning to build highly calibrated, confident probabilities
    'depth': 6,                         # Optimal for tabular data to find feature interactions without overfitting
    'loss_function': 'Logloss',         # Required for outputting accurate probabilities instead of just binary labels
    'eval_metric': 'AUC',               # Best metric for separating fraud from normal cases
    'auto_class_weights': 'Balanced',   # CRITICAL: Fixes the 0.4 probability ceiling by offsetting the 85/15 imbalance
    'l2_leaf_reg': 3.0,                 # Safe at 3.0 (default) because 50,000 rows provide enough data per node
    'early_stopping_rounds': 50,        # Safety brake: Stops training automatically if the test AUC stops improving
    'random_seed': 42,                  # Ensures reproducibility across runs
    'verbose': 100                      # Keeps your terminal clean
}
print("Training CatBoostClassifier...")
model = CatBoostClassifier(**params)

# Passing eval_set enables early stopping
model.fit(
    X_train, 
    y_train, 
    cat_features=cat_features, 
    eval_set=(X_test, y_test)
)

print("\nSaving model in .cbm format...")
os.makedirs('/media/mahroz/volumeS/git/FinCortex-AI_Brain_for_Corporate_Reimbursements/backend/models', exist_ok=True)
model_path = '/media/mahroz/volumeS/git/FinCortex-AI_Brain_for_Corporate_Reimbursements/backend/models/reimbursement_scorer.cbm'
model.save_model(model_path)
print(f"Model successfully saved to {model_path}")