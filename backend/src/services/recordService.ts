import { PROPERTY_INTELLIGENCE, RANPUR_PARCELS } from '../types/cadastre';
import { changeRequests } from '../controllers/adminController';
import { query } from '../config/db';

export interface AuditLogEntry {
  id: string;
  admin_id: string;
  admin_name: string;
  admin_role: string;
  action: string;
  target_entity: string;
  target_id: string;
  details: any;
  timestamp: string;
}

export const AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-001',
    admin_id: 'demo-admin-id',
    admin_name: 'Pooja Verma (Admin)',
    admin_role: 'ADMIN',
    action: 'SUBMIT_DISPUTE_PROPOSAL',
    target_entity: 'PROPERTY_LEGAL_DISPUTE',
    target_id: 'c0000000-0000-0000-0000-000000000102',
    details: {
      khasra_number: '102/1',
      dispute_type: 'PARTITION_SUIT',
      court_case: 'Civil Suit 182/2023 ADJ-2 Kota'
    },
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'log-002',
    admin_id: 'demo-admin-id',
    admin_name: 'Pooja Verma (Admin)',
    admin_role: 'ADMIN',
    action: 'SUBMIT_ENCUMBRANCE_PROPOSAL',
    target_entity: 'PROPERTY_ENCUMBRANCE',
    target_id: 'c0000000-0000-0000-0000-000000000103',
    details: {
      khasra_number: '103',
      bank: 'State Bank of India',
      amount_inr: 3500000
    },
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString()
  }
];

export class RecordService {
  public static getPropertyRecords(propertyId: string) {
    const parcel = RANPUR_PARCELS.find(p => p.id === propertyId || p.properties.property_id_code === propertyId);
    if (!parcel) return null;

    const intel = PROPERTY_INTELLIGENCE[parcel.id] || {
      ownership: null,
      history: [],
      government_land: null,
      legal_disputes: null,
      court_cases: [],
      encumbrance: null
    };

    return {
      property_id: parcel.id,
      property_id_code: parcel.properties.property_id_code,
      khasra_number: parcel.properties.khasra_number,
      sub_khasra: parcel.properties.sub_khasra,
      land_classification: parcel.properties.land_classification,
      area_sqm: parcel.properties.area_sqm,
      area_hectares: parcel.properties.area_hectares,
      area_bigha: parcel.properties.area_bigha,
      verification_status: parcel.properties.verification_status,
      records: intel,
      availability: parcel.properties.availability,
      source_departments: [
        { name: 'Apna Khata (e-Dharti)', jurisdiction: 'Board of Revenue Rajasthan, Ladpura' },
        { name: 'Bhunaksha Rajasthan', jurisdiction: 'NIC Cadastral Division, Kota' },
        { name: 'e-Courts Services', jurisdiction: 'District Court Kota (Case Information System 3.2)' },
        { name: 'IGRS Rajasthan', jurisdiction: 'Sub-Registrar Office Ladpura, Kota' }
      ]
    };
  }

