// ═══════════════════════════════════════════════════════════════════
// API Contract Fixtures — Mock data for frontend development
// Frontend uses these with MSW (Mock Service Worker) during dev
// Must match shared-types schemas exactly
// ═══════════════════════════════════════════════════════════════════

export const fixtures = {

  // ── Complaint (full response shape) ──
  complaint: {
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    filed_location: { lat: 17.3850, lng: 78.4867 },
    geohash: "tdr1wcp",
    category: "ROADS",
    subcategory: "Pothole",
    description: "Large pothole near Charminar bus stop causing traffic issues",
    photos: ["https://your-project.supabase.co/storage/v1/object/sign/complaint-photos/example.webp"],
    source_channel: "PWA",
    device_fingerprint_hash: null,
    ward_id: "b0000000-0000-0000-0000-000000000001",
    ward_name: "Charminar",
    routing_confidence_score: 0.95,
    routing_method: "MULTI_SIGNAL",
    assigned_officer_id: "c0000000-0000-0000-0000-000000000001",
    officer_name: "Ravi Kumar",
    contractor_id: "d0000000-0000-0000-0000-000000000002",
    department_ownership: ["Engineering"],
    is_multi_owner: false,
    ai_confidence: 0.92,
    ai_categorization_status: "AI_CONFIRMED",
    ai_fallback_reason: null,
    priority_score: 67.5,
    bundle_id: null,
    bundle_count: 1,
    capacity_constrained: false,
    capacity_constraint_type: null,
    capacity_constraint_evidence: null,
    status: "ASSIGNED",
    closure_photo_url: null,
    closure_photo_location: null,
    closure_verification_score: null,
    closed_at: null,
    closed_by: null,
    created_at: "2026-05-10T08:30:00Z",
    updated_at: "2026-05-10T09:15:00Z",
    hash_chain_previous: null,
    hash_chain_current: "a1b2c3d4e5f6..."
  },

  // ── Officer Queue Response ──
  officerQueue: {
    complaints: [
      {
        id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        category: "ROADS",
        subcategory: "Pothole",
        description: "Large pothole near bus stop",
        status: "ASSIGNED",
        priority_score: 67.5,
        priority_rank: 1,
        bundle_count: 3,
        ai_confidence: 0.92,
        sla_deadline: "2026-05-13T08:30:00Z",
        created_at: "2026-05-10T08:30:00Z",
        filed_location: { lat: 17.385, lng: 78.487 },
        ward_id: "b0000000-0000-0000-0000-000000000001",
        capacity_status: { is_constrained: false, reason: null },
      },
      {
        id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        category: "SANITATION",
        subcategory: "Garbage Dump",
        description: "Overflowing garbage bin near market",
        status: "ASSIGNED",
        priority_score: 55.0,
        priority_rank: 2,
        bundle_count: 1,
        ai_confidence: 0.88,
        sla_deadline: "2026-05-12T08:30:00Z",
        created_at: "2026-05-10T10:00:00Z",
        filed_location: { lat: 17.362, lng: 78.475 },
        ward_id: "b0000000-0000-0000-0000-000000000001",
        capacity_status: { is_constrained: false, reason: null },
      },
    ],
    queue_length: 2,
    estimated_workload_hours: 3.0,
  },

  // ── Dashboard Stats ──
  dashboardStats: {
    total_complaints: 1250,
    resolved_count: 890,
    pending_count: 280,
    avg_resolution_hours: 36.5,
    sla_breach_rate: 0.12,
    complaints_by_category: { ROADS: 420, SANITATION: 380, WATER: 250, ELECTRICITY: 150, OTHER: 50 },
    complaints_by_ward: [
      { ward_id: "b0000000-0000-0000-0000-000000000001", ward_name: "Charminar", count: 180 },
      { ward_id: "b0000000-0000-0000-0000-000000000007", ward_name: "Kukatpally", count: 220 },
    ],
  },

  // ── Phase Config ──
  phaseConfig: {
    current_phase: 3,
    features: {
      ai_categorization: true,
      photo_diff: true,
      fraud_scoring: true,
      surge_forecast: true,
      priority_queue: true,
      chronic_sites: true,
      accountability_dashboard: false,
      rti_packaging: false,
      community_verifiers: false,
      ward_digest: false,
      model_governance: false,
    },
  },

  // ── Fraud Score ──
  fraudScore: {
    id: "e5f6a7b8-c9d0-1234-5678-90abcdef1234",
    complaint_id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    officer_id: "c0000000-0000-0000-0000-000000000001",
    score: 15,
    tier: "CLEAN",
    signals: {
      metadata_mismatch: 0,
      geolocation_mismatch: 0,
      velocity_outlier: 0,
      citizen_challenge_rate: 0,
      off_hours_closure: 0,
      low_verification_score: 15,
      pattern_anomaly: 0,
    },
    excluded: false,
    exclusion_reason: null,
    created_at: "2026-05-10T14:00:00Z",
  },

  // ── Ward Digest ──
  digest: {
    ward_id: "b0000000-0000-0000-0000-000000000001",
    date: "2026-05-10",
    top_clusters: [
      { category: "ROADS", count: 5, geohash: "tdr1w" },
      { category: "SANITATION", count: 3, geohash: "tdr1x" },
    ],
    todays_priority_queue: [],
    yesterdays_sla_breaches: 2,
    tomorrows_surge_forecast: {
      ward_id: "b0000000-0000-0000-0000-000000000001",
      forecast_date: "2026-05-11",
      predicted_volume: 15,
      confidence: 0.7,
      factors: ["Monsoon season (1.5x)"],
    },
    chronic_site_updates: [],
    resource_status: [
      { resource_type: "Garbage Truck", resource_name: "GHM-SWM-042", status: "AVAILABLE" },
    ],
    recommended_action: "Prioritize the 5 road complaints clustered near Charminar main road.",
  },
};
