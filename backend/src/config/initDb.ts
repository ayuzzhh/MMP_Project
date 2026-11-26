import { pool } from './db';
import bcrypt from 'bcryptjs';
import { INITIAL_TEST_PARCELS, PROPERTY_INTELLIGENCE, RANPUR_PARCELS, GeoFeature } from '../types/cadastre';
import { GisService } from '../services/gisService';
import { changeRequests } from '../controllers/adminController';
import { MOCK_USERS_STORE } from '../services/authService';
import { RoleType } from '../types/auth';

export async function initializeDatabaseSchema() {
  console.log('🚀 Connecting to PostgreSQL (landguard_db)...');
  let client;
  try {
    client = await pool.connect();
    console.log('✅ PostgreSQL connection established.');

    await client.query(`
      CREATE TABLE IF NOT EXISTS villages (
        id VARCHAR(100) PRIMARY KEY,
        village_name VARCHAR(100) NOT NULL,
        village_code VARCHAR(50) NOT NULL UNIQUE,
        tehsil VARCHAR(100) NOT NULL,
        district VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        pin_code VARCHAR(10) NOT NULL,
        boundary_geojson JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS properties (
        id VARCHAR(100) PRIMARY KEY,
        village_id VARCHAR(100) REFERENCES villages(id) ON DELETE SET NULL,
        property_id_code VARCHAR(100) UNIQUE NOT NULL,
        khasra_number VARCHAR(100) NOT NULL,
        sub_khasra VARCHAR(100),
        land_classification VARCHAR(100) NOT NULL,
        area_sqm NUMERIC(14, 2) NOT NULL,
        area_hectares NUMERIC(10, 4) NOT NULL,
        area_bigha NUMERIC(10, 2) NOT NULL,
        verification_status VARCHAR(50) DEFAULT 'VERIFIED',
        custom_color VARCHAR(50),
        notes TEXT,
        is_demo_data BOOLEAN DEFAULT FALSE,
        availability JSONB DEFAULT '{"ownership":true,"government_land":false,"legal_disputes":false,"encumbrance":false,"court_cases":false,"history":true}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS property_boundaries (
        id VARCHAR(100) PRIMARY KEY,
        property_id VARCHAR(100) REFERENCES properties(id) ON DELETE CASCADE,
        geometry JSONB NOT NULL,
        centroid_lng DOUBLE PRECISION NOT NULL,
        centroid_lat DOUBLE PRECISION NOT NULL,
        is_demo_data BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS property_records (
        id VARCHAR(100) PRIMARY KEY,
        property_id VARCHAR(100) REFERENCES properties(id) ON DELETE CASCADE,
        owner_name VARCHAR(255),
        share_fraction VARCHAR(50),
        encumbrance_status VARCHAR(100),
        encumbrance_amount NUMERIC(14, 2),
        dispute_status VARCHAR(100),
        dispute_case_number VARCHAR(100),
        court_name VARCHAR(255),
        additional_data JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(100) PRIMARY KEY,
        admin_id VARCHAR(100),
        admin_name VARCHAR(255),
        admin_role VARCHAR(50),
        action VARCHAR(100) NOT NULL,
        target_entity VARCHAR(100),
        target_id VARCHAR(100),
        details JSONB,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS change_requests (
        id VARCHAR(100) PRIMARY KEY,
        property_id VARCHAR(100),
        property_id_code VARCHAR(100),
        khasra_number VARCHAR(100),
        change_type VARCHAR(50),
        category VARCHAR(50),
        requested_by VARCHAR(255),
        proposed_data JSONB,
        status VARCHAR(50) DEFAULT 'PENDING',
        review_notes TEXT,
        reviewed_by VARCHAR(255),
        reviewed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(100) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        phone_number VARCHAR(50),
        role VARCHAR(50) DEFAULT 'USER',
        is_active BOOLEAN DEFAULT TRUE,
        is_verified BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS token_wallets (
        id VARCHAR(100) PRIMARY KEY,
        user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
        balance INT DEFAULT 10,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS land_classifications (
        id VARCHAR(100) PRIMARY KEY,
        property_id VARCHAR(100) UNIQUE NOT NULL,
        classification VARCHAR(100) NOT NULL,
        detection_method VARCHAR(50) DEFAULT 'MANUAL_SURVEYOR',
        admin_status VARCHAR(50) DEFAULT 'CONFIRMED',
        reviewed_by VARCHAR(100),
        reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS land_markings (
        id VARCHAR(100) PRIMARY KEY,
        property_id VARCHAR(100),
        marking_type VARCHAR(50) NOT NULL,
        coordinates JSONB NOT NULL,
        description TEXT,
        creator_name VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS property_documents (
        id VARCHAR(100) PRIMARY KEY,
        property_id VARCHAR(100),
        property_id_code VARCHAR(100),
        khasra_number VARCHAR(100),
        document_type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path TEXT NOT NULL,
        file_size BIGINT,
        mime_type VARCHAR(100),
        uploaded_by VARCHAR(255),
        uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        ocr_status VARCHAR(50) DEFAULT 'PROCESSING',
        extracted_fields JSONB,
        human_verified_by VARCHAR(255),
        human_verified_at TIMESTAMP WITH TIME ZONE,
        super_admin_committed BOOLEAN DEFAULT FALSE
      );
    `);

    // Ensure Ranpur village record exists in DB
    await client.query(`
      INSERT INTO villages (id, village_name, village_code, tehsil, district, state, pin_code)
      VALUES ('v-ranpur-03807600', 'Ranpur', '03807600', 'Ladpura', 'Kota', 'Rajasthan', '325003')
      ON CONFLICT (village_code) DO NOTHING;
    `);

    // Ensure system users exist in PostgreSQL
    const userPw = await bcrypt.hash('User@123', 10);
    const adminPw = await bcrypt.hash('Admin@123', 10);
    const superAdminPw = await bcrypt.hash('SuperAdmin@123', 10);

    await client.query(`
      INSERT INTO users (id, email, password_hash, full_name, phone_number, role, is_active, is_verified)
      VALUES 
        ('demo-user-id', 'user@landguard.in', $1, 'Ayush Sharma (Citizen Buyer)', '+91 9829012345', 'USER', true, true),
        ('demo-admin-id', 'admin@landguard.in', $2, 'Pooja Verma (Verification Officer)', '+91 9829054321', 'ADMIN', true, true),
        ('demo-superadmin-id', 'superadmin@landguard.in', $3, 'Dr. Rajesh Rathore (Super Admin)', '+91 9829099999', 'SUPER_ADMIN', true, true)
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        full_name = EXCLUDED.full_name;
    `, [userPw, adminPw, superAdminPw]);

    await client.query(`
      INSERT INTO token_wallets (id, user_id, balance)
      VALUES 
        ('w-demo-user', 'demo-user-id', 15),
        ('w-demo-admin', 'demo-admin-id', 50),
        ('w-demo-superadmin', 'demo-superadmin-id', 100)
      ON CONFLICT (id) DO NOTHING;
    `);

    // Ensure user's Plot 101 (Yash Bhaiya) initial baseline exists in PostgreSQL without overwriting user updates
    const userParcel = INITIAL_TEST_PARCELS[0];
    const ring = userParcel.geometry.coordinates[0];
    const centroid = GisService.computeCentroid(ring);
    const intel = PROPERTY_INTELLIGENCE[userParcel.id] || {};

    await client.query(`
      INSERT INTO properties (
        id, village_id, property_id_code, khasra_number, sub_khasra,
        land_classification, area_sqm, area_hectares, area_bigha,
        verification_status, custom_color, notes, is_demo_data, availability
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (id) DO NOTHING;
    `, [
      userParcel.id,
      'v-ranpur-03807600',
      userParcel.properties.property_id_code,
      userParcel.properties.khasra_number,
      userParcel.properties.sub_khasra || null,
      userParcel.properties.land_classification,
      userParcel.properties.area_sqm,
      userParcel.properties.area_hectares,
      userParcel.properties.area_bigha,
      userParcel.properties.verification_status,
      userParcel.properties.custom_color || '#16a34a',
      userParcel.properties.notes || 'Owner: Yash Bhaiya',
      false,
      JSON.stringify(userParcel.properties.availability)
    ]);

    await client.query(`
      INSERT INTO property_boundaries (
        id, property_id, geometry, centroid_lng, centroid_lat, is_demo_data
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO NOTHING;
    `, [
      `b-${userParcel.id}`,
      userParcel.id,
      JSON.stringify(userParcel.geometry),
      centroid[0],
      centroid[1],
      false
    ]);

    await client.query(`
      INSERT INTO property_records (
        id, property_id, owner_name, share_fraction,
        encumbrance_status, encumbrance_amount,
        dispute_status, dispute_case_number, court_name, additional_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO NOTHING;
    `, [
      `rec-${userParcel.id}`,
      userParcel.id,
      'Yash Bhaiya',
      '1/1',
      'NONE',
      0,
      'CLEAR',
      null,
      null,
      JSON.stringify(intel)
    ]);

    await client.query(`
      INSERT INTO land_classifications (id, property_id, classification, detection_method, admin_status, reviewed_by, notes)
      VALUES 
        ('lc-101', 'c0000000-0000-0000-0000-000000000101', 'POTENTIALLY_VACANT', 'MANUAL_SURVEYOR', 'CONFIRMED', 'demo-admin-id', 'Confirmed by admin survey. Owner: Yash Bhaiya.')
      ON CONFLICT (property_id) DO NOTHING;
    `);

    // Hydrate in-memory stores directly from PostgreSQL so restarts preserve all data
    try {
      const parcelsRes = await client.query(`
        SELECT p.*, pb.geometry, pb.centroid_lng, pb.centroid_lat
        FROM properties p
        JOIN property_boundaries pb ON p.id = pb.property_id
        ORDER BY p.created_at ASC;
      `);
      if (parcelsRes.rows && parcelsRes.rows.length > 0) {
        RANPUR_PARCELS.length = 0;
        for (const row of parcelsRes.rows) {
          RANPUR_PARCELS.push({
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
          });
        }
        console.log(`✅ Hydrated ${RANPUR_PARCELS.length} active parcels from PostgreSQL.`);
      }

      const recsRes = await client.query(`SELECT * FROM property_records;`);
      if (recsRes.rows) {
        for (const row of recsRes.rows) {
          const addData = typeof row.additional_data === 'string' ? JSON.parse(row.additional_data) : (row.additional_data || {});
          PROPERTY_INTELLIGENCE[row.property_id] = {
            ownership: row.owner_name ? {
              owner_name: row.owner_name,
              share_fraction: row.share_fraction || '1/1',
              ownership_tenure: 'KHATEDARI',
              relation_type: 'SON_OF',
              father_or_husband_name: 'Verified Revenue Record',
              record_date: '2026-11-22',
              source: 'Apna Khata (e-Dharti) Rajasthan Jamabandi',
              source_grade: 'OFFICIAL_PUBLIC_RECORD',
              last_verified: '2026-11-22'
            } : null,
            history: addData.history || [],
            government_land: addData.government_land || null,
            legal_disputes: row.dispute_case_number ? {
              dispute_type: 'CIVIL_SUIT',
              dispute_status: 'ACTIVE_DISPUTE',
              case_number: row.dispute_case_number,
              court_name: row.court_name || 'District Court, Kota'
            } : null,
            court_cases: row.dispute_case_number ? [
              { case_number: row.dispute_case_number, court: row.court_name || 'District Court, Kota', status: 'PENDING' }
            ] : [],
            encumbrance: row.encumbrance_amount ? {
              encumbrance_type: 'REGISTERED_BANK_MORTGAGE',
              financial_institution: 'Scheduled Commercial Bank',
              amount_inr: parseFloat(row.encumbrance_amount),
              satisfaction_status: row.encumbrance_status || 'ACTIVE'
            } : null
          };
        }
      }

      const crRes = await client.query(`SELECT * FROM change_requests ORDER BY created_at DESC;`);
      if (crRes.rows && crRes.rows.length > 0) {
        changeRequests.length = 0;
        for (const row of crRes.rows) {
          changeRequests.push({
            id: row.id,
            property_id: row.property_id,
            property_id_code: row.property_id_code,
            khasra_number: row.khasra_number,
            change_type: row.change_type,
            category: row.category,
            requested_by: row.requested_by,
            proposed_data: typeof row.proposed_data === 'string' ? JSON.parse(row.proposed_data) : row.proposed_data,
            status: row.status,
            review_notes: row.review_notes,
            reviewed_by: row.reviewed_by,
            reviewed_at: row.reviewed_at,
            created_at: row.created_at
          });
        }
      }

      // Hydrate users store from PostgreSQL
      const usersRes = await client.query(`
        SELECT u.*, COALESCE(u.role, 'USER') as role, COALESCE(w.balance, 10) as wallet_balance
        FROM users u
        LEFT JOIN token_wallets w ON u.id = w.user_id;
      `);
      if (usersRes.rows && usersRes.rows.length > 0) {
        for (const row of usersRes.rows) {
          MOCK_USERS_STORE.set(row.email.toLowerCase(), {
            id: row.id,
            email: row.email,
            password_hash: row.password_hash,
            full_name: row.full_name,
            phone_number: row.phone_number || '',
            role: (row.role as RoleType) || 'USER',
            is_active: row.is_active,
            is_verified: row.is_verified,
            wallet_balance: parseInt(row.wallet_balance || '10', 10),
            created_at: row.created_at,
            updated_at: row.updated_at
          });
        }
      }
    } catch (hydrateErr: any) {
      console.warn('⚠️ Warning hydrating runtime caches from PostgreSQL:', hydrateErr.message);
    }

    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('✅ Tables active in PostgreSQL:', tablesRes.rows.map(r => r.table_name));
    return true;
  } catch (err: any) {
    console.error('❌ Database initialization error:', err.message);
    return false;
  } finally {
    if (client) client.release();
  }
}

if (require.main === module) {
  initializeDatabaseSchema().then(() => pool.end());
}
