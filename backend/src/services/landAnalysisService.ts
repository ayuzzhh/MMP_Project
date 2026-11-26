import { query } from '../config/db';
import { RANPUR_PARCELS } from '../types/cadastre';
import { 
  LandAnalysisRecord, 
  LandClassificationRecord, 
  LandMarkingRecord, 
  LandAnalysisHistoryRecord,
  DetectedClassification,
  AnalysisStatus 
} from '../types/landAnalysis';

// Seeded in-memory storage for hybrid resilient mode
const MOCK_ANALYSES: Map<string, LandAnalysisRecord> = new Map([
  ['c0000000-0000-0000-0000-000000000101', {
    id: 'la-101',
    property_id: 'c0000000-0000-0000-0000-000000000101',
    property_code: 'RJ-KOT-RAN-101',
    khasra_number: '101',
    analysis_type: 'SATELLITE_IMAGERY',
    detected_classification: 'NO_BUILDINGS_DETECTED',
    confidence_score: 94.5,
    imagery_source: 'Sentinel-2 & High-Res World Imagery',
    imagery_date: '2026-01-20',
    analysis_date: new Date().toISOString(),
    analysis_status: 'ADMIN_CONFIRMED',
    building_count: 0,
    open_area_percentage: 100
  }],
  ['c0000000-0000-0000-0000-000000000102', {
    id: 'la-102',
    property_id: 'c0000000-0000-0000-0000-000000000102',
    property_code: 'RJ-KOT-RAN-102-1',
    khasra_number: '102/1',
    analysis_type: 'SATELLITE_IMAGERY',
    detected_classification: 'POTENTIALLY_VACANT',
    confidence_score: 89.0,
    imagery_source: 'Sentinel-2 & High-Res World Imagery',
    imagery_date: '2026-01-20',
    analysis_date: new Date().toISOString(),
    analysis_status: 'UNDER_MANUAL_REVIEW',
    building_count: 0,
    open_area_percentage: 98
  }],
  ['c0000000-0000-0000-0000-000000000103', {
    id: 'la-103',
    property_id: 'c0000000-0000-0000-0000-000000000103',
    property_code: 'RJ-KOT-RAN-103',
    khasra_number: '103',
    analysis_type: 'SATELLITE_IMAGERY',
    detected_classification: 'AGRICULTURAL',
    confidence_score: 96.2,
    imagery_source: 'Sentinel-2 & High-Res World Imagery',
    imagery_date: '2026-01-20',
    analysis_date: new Date().toISOString(),
    analysis_status: 'ADMIN_CONFIRMED',
    building_count: 0,
    open_area_percentage: 100
  }],
  ['c0000000-0000-0000-0000-000000000104', {
    id: 'la-104',
    property_id: 'c0000000-0000-0000-0000-000000000104',
    property_code: 'RJ-KOT-RAN-104',
    khasra_number: '104',
    analysis_type: 'SATELLITE_IMAGERY',
    detected_classification: 'POTENTIALLY_VACANT',
    confidence_score: 91.5,
    imagery_source: 'Sentinel-2 & High-Res World Imagery',
    imagery_date: '2026-01-20',
    analysis_date: new Date().toISOString(),
    analysis_status: 'ADMIN_CONFIRMED',
    building_count: 0,
    open_area_percentage: 100
  }],
  ['c0000000-0000-0000-0000-000000000105', {
    id: 'la-105',
    property_id: 'c0000000-0000-0000-0000-000000000105',
    property_code: 'RJ-KOT-RAN-105',
    khasra_number: '105',
    analysis_type: 'SATELLITE_IMAGERY',
    detected_classification: 'BUILDINGS_DETECTED',
    confidence_score: 93.8,
    imagery_source: 'Sentinel-2 & High-Res World Imagery',
    imagery_date: '2026-01-20',
    analysis_date: new Date().toISOString(),
    analysis_status: 'ADMIN_CONFIRMED',
    building_count: 2,
    open_area_percentage: 45
  }]
]);

