-- ═══════════════════════════════════════════════════════════════════
-- Seed: Demo Officers (20 officers, 5 supervisors, admin roles)
-- Automatically inserts into auth.users first to satisfy foreign keys
-- ═══════════════════════════════════════════════════════════════════

-- 1. Create the Auth Users (Password for all is 'demo123456')
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'officer1@ghmc.demo', crypt('demo123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'officer2@ghmc.demo', crypt('demo123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'officer3@ghmc.demo', crypt('demo123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'officer4@ghmc.demo', crypt('demo123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'officer5@ghmc.demo', crypt('demo123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'officer6@ghmc.demo', crypt('demo123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'officer7@ghmc.demo', crypt('demo123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'officer8@ghmc.demo', crypt('demo123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'officer9@ghmc.demo', crypt('demo123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'officer10@ghmc.demo', crypt('demo123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'officer11@ghmc.demo', crypt('demo123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'officer12@ghmc.demo', crypt('demo123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'officer13@ghmc.demo', crypt('demo123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'officer14@ghmc.demo', crypt('demo123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'officer15@ghmc.demo', crypt('demo123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'officer16@ghmc.demo', crypt('demo123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'officer17@ghmc.demo', crypt('demo123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'officer18@ghmc.demo', crypt('demo123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'officer19@ghmc.demo', crypt('demo123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'officer20@ghmc.demo', crypt('demo123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sup1@ghmc.demo', crypt('demo123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sup2@ghmc.demo', crypt('demo123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sup3@ghmc.demo', crypt('demo123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sup4@ghmc.demo', crypt('demo123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sup5@ghmc.demo', crypt('demo123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000026', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@ghmc.demo', crypt('demo123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000027', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ithead@ghmc.demo', crypt('demo123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000028', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pio@ghmc.demo', crypt('demo123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000029', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'gis@ghmc.demo', crypt('demo123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'zc@ghmc.demo', crypt('demo123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. Insert the Officer profiles linked to those users
INSERT INTO officers (id, supabase_user_id, name, ward_id, department, role, phone) VALUES
  ('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Ravi Kumar', 'b0000000-0000-0000-0000-000000000001', 'Engineering', 'OFFICER', '+919900000001'),
  ('c0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'Priya Reddy', 'b0000000-0000-0000-0000-000000000001', 'SWM', 'OFFICER', '+919900000002'),
  ('c0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'Suresh Babu', 'b0000000-0000-0000-0000-000000000002', 'Engineering', 'OFFICER', '+919900000003'),
  ('c0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', 'Lakshmi Devi', 'b0000000-0000-0000-0000-000000000002', 'Water Board', 'OFFICER', '+919900000004'),
  ('c0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005', 'Anil Sharma', 'b0000000-0000-0000-0000-000000000003', 'Engineering', 'OFFICER', '+919900000005'),
  ('c0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000006', 'Fatima Begum', 'b0000000-0000-0000-0000-000000000003', 'SWM', 'OFFICER', '+919900000006'),
  ('c0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000007', 'Venkat Rao', 'b0000000-0000-0000-0000-000000000004', 'Engineering', 'OFFICER', '+919900000007'),
  ('c0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000008', 'Anjali Singh', 'b0000000-0000-0000-0000-000000000004', 'Electricity', 'OFFICER', '+919900000008'),
  ('c0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000009', 'Ramesh Goud', 'b0000000-0000-0000-0000-000000000005', 'SWM', 'OFFICER', '+919900000009'),
  ('c0000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000010', 'Kavitha Nair', 'b0000000-0000-0000-0000-000000000005', 'Water Board', 'OFFICER', '+919900000010'),
  ('c0000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000011', 'Srinivas M', 'b0000000-0000-0000-0000-000000000006', 'Engineering', 'OFFICER', '+919900000011'),
  ('c0000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000012', 'Padma Rani', 'b0000000-0000-0000-0000-000000000006', 'SWM', 'OFFICER', '+919900000012'),
  ('c0000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000013', 'Krishna Murthy', 'b0000000-0000-0000-0000-000000000007', 'Engineering', 'OFFICER', '+919900000013'),
  ('c0000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000014', 'Swathi Reddy', 'b0000000-0000-0000-0000-000000000007', 'SWM', 'OFFICER', '+919900000014'),
  ('c0000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000015', 'Narasimha Rao', 'b0000000-0000-0000-0000-000000000008', 'Engineering', 'OFFICER', '+919900000015'),
  ('c0000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000016', 'Meena Kumari', 'b0000000-0000-0000-0000-000000000008', 'Water Board', 'OFFICER', '+919900000016'),
  ('c0000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000017', 'Rajesh Khanna', 'b0000000-0000-0000-0000-000000000009', 'SWM', 'OFFICER', '+919900000017'),
  ('c0000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000018', 'Sunitha Devi', 'b0000000-0000-0000-0000-000000000009', 'Electricity', 'OFFICER', '+919900000018'),
  ('c0000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000019', 'Mahesh Babu', 'b0000000-0000-0000-0000-000000000010', 'Engineering', 'OFFICER', '+919900000019'),
  ('c0000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000020', 'Divya Bharathi', 'b0000000-0000-0000-0000-000000000010', 'SWM', 'OFFICER', '+919900000020');

-- Zone Supervisors (1 per zone = 5 supervisors)
INSERT INTO officers (id, supabase_user_id, name, ward_id, department, role, phone) VALUES
  ('c0000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000021', 'Supervisor Charminar', NULL, 'General', 'SUPERVISOR', '+919900000021'),
  ('c0000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000022', 'Supervisor Khairatabad', NULL, 'General', 'SUPERVISOR', '+919900000022'),
  ('c0000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000023', 'Supervisor Secunderabad', NULL, 'General', 'SUPERVISOR', '+919900000023'),
  ('c0000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000024', 'Supervisor Kukatpally', NULL, 'General', 'SUPERVISOR', '+919900000024'),
  ('c0000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000025', 'Supervisor LB Nagar', NULL, 'General', 'SUPERVISOR', '+919900000025')
ON CONFLICT (id) DO NOTHING;

-- Admin Roles
INSERT INTO officers (id, supabase_user_id, name, ward_id, department, role, phone) VALUES
  ('c0000000-0000-0000-0000-000000000026', '00000000-0000-0000-0000-000000000026', 'Admin User', NULL, 'IT', 'ADMIN', '+919900000026'),
  ('c0000000-0000-0000-0000-000000000027', '00000000-0000-0000-0000-000000000027', 'IT Head', NULL, 'IT', 'IT_HEAD', '+919900000027'),
  ('c0000000-0000-0000-0000-000000000028', '00000000-0000-0000-0000-000000000028', 'Public Information Officer', NULL, 'Legal', 'PIO', '+919900000028'),
  ('c0000000-0000-0000-0000-000000000029', '00000000-0000-0000-0000-000000000029', 'GIS Officer', NULL, 'GIS', 'GIS_OFFICER', '+919900000029'),
  ('c0000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000030', 'Zonal Commissioner', NULL, 'General', 'ZONAL_COMMISSIONER', '+919900000030')
ON CONFLICT (id) DO NOTHING;
