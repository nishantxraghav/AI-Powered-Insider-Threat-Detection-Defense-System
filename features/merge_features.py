import pandas as pd
import os

DATA_DIR = 'data'

# Load features
df_classic = pd.read_csv(os.path.join(DATA_DIR, 'features.csv'))
df_graph = pd.read_csv(os.path.join(DATA_DIR, 'graph_features.csv'))
df_nlp = pd.read_csv(os.path.join(DATA_DIR, 'nlp_email_features.csv'))
red_team_path = os.path.join(DATA_DIR, 'red_team_users.csv')
red_team = pd.read_csv(red_team_path)['user'].tolist() if os.path.exists(red_team_path) else []

# Aggregate NLP features per user (mean)
df_nlp['user'] = df_nlp['sender'].str.replace('@company.com', '')
df_nlp_agg = df_nlp.groupby('user').agg({
    'keyword_flag': 'mean',
    'subject_len': 'mean',
    'sentiment': 'mean'
}).reset_index()

# Merge all features
df = df_classic.merge(df_graph, on='user', how='left').merge(df_nlp_agg, on='user', how='left')
df['is_red_team'] = df['user'].isin(red_team).astype(int)
df.to_csv(os.path.join(DATA_DIR, 'merged_features.csv'), index=False)
print('Merged features saved to data/merged_features.csv') 