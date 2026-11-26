export type DetectedClassification = 
  | 'BUILDINGS_DETECTED' 
  | 'NO_BUILDINGS_DETECTED' 
  | 'POTENTIALLY_VACANT' 
  | 'AGRICULTURAL' 
  | 'NEEDS_MANUAL_REVIEW';

export type AnalysisStatus = 
  | 'NOT_ANALYZED' 
  | 'ANALYSIS_COMPLETED' 
  | 'POTENTIALLY_VACANT' 
  | 'BUILDING_DETECTED' 
  | 'AGRICULTURAL_LAND' 
  | 'UNDER_MANUAL_REVIEW' 
  | 'ADMIN_CONFIRMED' 
  | 'INCORRECT_CLASSIFICATION';

export type MarkingType = 
  | 'VACANT_POLYGON' 
  | 'BUILDING_FOOTPRINT' 
  | 'AGRICULTURAL_BOUNDARY' 
  | 'DISPUTED_ZONE';

export interface LandAnalysisRecord {
  id: string;
  property_id: string;
  property_code: string;
  khasra_number: string;
  analysis_type: string;
  detected_classification: DetectedClassification;
  confidence_score: number;
  imagery_source: string;
  imagery_date: string;
  analysis_date: string;
  analysis_status: AnalysisStatus;
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
  marking_type: MarkingType;
  coordinates: number[][][]; // GeoJSON Polygon coordinates
  description?: string;
  created_by?: string;
  creator_name?: string;
  created_at: string;
  updated_at: string;
}

export interface LandAnalysisHistoryRecord {
  id: string;
  property_id: string;
  previous_classification?: string;
  new_classification: string;
  changed_by?: string;
  changer_name?: string;
  change_reason?: string;
  changed_at: string;
}
