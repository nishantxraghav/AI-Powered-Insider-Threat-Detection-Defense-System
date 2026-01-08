import pandas as pd
import numpy as np
import joblib
import shap
from lime.lime_tabular import LimeTabularExplainer
import os

DATA_DIR = 'data'
MODEL_DIR = 'models'

# Load data
features = pd.read_csv(os.path.join(DATA_DIR, 'features.csv'))
scores = pd.read_csv(os.path.join(DATA_DIR, 'anomaly_scores.csv'))
df = pd.merge(features, scores, on='user')
X = features.drop(['user'], axis=1).values

# Select top anomaly
top_user = df.sort_values('isolation_forest', ascending=False).iloc[0]['user']
user_idx = df.index[df['user'] == top_user][0]
print(f'Explaining anomaly for user: {top_user}')

# Load model
iso = joblib.load(os.path.join(MODEL_DIR, 'isolation_forest.pkl'))

# LIME explanation
explainer = LimeTabularExplainer(X, feature_names=features.columns[1:], discretize_continuous=True)
exp = explainer.explain_instance(X[user_idx], iso.decision_function)
print('\nLIME Explanation:')
for f, w in exp.as_list():
    print(f'{f}: {w:.3f}')

# SHAP explanation
explainer_shap = shap.Explainer(iso, X)
shap_values = explainer_shap(X[user_idx:user_idx+1])
print('\nSHAP Explanation:')
for name, value in zip(features.columns[1:], shap_values.values[0]):
    print(f'{name}: {value:.3f}') 