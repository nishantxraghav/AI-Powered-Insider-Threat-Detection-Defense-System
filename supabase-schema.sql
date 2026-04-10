-- ============================================================
-- INSIDER THREAT DETECTION DASHBOARD — SUPABASE SCHEMA + SEED
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'analyst' CHECK (role IN ('admin', 'analyst', 'user')),
  risk_score FLOAT DEFAULT 0.0 CHECK (risk_score >= 0 AND risk_score <= 100),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('logon', 'file', 'email', 'web', 'usb', 'print')),
  value JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  threat_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  score FLOAT DEFAULT 0.0,
  description TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.anomalies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  deviation_score FLOAT NOT NULL,
  baseline FLOAT DEFAULT 0.0,
  observed FLOAT DEFAULT 0.0,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  indicators JSONB DEFAULT '[]',
  risk_level TEXT DEFAULT 'high',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all data (dashboard access)
CREATE POLICY "Authenticated read users" ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read activities" ON public.activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read alerts" ON public.alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read anomalies" ON public.anomalies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read scenarios" ON public.scenarios FOR SELECT TO authenticated USING (true);

-- Allow insert/update for authenticated users
CREATE POLICY "Authenticated insert alerts" ON public.alerts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update alerts" ON public.alerts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated insert anomalies" ON public.anomalies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated insert activities" ON public.activities FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- REALTIME
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.anomalies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO public.users (id, name, email, role, risk_score, department, last_login) VALUES
  ('a1b2c3d4-0001-0001-0001-000000000001', 'Sarah Chen', 'sarah.chen@corp.com', 'admin', 23.5, 'IT Security', NOW() - INTERVAL '2 hours'),
  ('a1b2c3d4-0002-0002-0002-000000000002', 'Marcus Webb', 'marcus.webb@corp.com', 'user', 78.2, 'Engineering', NOW() - INTERVAL '30 minutes'),
  ('a1b2c3d4-0003-0003-0003-000000000003', 'Elena Volkov', 'elena.volkov@corp.com', 'user', 91.4, 'Finance', NOW() - INTERVAL '1 hour'),
  ('a1b2c3d4-0004-0004-0004-000000000004', 'James Park', 'james.park@corp.com', 'analyst', 45.1, 'Operations', NOW() - INTERVAL '3 hours'),
  ('a1b2c3d4-0005-0005-0005-000000000005', 'Priya Sharma', 'priya.sharma@corp.com', 'user', 62.8, 'HR', NOW() - INTERVAL '15 minutes'),
  ('a1b2c3d4-0006-0006-0006-000000000006', 'David Torres', 'david.torres@corp.com', 'user', 87.9, 'Sales', NOW() - INTERVAL '5 minutes'),
  ('a1b2c3d4-0007-0007-0007-000000000007', 'Aisha Johnson', 'aisha.johnson@corp.com', 'user', 12.3, 'Marketing', NOW() - INTERVAL '6 hours'),
  ('a1b2c3d4-0008-0008-0008-000000000008', 'Robert Kim', 'robert.kim@corp.com', 'user', 55.6, 'Legal', NOW() - INTERVAL '4 hours')
ON CONFLICT DO NOTHING;

INSERT INTO public.activities (user_id, type, value, timestamp) VALUES
  ('a1b2c3d4-0002-0002-0002-000000000002', 'file', '{"action":"copy","size_mb":2340,"destination":"USB","filename":"Q4_financials.zip"}', NOW() - INTERVAL '2 hours'),
  ('a1b2c3d4-0002-0002-0002-000000000002', 'email', '{"recipients":["personal@gmail.com"],"attachments":3,"size_mb":45,"subject":"Project Files"}', NOW() - INTERVAL '3 hours'),
  ('a1b2c3d4-0002-0002-0002-000000000002', 'logon', '{"workstation":"WS-ENG-42","time":"02:34","after_hours":true}', NOW() - INTERVAL '1 day'),
  ('a1b2c3d4-0003-0003-0003-000000000003', 'web', '{"url":"linkedin.com/jobs","duration_min":45,"category":"job_search"}', NOW() - INTERVAL '30 minutes'),
  ('a1b2c3d4-0003-0003-0003-000000000003', 'file', '{"action":"download","size_mb":890,"source":"SharePoint","filename":"employee_salaries.xlsx"}', NOW() - INTERVAL '1 hour'),
  ('a1b2c3d4-0003-0003-0003-000000000003', 'email', '{"recipients":["competitor@rival.com"],"attachments":1,"size_mb":12}', NOW() - INTERVAL '2 hours'),
  ('a1b2c3d4-0006-0006-0006-000000000006', 'logon', '{"workstation":"WS-SALES-07","time":"23:15","after_hours":true,"vpn":false}', NOW() - INTERVAL '45 minutes'),
  ('a1b2c3d4-0006-0006-0006-000000000006', 'file', '{"action":"delete","count":234,"directory":"/prod/configs"}', NOW() - INTERVAL '40 minutes'),
  ('a1b2c3d4-0005-0005-0005-000000000005', 'web', '{"url":"phishing-site.net","category":"malicious","blocked":false}', NOW() - INTERVAL '20 minutes'),
  ('a1b2c3d4-0005-0005-0005-000000000005', 'email', '{"from":"ceo-impersonation@evil.net","action":"clicked_link","credentials_entered":true}', NOW() - INTERVAL '25 minutes');

