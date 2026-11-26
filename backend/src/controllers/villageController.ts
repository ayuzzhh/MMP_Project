import { Request, Response } from 'express';
import { GisService } from '../services/gisService';
import { RANPUR_VILLAGE_BOUNDARY } from '../types/cadastre';

export class VillageController {
  public static async getVillages(req: Request, res: Response) {
    return res.json({
      success: true,
      data: [
        {
          id: RANPUR_VILLAGE_BOUNDARY.id,
          name: 'Ranpur',
          name_hi: 'रणपुर',
          village_code: '03807600',
          tehsil: 'Ladpura',
          district: 'Kota',
          state: 'Rajasthan',
          pin_code: '325003',
          total_parcels: 5,
          active: true
        }
      ]
    });
  }

  public static async getVillageCadastre(req: Request, res: Response) {
    try {
      const villageCode = req.params.code || '03807600';
      const cadastre = await GisService.getVillageCadastre({
        villageCode,
        category: req.query.category as string,
        status: req.query.status as string
      });
      return res.json({
        success: true,
        data: cadastre
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}
