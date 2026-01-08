import pandas as pd
import numpy as np
import os
from datetime import datetime

DATA_DIR = 'data'

# Load logs
def load_logs():
    logins = pd.read_csv(os.path.join(DATA_DIR, 'logins.csv'), parse_dates=['login', 'logout'])
    file_access = pd.read_csv(os.path.join(DATA_DIR, 'file_access.csv'), parse_dates=['access_time'])
    usb_usage = pd.read_csv(os.path.join(DATA_DIR, 'usb_usage.csv'), parse_dates=['plug_time', 'unplug_time'])
    emails = pd.read_csv(os.path.join(DATA_DIR, 'emails.csv'), parse_dates=['time'])
    return logins, file_access, usb_usage, emails

# Feature extraction
def extract_features():
    logins, file_access, usb_usage, emails = load_logs()
    users = logins['user'].unique()
    features = []
    for user in users:
        user_logins = logins[logins['user'] == user]
        user_files = file_access[file_access['user'] == user]
        user_usb = usb_usage[usb_usage['user'] == user]
        user_emails = emails[emails['sender'] == f'{user}@company.com']
        # Time-based: mean login/logout hour
        mean_login_hour = user_logins['login'].dt.hour.mean()
        mean_logout_hour = user_logins['logout'].dt.hour.mean()
        # Access frequency: files accessed per day
        files_per_day = user_files.groupby(user_files['access_time'].dt.date).size().mean()
        # USB usage frequency
        usb_per_day = user_usb.groupby(user_usb['plug_time'].dt.date).size().mean() if not user_usb.empty else 0
        # Emails sent per day
        emails_per_day = user_emails.groupby(user_emails['time'].dt.date).size().mean() if not user_emails.empty else 0
        # Unusual combinations: files accessed outside login session
        out_of_session = 0
        for _, row in user_files.iterrows():
            session = user_logins[(user_logins['login'] <= row['access_time']) & (user_logins['logout'] >= row['access_time'])]
            if session.empty:
                out_of_session += 1
        features.append({
            'user': user,
            'mean_login_hour': mean_login_hour,
            'mean_logout_hour': mean_logout_hour,
            'files_per_day': files_per_day,
            'usb_per_day': usb_per_day,
            'emails_per_day': emails_per_day,
            'out_of_session_access': out_of_session
        })
    df = pd.DataFrame(features)
    df.to_csv(os.path.join(DATA_DIR, 'features.csv'), index=False)
    print('Features extracted to data/features.csv')

if __name__ == '__main__':
    extract_features() 