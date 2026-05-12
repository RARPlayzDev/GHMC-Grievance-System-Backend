// ═══════════════════════════════════════════════════════════════════
// GHMC Grievance Platform — Shared Type Definitions
// This is the SINGLE SOURCE OF TRUTH for all data contracts.
// Both frontend and backend import from this package.
// ═══════════════════════════════════════════════════════════════════

// ──────────────────────────── Enums ────────────────────────────

export enum ComplaintStatus {
  NEW = 'NEW',
  ROUTED = 'ROUTED',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  MULTI_OWNER_BLOCKED = 'MULTI_OWNER_BLOCKED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  PENDING_CITIZEN_VERIFICATION = 'PENDING_CITIZEN_VERIFICATION',
  RESOLVED = 'RESOLVED',
  REOPENED = 'REOPENED',
  ESCALATED = 'ESCALATED',
}

export enum ComplaintCategory {
  ROADS = 'ROADS',
  SANITATION = 'SANITATION',
  WATER = 'WATER',
  ELECTRICITY = 'ELECTRICITY',
  OTHER = 'OTHER',
}

export enum SourceChannel {
  PWA = 'PWA',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  VOICE = 'VOICE',
}

export enum RoutingMethod {
  POLYGON = 'POLYGON',
  NLP = 'NLP',
  CITIZEN_PIN = 'CITIZEN_PIN',
  MULTI_SIGNAL = 'MULTI_SIGNAL',
}

export enum OfficerRole {
  OFFICER = 'OFFICER',
  SUPERVISOR = 'SUPERVISOR',
  ADMIN = 'ADMIN',
  ZONAL_COMMISSIONER = 'ZONAL_COMMISSIONER',
  IT_HEAD = 'IT_HEAD',
  PIO = 'PIO',
  GIS_OFFICER = 'GIS_OFFICER',
  GOV_OFFICER = 'GOV_OFFICER',
}

export enum FraudTier {
  CLEAN = 'CLEAN',
  ADVISORY_WATCH = 'ADVISORY_WATCH',
  SUPERVISED_CLOSURE = 'SUPERVISED_CLOSURE',
  ESCALATED_REVIEW = 'ESCALATED_REVIEW',
}

export enum ContractorFailureType {
  NO_SHOW = 'NO_SHOW',
  INCOMPLETE_WORK = 'INCOMPLETE_WORK',
  EQUIPMENT_FAILURE = 'EQUIPMENT_FAILURE',
  DELAY = 'DELAY',
  QUALITY_ISSUE = 'QUALITY_ISSUE',
}

export enum MultiOwnerStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  BLOCKED = 'BLOCKED',
}

export enum ResourceAvailability {
  AVAILABLE = 'AVAILABLE',
  UNAVAILABLE = 'UNAVAILABLE',
  MAINTENANCE = 'MAINTENANCE',
}

export enum ChronicSiteEscalation {
  OFFICER_GRADUATED_SUPERVISION = 'OFFICER_GRADUATED_SUPERVISION',
  CONTRACTOR_SCORECARD_FLAG = 'CONTRACTOR_SCORECARD_FLAG',
  INTERDEPT_ZONAL_ESCALATION = 'INTERDEPT_ZONAL_ESCALATION',
  CAPACITY_BUDGET_REQUEST = 'CAPACITY_BUDGET_REQUEST',
}

export enum CapacityConstraintType {
  VEHICLE_UNAVAILABLE = 'VEHICLE_UNAVAILABLE',
  CONTRACTOR_ABSENT = 'CONTRACTOR_ABSENT',
  MULTI_DEPT_BLOCKED = 'MULTI_DEPT_BLOCKED',
}

// ──────────────────────────── GeoJSON ────────────────────────────

export interface GeoPoint {
  lat: number;
  lng: number;
}

// ──────────────────────────── Core Entities ────────────────────────────

