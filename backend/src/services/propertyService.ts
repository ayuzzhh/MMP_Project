import { RANPUR_PARCELS, PROPERTY_INTELLIGENCE, TOKEN_PRICING, GeoFeature } from '../types/cadastre';
import { GisService } from './gisService';
import { query } from '../config/db';

// In-memory unlock registry for prototype demo
const userUnlockedCategories: Map<string, Set<string>> = new Map();

export class PropertyService {
  public static async getBasicPropertyInfo(idOrCode: string): Promise<GeoFeature['properties'] | null> {
    const cadastre = await GisService.getVillageCadastre();
    const parcel = cadastre.features.find(p => p.id === idOrCode || p.properties.property_id_code === idOrCode || p.properties.khasra_number === idOrCode);
    if (parcel) return parcel.properties;
    const fallback = RANPUR_PARCELS.find(p => p.id === idOrCode || p.properties.property_id_code === idOrCode || p.properties.khasra_number === idOrCode);
    if (!fallback) return null;
    return fallback.properties;
  }

  public static async getPropertyReport(propertyId: string, userId: string = 'demo-user-id') {
    const cadastre = await GisService.getVillageCadastre();
    let parcel = cadastre.features.find(p => p.id === propertyId || p.properties.property_id_code === propertyId || p.properties.khasra_number === propertyId);
    if (!parcel) {
      parcel = RANPUR_PARCELS.find(p => p.id === propertyId || p.properties.property_id_code === propertyId || p.properties.khasra_number === propertyId);
    }
    if (!parcel) return null;

    const pId = parcel.id;
    const userUnlocks = userUnlockedCategories.get(userId) || new Set<string>();

    let intel = PROPERTY_INTELLIGENCE[pId] || null;
    if (!intel && parcel.properties.khasra_number) {
      const k = parcel.properties.khasra_number;
      for (const [key, val] of Object.entries(PROPERTY_INTELLIGENCE)) {
        const found = RANPUR_PARCELS.find(p => p.id === key && p.properties.khasra_number === k);
        if (found) {
          intel = val;
          break;
        }
      }
    }
    if (!intel) {
      try {
        const dbRec = await query(`SELECT * FROM property_records WHERE property_id = $1 LIMIT 1;`, [pId]);
        if (dbRec.rows && dbRec.rows.length > 0) {
          const row = dbRec.rows[0];
          intel = {
            ownership: row.owner_name ? {
              owner_name: row.owner_name,
              share_fraction: row.share_fraction || '1/1',
              ownership_tenure: 'KHATEDARI',
              relation_type: 'SON_OF',
              father_or_husband_name: 'Verified Revenue Record'
            } : null,
            history: [],
            government_land: parcel.properties.land_classification?.includes('GOVERNMENT') ? {
              is_government_land: true,
              agency: 'REVENUE_DEPARTMENT_RAJASTHAN'
            } : null,
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
      } catch (e) {}
    }
    intel = intel || {};

    const isUnlocked = (cat: string) => {
      return userUnlocks.has(`${pId}:${cat}`) || userUnlocks.has(`${pId}:COMPLETE_REPORT`);
    };

    return {
      basic: parcel.properties,
      geometry: parcel.geometry,
      pricing: TOKEN_PRICING,
      unlocked_categories: Array.from(userUnlocks).filter(key => key.startsWith(pId)).map(k => k.split(':')[1]),
      records: {
        ownership: isUnlocked('OWNERSHIP') ? intel.ownership : null,
        history: isUnlocked('OWNERSHIP_HISTORY') ? intel.history : null,
        government_land: isUnlocked('GOVERNMENT_LAND') ? intel.government_land : null,
        legal_disputes: isUnlocked('LEGAL_DISPUTES') ? intel.legal_disputes : null,
        court_cases: isUnlocked('COURT_CASES') ? intel.court_cases : null,
        encumbrance: isUnlocked('ENCUMBRANCE') ? intel.encumbrance : null
      },
      availability: parcel.properties.availability,
      disclaimer: "INFORMATIONAL DUE DILIGENCE REPORT: Does not substitute certified copies under Section 76 of Indian Evidence Act, 1872 or official SRO encumbrance search."
    };
  }

  public static async unlockCategory(propertyId: string, category: string, userId: string = 'demo-user-id') {
    const cadastre = await GisService.getVillageCadastre();
    let parcel = cadastre.features.find(p => p.id === propertyId || p.properties.property_id_code === propertyId || p.properties.khasra_number === propertyId);
    if (!parcel) {
      parcel = RANPUR_PARCELS.find(p => p.id === propertyId || p.properties.property_id_code === propertyId || p.properties.khasra_number === propertyId);
    }
    if (!parcel) {
      throw new Error('PROPERTY_NOT_FOUND');
    }

    const pId = parcel.id;
    let intel = PROPERTY_INTELLIGENCE[pId] || {};
    if (!intel.ownership && parcel.properties.khasra_number) {
      const k = parcel.properties.khasra_number;
      for (const [key, val] of Object.entries(PROPERTY_INTELLIGENCE)) {
        const found = RANPUR_PARCELS.find(p => p.id === key && p.properties.khasra_number === k);
        if (found) {
          intel = val;
          break;
        }
      }
    }

    // 1. Availability check: NEVER deduct tokens if category has no records!
    const isAvailable = (cat: string) => {
      switch (cat) {
        case 'OWNERSHIP': return !!intel.ownership;
        case 'GOVERNMENT_LAND': return !!intel.government_land;
        case 'LEGAL_DISPUTES': return !!intel.legal_disputes;
        case 'ENCUMBRANCE': return !!intel.encumbrance;
        case 'COURT_CASES': return Array.isArray(intel.court_cases) && intel.court_cases.length > 0;
        case 'OWNERSHIP_HISTORY': return Array.isArray(intel.history) && intel.history.length > 0;
        case 'COMPLETE_REPORT': return true;
        default: return false;
      }
    };

    if (!isAvailable(category)) {
      throw new Error('CATEGORY_DATA_UNAVAILABLE');
    }

    // 2. Check if already unlocked
    if (!userUnlockedCategories.has(userId)) {
      userUnlockedCategories.set(userId, new Set<string>());
    }
    const userSet = userUnlockedCategories.get(userId)!;
    const unlockKey = `${pId}:${category}`;

    if (userSet.has(unlockKey) || userSet.has(`${pId}:COMPLETE_REPORT`)) {
      return {
        already_unlocked: true,
        category,
        property_id: pId,
        message: 'Category already unlocked previously.'
      };
    }

    // 3. Token deduction cost
    const cost = TOKEN_PRICING[category] || 1;

    userSet.add(unlockKey);

    return {
      success: true,
      category,
      property_id: pId,
      tokens_deducted: cost,
      message: `Successfully unlocked ${category} intelligence for parcel ${parcel.properties.khasra_number}.`
    };
  }
}