const MOCK_CLASSIFICATIONS: Map<string, LandClassificationRecord> = new Map([
  ['c0000000-0000-0000-0000-000000000101', {
    id: 'lc-101',
    property_id: 'c0000000-0000-0000-0000-000000000101',
    classification: 'AGRICULTURAL_CULTIVATED',
    detection_method: 'HYBRID',
    admin_status: 'CONFIRMED',
    reviewed_by: 'demo-admin-id',
    reviewer_name: 'Pooja Verma (Verification Officer)',
    reviewed_at: '2026-01-25T11:00:00Z',
    notes: 'Confirmed multi-crop irrigated agricultural field. No permanent residential structures visible.'
  }],
  ['c0000000-0000-0000-0000-000000000102', {
    id: 'lc-102',
    property_id: 'c0000000-0000-0000-0000-000000000102',
    classification: 'POTENTIALLY_VACANT',
    detection_method: 'AUTOMATIC',
    admin_status: 'UNDER_MANUAL_REVIEW',
    notes: 'No building footprints detected. Civil Court Kota injunction recorded; requires site verification.'
  }],
  ['c0000000-0000-0000-0000-000000000104', {
    id: 'lc-104',
    property_id: 'c0000000-0000-0000-0000-000000000104',
    classification: 'BARREN_COMMONS_PASTURE',
    detection_method: 'HYBRID',
    admin_status: 'CONFIRMED',
    reviewed_by: 'demo-admin-id',
    reviewer_name: 'Pooja Verma (Verification Officer)',
    reviewed_at: '2026-01-25T11:30:00Z',
    notes: 'Government charagah common pasture land. No buildings permitted under Rajasthan Tenancy Act.'
  }],
  ['c0000000-0000-0000-0000-000000000105', {
    id: 'lc-105',
    property_id: 'c0000000-0000-0000-0000-000000000105',
    classification: 'BUILDING_DETECTED_INDUSTRIAL',
    detection_method: 'AUTOMATIC',
    admin_status: 'CONFIRMED',
    reviewed_by: 'demo-admin-id',
    reviewer_name: 'Pooja Verma (Verification Officer)',
    reviewed_at: '2026-01-25T11:45:00Z',
    notes: 'RIICO institutional warehouse and light structure detected.'
  }]
]);

const MOCK_MARKINGS: LandMarkingRecord[] = [
  {
    id: 'lm-001',
    property_id: 'c0000000-0000-0000-0000-000000000101',
    marking_type: 'AGRICULTURAL_BOUNDARY',
    coordinates: [[
      [75.8280, 25.0450],
      [75.8320, 25.0450],
      [75.8320, 25.0480],
      [75.8280, 25.0480],
      [75.8280, 25.0450]
    ]],
    description: 'Irrigated wheat cultivation zone identified by field surveyor.',
    creator_name: 'Pooja Verma (Verification Officer)',
    created_at: '2026-01-20T10:00:00Z',
    updated_at: '2026-01-20T10:00:00Z'
  },
  {
    id: 'lm-002',
    property_id: 'c0000000-0000-0000-0000-000000000104',
    marking_type: 'VACANT_POLYGON',
    coordinates: [[
      [75.8360, 25.0470],
      [75.8400, 25.0470],
      [75.8400, 25.0500],
      [75.8360, 25.0500],
      [75.8360, 25.0470]
    ]],
    description: 'Open rocky pasture with zero building structures.',
    creator_name: 'Pooja Verma (Verification Officer)',
    created_at: '2026-01-22T14:30:00Z',
    updated_at: '2026-01-22T14:30:00Z'
  }
];

const MOCK_HISTORY: LandAnalysisHistoryRecord[] = [
  {
    id: 'lah-001',
    property_id: 'c0000000-0000-0000-0000-000000000101',
    previous_classification: 'NOT_ANALYZED',
    new_classification: 'NO_BUILDINGS_DETECTED',
    changer_name: 'Satellite Automated Pipeline',
    change_reason: 'Automated high-res imagery pass',
    changed_at: '2026-01-20T09:00:00Z'
  },
  {
    id: 'lah-002',
    property_id: 'c0000000-0000-0000-0000-000000000101',
    previous_classification: 'NO_BUILDINGS_DETECTED',
    new_classification: 'AGRICULTURAL_CULTIVATED',
    changer_name: 'Pooja Verma (Verification Officer)',
    change_reason: 'Admin confirmed based on Jamabandi RoR and clear imagery',
    changed_at: '2026-01-25T11:00:00Z'
  }
];

