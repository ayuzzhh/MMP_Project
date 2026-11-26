-- ============================================================================
-- LANDGUARD POSTGRESQL + POSTGIS SCHEMA MIGRATION 001_INITIAL_SCHEMA.SQL
-- Designed for PostgreSQL 16+ with PostGIS 3.4+
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Custom Enumerated Types
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE land_classification_enum AS ENUM (
        'AGRICULTURAL_IRRIGATED',
        'AGRICULTURAL_UNIRRIGATED',
        'RESIDENTIAL',
        'COMMERCIAL',
        'INDUSTRIAL_RIICO',
        'GOVERNMENT_SIWAY_CHAK',
        'CHARAGAH_PASTURE',
        'BILANAM_GOVERNMENT',
        'ABADI_RESIDENTIAL',
        'GAIR_MUMKIN_INFRASTRUCTURE'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_status_enum AS ENUM (
        'VERIFIED',
        'PENDING_VERIFICATION',
        'UNVERIFIED',
        'DISPUTED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE relation_type_enum AS ENUM (
        'SON_OF',
        'DAUGHTER_OF',
        'WIFE_OF',
        'CARETAKER',
        'LEGAL_HEIR'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ownership_tenure_enum AS ENUM (
        'KHATEDARI',
        'GHAR_KHATEDARI',
        'LEASEHOLD',
        'ALLOTTEE_RIICO',
        'CO_SHARER',
        'GRAM_PANCHAYAT_PATTA'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transfer_type_enum AS ENUM (
        'SALE_DEED',
        'INHERITANCE_VIRASAT',
        'GIFT_DEED',
        'COURT_DECREE',
        'PARTITION_BATWARA',
        'GOVERNMENT_ALLOTMENT'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE government_agency_enum AS ENUM (
        'REVENUE_DEPARTMENT_RAJASTHAN',
        'RIICO',
        'KOTA_DEVELOPMENT_AUTHORITY',
        'GRAM_PANCHAYAT_RANPUR',
        'FOREST_DEPARTMENT',
        'PUBLIC_WORKS_DEPARTMENT'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public_purpose_enum AS ENUM (
        'CHARAGAH',
        'SIWAY_CHAK',
        'GAIR_MUMKIN_RASTA',
        'TALAB_WATERBODY',
        'CREMATION_BURIAL_GROUND',
        'GOVERNMENT_OFFICE_FACILITY'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE dispute_type_enum AS ENUM (
        'TITLE_DISPUTE',
        'BOUNDARY_ENCROACHMENT',
        'PARTITION_SUIT',
        'INJUNCTION_STAY',
        'MUTATION_CHALLENGE',
        'ACQUISITION_OBJECTION'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE dispute_status_enum AS ENUM (
        'ACTIVE',
        'STAY_GRANTED',
        'RESOLVED_MUTATION_DONE',
        'DISMISSED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE court_type_enum AS ENUM (
        'REVENUE_TEHSILDAR_LADPURA',
        'SDM_REVENUE_COURT_KOTA',
        'REVENUE_BOARD_AJMER',
        'CIVIL_COURT_KOTA',
        'DISTRICT_SESSIONS_COURT_KOTA',
        'RAJASTHAN_HIGH_COURT_JAIPUR'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE court_case_status_enum AS ENUM (
        'PENDING',
        'INTERIM_STAY_ACTIVE',
        'FINAL_DECREE_ISSUED',
        'DISPOSED',
        'APPEAL_PENDING'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE encumbrance_type_enum AS ENUM (
        'REGISTERED_BANK_MORTGAGE',
        'EQUITABLE_MORTGAGE',
        'KISAN_CREDIT_CARD_CHARGE',
        'COURT_ATTACHMENT_ORDER',
        'GOVERNMENT_TAX_LIEN',
        'PRIVATE_FINANCIAL_CHARGE'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE satisfaction_status_enum AS ENUM (
        'ACTIVE',
        'DISCHARGED_NOC_ISSUED',
        'IN_DEFAULT_AUCTION_NOTICE'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE token_category_enum AS ENUM (
        'BASIC_OVERVIEW',
        'OWNERSHIP',
        'GOVERNMENT_LAND',
        'LEGAL_DISPUTES',
        'ENCUMBRANCE',
        'OWNERSHIP_HISTORY',
        'COURT_CASES',
        'COMPLETE_REPORT'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status_enum AS ENUM (
        'CREATED',
        'SUCCESS',
        'FAILED',
        'REFUNDED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type_enum AS ENUM (
        'PURCHASE',
        'UNLOCK_SPEND',
        'REFUND',
        'ADMIN_ADJUSTMENT'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE change_request_status_enum AS ENUM (
        'PENDING',
        'APPROVED',
        'REJECTED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ocr_status_enum AS ENUM (
        'PENDING',
        'PROCESSING',
        'EXTRACTED',
        'VERIFIED_CORRECTED',
        'FAILED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Users & Roles
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name user_role_enum NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) NOT NULL UNIQUE,
    module VARCHAR(50) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 2. Geographical & Cadastral Tables
CREATE TABLE IF NOT EXISTS villages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    village_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    name_hi VARCHAR(100),
    tehsil VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL DEFAULT 'Rajasthan',
    pin_code VARCHAR(10) NOT NULL,
    boundary GEOMETRY(MultiPolygon, 4326),
    center_point GEOMETRY(Point, 4326),
    total_area_hectares NUMERIC(12, 4),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id_code VARCHAR(50) NOT NULL UNIQUE,
    village_id UUID NOT NULL REFERENCES villages(id) ON DELETE RESTRICT,
    khasra_number VARCHAR(50) NOT NULL,
    sub_khasra VARCHAR(20),
    land_classification land_classification_enum NOT NULL DEFAULT 'AGRICULTURAL_IRRIGATED',
    area_sqm NUMERIC(12, 2) NOT NULL CHECK (area_sqm > 0),
    area_hectares NUMERIC(10, 4) GENERATED ALWAYS AS (area_sqm / 10000.0) STORED,
    area_bigha NUMERIC(10, 4) GENERATED ALWAYS AS ((area_sqm / 10000.0) * 3.95) STORED,
    verification_status verification_status_enum NOT NULL DEFAULT 'UNVERIFIED',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS property_boundaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL UNIQUE REFERENCES properties(id) ON DELETE CASCADE,
    boundary GEOMETRY(Polygon, 4326) NOT NULL,
    centroid GEOMETRY(Point, 4326) NOT NULL,
    srid INTEGER NOT NULL DEFAULT 4326,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_demo_data BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS khasra_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    village_id UUID NOT NULL REFERENCES villages(id) ON DELETE RESTRICT,
    khasra_number VARCHAR(50) NOT NULL,
    khata_number VARCHAR(50),
    sheet_number VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Provenance & Records
CREATE TABLE IF NOT EXISTS property_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_name VARCHAR(255) NOT NULL,
    source_type VARCHAR(100) NOT NULL,
    source_url VARCHAR(500),
    reference_id VARCHAR(255),
    last_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    authenticity_grade VARCHAR(50) NOT NULL DEFAULT 'OFFICIAL_PUBLIC_RECORD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ownership_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    owner_name VARCHAR(255) NOT NULL,
    relation_name VARCHAR(255),
    relation_type relation_type_enum DEFAULT 'SON_OF',
    ownership_type ownership_tenure_enum NOT NULL DEFAULT 'KHATEDARI',
    share_fraction VARCHAR(20) NOT NULL DEFAULT '1/1',
    source_id UUID REFERENCES property_sources(id),
    record_date DATE NOT NULL,
    verification_status verification_status_enum NOT NULL DEFAULT 'PENDING_VERIFICATION',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ownership_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    previous_owner_name VARCHAR(255) NOT NULL,
    transfer_type transfer_type_enum NOT NULL,
    transfer_date DATE NOT NULL,
    registration_number VARCHAR(100),
    sub_registrar_office VARCHAR(150),
    consideration_amount NUMERIC(14, 2),
    source_id UUID REFERENCES property_sources(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS government_land_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    government_type government_agency_enum NOT NULL,
    public_purpose_classification public_purpose_enum NOT NULL,
    restricting_authority VARCHAR(200) NOT NULL,
    gazette_notification_number VARCHAR(150),
    restriction_details TEXT NOT NULL,
    source_id UUID REFERENCES property_sources(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS legal_disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    dispute_type dispute_type_enum NOT NULL,
    dispute_status dispute_status_enum NOT NULL DEFAULT 'ACTIVE',
    description TEXT NOT NULL,
    is_lis_pendens BOOLEAN NOT NULL DEFAULT TRUE,
    source_id UUID REFERENCES property_sources(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS court_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispute_id UUID NOT NULL REFERENCES legal_disputes(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    cnr_number VARCHAR(50) NOT NULL UNIQUE,
    case_number VARCHAR(100) NOT NULL,
    court_name VARCHAR(255) NOT NULL,
    court_type court_type_enum NOT NULL,
    petitioner VARCHAR(255) NOT NULL,
    respondent VARCHAR(255) NOT NULL,
    filing_date DATE NOT NULL,
    case_status court_case_status_enum NOT NULL DEFAULT 'PENDING',
    stay_order_details TEXT,
    certified_copy_url VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS encumbrance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    encumbrance_type encumbrance_type_enum NOT NULL,
    financial_institution VARCHAR(255) NOT NULL,
    loan_account_reference VARCHAR(100),
    amount_inr NUMERIC(14, 2) NOT NULL,
    registration_number VARCHAR(100),
    mortgage_date DATE NOT NULL,
    satisfaction_status satisfaction_status_enum NOT NULL DEFAULT 'ACTIVE',
    discharge_date DATE,
    deed_of_reconveyance_ref VARCHAR(100),
    source_id UUID REFERENCES property_sources(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS property_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    ocr_extracted_text TEXT,
    ocr_extracted_fields JSONB,
    ocr_status ocr_status_enum NOT NULL DEFAULT 'PENDING',
    uploaded_by UUID NOT NULL REFERENCES users(id),
    verification_status verification_status_enum NOT NULL DEFAULT 'PENDING_VERIFICATION',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS property_change_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    change_type VARCHAR(50) NOT NULL,
    category VARCHAR(100) NOT NULL,
    requested_by_admin_id UUID NOT NULL REFERENCES users(id),
    reviewed_by_super_admin_id UUID REFERENCES users(id),
    proposed_data JSONB NOT NULL,
    current_data JSONB,
    status change_request_status_enum NOT NULL DEFAULT 'PENDING',
    review_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Monetization & Wallet
CREATE TABLE IF NOT EXISTS token_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
    lifetime_purchased INTEGER NOT NULL DEFAULT 0,
    lifetime_spent INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS token_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    tokens_count INTEGER NOT NULL CHECK (tokens_count > 0),
    price_inr NUMERIC(10, 2) NOT NULL CHECK (price_inr >= 0),
    discount_percentage NUMERIC(5, 2) DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS token_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category token_category_enum NOT NULL UNIQUE,
    token_cost INTEGER NOT NULL CHECK (token_cost >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    package_id UUID REFERENCES token_packages(id),
    amount_inr NUMERIC(10, 2) NOT NULL,
    tokens_allotted INTEGER NOT NULL,
    razorpay_order_id VARCHAR(100) NOT NULL UNIQUE,
    razorpay_payment_id VARCHAR(100) UNIQUE,
    razorpay_signature VARCHAR(255),
    status payment_status_enum NOT NULL DEFAULT 'CREATED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS token_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES token_wallets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    transaction_type transaction_type_enum NOT NULL,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    category_unlocked token_category_enum,
    balance_after INTEGER NOT NULL,
    description VARCHAR(255) NOT NULL,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS report_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    category_unlocked token_category_enum NOT NULL,
    token_transaction_id UUID REFERENCES token_transactions(id) ON DELETE SET NULL,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_property_category UNIQUE (user_id, property_id, category_unlocked)
);

CREATE TABLE IF NOT EXISTS user_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    issue_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    admin_notes TEXT,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    target_entity VARCHAR(100) NOT NULL,
    target_id UUID,
    details JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_villages_boundary ON villages USING GIST (boundary);
CREATE INDEX IF NOT EXISTS idx_property_boundaries_boundary ON property_boundaries USING GIST (boundary);
CREATE INDEX IF NOT EXISTS idx_property_boundaries_centroid ON property_boundaries USING GIST (centroid);
CREATE INDEX IF NOT EXISTS idx_properties_village_khasra ON properties (village_id, khasra_number);
CREATE INDEX IF NOT EXISTS idx_properties_code ON properties (property_id_code);
CREATE INDEX IF NOT EXISTS idx_court_cases_cnr ON court_cases (cnr_number);
CREATE INDEX IF NOT EXISTS idx_report_access_user_property ON report_access (user_id, property_id);
