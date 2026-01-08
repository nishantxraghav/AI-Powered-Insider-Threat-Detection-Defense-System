import os
import random
import pandas as pd
from datetime import datetime, timedelta

os.makedirs('data', exist_ok=True)

USERS = [f'user{i}' for i in range(1, 21)]
FILES = [f'file_{i}.docx' for i in range(1, 51)]
DEVICES = [f'usb_{i}' for i in range(1, 6)]
EMAILS = [f'user{i}@company.com' for i in range(1, 21)]

START_DATE = datetime(2023, 1, 1)
DAYS = 30

random.seed(42)

def simulate_logins():
    records = []
    for day in range(DAYS):
        date = START_DATE + timedelta(days=day)
        for user in USERS:
            login_time = date + timedelta(hours=random.randint(6, 10), minutes=random.randint(0, 59))
            logout_time = login_time + timedelta(hours=random.randint(6, 10))
            records.append({'user': user, 'login': login_time, 'logout': logout_time})
    pd.DataFrame(records).to_csv('data/logins.csv', index=False)

def simulate_file_access():
    records = []
    for day in range(DAYS):
        date = START_DATE + timedelta(days=day)
        for _ in range(random.randint(50, 100)):
            user = random.choice(USERS)
            file = random.choice(FILES)
            access_time = date + timedelta(hours=random.randint(0, 23), minutes=random.randint(0, 59))
            records.append({'user': user, 'file': file, 'access_time': access_time})
    pd.DataFrame(records).to_csv('data/file_access.csv', index=False)

def simulate_usb_usage():
    records = []
    for day in range(DAYS):
        date = START_DATE + timedelta(days=day)
        for _ in range(random.randint(2, 8)):
            user = random.choice(USERS)
            device = random.choice(DEVICES)
            plug_time = date + timedelta(hours=random.randint(8, 18), minutes=random.randint(0, 59))
            unplug_time = plug_time + timedelta(minutes=random.randint(5, 120))
            records.append({'user': user, 'device': device, 'plug_time': plug_time, 'unplug_time': unplug_time})
    pd.DataFrame(records).to_csv('data/usb_usage.csv', index=False)

def simulate_emails():
    records = []
    for day in range(DAYS):
        date = START_DATE + timedelta(days=day)
        for _ in range(random.randint(30, 60)):
            sender = random.choice(EMAILS)
            recipient = random.choice([e for e in EMAILS if e != sender])
            time = date + timedelta(hours=random.randint(7, 19), minutes=random.randint(0, 59))
            subject = random.choice(['Project Update', 'Meeting', 'Invoice', 'Confidential', 'Request'])
            records.append({'sender': sender, 'recipient': recipient, 'time': time, 'subject': subject})
    pd.DataFrame(records).to_csv('data/emails.csv', index=False)

if __name__ == '__main__':
    simulate_logins()
    simulate_file_access()
    simulate_usb_usage()
    simulate_emails()
    print('Simulated logs generated in data/.') 