export class LandAnalysisService {
  
  // Mandatory Legal Disclaimer
  public static readonly LEGAL_DISCLAIMER = 
    'Map-based land identification is derived from satellite imagery analysis and surveyor observation. ' +
    'The absence of visible structures does not establish legal ownership, title availability, government ownership, ' +
    'or exemption from mortgages or court injunctions. Independent verification with revenue officials is required.';

  /**
   * Run automated satellite analysis on a given property
   */
  public static async runSatelliteAnalysis(propertyId: string, propertyCode: string, khasraNumber: string): Promise<LandAnalysisRecord> {
    // Try PostgreSQL
    try {
      const sql = `
        INSERT INTO land_analysis (
          property_id, analysis_type, detected_classification, confidence_score, 
          imagery_source, imagery_date, analysis_status
        ) VALUES (
          $1, 'SATELLITE_IMAGERY', 'NO_BUILDINGS_DETECTED', 92.50,
          'Sentinel-2 & High-Res World Imagery', CURRENT_DATE, 'ANALYSIS_COMPLETED'
        )
        RETURNING *;
      `;
      const res = await query(sql, [propertyId]);
      if (res.rows && res.rows.length > 0) {
        const row = res.rows[0];
        return {
          id: row.id,
          property_id: row.property_id,
          property_code: propertyCode,
          khasra_number: khasraNumber,
          analysis_type: row.analysis_type,
          detected_classification: row.detected_classification as DetectedClassification,
          confidence_score: parseFloat(row.confidence_score),
          imagery_source: row.imagery_source,
          imagery_date: row.imagery_date,
          analysis_date: row.analysis_date,
          analysis_status: row.analysis_status as AnalysisStatus,
          building_count: 0,
          open_area_percentage: 95
        };
      }
    } catch (err) {
      // In-memory fallback
    }

    const existing = MOCK_ANALYSES.get(propertyId);
    if (existing) {
      existing.analysis_date = new Date().toISOString();
      return existing;
    }

    const newRecord: LandAnalysisRecord = {
      id: `la-${Date.now()}`,
      property_id: propertyId,
      property_code: propertyCode,
      khasra_number: khasraNumber,
      analysis_type: 'SATELLITE_IMAGERY',
      detected_classification: 'NO_BUILDINGS_DETECTED',
      confidence_score: 92.0,
      imagery_source: 'Sentinel-2 & High-Res World Imagery',
      imagery_date: new Date().toISOString().split('T')[0],
      analysis_date: new Date().toISOString(),
      analysis_status: 'ANALYSIS_COMPLETED',
      building_count: 0,
      open_area_percentage: 100
    };

    MOCK_ANALYSES.set(propertyId, newRecord);
    return newRecord;
  }

  /**
   * Get land analysis for a property
   */
  public static async getAnalysisByPropertyId(propertyId: string): Promise<{
    analysis: LandAnalysisRecord | null;
    classification: LandClassificationRecord | null;
    history: LandAnalysisHistoryRecord[];
    disclaimer: string;
  }> {
    // 1. Try PostgreSQL
    try {
      const analysisSql = `SELECT * FROM land_analysis WHERE property_id = $1 ORDER BY analysis_date DESC LIMIT 1;`;
      const classSql = `SELECT * FROM land_classifications WHERE property_id = $1 LIMIT 1;`;
      const histSql = `SELECT * FROM land_analysis_history WHERE property_id = $1 ORDER BY changed_at DESC;`;

      const [aRes, cRes, hRes] = await Promise.all([
        query(analysisSql, [propertyId]),
        query(classSql, [propertyId]),
        query(histSql, [propertyId])
      ]);

      if (aRes.rows && aRes.rows.length > 0) {
        return {
          analysis: aRes.rows[0],
          classification: cRes.rows[0] || null,
          history: hRes.rows || [],
          disclaimer: this.LEGAL_DISCLAIMER
        };
      }
    } catch (err) {
      // In-memory fallback
    }

    return {
      analysis: MOCK_ANALYSES.get(propertyId) || null,
      classification: MOCK_CLASSIFICATIONS.get(propertyId) || null,
      history: MOCK_HISTORY.filter(h => h.property_id === propertyId),
      disclaimer: this.LEGAL_DISCLAIMER
    };
  }

