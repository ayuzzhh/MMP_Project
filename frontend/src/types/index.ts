export type RoleType = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone_number: string;
  role: RoleType;
  is_active: boolean;
  is_verified: boolean;
  wallet_balance: number;
  permissions: string[];
  created_at: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user: UserProfile;
}

export interface CadastralProperty {
  property_id_code: string;
  khasra_number: string;
  sub_khasra?: string | null;
  village_name: string;
  village_code: string;
  tehsil: string;
  district: string;
  state: string;
  pin_code: string;
  land_classification: string;
  area_sqm: number;
  area_hectares: number;
  area_bigha: number;
  centroid?: [number, number];
  custom_color?: string;
  notes?: string;
  verification_status: 'VERIFIED' | 'PENDING_VERIFICATION' | 'UNVERIFIED' | 'DISPUTED';
  is_demo_data: boolean;
  availability: {
    ownership: boolean;
    government_land: boolean;
    legal_disputes: boolean;
    encumbrance: boolean;
    court_cases: boolean;
    history: boolean;
  };
}

export interface CadastralFeature {
  type: 'Feature';
  id: string;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: any;
  };
  properties: CadastralProperty;
}

export interface CadastralCollection {
  type: 'FeatureCollection';
  features: CadastralFeature[];
}

export interface PropertyReport {
  basic: CadastralProperty;
  geometry: any;
  pricing: Record<string, number>;
  unlocked_categories: string[];
  records: {
    ownership: {
      owner_name: string;
      relation_name: string;
      relation_type: string;
      ownership_type: string;
      share_fraction: string;
      record_date: string;
      source: string;
      source_grade: string;
      last_verified: string;
    } | null;
    history: Array<{
      previous_owner_name: string;
      transfer_type: string;
      transfer_date: string;
      registration_number: string;
      sub_registrar_office: string;
      consideration_amount: number;
    }> | null;
    government_land: {
      government_type: string;
      public_purpose_classification: string;
      restricting_authority: string;
      gazette_notification_number: string;
      restriction_details: string;
      source: string;
    } | null;
    legal_disputes: {
      dispute_type: string;
      dispute_status: string;
      description: string;
      is_lis_pendens: boolean;
      warning?: string;
    } | null;
    court_cases: Array<{
      cnr_number: string;
      case_number: string;
      court_name: string;
      court_type: string;
      petitioner: string;
      respondent: string;
      filing_date: string;
      case_status: string;
      stay_order_details: string;
    }> | null;
    encumbrance: {
      encumbrance_type: string;
      financial_institution: string;
      loan_account_reference: string;
      amount_inr: number;
      registration_number: string;
      mortgage_date: string;
      satisfaction_status: string;
      discharge_date?: string | null;
      source: string;
    } | null;
  };
  availability: CadastralProperty['availability'];
  disclaimer: string;
}

export interface WalletData {
  balance: number;
  transactions: Array<{
    id: string;
    type: 'PURCHASE' | 'UNLOCK_SPEND' | 'REFUND';
    amount: number;
    balance_after: number;
    description: string;
    created_at: string;
  }>;
}

// Smart Land Identification Types
export interface LandAnalysisRecord {
  id: string;
  property_id: string;
  property_code: string;
  khasra_number: string;
  analysis_type: string;
  detected_classification: 'BUILDINGS_DETECTED' | 'NO_BUILDINGS_DETECTED' | 'POTENTIALLY_VACANT' | 'AGRICULTURAL' | 'NEEDS_MANUAL_REVIEW';
  confidence_score: number;
  imagery_source: string;
  imagery_date: string;
  analysis_date: string;
  analysis_status: string;
  building_count?: number;
  open_area_percentage?: number;
}

export interface LandClassificationRecord {
  id: string;
  property_id: string;
  classification: string;
  detection_method: 'AUTOMATIC' | 'MANUAL_SURVEYOR' | 'HYBRID';
  admin_status: 'PENDING' | 'UNDER_MANUAL_REVIEW' | 'CONFIRMED' | 'REJECTED';
  reviewed_by?: string;
  reviewer_name?: string;
  reviewed_at?: string;
  notes?: string;
}

export interface LandMarkingRecord {
  id: string;
  property_id?: string;
  marking_type: 'VACANT_POLYGON' | 'BUILDING_FOOTPRINT' | 'AGRICULTURAL_BOUNDARY' | 'DISPUTED_ZONE';
  coordinates: number[][][];
  description?: string;
  creator_name?: string;
  created_at: string;
  updated_at: string;
}

export interface LandOverviewStats {
  total_mapped_parcels: number;
  buildings_detected: number;
  potentially_vacant: number;
  agricultural_parcels: number;
  pending_manual_reviews: number;
  confirmed_classifications: number;
}
