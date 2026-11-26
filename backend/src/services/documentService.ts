import fs from 'fs';
import path from 'path';
import { RANPUR_PARCELS, PROPERTY_INTELLIGENCE } from '../types/cadastre';
import { RecordService } from './recordService';
import { query } from '../config/db';

export interface ExtractedDocumentFields {
  khasra_number?: string;
  khata_number?: string;
  village_name?: string;
  tehsil?: string;
  district?: string;
  owner_name?: string;
  father_name?: string;
  ownership_type?: string;
  area_bigha?: number;
  area_hectares?: number;
  land_classification?: string;
  annual_revenue_lagaan_inr?: number;
  encumbrance_note?: string;
  cnr_number?: string;
  sro_registration_number?: string;
  confidence_score: number;
  discrepancies: string[];
}

export interface PropertyDocument {
  id: string;
  property_id: string;
  property_id_code: string;
  khasra_number: string;
  document_type: 'JAMABANDI_NAKAL' | 'REGISTRY_SALE_DEED' | 'MUTATION_INTKAL' | 'COURT_ORDER' | 'REVENUE_MAP';
  title: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  uploaded_at: string;
  ocr_status: 'PROCESSING' | 'COMPLETED' | 'VERIFIED' | 'REJECTED';
  extracted_fields: ExtractedDocumentFields | null;
  human_verified_by?: string;
  human_verified_at?: string;
  super_admin_committed: boolean;
}

// In-Memory Document Registry with realistic pre-seeded documents for Ranpur
export const PROPERTY_DOCUMENTS: PropertyDocument[] = [
  {
    id: 'doc-001',
    property_id: 'c0000000-0000-0000-0000-000000000101',
    property_id_code: 'LG-RJ-KOT-RAN-00101',
    khasra_number: '101',
    document_type: 'JAMABANDI_NAKAL',
    title: 'Certified Jamabandi Nakal (Samvat 2078-2081) - Khasra 101',
    file_name: 'jamabandi_ranpur_khasra_101.pdf',
    file_path: '/uploads/documents/jamabandi_ranpur_khasra_101.pdf',
    file_size: 284500,
    mime_type: 'application/pdf',
    uploaded_by: 'Pooja Verma (Verification Officer)',
    uploaded_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    ocr_status: 'VERIFIED',
    extracted_fields: {
      khasra_number: '101',
      khata_number: '14/89',
      village_name: 'Ranpur (03807600)',
      tehsil: 'Ladpura',
      district: 'Kota',
      owner_name: 'Ramprasad Meena',
      father_name: 'Late Shri Mangilal Meena',
      ownership_type: 'KHATEDARI',
      area_bigha: 3.95,
      area_hectares: 1.0000,
      land_classification: 'AGRICULTURAL_IRRIGATED',
      annual_revenue_lagaan_inr: 45.50,
      encumbrance_note: 'Nil / Clear of recorded charges in Column 8',
      confidence_score: 0.98,
      discrepancies: []
    },
    human_verified_by: 'Pooja Verma (Verification Officer)',
    human_verified_at: new Date(Date.now() - 3600000 * 36).toISOString(),
    super_admin_committed: true
  },
  {
    id: 'doc-002',
    property_id: 'c0000000-0000-0000-0000-000000000102',
    property_id_code: 'LG-RJ-KOT-RAN-00102-1',
    khasra_number: '102/1',
    document_type: 'COURT_ORDER',
    title: 'Interim Injunction Order - ADJ-2 Court Kota (Civil Suit 182/2023)',
    file_name: 'injunction_order_khasra_102_1.pdf',
    file_path: '/uploads/documents/injunction_order_khasra_102_1.pdf',
    file_size: 412000,
    mime_type: 'application/pdf',
    uploaded_by: 'Pooja Verma (Verification Officer)',
    uploaded_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    ocr_status: 'VERIFIED',
    extracted_fields: {
      khasra_number: '102/1',
      village_name: 'Ranpur',
      tehsil: 'Ladpura',
      district: 'Kota',
      cnr_number: 'RJKO010045212023',
      owner_name: 'Kailash Chand Sharma',
      encumbrance_note: 'Status quo order under Order 39 Rules 1 & 2 CPC restraining alienation',
      confidence_score: 0.96,
      discrepancies: []
    },
    human_verified_by: 'Pooja Verma (Verification Officer)',
    human_verified_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    super_admin_committed: true
  },
  {
    id: 'doc-003',
    property_id: 'c0000000-0000-0000-0000-000000000103',
    property_id_code: 'LG-RJ-KOT-RAN-00103',
    khasra_number: '103',
    document_type: 'REGISTRY_SALE_DEED',
    title: 'Registered Mortgage Deed SBI SME Ranpur (SRO Ladpura Reg 2021-998)',
    file_name: 'sbi_mortgage_khasra_103.pdf',
    file_path: '/uploads/documents/sbi_mortgage_khasra_103.pdf',
    file_size: 521000,
    mime_type: 'application/pdf',
    uploaded_by: 'Pooja Verma (Verification Officer)',
    uploaded_at: new Date(Date.now() - 3600000 * 10).toISOString(),
    ocr_status: 'COMPLETED',
    extracted_fields: {
      khasra_number: '103',
      village_name: 'Ranpur',
      tehsil: 'Ladpura',
      district: 'Kota',
      owner_name: 'Virendra Singh Hada',
      sro_registration_number: 'SRO-LADPURA-REG-2021-998',
      encumbrance_note: 'Simple registered mortgage in favor of State Bank of India for ₹35,00,000/-',
      confidence_score: 0.94,
      discrepancies: ['Pending human officer review of satisfaction column']
    },
    super_admin_committed: false
  }
];