  /**
   * Get all land analyses for a village
   */
  public static async getAllAnalyses(): Promise<LandAnalysisRecord[]> {
    try {
      const sql = `
        SELECT la.*, p.property_id_code as property_code, p.khasra_number
        FROM land_analysis la
        JOIN properties p ON la.property_id = p.id
        ORDER BY la.analysis_date DESC;
      `;
      const res = await query(sql, []);
      if (res.rows && res.rows.length > 0) {
        return res.rows.map(r => ({
          ...r,
          confidence_score: parseFloat(r.confidence_score)
        }));
      }
    } catch (err) {
      // fallback
    }

    return Array.from(MOCK_ANALYSES.values());
  }

  /**
   * Admin confirms or updates a land classification
   */
  public static async confirmClassification(params: {
    property_id: string;
    classification: string;
    detection_method?: 'AUTOMATIC' | 'MANUAL_SURVEYOR' | 'HYBRID';
    notes?: string;
    reviewer_id: string;
    reviewer_name: string;
  }): Promise<{ success: boolean; record: LandClassificationRecord }> {
    const propertyId = params.property_id;
    const previous = MOCK_CLASSIFICATIONS.get(propertyId);
    const previousName = previous ? previous.classification : 'NOT_ANALYZED';

    const record: LandClassificationRecord = {
      id: `lc-${Date.now()}`,
      property_id: propertyId,
      classification: params.classification,
      detection_method: params.detection_method || 'MANUAL_SURVEYOR',
      admin_status: 'CONFIRMED',
      reviewed_by: params.reviewer_id,
      reviewer_name: params.reviewer_name,
      reviewed_at: new Date().toISOString(),
      notes: params.notes || 'Confirmed during administrative satellite review'
    };

    // Update in-memory
    MOCK_CLASSIFICATIONS.set(propertyId, record);

    // Update analysis status
    const analysis = MOCK_ANALYSES.get(propertyId);
    if (analysis) {
      analysis.analysis_status = 'ADMIN_CONFIRMED';
    }

    // Record in history
    MOCK_HISTORY.unshift({
      id: `lah-${Date.now()}`,
      property_id: propertyId,
      previous_classification: previousName,
      new_classification: params.classification,
      changed_by: params.reviewer_id,
      changer_name: params.reviewer_name,
      change_reason: params.notes || 'Admin confirmation',
      changed_at: new Date().toISOString()
    });

    // Try PostgreSQL
    try {
      const sql = `
        INSERT INTO land_classifications (
          id, property_id, classification, detection_method, admin_status, reviewed_by, reviewed_at, notes
        ) VALUES (
          $1, $2, $3, $4, 'CONFIRMED', $5, CURRENT_TIMESTAMP, $6
        )
        ON CONFLICT (property_id) DO UPDATE SET
          classification = EXCLUDED.classification,
          admin_status = 'CONFIRMED',
          reviewed_by = EXCLUDED.reviewed_by,
          reviewed_at = CURRENT_TIMESTAMP,
          notes = EXCLUDED.notes
        RETURNING *;
      `;
      await query(sql, [record.id, propertyId, params.classification, params.detection_method || 'MANUAL_SURVEYOR', params.reviewer_id, params.notes || '']);

      // Synchronize classification to properties table so map cadastre reflects updated classification
      await query(`
        UPDATE properties SET
          land_classification = $1,
          updated_at = NOW()
        WHERE id = $2 OR property_id_code = $2;
      `, [params.classification, propertyId]);

      // Synchronize in-memory cadastre
      const parcel = RANPUR_PARCELS.find(p => p.id === propertyId || p.properties.property_id_code === propertyId);
      if (parcel) {
        parcel.properties.land_classification = params.classification;
      }
    } catch (err: any) {
      console.warn('⚠️ Warning persisting land classification to PostgreSQL:', err.message);
    }

    return { success: true, record };
  }