export interface Ward {
  id: string;
  name: string;
  zone_id: string;
  boundary: any; // PostGIS GEOGRAPHY — serialized as GeoJSON on API responses
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface Officer {
  id: string;
  supabase_user_id: string;
  name: string;
  ward_id: string | null;
  department: string;
  role: OfficerRole;
  phone: string | null;
  created_at: string;
}

export interface Contractor {
  id: string;
  name: string;
  categories: string[];
  ward_ids: string[];
  contact_phone: string | null;
  performance_score: number;
  created_at: string;
}

export interface Complaint {
  id: string;
  filed_location: GeoPoint;
  geohash: string;
  category: ComplaintCategory;
  subcategory: string | null;
  description: string | null;
  photos: string[];
  source_channel: SourceChannel;
  device_fingerprint_hash: string | null;
  ward_id: string | null;
  routing_confidence_score: number | null;
  routing_method: RoutingMethod | null;
  assigned_officer_id: string | null;
  contractor_id: string | null;
  department_ownership: string[];
  is_multi_owner: boolean;
  ai_confidence: number | null;
  ai_categorization_status: string | null;
  ai_fallback_reason: string | null;
  priority_score: number | null;
  bundle_id: string | null;
  bundle_count: number;
  capacity_constrained: boolean;
  capacity_constraint_type: CapacityConstraintType | null;
  capacity_constraint_evidence: string | null;
  status: ComplaintStatus;
  closure_photo_url: string | null;
  closure_photo_location: GeoPoint | null;
  closure_verification_score: number | null;
  closed_at: string | null;
  closed_by: string | null;
  created_at: string;
  updated_at: string;
  hash_chain_previous: string | null;
  hash_chain_current: string | null;
}

export interface Bundle {
  id: string;
  primary_complaint_id: string;
  bundled_complaint_ids: string[];
  geohash: string;
  category: string;
  bundle_count: number;
  filed_location: GeoPoint;
  created_at: string;
}

export interface ComplaintDependency {
  id: string;
  complaint_id: string;
  blocking_department: string;
  blocking_complaint_id: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface MultiOwnerAssignment {
  id: string;
  complaint_id: string;
  department: string;
  assigned_officer_id: string | null;
  status: MultiOwnerStatus;
  after_photo_url: string | null;
  closure_notes: string | null;
  closed_at: string | null;
  created_at: string;
}

export interface ContractorNonperformanceLog {
  id: string;
  complaint_id: string;
  contractor_id: string;
  reported_by: string;
  failure_type: ContractorFailureType;
  evidence_photo_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface ActionLog {
  id: string;
  complaint_id: string;
  officer_id: string | null;
  action_type: string;
  metadata: Record<string, any> | null;
  timestamp: string;
  hash_chain_previous: string | null;
  hash_chain_current: string | null;
}

export interface RoutingError {
  id: string;
  complaint_id: string;
  original_ward_id: string;
  disputed_by: string;
  corrected_ward_id: string | null;
  resolution_method: string | null;
  created_at: string;
}

export interface FraudScore {
  id: string;
  complaint_id: string;
  officer_id: string;
  score: number;
  tier: FraudTier;
  signals: Record<string, any>;
  excluded: boolean;
  exclusion_reason: string | null;
  created_at: string;
}

export interface ChronicSite {
  id: string;
  geohash: string;
  category: string;
  cycle_count: number;
  complaint_ids: string[];
  escalation_path: ChronicSiteEscalation | null;
  failure_cause: string | null;
  detected_at: string;
}

export interface ResourceStatus {
  id: string;
  ward_id: string;
  resource_type: string;
  resource_name: string | null;
  status: ResourceAvailability;
  expected_available_at: string | null;
  logged_at: string;
}

// ──────────────────────────── AI Response Contracts ────────────────────────────

export interface AICategorizationResult {
  category: ComplaintCategory;
  subcategory: string;
  department_ownership: string[];
  ai_confidence: number;
  reasoning: string;
}

export interface AIRoutingResult {
  ward_id: string;
  routing_confidence_score: number;
  reasoning?: string;
}

export interface AIPhotoDiffResult {
  closure_verification_score: number;
  reasoning: string;
}

export interface AITranscriptionResult {
  transcription: string;
  language_detected: string;
}

export interface AIStatusTextResult {
  status_text: string;
  language: string;
}

export interface AISurgeForcastResult {
  ward_id: string;
  forecast_date: string;
  predicted_volume: number;
  confidence: number;
  factors: string[];
}

// ──────────────────────────── API Request DTOs ────────────────────────────

export interface CreateComplaintDTO {
  filed_location: GeoPoint;
  category: ComplaintCategory;
  subcategory?: string;
  description?: string;
  source_channel?: SourceChannel;
  device_fingerprint?: string;  // Raw — backend hashes it
}

export interface CloseComplaintDTO {
  closure_location: GeoPoint;
  notes?: string;
}

export interface SyncComplaintDTO {
  complaints: CreateComplaintDTO[];
  device_id: string;
}

export interface CreateContractorDTO {
  name: string;
  categories: string[];
  ward_ids: string[];
  contact_phone?: string;
}

export interface LogNonperformanceDTO {
  complaint_id: string;
  contractor_id: string;
  failure_type: ContractorFailureType;
  notes?: string;
}

export interface DisputeRoutingDTO {
  complaint_id: string;
  reason: string;
}

export interface ChallengeClosureDTO {
  complaint_id: string;
  reason: string;
}

// ──────────────────────────── API Response DTOs ────────────────────────────

export interface ComplaintResponse extends Complaint {
  ward_name?: string;
  officer_name?: string;
}

export interface ComplaintWithPriority extends ComplaintResponse {
  priority_rank: number;
  sla_deadline: string;
  capacity_status: {
    is_constrained: boolean;
    reason: string | null;
  };
}

export interface QueueResponse {
  complaints: ComplaintWithPriority[];
  queue_length: number;
  estimated_workload_hours: number;
}

export interface SyncResponse {
  synced: number;
  duplicates: number;
  conflicts: Array<{
    complaint: CreateComplaintDTO;
    reason: string;
  }>;
}

export interface DashboardStats {
  total_complaints: number;
  resolved_count: number;
  pending_count: number;
  avg_resolution_hours: number;
  sla_breach_rate: number;
  complaints_by_category: Record<string, number>;
  complaints_by_status: Record<string, number>;
  complaints_by_ward: Array<{ ward_id: string; ward_name: string; count: number }>;
}

export interface OfficerPerformance {
  officer_id: string;
  officer_name: string;
  resolved_count: number;
  avg_resolution_hours: number;
  sla_breach_rate: number;
  fraud_tier: FraudTier;
  reopen_rate: number;
  capacity_adjusted_score: number;
}

export interface ContractorPerformance {
  contractor_id: string;
  contractor_name: string;
  total_assignments: number;
  nonperformance_count: number;
  failure_types: Record<string, number>;
  chronic_site_count: number;
  performance_score: number;
}

export interface RTIPackage {
  complaint_id: string;
  generated_at: string;
  complaint_timeline: ActionLog[];
  officer_actions: ActionLog[];
  fraud_assessment: FraudScore | null;
  contractor_record: ContractorNonperformanceLog[];
  closure_verification: {
    score: number | null;
    citizen_challenge: boolean;
  };
  pdf_url: string;
}

export interface DigestData {
  ward_id: string;
  date: string;
  top_clusters: Array<{ category: string; count: number; geohash: string }>;
  todays_priority_queue: ComplaintWithPriority[];
  yesterdays_sla_breaches: number;
  tomorrows_surge_forecast: AISurgeForcastResult | null;
  chronic_site_updates: ChronicSite[];
  resource_status: ResourceStatus[];
  recommended_action: string;
}

// ──────────────────────────── Auth ────────────────────────────

export interface JWTPayload {
  sub: string;          // Supabase user ID
  email: string;
  role: OfficerRole;
  officer_id: string;
  ward_id: string | null;
  zone_id: string | null;
  department: string;
  iat: number;
  exp: number;
}

// ──────────────────────────── API Error ────────────────────────────

export interface APIError {
  error: string;
  message: string;
  status: number;
  details?: Record<string, any>;
}

// ──────────────────────────── Phase Gating ────────────────────────────

export interface PhaseConfig {
  current_phase: number;
  features: {
    ai_categorization: boolean;
    photo_diff: boolean;
    fraud_scoring: boolean;
    surge_forecast: boolean;
    priority_queue: boolean;
    chronic_sites: boolean;
    accountability_dashboard: boolean;
    rti_packaging: boolean;
    community_verifiers: boolean;
    ward_digest: boolean;
    model_governance: boolean;
  };
}

// ──────────────────────────── Model Governance ────────────────────────────

export interface ModelGovernanceLog {
  id: string;
  model_name: string;
  version_from: string;
  version_to: string;
  accuracy_delta: number;
  approved_by: string | null;
  approved_at: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ROLLED_BACK';
  validation_report: Record<string, any>;
  created_at: string;
}

// ──────────────────────────── Notification ────────────────────────────

export interface NotificationPayload {
  complaint_id: string;
  recipient_phone: string | null;
  channel: 'SMS' | 'WHATSAPP' | 'PUSH' | 'EMAIL';
  message: string;
  status: 'SENT' | 'DEFERRED' | 'FAILED';
  demo_mode: boolean;
}
