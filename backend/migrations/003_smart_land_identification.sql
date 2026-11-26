-- ============================================================================
-- LANDGUARD POSTGRESQL + POSTGIS SCHEMA MIGRATION 003_SMART_LAND_IDENTIFICATION.SQL
-- Adds Smart Land Identification, Satellite Analysis, Classifications & Markings
-- ============================================================================

-- 1. Table: land_analysis
-- Stores automatic and manual satellite imagery analysis records
CREATE TABLE IF NOT EXISTS land_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    analysis_type VARCHAR(50) NOT NULL DEFAULT 'SATELLITE_IMAGERY',
    detected_classification VARCHAR(50) NOT NULL, -- 'BUILDINGS_DETECTED', 'NO_BUILDINGS_DETECTED', 'POTENTIALLY_VACANT', 'AGRICULTURAL', 'NEEDS_MANUAL_REVIEW'
    confidence_score NUMERIC(5, 2) NOT NULL DEFAULT 85.00, -- 0.00 to 100.00%
    imagery_source VARCHAR(100) NOT NULL DEFAULT 'Sentinel-2 / World_Imagery',
    imagery_date DATE DEFAULT CURRENT_DATE,
    analysis_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    analysis_status VARCHAR(50) NOT NULL DEFAULT 'ANALYSIS_COMPLETED', -- 'NOT_ANALYZED', 'ANALYSIS_COMPLETED', 'UNDER_MANUAL_REVIEW', 'CONFIRMED', 'INCORRECT'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_land_analysis_property_id ON land_analysis(property_id);
CREATE INDEX IF NOT EXISTS idx_land_analysis_status ON land_analysis(analysis_status);

-- 2. Table: land_classifications
-- Stores confirmed and reviewed land classifications
CREATE TABLE IF NOT EXISTS land_classifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    classification VARCHAR(50) NOT NULL, -- 'POTENTIALLY_VACANT', 'BUILDING_DETECTED', 'AGRICULTURAL', 'BARREN_OPEN', 'COMMERCIAL'
    detection_method VARCHAR(50) NOT NULL DEFAULT 'AUTOMATIC', -- 'AUTOMATIC', 'MANUAL_SURVEYOR', 'HYBRID'
    admin_status VARCHAR(50) NOT NULL DEFAULT 'UNDER_MANUAL_REVIEW', -- 'PENDING', 'UNDER_MANUAL_REVIEW', 'CONFIRMED', 'REJECTED'
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_land_classifications_property_id ON land_classifications(property_id);
CREATE INDEX IF NOT EXISTS idx_land_classifications_admin_status ON land_classifications(admin_status);

-- 3. Table: land_markings
-- Stores surveyor drawn polygons and boundary markings in PostGIS
CREATE TABLE IF NOT EXISTS land_markings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    geometry GEOMETRY(Polygon, 4326) NOT NULL,
    marking_type VARCHAR(50) NOT NULL DEFAULT 'VACANT_POLYGON', -- 'VACANT_POLYGON', 'BUILDING_FOOTPRINT', 'AGRICULTURAL_BOUNDARY', 'DISPUTED_ZONE'
    description TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_land_markings_geometry ON land_markings USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_land_markings_property_id ON land_markings(property_id);

-- 4. Table: land_analysis_history
-- Maintains chronological historical records of all classification changes
CREATE TABLE IF NOT EXISTS land_analysis_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    previous_classification VARCHAR(50),
    new_classification VARCHAR(50) NOT NULL,
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    change_reason TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_land_analysis_history_property_id ON land_analysis_history(property_id);