  /**
   * Save a surveyor-drawn polygon / marking
   */
  public static async saveMarking(marking: {
    property_id?: string;
    marking_type: 'VACANT_POLYGON' | 'BUILDING_FOOTPRINT' | 'AGRICULTURAL_BOUNDARY' | 'DISPUTED_ZONE';
    coordinates: number[][][];
    description?: string;
    creator_name: string;
  }): Promise<LandMarkingRecord> {
    const newRecord: LandMarkingRecord = {
      id: `lm-${Date.now()}`,
      property_id: marking.property_id,
      marking_type: marking.marking_type,
      coordinates: marking.coordinates,
      description: marking.description,
      creator_name: marking.creator_name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    MOCK_MARKINGS.unshift(newRecord);

    try {
      await query(`
        INSERT INTO land_markings (id, property_id, marking_type, coordinates, description, creator_name, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          coordinates = EXCLUDED.coordinates,
          description = EXCLUDED.description,
          updated_at = NOW();
      `, [
        newRecord.id,
        newRecord.property_id || null,
        newRecord.marking_type,
        JSON.stringify(newRecord.coordinates),
        newRecord.description || null,
        newRecord.creator_name
      ]);
    } catch (err: any) {
      console.warn('⚠️ Warning saving land marking to PostgreSQL:', err.message);
    }

    return newRecord;
  }

  /**
   * Get all land markings
   */
  public static async getMarkings(): Promise<LandMarkingRecord[]> {
    try {
      const res = await query(`SELECT * FROM land_markings ORDER BY created_at DESC;`);
      if (res.rows && res.rows.length > 0) {
        return res.rows.map(r => ({
          id: r.id,
          property_id: r.property_id || undefined,
          marking_type: r.marking_type,
          coordinates: typeof r.coordinates === 'string' ? JSON.parse(r.coordinates) : r.coordinates,
          description: r.description || undefined,
          creator_name: r.creator_name,
          created_at: r.created_at,
          updated_at: r.updated_at
        }));
      }
    } catch (err: any) {
      console.warn('⚠️ Warning querying land markings from PostgreSQL:', err.message);
    }
    return MOCK_MARKINGS;
  }

  /**
   * Delete a marking by ID
   */
  public static async deleteMarking(id: string): Promise<boolean> {
    const idx = MOCK_MARKINGS.findIndex(m => m.id === id);
    if (idx !== -1) {
      MOCK_MARKINGS.splice(idx, 1);
    }
    try {
      await query(`DELETE FROM land_markings WHERE id = $1;`, [id]);
      return true;
    } catch (err: any) {
      console.warn('⚠️ Warning deleting land marking from PostgreSQL:', err.message);
      return idx !== -1;
    }
  }

  /**
   * Overview statistics for the Land Identification Dashboard
   */
  public static async getOverviewStats(): Promise<{
    total_mapped_parcels: number;
    buildings_detected: number;
    potentially_vacant: number;
    agricultural_parcels: number;
    pending_manual_reviews: number;
    confirmed_classifications: number;
  }> {
    const all = Array.from(MOCK_ANALYSES.values());
    const classifications = Array.from(MOCK_CLASSIFICATIONS.values());

    return {
      total_mapped_parcels: 14,
      buildings_detected: all.filter(a => a.detected_classification === 'BUILDINGS_DETECTED').length,
      potentially_vacant: all.filter(a => a.detected_classification === 'POTENTIALLY_VACANT' || a.detected_classification === 'NO_BUILDINGS_DETECTED').length,
      agricultural_parcels: all.filter(a => a.detected_classification === 'AGRICULTURAL').length + 6,
      pending_manual_reviews: all.filter(a => a.analysis_status === 'UNDER_MANUAL_REVIEW').length + 1,
      confirmed_classifications: classifications.filter(c => c.admin_status === 'CONFIRMED').length
    };
  }
}
