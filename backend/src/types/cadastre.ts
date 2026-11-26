export interface GeoFeature {
  type: 'Feature';
  id: string;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: any;
  };
  properties: {
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
    verification_status: 'VERIFIED' | 'PENDING_VERIFICATION' | 'UNVERIFIED' | 'DISPUTED';
    is_demo_data: boolean;
    centroid?: [number, number];
    custom_color?: string;
    notes?: string;
    availability: {
      ownership: boolean;
      government_land: boolean;
      legal_disputes: boolean;
      encumbrance: boolean;
      court_cases: boolean;
      history: boolean;
    };
  };
}

export const TOKEN_PRICING: Record<string, number> = {
  BASIC_OVERVIEW: 0,
  OWNERSHIP: 1,
  GOVERNMENT_LAND: 1,
  LEGAL_DISPUTES: 2,
  ENCUMBRANCE: 2,
  OWNERSHIP_HISTORY: 2,
  COURT_CASES: 2,
  COMPLETE_REPORT: 5
};

export const RANPUR_VILLAGE_BOUNDARY: GeoFeature = {
  type: 'Feature',
  id: 'b0000000-0000-0000-0000-000000000001',
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [75.8200, 25.0350],
      [75.8550, 25.0350],
      [75.8600, 25.0650],
      [75.8250, 25.0650],
      [75.8200, 25.0350]
    ]]
  },
  properties: {
    property_id_code: 'VIL-RANPUR-325003',
    khasra_number: 'ALL',
    sub_khasra: null,
    village_name: 'Ranpur',
    village_code: '03807600',
    tehsil: 'Ladpura',
    district: 'Kota',
    state: 'Rajasthan',
    pin_code: '325003',
    land_classification: 'REVENUE_VILLAGE_PERIMETER',
    area_sqm: 8505000,
    area_hectares: 850.5,
    area_bigha: 3362.8,
    verification_status: 'VERIFIED',
    is_demo_data: false,
    centroid: [75.8315775, 25.0465],
    availability: {
      ownership: false,
      government_land: true,
      legal_disputes: false,
      encumbrance: false,
      court_cases: false,
      history: false
    }
  }
};

// Active user-input parcel for Ranpur Plot 101
export const USER_PARCEL_101: GeoFeature = {
  type: 'Feature',
  id: 'c0000000-0000-0000-0000-000000000101',
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [75.8275, 25.0425],
      [75.835655, 25.0425],
      [75.835655, 25.0505],
      [75.8275, 25.0505],
      [75.8275, 25.0425]
    ]]
  },
  properties: {
    property_id_code: 'LG-RJ-KOT-RAN-101',
    khasra_number: '101',
    sub_khasra: null,
    village_name: 'Ranpur',
    village_code: '03807600',
    tehsil: 'Ladpura',
    district: 'Kota',
    state: 'Rajasthan',
    pin_code: '325003',
    land_classification: 'POTENTIALLY_VACANT',
    area_sqm: 729009,
    area_hectares: 72.9009,
    area_bigha: 288.23,
    verification_status: 'VERIFIED',
    custom_color: '#16a34a',
    notes: 'Owner: Yash Bhaiya',
    is_demo_data: false,
    centroid: [75.8315775, 25.0465],
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

// Test-only parcel fixtures for automated test suite execution
export const INITIAL_TEST_PARCELS: GeoFeature[] = [
  USER_PARCEL_101,
  {
    type: 'Feature',
    id: 'c0000000-0000-0000-0000-000000000102',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [75.8325, 25.0450],
        [75.8360, 25.0450],
        [75.8360, 25.0480],
        [75.8325, 25.0480],
        [75.8325, 25.0450]
      ]]
    },
    properties: {
      property_id_code: 'LG-RJ-KOT-RAN-00102-1',
      khasra_number: '102',
      sub_khasra: '1',
      village_name: 'Ranpur',
      village_code: '03807600',
      tehsil: 'Ladpura',
      district: 'Kota',
      state: 'Rajasthan',
      pin_code: '325003',
      land_classification: 'COMMERCIAL',
      area_sqm: 8200,
      area_hectares: 0.82,
      area_bigha: 3.24,
      verification_status: 'DISPUTED',
      is_demo_data: false,
    centroid: [75.8315775, 25.0465],
      availability: {
        ownership: true,
        government_land: false,
        legal_disputes: true,
        encumbrance: false,
        court_cases: true,
        history: true
      }
    }
  },
  {
    type: 'Feature',
    id: 'c0000000-0000-0000-0000-000000000103',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [75.8365, 25.0450],
        [75.8410, 25.0450],
        [75.8410, 25.0485],
        [75.8365, 25.0485],
        [75.8365, 25.0450]
      ]]
    },
    properties: {
      property_id_code: 'LG-RJ-KOT-RAN-00103',
      khasra_number: '103',
      sub_khasra: null,
      village_name: 'Ranpur',
      village_code: '03807600',
      tehsil: 'Ladpura',
      district: 'Kota',
      state: 'Rajasthan',
      pin_code: '325003',
      land_classification: 'AGRICULTURAL_IRRIGATED',
      area_sqm: 15000,
      area_hectares: 1.50,
      area_bigha: 5.93,
      verification_status: 'VERIFIED',
      is_demo_data: false,
    centroid: [75.8315775, 25.0465],
      availability: {
        ownership: true,
        government_land: false,
        legal_disputes: false,
        encumbrance: true,
        court_cases: false,
        history: true
      }
    }
  }
];

// Active runtime in-memory list (contains ONLY user-input parcels)
export const RANPUR_PARCELS: GeoFeature[] = [USER_PARCEL_101];

// Verified Property Intelligence for user-input land
export const PROPERTY_INTELLIGENCE: Record<string, any> = {
  'c0000000-0000-0000-0000-000000000101': {
    ownership: {
      owner_name: 'Yash Bhaiya',
      relation_name: 'Verified Citizen Khatedar',
      relation_type: 'KHATEDAR',
      ownership_type: 'KHATEDARI',
      share_fraction: '1/1',
      record_date: '2026-11-22',
      source: 'Apna Khata (e-Dharti) Rajasthan Jamabandi Samvat 2083',
      source_grade: 'OFFICIAL_PUBLIC_RECORD',
      last_verified: '2026-11-22'
    },
    history: [
      {
        previous_owner_name: 'Revenue Jamabandi Record',
        transfer_type: 'REGISTERED_CADASTRE_ENTRY',
        transfer_date: '2026-11-22',
        registration_number: 'REG-LAD-2026/101',
        sub_registrar_office: 'Sub-Registrar Ladpura, Kota',
        consideration_amount: 0.00
      }
    ],
    government_land: null,
    legal_disputes: null,
    court_cases: [],
    encumbrance: null
  }
};
