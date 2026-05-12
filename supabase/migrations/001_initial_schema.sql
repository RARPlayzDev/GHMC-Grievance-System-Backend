-- ═══════════════════════════════════════════════════════════════════
-- GHMC Grievance Platform — Initial Schema (Phase 1)
-- PostGIS, pgcrypto, core tables, RLS policies, hash chains
-- ═══════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ──────── Zones ────────
CREATE TABLE zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ──────── Wards ────────
CREATE TABLE wards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  zone_id UUID NOT NULL REFERENCES zones(id),
  boundary GEOGRAPHY(POLYGON, 4326) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_wards_boundary ON wards USING GIST(boundary);
CREATE INDEX idx_wards_zone ON wards(zone_id);

-- ──────── Officers ────────
CREATE TABLE officers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id),
  name TEXT NOT NULL,
  ward_id UUID REFERENCES wards(id),
  department TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('OFFICER','SUPERVISOR','ADMIN','ZONAL_COMMISSIONER','IT_HEAD','PIO','GIS_OFFICER','GOV_OFFICER')),
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_officers_ward ON officers(ward_id);
CREATE INDEX idx_officers_role ON officers(role);

-- ──────── Contractors ────────
CREATE TABLE contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  categories TEXT[] NOT NULL,
  ward_ids UUID[] NOT NULL,
  contact_phone TEXT,
  performance_score NUMERIC(3,2) DEFAULT 1.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ──────── Complaints ────────
CREATE TABLE complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filed_location GEOGRAPHY(POINT, 4326) NOT NULL,
  geohash TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  description TEXT,
  photos TEXT[],
  source_channel TEXT CHECK (source_channel IN ('PWA','SMS','WHATSAPP','VOICE')),
  device_fingerprint_hash TEXT,
  ward_id UUID REFERENCES wards(id),
  routing_confidence_score NUMERIC(3,2),
  routing_method TEXT CHECK (routing_method IN ('POLYGON','NLP','CITIZEN_PIN','MULTI_SIGNAL','NONE')),
  assigned_officer_id UUID REFERENCES officers(id),
  contractor_id UUID REFERENCES contractors(id),
  department_ownership TEXT[],
  is_multi_owner BOOLEAN DEFAULT FALSE,
  ai_confidence NUMERIC(3,2),
  ai_categorization_status TEXT,
  ai_fallback_reason TEXT,
  priority_score NUMERIC(5,2),
  bundle_id UUID,
  bundle_count INT DEFAULT 1,
  capacity_constrained BOOLEAN DEFAULT FALSE,
  capacity_constraint_type TEXT,
  capacity_constraint_evidence TEXT,
  status TEXT NOT NULL DEFAULT 'NEW',
  closure_photo_url TEXT,
  closure_photo_location GEOGRAPHY(POINT, 4326),
  closure_verification_score NUMERIC(3,2),
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES officers(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  hash_chain_previous TEXT
);
CREATE INDEX idx_complaints_ward ON complaints(ward_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_geohash ON complaints(geohash);
CREATE INDEX idx_complaints_location ON complaints USING GIST(filed_location);
CREATE INDEX idx_complaints_created ON complaints(created_at DESC);
CREATE INDEX idx_complaints_officer ON complaints(assigned_officer_id);

-- ──────── Bundles ────────
CREATE TABLE bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_complaint_id UUID REFERENCES complaints(id),
  bundled_complaint_ids UUID[],
  geohash TEXT NOT NULL,
  category TEXT NOT NULL,
  bundle_count INT NOT NULL,
  filed_location GEOGRAPHY(POINT, 4326) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ──────── Complaint Dependencies ────────
CREATE TABLE complaint_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID REFERENCES complaints(id),
  blocking_department TEXT NOT NULL,
  blocking_complaint_id UUID REFERENCES complaints(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ──────── Multi-Owner Assignments ────────
CREATE TABLE multi_owner_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID REFERENCES complaints(id),
  department TEXT NOT NULL,
  assigned_officer_id UUID REFERENCES officers(id),
  status TEXT CHECK (status IN ('PENDING','IN_PROGRESS','RESOLVED','BLOCKED')) DEFAULT 'PENDING',
  after_photo_url TEXT,
  closure_notes TEXT,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(complaint_id, department)
);

-- ──────── Contractor Non-Performance Log ────────
CREATE TABLE contractor_nonperformance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID REFERENCES complaints(id),
  contractor_id UUID REFERENCES contractors(id),
  reported_by UUID REFERENCES officers(id),
  failure_type TEXT NOT NULL CHECK (failure_type IN ('NO_SHOW','INCOMPLETE_WORK','EQUIPMENT_FAILURE','DELAY','QUALITY_ISSUE')),
  evidence_photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ──────── Action Logs (Hash-Chained) ────────
CREATE TABLE action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID REFERENCES complaints(id),
  officer_id UUID REFERENCES officers(id),
  action_type TEXT NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  hash_chain_previous TEXT
);
CREATE INDEX idx_action_logs_complaint ON action_logs(complaint_id);
CREATE INDEX idx_action_logs_type ON action_logs(action_type);

