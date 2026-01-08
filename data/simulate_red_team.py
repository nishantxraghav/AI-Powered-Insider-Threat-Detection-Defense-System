import pandas as pd
import numpy as np
import random
import os
from datetime import timedelta

DATA_DIR = 'data'
random.seed(99)
np.random.seed(99)

# Load logs
logins = pd.read_csv(os.path.join(DATA_DIR, 'logins.csv'), parse_dates=['login', 'logout'])
file_access = pd.read_csv(os.path.join(DATA_DIR, 'file_access.csv'), parse_dates=['access_time'])
usb_usage = pd.read_csv(os.path.join(DATA_DIR, 'usb_usage.csv'), parse_dates=['plug_time', 'unplug_time'])

# Select a few users to be "malicious"
users = logins['user'].unique()
red_users = random.sample(list(users), 3)

# Inject after-hours file access
for user in red_users:
    for i in range(5):
        day = random.choice(pd.date_range(logins['login'].min(), logins['login'].max()))
        access_time = day + timedelta(hours=random.randint(0, 4))  # 12am-4am
        file = random.choice(file_access['file'].unique())
        file_access = pd.concat([file_access, pd.DataFrame([{'user': user, 'file': file, 'access_time': access_time}])], ignore_index=True)

# Inject mass file downloads
for user in red_users:
    day = random.choice(pd.date_range(logins['login'].min(), logins['login'].max()))
    for i in range(20):
        file = random.choice(file_access['file'].unique())
        access_time = day + timedelta(hours=10, minutes=random.randint(0, 59))
        file_access = pd.concat([file_access, pd.DataFrame([{'user': user, 'file': file, 'access_time': access_time}])], ignore_index=True)

# Inject suspicious USB usage
for user in red_users:
    day = random.choice(pd.date_range(logins['login'].min(), logins['login'].max()))
    plug_time = day + timedelta(hours=2)
    unplug_time = plug_time + timedelta(minutes=10)
    device = random.choice(usb_usage['device'].unique())
    usb_usage = pd.concat([usb_usage, pd.DataFrame([{'user': user, 'device': device, 'plug_time': plug_time, 'unplug_time': unplug_time}])], ignore_index=True)

# Save modified logs
file_access.to_csv(os.path.join(DATA_DIR, 'file_access.csv'), index=False)
usb_usage.to_csv(os.path.join(DATA_DIR, 'usb_usage.csv'), index=False)
pd.DataFrame({'user': red_users}).to_csv(os.path.join(DATA_DIR, 'red_team_users.csv'), index=False)
print('Red team behaviors injected. Red team users saved to data/red_team_users.csv') 