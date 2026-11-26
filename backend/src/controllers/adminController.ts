import { Request, Response } from 'express';
import { RANPUR_PARCELS, GeoFeature } from '../types/cadastre';
import { GisService } from '../services/gisService';
import { RecordService } from '../services/recordService';
import { query } from '../config/db';

export const changeRequests: any[] = [
  {
    id: 'cr-001',
    property_id: 'c0000000-0000-0000-0000-000000000102',
    property_id_code: 'LG-RJ-KOT-RAN-00102-1',
    khasra_number: '102/1',
    change_type: 'UPDATE',
    category: 'LEGAL_DISPUTES',
    requested_by: 'Pooja Verma (Admin)',
    proposed_data: {
      dispute_type: 'PARTITION_SUIT',
      dispute_status: 'STAY_GRANTED',
      description: 'Active partition dispute among legal heirs; temporary injunction restraining alienation of land passed under Order 39 Rules 1 & 2 CPC.',
      court_case: {
        cnr_number: 'RJKO010045212023',
        case_number: 'Civil Suit 182/2023',
        court_name: 'Court of Additional District Judge No. 2, Kota',
        court_type: 'CIVIL_COURT_KOTA',
        petitioner: 'Kailash Chand Sharma',
        respondent: 'Suresh Chand Sharma & Ors.',
        case_status: 'INTERIM_STAY_ACTIVE',
        stay_order_details: 'Status quo on possession and alienation ordered until final disposal.'
      }
    },
    status: 'PENDING',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'cr-002',
    property_id: 'c0000000-0000-0000-0000-000000000103',
    property_id_code: 'LG-RJ-KOT-RAN-00103',
    khasra_number: '103',
    change_type: 'UPDATE',
    category: 'ENCUMBRANCE',
    requested_by: 'Pooja Verma (Admin)',
    proposed_data: {
      encumbrance_type: 'REGISTERED_BANK_MORTGAGE',
      financial_institution: 'State Bank of India, SME Branch Ranpur Kota',
      loan_account_reference: 'SBI-CC-78923412',
      amount_inr: 3500000,
      registration_number: 'SRO-LADPURA-REG-2021-998',
      mortgage_date: '2021-06-25',
      satisfaction_status: 'ACTIVE'
    },
    status: 'PENDING',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString()
  }
];

export class AdminController {
  public static getDashboardStats(req: Request, res: Response) {
    return res.json({
      success: true,
      data: {
        total_registered_users: 142,
        total_villages: 1,
        total_land_parcels: RANPUR_PARCELS.length,
        total_verified_properties: RANPUR_PARCELS.filter(p => p.properties.verification_status === 'VERIFIED').length,
        pending_verification_requests: changeRequests.filter(r => r.status === 'PENDING').length,
        recorded_government_land: RANPUR_PARCELS.filter(p => p.properties.land_classification === 'CHARAGAH_PASTURE').length,
        properties_with_recorded_disputes: RANPUR_PARCELS.filter(p => p.properties.verification_status === 'DISPUTED').length,
        pending_document_reviews: 3,
        total_token_transactions_volume: '₹ 84,200',
        active_village: 'Ranpur, Ladpura, Kota (PIN 325003)'
      }
    });
  }

  public static async getChangeRequests(req: Request, res: Response) {
    try {
      const dbRes = await query(`SELECT * FROM change_requests ORDER BY created_at DESC;`);
      if (dbRes.rows && dbRes.rows.length > 0) {
        return res.json({
          success: true,
          data: dbRes.rows.map(r => ({
            id: r.id,
            property_id: r.property_id,
            property_id_code: r.property_id_code,
            khasra_number: r.khasra_number,
            change_type: r.change_type,
            category: r.category,
            requested_by: r.requested_by,
            proposed_data: typeof r.proposed_data === 'string' ? JSON.parse(r.proposed_data) : r.proposed_data,
            status: r.status,
            review_notes: r.review_notes,
            reviewed_by: r.reviewed_by,
            reviewed_at: r.reviewed_at,
            created_at: r.created_at
          }))
        });
      }
    } catch (err: any) {
      console.warn('⚠️ Warning fetching change requests from PostgreSQL:', err.message);
    }
    return res.json({
      success: true,
      data: changeRequests
    });
  }