export class DocumentService {
  /**
   * Process simulated and regex OCR extraction from uploaded revenue document.
   */
  public static extractOcrFields(
    fileName: string,
    docType: string,
    targetKhasra: string,
    rawTextHint?: string
  ): ExtractedDocumentFields {
    // Specialized Rajasthan Revenue Document Parsing Rules
    let extracted: ExtractedDocumentFields = {
      khasra_number: targetKhasra,
      khata_number: '14/89',
      village_name: 'Ranpur (LGD: 100452)',
      tehsil: 'Ladpura',
      district: 'Kota',
      owner_name: 'Ramprasad Meena',
      father_name: 'Late Shri Mangilal Meena',
      ownership_type: 'KHATEDARI',
      area_bigha: 3.95,
      area_hectares: 1.00,
      land_classification: 'AGRICULTURAL_IRRIGATED',
      annual_revenue_lagaan_inr: 45.50,
      encumbrance_note: 'Clear title, nil encumbrance recorded in Column 8.',
      confidence_score: 0.95,
      discrepancies: []
    };

    if (rawTextHint) {
      // Regex extraction from text
      const khasraMatch = rawTextHint.match(/खसरा\s*(?:नंबर|नं\.?|संख्या|सं\.?)?\s*[:\-]?\s*([0-9]+(?:\/[0-9]+)?)/i) ||
                          rawTextHint.match(/khasra\s*(?:no\.?|number)?\s*[:\-]?\s*([0-9]+(?:\/[0-9]+)?)/i);
      if (khasraMatch) extracted.khasra_number = khasraMatch[1];

      const khataMatch = rawTextHint.match(/खाता\s*(?:नंबर|नं\.?|संख्या|सं\.?)?\s*[:\-]?\s*([0-9]+(?:\/[0-9]+)?)/i) ||
                         rawTextHint.match(/khata\s*(?:no\.?|number)?\s*[:\-]?\s*([0-9]+(?:\/[0-9]+)?)/i);
      if (khataMatch) extracted.khata_number = khataMatch[1];

      const ownerMatch = rawTextHint.match(/खातेदार\s*(?:का\s*नाम)?\s*[:\-]?\s*([A-Za-z\s\u0900-\u097F]+?)(?:पुत्र|पिता|s\/o|w\/o|$)/i);
      if (ownerMatch) extracted.owner_name = ownerMatch[1].trim();

      const cnrMatch = rawTextHint.match(/[A-Z]{4}[0-9]{12}/);
      if (cnrMatch) extracted.cnr_number = cnrMatch[0];

      const sroMatch = rawTextHint.match(/SRO-[A-Za-z0-9\-]+/i);
      if (sroMatch) extracted.sro_registration_number = sroMatch[0];
    } else {
      // Custom defaults per document type
      if (docType === 'REGISTRY_SALE_DEED') {
        extracted.owner_name = 'Virendra Singh Hada';
        extracted.father_name = 'Bhawani Singh Hada';
        extracted.sro_registration_number = `SRO-LADPURA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        extracted.confidence_score = 0.92;
      } else if (docType === 'COURT_ORDER') {
        extracted.cnr_number = `RJKO0100${Math.floor(10000000 + Math.random() * 90000000)}`;
        extracted.encumbrance_note = 'Interim status quo order restraining registration / possession.';
        extracted.confidence_score = 0.94;
      }
    }

    // Cross-validation Discrepancy Check
    if (extracted.khasra_number && targetKhasra && extracted.khasra_number !== targetKhasra) {
      extracted.discrepancies.push(
        `DISCREPANCY ALERT: Extracted Khasra (${extracted.khasra_number}) does not match property record Khasra (${targetKhasra})!`
      );
      extracted.confidence_score = Math.min(extracted.confidence_score, 0.70);
    }

    return extracted;
  }

  /**
   * Upload and register a new property document.
   */
  public static async addDocument(params: {
    propertyId: string;
    docType: 'JAMABANDI_NAKAL' | 'REGISTRY_SALE_DEED' | 'MUTATION_INTKAL' | 'COURT_ORDER' | 'REVENUE_MAP';
    title: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    user: any;
    rawTextHint?: string;
  }): Promise<PropertyDocument> {
    const { propertyId, docType, title, fileName, fileSize, mimeType, user, rawTextHint } = params;

    const parcel = RANPUR_PARCELS.find(p => p.id === propertyId || p.properties.property_id_code === propertyId);
    if (!parcel) {
      throw new Error('PROPERTY_NOT_FOUND');
    }

    const docId = `doc-${Date.now().toString().slice(-4)}`;
    const extractedFields = this.extractOcrFields(fileName, docType, parcel.properties.khasra_number, rawTextHint);

    const newDoc: PropertyDocument = {
      id: docId,
      property_id: parcel.id,
      property_id_code: parcel.properties.property_id_code,
      khasra_number: parcel.properties.khasra_number,
      document_type: docType,
      title: title || `${docType.replace('_', ' ')} - Khasra ${parcel.properties.khasra_number}`,
      file_name: fileName,
      file_path: `/uploads/documents/${fileName}`,
      file_size: fileSize || 320000,
      mime_type: mimeType || 'application/pdf',
      uploaded_by: user?.full_name || 'Verification Officer',
      uploaded_at: new Date().toISOString(),
      ocr_status: 'COMPLETED',
      extracted_fields: extractedFields,
      super_admin_committed: false
    };

    PROPERTY_DOCUMENTS.unshift(newDoc);

    // Persist to PostgreSQL property_documents
    try {
      await query(`
        INSERT INTO property_documents (
          id, property_id, property_id_code, khasra_number,
          document_type, title, file_name, file_path, file_size, mime_type,
          uploaded_by, uploaded_at, ocr_status, extracted_fields, super_admin_committed
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (id) DO NOTHING;
      `, [
        newDoc.id,
        newDoc.property_id,
        newDoc.property_id_code,
        newDoc.khasra_number,
        newDoc.document_type,
        newDoc.title,
        newDoc.file_name,
        newDoc.file_path,
        newDoc.file_size,
        newDoc.mime_type,
        newDoc.uploaded_by,
        newDoc.uploaded_at,
        newDoc.ocr_status,
        JSON.stringify(newDoc.extracted_fields),
        newDoc.super_admin_committed
      ]);
    } catch (dbErr: any) {
      console.warn('⚠️ Warning saving document to PostgreSQL:', dbErr.message);
    }

    // Audit log
    RecordService.logAudit({
      admin_id: user?.id || 'demo-admin-id',
      admin_name: user?.full_name || 'Verification Officer',
      admin_role: user?.role || 'ADMIN',
      action: 'UPLOAD_PROPERTY_DOCUMENT',
      target_entity: 'PROPERTY_DOCUMENT',
      target_id: newDoc.id,
      details: {
        document_title: newDoc.title,
        khasra_number: parcel.properties.khasra_number,
        ocr_confidence: extractedFields.confidence_score
      }
    });

    return newDoc;
  }

  /**
   * Human Verification of OCR Fields by Verification Officer.
   */
  public static async verifyOcrFields(params: {
    documentId: string;
    verifiedFields: Partial<ExtractedDocumentFields>;
    user: any;
    submitForCommit?: boolean;
  }) {
    const { documentId, verifiedFields, user, submitForCommit } = params;

    let doc = PROPERTY_DOCUMENTS.find(d => d.id === documentId);
    if (!doc) {
      try {
        const res = await query(`SELECT * FROM property_documents WHERE id = $1;`, [documentId]);
        if (res.rows && res.rows.length > 0) {
          const row = res.rows[0];
          doc = {
            id: row.id,
            property_id: row.property_id,
            property_id_code: row.property_id_code,
            khasra_number: row.khasra_number,
            document_type: row.document_type,
            title: row.title,
            file_name: row.file_name,
            file_path: row.file_path,
            file_size: parseInt(row.file_size) || 0,
            mime_type: row.mime_type,
            uploaded_by: row.uploaded_by,
            uploaded_at: row.uploaded_at,
            ocr_status: row.ocr_status,
            extracted_fields: typeof row.extracted_fields === 'string' ? JSON.parse(row.extracted_fields) : row.extracted_fields,
            human_verified_by: row.human_verified_by,
            human_verified_at: row.human_verified_at,
            super_admin_committed: row.super_admin_committed
          };
          PROPERTY_DOCUMENTS.push(doc);
        }
      } catch (e) {}
    }

    if (!doc) {
      throw new Error('DOCUMENT_NOT_FOUND');
    }

    // Merge human verified corrections
    doc.extracted_fields = {
      ...(doc.extracted_fields || { confidence_score: 1.0, discrepancies: [] }),
      ...verifiedFields,
      confidence_score: 1.0, // Human verified
      discrepancies: [] // Cleared upon human sign-off
    };

    doc.ocr_status = 'VERIFIED';
    doc.human_verified_by = user?.full_name || 'Verification Officer';
    doc.human_verified_at = new Date().toISOString();

    // Persist verification to PostgreSQL
    try {
      await query(`
        UPDATE property_documents SET
          ocr_status = 'VERIFIED',
          extracted_fields = $1,
          human_verified_by = $2,
          human_verified_at = $3
        WHERE id = $4;
      `, [
        JSON.stringify(doc.extracted_fields),
        doc.human_verified_by,
        doc.human_verified_at,
        doc.id
      ]);
    } catch (dbErr: any) {
      console.warn('⚠️ Warning updating document verification in PostgreSQL:', dbErr.message);
    }

    RecordService.logAudit({
      admin_id: user?.id || 'demo-admin-id',
      admin_name: user?.full_name || 'Verification Officer',
      admin_role: user?.role || 'ADMIN',
      action: 'HUMAN_VERIFY_DOCUMENT_OCR',
      target_entity: 'PROPERTY_DOCUMENT',
      target_id: doc.id,
      details: {
        khasra_number: doc.khasra_number,
        verified_fields: verifiedFields
      }
    });

    // If requested to submit for live commit under Two-Man Rule
    if (submitForCommit) {
      const cr = RecordService.proposeRecordChange({
        propertyId: doc.property_id,
        category: doc.document_type === 'COURT_ORDER' ? 'LEGAL_DISPUTES' :
                  doc.document_type === 'REGISTRY_SALE_DEED' ? 'ENCUMBRANCE' : 'OWNERSHIP',
        changeType: 'UPDATE',
        proposedData: {
          ...doc.extracted_fields,
          source_document_id: doc.id,
          source_document_title: doc.title,
          verified_by: doc.human_verified_by
        },
        user
      });

      return { document: doc, change_request: cr };
    }

    return { document: doc };
  }

  /**
   * Super Admin commits document intelligence to live cadastre records.
   */
  public static async commitDocumentToRecords(documentId: string, superAdminUser: any) {
    let doc = PROPERTY_DOCUMENTS.find(d => d.id === documentId);
    if (!doc) {
      try {
        const res = await query(`SELECT * FROM property_documents WHERE id = $1;`, [documentId]);
        if (res.rows && res.rows.length > 0) {
          const row = res.rows[0];
          doc = {
            id: row.id,
            property_id: row.property_id,
            property_id_code: row.property_id_code,
            khasra_number: row.khasra_number,
            document_type: row.document_type,
            title: row.title,
            file_name: row.file_name,
            file_path: row.file_path,
            file_size: parseInt(row.file_size) || 0,
            mime_type: row.mime_type,
            uploaded_by: row.uploaded_by,
            uploaded_at: row.uploaded_at,
            ocr_status: row.ocr_status,
            extracted_fields: typeof row.extracted_fields === 'string' ? JSON.parse(row.extracted_fields) : row.extracted_fields,
            human_verified_by: row.human_verified_by,
            human_verified_at: row.human_verified_at,
            super_admin_committed: row.super_admin_committed
          };
          PROPERTY_DOCUMENTS.push(doc);
        }
      } catch (e) {}
    }

    if (!doc) {
      throw new Error('DOCUMENT_NOT_FOUND');
    }

    doc.super_admin_committed = true;

    // Apply to property intelligence
    const pId = doc.property_id;
    if (PROPERTY_INTELLIGENCE[pId] && doc.extracted_fields) {
      if (doc.document_type === 'JAMABANDI_NAKAL') {
        PROPERTY_INTELLIGENCE[pId].ownership = {
          owner_name: doc.extracted_fields.owner_name || 'Verified Khatedar',
          relation_name: doc.extracted_fields.father_name || '',
          relation_type: 'SON_OF',
          ownership_type: doc.extracted_fields.ownership_type || 'KHATEDARI',
          share_fraction: '1/1',
          record_date: new Date().toISOString().split('T')[0],
          source: `Verified ${doc.title}`,
          source_grade: 'OFFICIAL_PUBLIC_RECORD',
          last_verified: new Date().toISOString().split('T')[0]
        };

        // Persist to PostgreSQL property_records table
        try {
          await query(`
            INSERT INTO property_records (id, property_id, owner_name, share_fraction, encumbrance_status, encumbrance_amount, dispute_status, dispute_case_number)
            VALUES ($1, $2, $3, '1/1', 'NONE', 0, 'CLEAR', NULL)
            ON CONFLICT (id) DO UPDATE SET
              owner_name = EXCLUDED.owner_name,
              updated_at = NOW();
          `, [`rec-${pId}`, pId, doc.extracted_fields.owner_name || 'Verified Khatedar']);
        } catch (dbErr: any) {
          console.warn('⚠️ Warning updating property record in PostgreSQL:', dbErr.message);
        }
      }
    }

    // Persist document commit state to PostgreSQL
    try {
      await query(`UPDATE property_documents SET super_admin_committed = true WHERE id = $1;`, [documentId]);
    } catch (dbErr: any) {
      console.warn('⚠️ Warning committing document in PostgreSQL:', dbErr.message);
    }

    RecordService.logAudit({
      admin_id: superAdminUser?.id || 'demo-superadmin-id',
      admin_name: superAdminUser?.full_name || 'Super Admin',
      admin_role: superAdminUser?.role || 'SUPER_ADMIN',
      action: 'COMMIT_DOCUMENT_TO_LIVE_CADASTRE',
      target_entity: 'PROPERTY_DOCUMENT',
      target_id: doc.id,
      details: {
        khasra_number: doc.khasra_number,
        document_title: doc.title
      }
    });

    return doc;
  }

  public static async getDocumentsForProperty(propertyId: string) {
    try {
      const res = await query(`
        SELECT * FROM property_documents 
        WHERE property_id = $1 OR property_id_code = $1 OR khasra_number = $1
        ORDER BY uploaded_at DESC;
      `, [propertyId]);
      if (res.rows && res.rows.length > 0) {
        return res.rows.map(r => ({
          id: r.id,
          property_id: r.property_id,
          property_id_code: r.property_id_code,
          khasra_number: r.khasra_number,
          document_type: r.document_type,
          title: r.title,
          file_name: r.file_name,
          file_path: r.file_path,
          file_size: parseInt(r.file_size) || 0,
          mime_type: r.mime_type,
          uploaded_by: r.uploaded_by,
          uploaded_at: r.uploaded_at,
          ocr_status: r.ocr_status,
          extracted_fields: typeof r.extracted_fields === 'string' ? JSON.parse(r.extracted_fields) : r.extracted_fields,
          human_verified_by: r.human_verified_by,
          human_verified_at: r.human_verified_at,
          super_admin_committed: r.super_admin_committed
        }));
      }
    } catch (err: any) {
      console.warn('⚠️ Warning fetching property documents from PostgreSQL:', err.message);
    }
    return PROPERTY_DOCUMENTS.filter(
      d => d.property_id === propertyId || d.property_id_code === propertyId || d.khasra_number === propertyId
    );
  }

  public static async getAllDocuments() {
    try {
      const res = await query(`SELECT * FROM property_documents ORDER BY uploaded_at DESC;`);
      if (res.rows && res.rows.length > 0) {
        return res.rows.map(r => ({
          id: r.id,
          property_id: r.property_id,
          property_id_code: r.property_id_code,
          khasra_number: r.khasra_number,
          document_type: r.document_type,
          title: r.title,
          file_name: r.file_name,
          file_path: r.file_path,
          file_size: parseInt(r.file_size) || 0,
          mime_type: r.mime_type,
          uploaded_by: r.uploaded_by,
          uploaded_at: r.uploaded_at,
          ocr_status: r.ocr_status,
          extracted_fields: typeof r.extracted_fields === 'string' ? JSON.parse(r.extracted_fields) : r.extracted_fields,
          human_verified_by: r.human_verified_by,
          human_verified_at: r.human_verified_at,
          super_admin_committed: r.super_admin_committed
        }));
      }
    } catch (err: any) {
      console.warn('⚠️ Warning fetching property documents from PostgreSQL:', err.message);
    }
    return PROPERTY_DOCUMENTS;
  }
}