  public static proposeRecordChange(params: {
    propertyId: string;
    category: 'OWNERSHIP' | 'OWNERSHIP_HISTORY' | 'GOVERNMENT_LAND' | 'LEGAL_DISPUTES' | 'ENCUMBRANCE';
    changeType: 'CREATE' | 'UPDATE' | 'DELETE';
    proposedData: any;
    user: any;
  }) {
    const { propertyId, category, changeType, proposedData, user } = params;

    const parcel = RANPUR_PARCELS.find(p => p.id === propertyId || p.properties.property_id_code === propertyId);
    if (!parcel) {
      throw new Error('PROPERTY_NOT_FOUND');
    }

    const newRequestId = `cr-${Date.now().toString().slice(-4)}`;
    const currentIntel = PROPERTY_INTELLIGENCE[parcel.id] || {};

    let currentCategoryData = null;
    switch (category) {
      case 'OWNERSHIP': currentCategoryData = currentIntel.ownership; break;
      case 'OWNERSHIP_HISTORY': currentCategoryData = currentIntel.history; break;
      case 'GOVERNMENT_LAND': currentCategoryData = currentIntel.government_land; break;
      case 'LEGAL_DISPUTES': currentCategoryData = currentIntel.legal_disputes; break;
      case 'ENCUMBRANCE': currentCategoryData = currentIntel.encumbrance; break;
    }

    const changeReq = {
      id: newRequestId,
      property_id: parcel.id,
      property_id_code: parcel.properties.property_id_code,
      khasra_number: parcel.properties.khasra_number,
      change_type: changeType,
      category,
      requested_by: user?.full_name || 'Verification Officer',
      current_data: currentCategoryData,
      proposed_data: proposedData,
      status: 'PENDING',
      created_at: new Date().toISOString()
    };

    changeRequests.unshift(changeReq);

    // Persist change request to PostgreSQL
    try {
      query(`
        INSERT INTO change_requests (
          id, property_id, property_id_code, khasra_number,
          change_type, category, requested_by, proposed_data, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING', NOW())
        ON CONFLICT (id) DO NOTHING;
      `, [
        changeReq.id,
        changeReq.property_id || null,
        changeReq.property_id_code,
        changeReq.khasra_number,
        changeReq.change_type,
        changeReq.category,
        changeReq.requested_by,
        JSON.stringify(changeReq.proposed_data)
      ]).catch(e => console.warn('⚠️ Warning persisting change request:', e.message));
    } catch (e: any) {}

    // Append to audit log
    this.logAudit({
      admin_id: user?.id || 'demo-admin-id',
      admin_name: user?.full_name || 'Verification Officer',
      admin_role: user?.role || 'ADMIN',
      action: `PROPOSE_${category}_CHANGE`,
      target_entity: `PROPERTY_${category}`,
      target_id: parcel.id,
      details: {
        khasra_number: parcel.properties.khasra_number,
        change_request_id: newRequestId,
        summary: proposedData
      }
    });

    return changeReq;
  }