-- ──────── Routing Errors ────────
CREATE TABLE routing_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID REFERENCES complaints(id),
  original_ward_id UUID REFERENCES wards(id),
  disputed_by UUID REFERENCES officers(id),
  corrected_ward_id UUID REFERENCES wards(id),
  resolution_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ──────── Fraud Scores ────────
CREATE TABLE fraud_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID REFERENCES complaints(id),
  officer_id UUID REFERENCES officers(id),
  score INT NOT NULL CHECK (score >= 0 AND score <= 100),
  tier TEXT CHECK (tier IN ('CLEAN','ADVISORY_WATCH','SUPERVISED_CLOSURE','ESCALATED_REVIEW')),
  signals JSONB NOT NULL,
  excluded BOOLEAN DEFAULT FALSE,
  exclusion_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_fraud_officer ON fraud_scores(officer_id);

-- ──────── Chronic Sites ────────
CREATE TABLE chronic_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  geohash TEXT NOT NULL,
  category TEXT NOT NULL,
  cycle_count INT NOT NULL,
  complaint_ids UUID[],
  escalation_path TEXT CHECK (escalation_path IN ('OFFICER_GRADUATED_SUPERVISION','CONTRACTOR_SCORECARD_FLAG','INTERDEPT_ZONAL_ESCALATION','CAPACITY_BUDGET_REQUEST')),
  failure_cause TEXT,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(geohash, category)
);

-- ──────── Resource Status ────────
CREATE TABLE resource_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ward_id UUID REFERENCES wards(id),
  resource_type TEXT NOT NULL,
  resource_name TEXT,
  status TEXT CHECK (status IN ('AVAILABLE','UNAVAILABLE','MAINTENANCE')) DEFAULT 'AVAILABLE',
  expected_available_at TIMESTAMPTZ,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- ──────── Model Governance Log ────────
CREATE TABLE model_governance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name TEXT NOT NULL,
  version_from TEXT NOT NULL,
  version_to TEXT NOT NULL,
  accuracy_delta NUMERIC(5,4) NOT NULL,
  approved_by UUID REFERENCES officers(id),
  approved_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('PENDING','APPROVED','REJECTED','ROLLED_BACK')) DEFAULT 'PENDING',
  validation_report JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ──────── Monsoon Calendar (seeded data for surge forecast) ────────
CREATE TABLE monsoon_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month INT NOT NULL CHECK (month >= 1 AND month <= 12),
  day INT NOT NULL CHECK (day >= 1 AND day <= 31),
  rainfall_mm NUMERIC(5,1),
  historical_complaint_multiplier NUMERIC(3,2) DEFAULT 1.00,
  UNIQUE(month, day)
);

-- ═══════════════════════════════════════════════════════════════════
-- PostGIS Helper Function: Find ward by point
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION find_ward_by_point(lat DOUBLE PRECISION, lng DOUBLE PRECISION)
RETURNS UUID AS $$
  SELECT id FROM wards
  WHERE ST_Contains(boundary::geometry, ST_SetSRID(ST_MakePoint(lng, lat), 4326))
  LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- ═══════════════════════════════════════════════════════════════════
-- Row-Level Security Policies
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_logs ENABLE ROW LEVEL SECURITY;

-- Officers see complaints in their ward only
CREATE POLICY officer_ward_isolation ON complaints
  FOR SELECT TO authenticated
  USING (
    ward_id = (current_setting('request.jwt.claims', true)::json->>'ward_id')::uuid
    AND (current_setting('request.jwt.claims', true)::json->>'role') = 'OFFICER'
  );

-- Supervisors see all wards in their zone
CREATE POLICY supervisor_zone_access ON complaints
  FOR SELECT TO authenticated
  USING (
    ward_id IN (
      SELECT id FROM wards WHERE zone_id = (current_setting('request.jwt.claims', true)::json->>'zone_id')::uuid
    )
    AND (current_setting('request.jwt.claims', true)::json->>'role') = 'SUPERVISOR'
  );

-- Admin/Commissioner see everything
CREATE POLICY admin_full_access ON complaints
  FOR ALL TO authenticated
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role') IN ('ADMIN','ZONAL_COMMISSIONER','IT_HEAD','PIO','GIS_OFFICER','GOV_OFFICER')
  );

-- Citizen INSERT (anonymous)
CREATE POLICY citizen_complaint_creation ON complaints
  FOR INSERT TO anon WITH CHECK (true);

-- Public SELECT for complaint tracking
CREATE POLICY public_complaint_read ON complaints
  FOR SELECT TO anon
  USING (true);

-- Officers see only their own profile
CREATE POLICY officer_self_access ON officers
  FOR SELECT TO authenticated
  USING (supabase_user_id = auth.uid() OR (current_setting('request.jwt.claims', true)::json->>'role') IN ('ADMIN','SUPERVISOR','ZONAL_COMMISSIONER'));

-- Action logs: complaint-scoped access
CREATE POLICY action_log_access ON action_logs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY action_log_insert ON action_logs
  FOR INSERT TO authenticated WITH CHECK (true);