INSERT INTO public.alerts (user_id, threat_type, severity, score, description, status, created_at) VALUES
  ('a1b2c3d4-0002-0002-0002-000000000002', 'IP Theft', 'high', 89.2, 'User copied 2.3GB of proprietary files to external USB device after hours. Pattern matches intellectual property exfiltration.', 'open', NOW() - INTERVAL '2 hours'),
  ('a1b2c3d4-0003-0003-0003-000000000003', 'Departing Employee', 'high', 91.4, 'Unusual data hoarding pattern detected. User accessed employee salary data and sent files to external email.', 'investigating', NOW() - INTERVAL '1 hour'),
  ('a1b2c3d4-0006-0006-0006-000000000006', 'Admin Sabotage', 'critical', 95.1, 'Admin user deleted 234 configuration files during off-hours access. No change ticket associated.', 'open', NOW() - INTERVAL '40 minutes'),
  ('a1b2c3d4-0005-0005-0005-000000000005', 'Phishing Victim', 'medium', 67.3, 'User clicked phishing link and entered credentials on malicious site. Account may be compromised.', 'open', NOW() - INTERVAL '20 minutes'),
  ('a1b2c3d4-0004-0004-0004-000000000004', 'Competitor Browsing', 'low', 34.5, 'User spent 3+ hours browsing competitor websites and job boards during work hours.', 'resolved', NOW() - INTERVAL '5 hours'),
  ('a1b2c3d4-0002-0002-0002-000000000002', 'After Hours Access', 'medium', 71.0, 'Login detected at 2:34 AM from engineering workstation. No scheduled maintenance.', 'open', NOW() - INTERVAL '1 day');

INSERT INTO public.anomalies (user_id, feature, deviation_score, baseline, observed, timestamp) VALUES
  ('a1b2c3d4-0002-0002-0002-000000000002', 'file_transfer_volume', 8.7, 50.0, 2340.0, NOW() - INTERVAL '2 hours'),
  ('a1b2c3d4-0002-0002-0002-000000000002', 'after_hours_logins', 6.2, 0.1, 4.0, NOW() - INTERVAL '1 day'),
  ('a1b2c3d4-0002-0002-0002-000000000002', 'external_email_count', 7.8, 2.0, 23.0, NOW() - INTERVAL '3 hours'),
  ('a1b2c3d4-0003-0003-0003-000000000003', 'job_site_access', 9.1, 0.0, 12.0, NOW() - INTERVAL '30 minutes'),
  ('a1b2c3d4-0003-0003-0003-000000000003', 'data_download_volume', 7.4, 120.0, 890.0, NOW() - INTERVAL '1 hour'),
  ('a1b2c3d4-0006-0006-0006-000000000006', 'file_deletions', 9.8, 0.5, 234.0, NOW() - INTERVAL '40 minutes'),
  ('a1b2c3d4-0006-0006-0006-000000000006', 'after_hours_logins', 8.3, 0.2, 3.0, NOW() - INTERVAL '45 minutes'),
  ('a1b2c3d4-0005-0005-0005-000000000005', 'phishing_clicks', 10.0, 0.0, 1.0, NOW() - INTERVAL '20 minutes'),
  ('a1b2c3d4-0005-0005-0005-000000000005', 'malicious_url_visits', 9.2, 0.0, 3.0, NOW() - INTERVAL '25 minutes'),
  ('a1b2c3d4-0004-0004-0004-000000000004', 'competitor_browsing', 5.1, 0.0, 8.0, NOW() - INTERVAL '5 hours');

INSERT INTO public.scenarios (name, type, description, indicators, risk_level) VALUES
  ('IP Theft', 'ip_theft', 'Employee copying proprietary source code and trade secrets to personal devices before resignation', '["Large file transfers to USB","After-hours access","External email attachments","VPN anomalies","Accessing restricted repositories"]', 'critical'),
  ('Departing Employee', 'departing_employee', 'Employee showing signs of leaving: excessive data downloading, job site browsing, and data hoarding behavior', '["Job site browsing","Bulk downloads","Personal email transfers","Printer usage spike","LinkedIn activity"]', 'high'),
  ('Admin Sabotage', 'admin_sabotage', 'Privileged user deliberately deleting or corrupting critical system configurations and data', '["Mass file deletions","Config changes without tickets","Off-hours privileged access","Audit log tampering","Service disruptions"]', 'critical'),
  ('Phishing Victim', 'phishing_victim', 'Employee fell victim to phishing attack, credentials potentially compromised and used for lateral movement', '["Credential entry on external site","Unusual login locations","Failed auth attempts","Suspicious email patterns","After-hours remote access"]', 'high'),
  ('Competitor Browsing', 'competitor_browsing', 'Employee spending excessive time on competitor websites and external job boards, potential information leakage', '["Competitor website visits","Job board access","LinkedIn connections to rivals","Reduced productivity","Document access patterns"]', 'medium');