  public static applyApprovedChange(changeReq: any, reviewerUser: any) {
    const pId = changeReq.property_id;
    if (!PROPERTY_INTELLIGENCE[pId]) {
      PROPERTY_INTELLIGENCE[pId] = {
        ownership: null,
        history: [],
        government_land: null,
        legal_disputes: null,
        court_cases: [],
        encumbrance: null
      };
    }

    const intel = PROPERTY_INTELLIGENCE[pId];
    const data = changeReq.proposed_data;

    switch (changeReq.category) {
      case 'OWNERSHIP':
        intel.ownership = {
          owner_name: data.owner_name,
          relation_name: data.relation_name || '',
          relation_type: data.relation_type || 'SON_OF',
          ownership_type: data.ownership_type || 'KHATEDARI',
          share_fraction: data.share_fraction || '1/1',
          record_date: data.record_date || new Date().toISOString().split('T')[0],
          source: data.source || 'Apna Khata (e-Dharti) Rajasthan Jamabandi',
          source_grade: 'OFFICIAL_PUBLIC_RECORD',
          last_verified: new Date().toISOString().split('T')[0]
        };
        // Update parcel availability
        const parcelOwn = RANPUR_PARCELS.find(p => p.id === pId);
        if (parcelOwn) parcelOwn.properties.availability.ownership = true;
        break;

      case 'OWNERSHIP_HISTORY':
        if (!Array.isArray(intel.history)) intel.history = [];
        intel.history.unshift({
          previous_owner_name: data.previous_owner_name,
          transfer_type: data.transfer_type || 'SALE_DEED',
          transfer_date: data.transfer_date || new Date().toISOString().split('T')[0],
          registration_number: data.registration_number || 'SRO-LADPURA-REG',
          sub_registrar_office: data.sub_registrar_office || 'Sub-Registrar Ladpura, Kota',
          consideration_amount: Number(data.consideration_amount) || 0.00
        });
        const parcelHist = RANPUR_PARCELS.find(p => p.id === pId);
        if (parcelHist) parcelHist.properties.availability.history = true;
        break;

      case 'GOVERNMENT_LAND':
        intel.government_land = {
          government_type: data.government_type || 'REVENUE_DEPARTMENT_RAJASTHAN',
          public_purpose_classification: data.public_purpose_classification || 'SIWAY_CHAK',
          restricting_authority: data.restricting_authority || 'District Collector, Kota',
          gazette_notification_number: data.gazette_notification_number || 'RJ-GAZETTE-REV',
          restriction_details: data.restriction_details,
          source: data.source || 'Board of Revenue Rajasthan'
        };
        const parcelGov = RANPUR_PARCELS.find(p => p.id === pId);
        if (parcelGov) parcelGov.properties.availability.government_land = true;
        break;

      case 'LEGAL_DISPUTES':
        intel.legal_disputes = {
          dispute_type: data.dispute_type || 'TITLE_DISPUTE',
          dispute_status: data.dispute_status || 'ACTIVE',
          description: data.description,
          is_lis_pendens: true,
          warning: 'LIS PENDENS RESTRICTION: Section 52 Transfer of Property Act applies.'
        };
        if (data.court_case) {
          if (!Array.isArray(intel.court_cases)) intel.court_cases = [];
          intel.court_cases.unshift({
            cnr_number: data.court_case.cnr_number || `RJKO0100${Date.now().toString().slice(-8)}`,
            case_number: data.court_case.case_number,
            court_name: data.court_case.court_name || 'Court of Additional District Judge No. 2, Kota',
            court_type: data.court_case.court_type || 'CIVIL_COURT_KOTA',
            petitioner: data.court_case.petitioner || 'Petitioner',
            respondent: data.court_case.respondent || 'Respondent',
            filing_date: data.court_case.filing_date || new Date().toISOString().split('T')[0],
            case_status: data.court_case.case_status || 'PENDING',
            stay_order_details: data.court_case.stay_order_details || 'Interim status quo in effect.'
          });
        }
        const parcelDisp = RANPUR_PARCELS.find(p => p.id === pId);
        if (parcelDisp) {
          parcelDisp.properties.verification_status = 'DISPUTED';
          parcelDisp.properties.availability.legal_disputes = true;
          parcelDisp.properties.availability.court_cases = true;
        }
        break;

      case 'ENCUMBRANCE':
        intel.encumbrance = {
          encumbrance_type: data.encumbrance_type || 'REGISTERED_BANK_MORTGAGE',
          financial_institution: data.financial_institution,
          loan_account_reference: data.loan_account_reference || 'REF-N/A',
          amount_inr: Number(data.amount_inr) || 0,
          registration_number: data.registration_number || 'SRO-REG',
          mortgage_date: data.mortgage_date || new Date().toISOString().split('T')[0],
          satisfaction_status: data.satisfaction_status || 'ACTIVE',
          discharge_date: data.discharge_date || null,
          source: data.source || 'IGRS Rajasthan (SRO Ladpura)'
        };
        const parcelEnc = RANPUR_PARCELS.find(p => p.id === pId);
        if (parcelEnc) parcelEnc.properties.availability.encumbrance = true;
        break;
    }

    // Persist updated records to PostgreSQL property_records
    try {
      query(`
        INSERT INTO property_records (
          id, property_id, owner_name, share_fraction, encumbrance_status, encumbrance_amount,
          dispute_status, dispute_case_number, additional_data, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        ON CONFLICT (id) DO UPDATE SET
          owner_name = COALESCE(EXCLUDED.owner_name, property_records.owner_name),
          share_fraction = COALESCE(EXCLUDED.share_fraction, property_records.share_fraction),
          encumbrance_status = COALESCE(EXCLUDED.encumbrance_status, property_records.encumbrance_status),
          encumbrance_amount = COALESCE(EXCLUDED.encumbrance_amount, property_records.encumbrance_amount),
          dispute_status = COALESCE(EXCLUDED.dispute_status, property_records.dispute_status),
          dispute_case_number = COALESCE(EXCLUDED.dispute_case_number, property_records.dispute_case_number),
          additional_data = EXCLUDED.additional_data,
          updated_at = NOW();
      `, [
        `rec-${pId}`,
        pId,
        intel.ownership?.owner_name || null,
        intel.ownership?.share_fraction || '1/1',
        intel.encumbrance?.satisfaction_status || 'NONE',
        intel.encumbrance?.amount_inr || 0,
        intel.legal_disputes?.dispute_status || 'CLEAR',
        intel.court_cases?.[0]?.case_number || null,
        JSON.stringify(intel)
      ]).catch(e => console.warn('⚠️ Warning persisting property_records in PostgreSQL:', e.message));
    } catch (e: any) {}

    // Append to audit log
    this.logAudit({
      admin_id: reviewerUser?.id || 'demo-superadmin-id',
      admin_name: reviewerUser?.full_name || 'Super Admin',
      admin_role: reviewerUser?.role || 'SUPER_ADMIN',
      action: `APPROVE_${changeReq.category}_CHANGE`,
      target_entity: `PROPERTY_${changeReq.category}`,
      target_id: pId,
      details: {
        change_request_id: changeReq.id,
        khasra_number: changeReq.khasra_number,
        applied_data: data
      }
    });
  }