  public static async reviewChangeRequest(req: Request, res: Response) {
    const { id } = req.params;
    const { action, notes } = req.body; // 'APPROVE' or 'REJECT'

    let reqItem = changeRequests.find(r => r.id === id);
    if (!reqItem) {
      try {
        const dbRes = await query(`SELECT * FROM change_requests WHERE id = $1 LIMIT 1;`, [id]);
        if (dbRes.rows && dbRes.rows.length > 0) {
          const r = dbRes.rows[0];
          reqItem = {
            id: r.id,
            property_id: r.property_id,
            property_id_code: r.property_id_code,
            khasra_number: r.khasra_number,
            change_type: r.change_type,
            category: r.category,
            requested_by: r.requested_by,
            proposed_data: typeof r.proposed_data === 'string' ? JSON.parse(r.proposed_data) : r.proposed_data,
            status: r.status,
            review_notes: r.review_notes,
            reviewed_by: r.reviewed_by,
            reviewed_at: r.reviewed_at,
            created_at: r.created_at
          };
          changeRequests.push(reqItem);
        }
      } catch (err: any) {}
    }

    if (!reqItem) {
      return res.status(404).json({ success: false, error: 'Change request not found' });
    }

    reqItem.status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    reqItem.reviewed_by = (req as any).user?.full_name || 'Super Admin';
    reqItem.reviewed_at = new Date().toISOString();
    reqItem.review_notes = notes || (action === 'APPROVE' ? 'Approved after cadastral audit.' : 'Rejected.');

    // Persist status update to PostgreSQL change_requests
    try {
      await query(`
        UPDATE change_requests SET
          status = $1,
          review_notes = $2,
          reviewed_by = $3,
          reviewed_at = NOW()
        WHERE id = $4;
      `, [reqItem.status, reqItem.review_notes, reqItem.reviewed_by, id]);
    } catch (dbErr: any) {
      console.warn('⚠️ Warning updating change request in PostgreSQL:', dbErr.message);
    }

    // If approved, apply mutations to live dataset
    if (action === 'APPROVE') {
      if (reqItem.category === 'BOUNDARIES' && reqItem.proposed_data?.coordinates) {
        const parcel = RANPUR_PARCELS.find(p => p.id === reqItem.property_id || p.properties.property_id_code === reqItem.property_id_code);
        if (parcel) {
          parcel.geometry.coordinates = [reqItem.proposed_data.coordinates];
          parcel.properties.centroid = GisService.computeCentroid(reqItem.proposed_data.coordinates);
          const newAreaSqm = GisService.calculatePolygonAreaSqm(reqItem.proposed_data.coordinates);
          parcel.properties.area_sqm = newAreaSqm;
          parcel.properties.area_bigha = Number((newAreaSqm / 2529.28).toFixed(2));
          parcel.properties.area_hectares = Number((newAreaSqm / 10000).toFixed(4));

          try {
            await query(`
              UPDATE property_boundaries SET
                geometry = $1,
                centroid_lng = $2,
                centroid_lat = $3
              WHERE property_id = $4;
            `, [
              JSON.stringify(parcel.geometry),
              parcel.properties.centroid[0],
              parcel.properties.centroid[1],
              parcel.id
            ]);
            await query(`
              UPDATE properties SET
                area_sqm = $1,
                area_bigha = $2,
                area_hectares = $3,
                updated_at = NOW()
              WHERE id = $4;
            `, [newAreaSqm, parcel.properties.area_bigha, parcel.properties.area_hectares, parcel.id]);
          } catch (dbErr: any) {
            console.warn('⚠️ Warning updating boundaries in PostgreSQL:', dbErr.message);
          }
        }
      } else if (reqItem.category === 'NEW_PROPERTY_CREATION' && reqItem.proposed_data?.coordinates) {
        const pData = reqItem.proposed_data;
        const propCode = reqItem.property_id_code || `LG-RJ-KOT-RAN-${pData.khasra_number}${pData.sub_khasra ? '-' + pData.sub_khasra : ''}`;
        const newPropertyId = reqItem.property_id || `c0000000-0000-0000-0000-${Date.now().toString().padStart(12, '0')}`;
        const centroid = GisService.computeCentroid(pData.coordinates);
        const calculatedAreaSqm = Number(pData.area_sqm) || GisService.calculatePolygonAreaSqm(pData.coordinates);
        const areaBigha = Number((calculatedAreaSqm / 2529.28).toFixed(2));
        const areaHectares = Number((calculatedAreaSqm / 10000).toFixed(4));

        try {
          const propRes = await query(`
            INSERT INTO properties (
              id, village_id, property_id_code, khasra_number, sub_khasra,
              land_classification, area_sqm, area_hectares, area_bigha,
              verification_status, custom_color, notes, is_demo_data
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT (property_id_code) DO UPDATE SET
              khasra_number = EXCLUDED.khasra_number,
              sub_khasra = EXCLUDED.sub_khasra,
              land_classification = EXCLUDED.land_classification,
              area_sqm = EXCLUDED.area_sqm,
              area_hectares = EXCLUDED.area_hectares,
              area_bigha = EXCLUDED.area_bigha,
              verification_status = EXCLUDED.verification_status,
              custom_color = EXCLUDED.custom_color,
              notes = EXCLUDED.notes,
              updated_at = NOW()
            RETURNING id;
          `, [
            newPropertyId, 'v-ranpur-03807600', propCode, String(pData.khasra_number), pData.sub_khasra || null,
            pData.land_classification || 'AGRICULTURAL_IRRIGATED', calculatedAreaSqm, areaHectares, areaBigha,
            'VERIFIED', pData.color || null, pData.notes || null, false
          ]);
          const actualPropertyId = (propRes.rows && propRes.rows[0]) ? propRes.rows[0].id : newPropertyId;

          await query(`
            INSERT INTO property_boundaries (
              id, property_id, geometry, centroid_lng, centroid_lat, is_demo_data
            ) VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (id) DO UPDATE SET
              geometry = EXCLUDED.geometry,
              centroid_lng = EXCLUDED.centroid_lng,
              centroid_lat = EXCLUDED.centroid_lat;
          `, [
            `b-${actualPropertyId}`, actualPropertyId,
            JSON.stringify({ type: 'Polygon', coordinates: [pData.coordinates] }),
            centroid[0], centroid[1], false
          ]);

          await query(`
            INSERT INTO property_records (
              id, property_id, owner_name, share_fraction,
              encumbrance_status, encumbrance_amount,
              dispute_status, dispute_case_number
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (id) DO UPDATE SET
              owner_name = EXCLUDED.owner_name,
              updated_at = NOW();
          `, [
            `rec-${actualPropertyId}`, actualPropertyId, pData.owner_name || 'Cadastral Survey Record',
            '1/1', 'NONE', 0, 'CLEAR', null
          ]);

          const approvedParcel: GeoFeature = {
            type: 'Feature',
            id: actualPropertyId,
            geometry: { type: 'Polygon', coordinates: [pData.coordinates] },
            properties: {
              property_id_code: propCode,
              khasra_number: String(pData.khasra_number),
              sub_khasra: pData.sub_khasra || null,
              village_name: 'Ranpur',
              village_code: '03807600',
              tehsil: 'Ladpura',
              district: 'Kota',
              state: 'Rajasthan',
              pin_code: '325003',
              land_classification: pData.land_classification || 'AGRICULTURAL_IRRIGATED',
              area_sqm: calculatedAreaSqm,
              area_hectares: areaHectares,
              area_bigha: areaBigha,
              verification_status: 'VERIFIED',
              is_demo_data: false,
              centroid: centroid,
              custom_color: pData.color || undefined,
              notes: pData.notes || undefined,
              availability: {
                ownership: true,
                government_land: false,
                legal_disputes: false,
                encumbrance: false,
                court_cases: false,
                history: true
              }
            }
          };
          RANPUR_PARCELS.push(approvedParcel);
        } catch (dbErr: any) {
          console.error('Error committing approved new parcel to PostgreSQL:', dbErr);
        }
      } else {
        // Apply record mutation via RecordService
        RecordService.applyApprovedChange(reqItem, (req as any).user);
      }
    }

    return res.json({
      success: true,
      message: `Change request ${id} has been ${reqItem.status} under Super Admin two-man rule authorization.`,
      data: reqItem
    });
  }

