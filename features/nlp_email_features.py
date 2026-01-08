import pandas as pd
import os
import re

DATA_DIR = 'data'
SUSPICIOUS_KEYWORDS = ['confidential', 'urgent', 'password', 'secret', 'invoice', 'transfer']

def extract_features():
    emails = pd.read_csv(os.path.join(DATA_DIR, 'emails.csv'), parse_dates=['time'])
    features = []
    for _, row in emails.iterrows():
        subject = str(row['subject']).lower()
        keyword_flag = int(any(kw in subject for kw in SUSPICIOUS_KEYWORDS))
        subject_len = len(subject)
        # Placeholder for sentiment (could use TextBlob or Vader)
        sentiment = 0
        features.append({
            'sender': row['sender'],
            'recipient': row['recipient'],
            'time': row['time'],
            'keyword_flag': keyword_flag,
            'subject_len': subject_len,
            'sentiment': sentiment
        })
    pd.DataFrame(features).to_csv(os.path.join(DATA_DIR, 'nlp_email_features.csv'), index=False)
    print('NLP email features saved to data/nlp_email_features.csv')

if __name__ == '__main__':
    extract_features() 