  public static setDirectPropertyRecords(propertyId: string, data: {
    owner_name?: string;
    share_fraction?: string;
    land_classification?: string;
    dispute_case_number?: string;
    encumbrance?: string;
    encumbrance_amount?: number;
  }) {
    PROPERTY_INTELLIGENCE[propertyId] = {
      ownership: data.owner_name ? {
        owner_name: data.owner_name,
        ownership_type: 'KHATEDARI',
        share_fraction: data.share_fraction || '1/1',
        record_date: new Date().toISOString().split('T')[0],
        source: 'Official Cadastral Survey & Revenue Field Record'
      } : null,
      history: [
        {
          previous_owner: 'Original Allottee / Ancestral Estate',
          transfer_type: 'ALLOTMENT / INHERITANCE',
          transfer_date: '2018-05-10',
          registration_number: 'REG-KOT-2018-441'
        }
      ],
      government_land: data.land_classification?.includes('GOVERNMENT') || data.land_classification?.includes('CHARAGAH') ? {
        department: 'Revenue Department Rajasthan',
        purpose: 'Public Village Utility & Pasture'
      } : null,
      legal_disputes: data.dispute_case_number ? {
        dispute_type: 'TITLE_SUIT',
        court_name: 'District & Sessions Court, Kota',
        case_number: data.dispute_case_number,
        stay_order: true
      } : null,
      court_cases: data.dispute_case_number ? [
        {
          case_number: data.dispute_case_number,
          court: 'District Court, Kota',
          status: 'PENDING'
        }
      ] : [],
      encumbrance: data.encumbrance ? {
        financial_institution: data.encumbrance,
        encumbrance_type: 'REGISTERED_BANK_MORTGAGE',
        amount_inr: Number(data.encumbrance_amount) || 2000000,
        loan_account_reference: 'ACC-MORTGAGE-001',
        mortgage_date: new Date().toISOString().split('T')[0],
        satisfaction_status: 'ACTIVE',
        registration_number: 'SRO-LADPURA-REG-2026',
        source: 'Sub-Registrar Office Ladpura, Kota'
      } : null
    };
  }

  public static logAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) {
    const log: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...entry
    };
    AUDIT_LOGS.unshift(log);
    return log;
  }

  public static getAuditLogs() {
    return AUDIT_LOGS;
  }
}
