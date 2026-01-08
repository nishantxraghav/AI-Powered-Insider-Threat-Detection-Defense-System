import streamlit as st
import pandas as pd
import os

DATA_DIR = 'data'

st.title('AI-Powered Insider Threat Detection Dashboard')

# Load data
def load_data():
    features = pd.read_csv(os.path.join(DATA_DIR, 'merged_features.csv'))
    scores = pd.read_csv(os.path.join(DATA_DIR, 'anomaly_scores.csv'))
    df = pd.merge(features, scores, on='user')
    return df

df = load_data()

# Show anomaly scores
st.header('User Anomaly Scores')
score_method = st.selectbox('Select Model', ['isolation_forest', 'oneclass_svm', 'autoencoder'])

# Add red flag emoji for red team users
df['Red Team'] = df['is_red_team_x'].apply(lambda x: '🚩' if x == 1 else '') if 'is_red_team_x' in df.columns else df['is_red_team'].apply(lambda x: '🚩' if x == 1 else '')

# Rank users by anomaly score (descending: higher = more anomalous)
df['rank'] = df[score_method].rank(ascending=False)
df_sorted = df.sort_values(score_method, ascending=False)

cols = ['user', 'Red Team', score_method, 'rank'] + [c for c in df.columns if c not in ['user', score_method, 'rank', 'Red Team']]
st.dataframe(df_sorted[cols], height=400)

# Bar chart of top anomalies
st.subheader('Top 5 Anomalous Users')
top5 = df_sorted.head(5)
st.bar_chart(top5.set_index('user')[score_method])

# User detail view
st.header('User Detail')
selected_user = st.selectbox('Select User', df_sorted['user'])
user_row = df_sorted[df_sorted['user'] == selected_user].iloc[0]
st.write('**Red Team:**', '🚩' if user_row['Red Team'] else 'No')
st.write('**Features:**')
st.json({k: user_row[k] for k in ['mean_login_hour', 'mean_logout_hour', 'files_per_day', 'usb_per_day', 'emails_per_day', 'out_of_session_access', 'degree_centrality', 'betweenness_centrality', 'keyword_flag', 'subject_len', 'sentiment'] if k in user_row})
st.write('**Anomaly Scores:**')
st.json({k: user_row[k] for k in ['isolation_forest', 'oneclass_svm', 'autoencoder']}) 