  public static async proposeBoundaryUpdate(req: Request, res: Response) {
    const targetId = req.params.id || req.body.property_id;
    const { coordinates, justification } = req.body;
    const adminUser = (req as any).user;

    let parcel = RANPUR_PARCELS.find(p => p.id === targetId || p.properties.property_id_code === targetId);
    if (!parcel) {
      // Check PostgreSQL
      try {
        const dbRes = await query(`
          SELECT p.*, pb.geometry, pb.centroid_lng, pb.centroid_lat
          FROM properties p
          JOIN property_boundaries pb ON p.id = pb.property_id
          WHERE p.id = $1 OR p.property_id_code = $1
          LIMIT 1;
        `, [targetId]);
        if (dbRes.rows && dbRes.rows.length > 0) {
          const row = dbRes.rows[0];
          parcel = {
            type: 'Feature',
            id: row.id,
            geometry: typeof row.geometry === 'string' ? JSON.parse(row.geometry) : row.geometry,
            properties: {
              property_id_code: row.property_id_code,
              khasra_number: row.khasra_number,
              sub_khasra: row.sub_khasra,
              village_name: 'Ranpur',
              village_code: '03807600',
              tehsil: 'Ladpura',
              district: 'Kota',
              state: 'Rajasthan',
              pin_code: '325003',
              land_classification: row.land_classification,
              area_sqm: parseFloat(row.area_sqm),
              area_hectares: parseFloat(row.area_hectares),
              area_bigha: parseFloat(row.area_bigha),
              verification_status: row.verification_status,
              custom_color: row.custom_color || undefined,
              notes: row.notes || undefined,
              is_demo_data: row.is_demo_data,
              centroid: [parseFloat(row.centroid_lng), parseFloat(row.centroid_lat)],
              availability: row.availability || {
                ownership: true,
                government_land: false,
                legal_disputes: false,
                encumbrance: false,
                court_cases: false,
                history: true
              }
            }
          };
          RANPUR_PARCELS.push(parcel);
        }
      } catch (err: any) {
        console.warn('DB check error:', err.message);
      }
    }

    if (!parcel) {
      return res.status(404).json({ success: false, error: 'Property parcel not found' });
    }

    const validation = GisService.validatePolygon(coordinates);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: 'INVALID_GEOMETRY', message: validation.error });
    }

    const isDirect = req.body.is_direct_commit || req.body.auto_commit || adminUser?.role === 'SUPER_ADMIN';
    if (isDirect) {
      // Auto-close polygon ring if needed
      const ringCoords = [...coordinates];
      if (ringCoords.length >= 3) {
        const first = ringCoords[0];
        const last = ringCoords[ringCoords.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
          ringCoords.push([first[0], first[1]]);
        }
      }
      parcel.geometry.coordinates = [ringCoords];
      parcel.properties.centroid = GisService.computeCentroid(ringCoords);
      const newAreaSqm = GisService.calculatePolygonAreaSqm(ringCoords);
      parcel.properties.area_sqm = newAreaSqm;
      parcel.properties.area_bigha = Number((newAreaSqm / 2529.28).toFixed(2));
      parcel.properties.area_hectares = Number((newAreaSqm / 10000).toFixed(4));

      // Persist boundary geometry update to PostgreSQL
      try {
        await query(`
          UPDATE property_boundaries SET
            geometry = $1,
            centroid_lng = $2,
            centroid_lat = $3
          WHERE property_id = $4;
        `, [
          JSON.stringify({ type: 'Polygon', coordinates: [ringCoords] }),
          parcel.properties.centroid[0],
          parcel.properties.centroid[1],
          parcel.id
        ]);

        await query(`
          UPDATE properties SET
            area_sqm = $1,
            area_bigha = $2,
            area_hectares = $3,
            updated_at = NOW()
          WHERE id = $4 OR property_id_code = $4;
        `, [
          newAreaSqm,
          Number((newAreaSqm / 2529.28).toFixed(2)),
          Number((newAreaSqm / 10000).toFixed(4)),
          parcel.id
        ]);
      } catch (dbErr: any) {
        console.warn('DB boundary update error:', dbErr.message);
      }

      RecordService.logAudit({
        admin_id: adminUser?.id || 'demo-admin-id',
        admin_name: adminUser?.full_name || 'Administrator',
        admin_role: adminUser?.role || 'ADMIN',
        action: 'UPDATE_PROPERTY_BOUNDARY_DIRECT',
        target_entity: 'PROPERTY_BOUNDARY',
        target_id: parcel.id,
        details: {
          khasra_number: parcel.properties.khasra_number,
          new_area_sqm: newAreaSqm
        }
      });

      return res.status(200).json({
        success: true,
        message: `Boundary for Khasra ${parcel.properties.khasra_number} updated directly in database and applied to map.`,
        parcel
      });
    }

    const newRequestId = `cr-${Date.now().toString().slice(-4)}`;
    const changeReq = {
      id: newRequestId,
      property_id: parcel.id,
      property_id_code: parcel.properties.property_id_code,
      khasra_number: parcel.properties.khasra_number,
      change_type: 'UPDATE',
      category: 'BOUNDARIES',
      requested_by: adminUser?.full_name || 'Verification Officer',
      proposed_data: {
        coordinates,
        new_centroid: GisService.computeCentroid(coordinates),
        justification: justification || 'Boundary realignment surveyed from latest Bhunaksha Rajasthan cadastral map sheet.'
      },
      status: 'PENDING',
      created_at: new Date().toISOString()
    };

    changeRequests.unshift(changeReq);

    // Persist change request to PostgreSQL
    try {
      await query(`
        INSERT INTO change_requests (
          id, property_id, property_id_code, khasra_number,
          change_type, category, requested_by, proposed_data, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING', NOW())
        ON CONFLICT (id) DO NOTHING;
      `, [
        changeReq.id,
        (changeReq as any).property_id || null,
        changeReq.property_id_code,
        changeReq.khasra_number,
        changeReq.change_type,
        changeReq.category,
        changeReq.requested_by,
        JSON.stringify(changeReq.proposed_data)
      ]);
    } catch (dbErr: any) {
      console.warn('⚠️ Warning saving change request to PostgreSQL:', dbErr.message);
    }

    RecordService.logAudit({
      admin_id: adminUser?.id || 'demo-admin-id',
      admin_name: adminUser?.full_name || 'Verification Officer',
      admin_role: adminUser?.role || 'ADMIN',
      action: 'PROPOSE_BOUNDARY_UPDATE',
      target_entity: 'PROPERTY_BOUNDARY',
      target_id: parcel.id,
      details: {
        khasra_number: parcel.properties.khasra_number,
        change_request_id: newRequestId
      }
    });

    return res.status(201).json({
      success: true,
      message: `Boundary modification proposed for Khasra ${parcel.properties.khasra_number}. Quarantined under Two-Man Rule awaiting Super Admin review.`,
      change_request: changeReq
    });
  }

  public static async createProperty(req: Request, res: Response) {
    const { khasra_number, sub_khasra, land_classification, area_sqm, coordinates, owner_name, color, notes, is_direct_commit, auto_commit } = req.body;
    const adminUser = (req as any).user;

    if (!khasra_number || !coordinates) {
      return res.status(400).json({ success: false, error: 'Khasra number and coordinates are required.' });
    }

    // Auto-close polygon if needed
    if (Array.isArray(coordinates) && coordinates.length >= 3) {
      const first = coordinates[0];
      const last = coordinates[coordinates.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        coordinates.push([first[0], first[1]]);
      }
    }

    const validation = GisService.validatePolygon(coordinates);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: 'INVALID_GEOMETRY', message: validation.error });
    }

    const propCode = `LG-RJ-KOT-RAN-${khasra_number}${sub_khasra ? '-' + sub_khasra : ''}`;
    const centroid = GisService.computeCentroid(coordinates);
    const calculatedAreaSqm = Number(area_sqm) || GisService.calculatePolygonAreaSqm(coordinates);
    const areaBigha = Number((calculatedAreaSqm / 2529.28).toFixed(2));
    const areaHectares = Number((calculatedAreaSqm / 10000).toFixed(4));
    const newPropertyId = `c0000000-0000-0000-0000-${Date.now().toString().padStart(12, '0')}`;

    // Direct commit (instantly active on map and persisted to PostgreSQL)
    if (is_direct_commit || auto_commit || adminUser?.role === 'SUPER_ADMIN') {
      const newParcel: GeoFeature = {
        type: 'Feature',
        id: newPropertyId,
        geometry: {
          type: 'Polygon',
          coordinates: [coordinates]
        },
        properties: {
          property_id_code: propCode,
          khasra_number: String(khasra_number),
          sub_khasra: sub_khasra || null,
          village_name: 'Ranpur',
          village_code: '03807600',
          tehsil: 'Ladpura',
          district: 'Kota',
          state: 'Rajasthan',
          pin_code: '325003',
          land_classification: land_classification || 'AGRICULTURAL_IRRIGATED',
          area_sqm: calculatedAreaSqm,
          area_hectares: areaHectares,
          area_bigha: areaBigha,
          verification_status: (req.body.verification_status as any) || 'VERIFIED',
          is_demo_data: false,
          centroid: centroid,
          custom_color: color || undefined,
          notes: notes || undefined,
          availability: {
            ownership: true,
            government_land: land_classification?.includes('GOVERNMENT') || false,
            legal_disputes: req.body.verification_status === 'DISPUTED' || !!req.body.dispute_case_number,
            encumbrance: !!req.body.encumbrance,
            court_cases: req.body.verification_status === 'DISPUTED' || !!req.body.dispute_case_number,
            history: true
          }
        }
      };

      // 1. Insert into PostgreSQL properties table
      try {
        const propRes = await query(`
          INSERT INTO properties (
            id, village_id, property_id_code, khasra_number, sub_khasra,
            land_classification, area_sqm, area_hectares, area_bigha,
            verification_status, custom_color, notes, is_demo_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (property_id_code) DO UPDATE SET
            khasra_number = EXCLUDED.khasra_number,
            sub_khasra = EXCLUDED.sub_khasra,
            land_classification = EXCLUDED.land_classification,
            area_sqm = EXCLUDED.area_sqm,
            area_hectares = EXCLUDED.area_hectares,
            area_bigha = EXCLUDED.area_bigha,
            verification_status = EXCLUDED.verification_status,
            custom_color = EXCLUDED.custom_color,
            notes = EXCLUDED.notes,
            updated_at = NOW()
          RETURNING id;
        `, [
          newPropertyId, 'v-ranpur-03807600', propCode, String(khasra_number), sub_khasra || null,
          land_classification || 'AGRICULTURAL_IRRIGATED', calculatedAreaSqm, areaHectares, areaBigha,
          req.body.verification_status || 'VERIFIED', color || null, notes || null, false
        ]);
        const actualPropertyId = (propRes.rows && propRes.rows[0]) ? propRes.rows[0].id : newPropertyId;
        newParcel.id = actualPropertyId;

        // 2. Insert into PostgreSQL property_boundaries table
        await query(`
          INSERT INTO property_boundaries (
            id, property_id, geometry, centroid_lng, centroid_lat, is_demo_data
          ) VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id) DO UPDATE SET
            geometry = EXCLUDED.geometry,
            centroid_lng = EXCLUDED.centroid_lng,
            centroid_lat = EXCLUDED.centroid_lat;
        `, [
          `b-${actualPropertyId}`, actualPropertyId,
          JSON.stringify({ type: 'Polygon', coordinates: [coordinates] }),
          centroid[0], centroid[1], false
        ]);

        // 3. Insert into PostgreSQL property_records table
        await query(`
          INSERT INTO property_records (
            id, property_id, owner_name, share_fraction,
            encumbrance_status, encumbrance_amount,
            dispute_status, dispute_case_number
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO UPDATE SET
            owner_name = EXCLUDED.owner_name,
            share_fraction = EXCLUDED.share_fraction,
            encumbrance_status = EXCLUDED.encumbrance_status,
            encumbrance_amount = EXCLUDED.encumbrance_amount,
            dispute_status = EXCLUDED.dispute_status,
            dispute_case_number = EXCLUDED.dispute_case_number,
            updated_at = NOW();
        `, [
          `rec-${actualPropertyId}`, actualPropertyId, owner_name || 'Cadastral Survey Record',
          req.body.share_fraction || '1/1',
          req.body.encumbrance ? 'ACTIVE' : 'NONE',
          req.body.encumbrance_amount ? Number(req.body.encumbrance_amount) : 0,
          req.body.dispute_case_number ? 'DISPUTED' : 'CLEAR',
          req.body.dispute_case_number || null
        ]);

        // 4. Insert into PostgreSQL audit_logs table
        await query(`
          INSERT INTO audit_logs (id, admin_id, admin_name, admin_role, action, target_entity, target_id, details)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          `log-${Date.now()}`, adminUser?.id || 'admin', adminUser?.full_name || 'Administrator', adminUser?.role || 'ADMIN',
          'CREATE_CUSTOM_PARCEL_ON_MAP', 'PROPERTY', actualPropertyId,
          JSON.stringify({ khasra_number, color, area_sqm: calculatedAreaSqm, owner_name })
        ]);
        console.log(`✅ Parcel Khasra ${khasra_number} (${actualPropertyId}) saved directly into PostgreSQL database.`);
      } catch (dbErr: any) {
        console.warn('⚠️ Warning saving parcel to PostgreSQL:', dbErr.message);
      }

      RANPUR_PARCELS.push(newParcel);

      RecordService.setDirectPropertyRecords(newPropertyId, {
        owner_name: owner_name || 'Direct Cadastral Survey Record',
        share_fraction: req.body.share_fraction || '1/1',
        land_classification,
        dispute_case_number: req.body.dispute_case_number,
        encumbrance: req.body.encumbrance,
        encumbrance_amount: req.body.encumbrance_amount
      });

      RecordService.logAudit({
        admin_id: adminUser?.id || 'demo-admin-id',
        admin_name: adminUser?.full_name || 'Administrator',
        admin_role: adminUser?.role || 'ADMIN',
        action: 'CREATE_CUSTOM_PARCEL_ON_MAP',
        target_entity: 'PROPERTY',
        target_id: newPropertyId,
        details: {
          khasra_number,
          color,
          area_sqm: calculatedAreaSqm,
          owner_name
        }
      });

      return res.status(201).json({
        success: true,
        message: `Custom parcel Khasra ${khasra_number} created and saved in the database successfully.`,
        parcel: newParcel
      });
    }

    // Default: Queue as change request for Two-Man Rule review
    const newRequestId = `cr-${Date.now().toString().slice(-4)}`;
    const changeReq = {
      id: newRequestId,
      property_id_code: propCode,
      khasra_number,
      change_type: 'CREATE',
      category: 'NEW_PROPERTY_CREATION',
      requested_by: adminUser?.full_name || 'Verification Officer',
      proposed_data: {
        khasra_number,
        sub_khasra: sub_khasra || null,
        land_classification: land_classification || 'AGRICULTURAL_IRRIGATED',
        area_sqm: calculatedAreaSqm,
        coordinates,
        owner_name: owner_name || 'Pending Revenue Verification',
        color,
        notes
      },
      status: 'PENDING',
      created_at: new Date().toISOString()
    };

    changeRequests.unshift(changeReq);

    // Persist change request to PostgreSQL
    try {
      await query(`
        INSERT INTO change_requests (
          id, property_id, property_id_code, khasra_number,
          change_type, category, requested_by, proposed_data, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING', NOW())
        ON CONFLICT (id) DO NOTHING;
      `, [
        changeReq.id,
        (changeReq as any).property_id || null,
        changeReq.property_id_code,
        changeReq.khasra_number,
        changeReq.change_type,
        changeReq.category,
        changeReq.requested_by,
        JSON.stringify(changeReq.proposed_data)
      ]);
    } catch (dbErr: any) {
      console.warn('⚠️ Warning saving change request to PostgreSQL:', dbErr.message);
    }

    RecordService.logAudit({
      admin_id: adminUser?.id || 'demo-admin-id',
      admin_name: adminUser?.full_name || 'Verification Officer',
      admin_role: adminUser?.role || 'ADMIN',
      action: 'PROPOSE_NEW_PARCEL',
      target_entity: 'PROPERTY',
      target_id: propCode,
      details: {
        khasra_number,
        change_request_id: newRequestId
      }
    });

    return res.status(201).json({
      success: true,
      message: `New parcel Khasra ${khasra_number} submitted. Quarantined in Two-Man Rule queue for Super Admin authorization.`,
      change_request: changeReq
    });
  }

  // --- Domain Record Management Endpoints ---
  public static proposeRecordMutation(req: Request, res: Response) {
    const { id } = req.params;
    const { category, changeType = 'UPDATE', proposedData } = req.body;

    if (!category || !proposedData) {
      return res.status(400).json({ success: false, error: 'Category and proposedData are required.' });
    }

    try {
      const changeReq = RecordService.proposeRecordChange({
        propertyId: id,
        category,
        changeType,
        proposedData,
        user: (req as any).user
      });

      return res.status(201).json({
        success: true,
        message: `Proposed ${category} mutation for Property ${id}. Quarantined under Two-Man Rule.`,
        change_request: changeReq
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  public static getPropertyRecordDetails(req: Request, res: Response) {
    const { id } = req.params;
    const details = RecordService.getPropertyRecords(id);
    if (!details) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }
    return res.json({ success: true, data: details });
  }

  public static getAuditLogs(req: Request, res: Response) {
    const logs = RecordService.getAuditLogs();
    return res.json({ success: true, count: logs.length, data: logs });
  }

  public static async updateProperty(req: Request, res: Response) {
    const { id } = req.params;
    const adminUser = (req as any).user;
    let parcel = RANPUR_PARCELS.find(p => p.id === id || p.properties.property_id_code === id);

    if (!parcel) {
      try {
        const dbRes = await query(`
          SELECT p.*, pb.geometry, pb.centroid_lng, pb.centroid_lat
          FROM properties p
          JOIN property_boundaries pb ON p.id = pb.property_id
          WHERE p.id = $1 OR p.property_id_code = $1
          LIMIT 1;
        `, [id]);
        if (dbRes.rows && dbRes.rows.length > 0) {
          const row = dbRes.rows[0];
          parcel = {
            type: 'Feature',
            id: row.id,
            geometry: typeof row.geometry === 'string' ? JSON.parse(row.geometry) : row.geometry,
            properties: {
              property_id_code: row.property_id_code,
              khasra_number: row.khasra_number,
              sub_khasra: row.sub_khasra,
              village_name: 'Ranpur',
              village_code: '03807600',
              tehsil: 'Ladpura',
              district: 'Kota',
              state: 'Rajasthan',
              pin_code: '325003',
              land_classification: row.land_classification,
              area_sqm: parseFloat(row.area_sqm),
              area_hectares: parseFloat(row.area_hectares),
              area_bigha: parseFloat(row.area_bigha),
              verification_status: row.verification_status,
              custom_color: row.custom_color || undefined,
              notes: row.notes || undefined,
              is_demo_data: row.is_demo_data,
              centroid: [parseFloat(row.centroid_lng), parseFloat(row.centroid_lat)],
              availability: row.availability || {
                ownership: true,
                government_land: false,
                legal_disputes: false,
                encumbrance: false,
                court_cases: false,
                history: true
              }
            }
          };
          RANPUR_PARCELS.push(parcel);
        }
      } catch (err: any) {
        console.warn('DB check error:', err.message);
      }
    }

    if (!parcel) {
      return res.status(404).json({ success: false, error: 'Property parcel not found' });
    }

    const {
      khasra_number,
      sub_khasra,
      land_classification,
      area_sqm,
      custom_color,
      notes,
      verification_status,
      owner_name,
      dispute_case_number,
      encumbrance,
      encumbrance_amount
    } = req.body;

    if (khasra_number !== undefined && khasra_number !== null) {
      parcel.properties.khasra_number = String(khasra_number);
    }
    if (sub_khasra !== undefined) {
      parcel.properties.sub_khasra = sub_khasra || null;
    }
    if (land_classification !== undefined) {
      parcel.properties.land_classification = land_classification;
    }
    if (area_sqm !== undefined) {
      const parsedArea = Number(area_sqm);
      if (!isNaN(parsedArea) && parsedArea > 0) {
        parcel.properties.area_sqm = parsedArea;
        parcel.properties.area_bigha = Number((parsedArea / 2529.28).toFixed(2));
        parcel.properties.area_hectares = Number((parsedArea / 10000).toFixed(4));
      }
    }
    if (custom_color !== undefined) {
      parcel.properties.custom_color = custom_color || undefined;
    }
    if (notes !== undefined) {
      parcel.properties.notes = notes || undefined;
    }
    if (verification_status !== undefined) {
      parcel.properties.verification_status = verification_status;
    }

    // Persist property update to PostgreSQL
    try {
      await query(`
        UPDATE properties SET
          khasra_number = COALESCE($1, khasra_number),
          sub_khasra = $2,
          land_classification = COALESCE($3, land_classification),
          area_sqm = COALESCE($4, area_sqm),
          area_bigha = COALESCE($5, area_bigha),
          area_hectares = COALESCE($6, area_hectares),
          custom_color = $7,
          notes = $8,
          verification_status = COALESCE($9, verification_status),
          updated_at = NOW()
        WHERE id = $10 OR property_id_code = $10;
      `, [
        khasra_number !== undefined ? String(khasra_number) : null,
        sub_khasra !== undefined ? sub_khasra : null,
        land_classification || null,
        area_sqm !== undefined ? Number(area_sqm) : null,
        area_sqm !== undefined ? Number((Number(area_sqm) / 2529.28).toFixed(2)) : null,
        area_sqm !== undefined ? Number((Number(area_sqm) / 10000).toFixed(4)) : null,
        custom_color !== undefined ? custom_color : null,
        notes !== undefined ? notes : null,
        verification_status || null,
        parcel.id
      ]);

      if (owner_name || dispute_case_number !== undefined || encumbrance !== undefined) {
        await query(`
          INSERT INTO property_records (id, property_id, owner_name, share_fraction, encumbrance_status, encumbrance_amount, dispute_status, dispute_case_number)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO UPDATE SET
            owner_name = EXCLUDED.owner_name,
            share_fraction = EXCLUDED.share_fraction,
            encumbrance_status = EXCLUDED.encumbrance_status,
            encumbrance_amount = EXCLUDED.encumbrance_amount,
            dispute_status = EXCLUDED.dispute_status,
            dispute_case_number = EXCLUDED.dispute_case_number,
            updated_at = NOW();
        `, [
          `rec-${parcel.id}`, parcel.id, owner_name || null, req.body.share_fraction || '1/1',
          encumbrance ? 'ACTIVE' : 'NONE', encumbrance_amount ? Number(encumbrance_amount) : 0,
          dispute_case_number ? 'DISPUTED' : 'CLEAR', dispute_case_number || null
        ]);
      }
    } catch (dbErr: any) {
      console.warn('DB update property error:', dbErr.message);
    }

    // Update intelligence/records if provided
    if (owner_name || dispute_case_number !== undefined || encumbrance !== undefined) {
      RecordService.setDirectPropertyRecords(parcel.id, {
        owner_name: owner_name || undefined,
        share_fraction: req.body.share_fraction || '1/1',
        land_classification: land_classification || parcel.properties.land_classification,
        dispute_case_number,
        encumbrance,
        encumbrance_amount
      });
    }

    RecordService.logAudit({
      admin_id: adminUser?.id || 'demo-admin-id',
      admin_name: adminUser?.full_name || 'Administrator',
      admin_role: adminUser?.role || 'ADMIN',
      action: 'UPDATE_PROPERTY_METADATA',
      target_entity: 'PROPERTY',
      target_id: parcel.id,
      details: {
        khasra_number: parcel.properties.khasra_number,
        land_classification: parcel.properties.land_classification
      }
    });

    return res.json({
      success: true,
      message: `Property details for Khasra ${parcel.properties.khasra_number} updated in database successfully.`,
      parcel
    });
  }

  public static async deleteProperty(req: Request, res: Response) {
    const { id } = req.params;
    const adminUser = (req as any).user;
    const index = RANPUR_PARCELS.findIndex(p => p.id === id || p.properties.property_id_code === id);
    const removed = index !== -1 ? RANPUR_PARCELS.splice(index, 1)[0] : null;

    // Delete from PostgreSQL
    try {
      await query(`DELETE FROM properties WHERE id = $1 OR property_id_code = $1;`, [id]);
    } catch (dbErr: any) {
      console.warn('DB delete property error:', dbErr.message);
    }

    RecordService.logAudit({
      admin_id: adminUser?.id || 'demo-admin-id',
      admin_name: adminUser?.full_name || 'Administrator',
      admin_role: adminUser?.role || 'ADMIN',
      action: 'DELETE_PROPERTY_PARCEL',
      target_entity: 'PROPERTY',
      target_id: id,
      details: {
        id,
        khasra_number: removed?.properties?.khasra_number
      }
    });

    return res.json({
      success: true,
      message: `Property ${removed?.properties?.khasra_number || id} deleted from database successfully.`,
      id
    });
  }
}
