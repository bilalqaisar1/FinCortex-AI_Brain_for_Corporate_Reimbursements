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
# Ensure categorical boolean columns are strings to match inference
df['is_weekend_expense'] = df['is_weekend_expense'].astype(str)
df['has_policy_violation'] = df['has_policy_violation'].astype(str)

X = df[features_order]
y = df['is_fraud']

cat_features = [9, 10, 11, 12]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

params = {
    'iterations': 500,
    'learning_rate': 0.1,
    'eval_metric': 'AUC',
    'verbose': 50
}

print("Training CatBoostClassifier...")
model = CatBoostClassifier(**params)
model.fit(X_train, y_train, cat_features=cat_features, eval_set=(X_test, y_test))

print("Saving model in .cbm format...")
os.makedirs('/media/mahroz/volumeS/git/FinCortex-AI_Brain_for_Corporate_Reimbursements/backend/models', exist_ok=True)
model_path = '/media/mahroz/volumeS/git/FinCortex-AI_Brain_for_Corporate_Reimbursements/backend/models/reimbursement_scorer.cbm'
model.save_model(model_path)
print(f"Model successfully saved to {model_path}")
