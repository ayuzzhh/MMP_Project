import { Request, Response } from 'express';
import { GisService } from '../services/gisService';
import { PropertyService } from '../services/propertyService';
import { WalletService } from '../services/walletService';
import { TOKEN_PRICING, RANPUR_PARCELS } from '../types/cadastre';

export class PropertyController {
  public static async getProperties(req: Request, res: Response) {
    const cadastre = await GisService.getVillageCadastre();
    const parcels = cadastre.features.filter(f => f.properties.land_classification !== 'REVENUE_VILLAGE_PERIMETER');
    return res.json({
      success: true,
      count: parcels.length,
      data: parcels.map(p => p.properties)
    });
  }

  public static async getPropertyById(req: Request, res: Response) {
    const { id } = req.params;
    const info = await PropertyService.getBasicPropertyInfo(id);
    if (!info) {
      return res.status(404).json({ success: false, error: 'Property parcel not found' });
    }
    return res.json({ success: true, data: info });
  }

  public static async searchProperties(req: Request, res: Response) {
    const query = (req.query.q as string) || '';
    if (!query) {
      return res.json({ success: true, data: [] });
    }
    const results = await GisService.searchParcels(query);
    return res.json({ success: true, count: results.length, data: results });
  }

  public static async identifyProperty(req: Request, res: Response) {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ success: false, error: 'Valid latitude and longitude are required.' });
    }

    const parcel = await GisService.identifyParcelAtPoint(lng, lat);
    if (!parcel) {
      return res.status(404).json({ success: false, message: 'No registered parcel found at this coordinate.' });
    }

    return res.json({ success: true, data: parcel });
  }

  public static async getPropertyReport(req: Request, res: Response) {
    const { id } = req.params;
    const userId = (req as any).user?.id || 'demo-user-id';
    const report = await PropertyService.getPropertyReport(id, userId);

    if (!report) {
      return res.status(404).json({ success: false, error: 'Property parcel not found' });
    }

    return res.json({ success: true, data: report });
  }

  public static async unlockPropertyCategory(req: Request, res: Response) {
    const { id } = req.params;
    const { category } = req.body;
    const userId = (req as any).user?.id || 'demo-user-id';

    if (!category) {
      return res.status(400).json({ success: false, error: 'Information category is required.' });
    }

    try {
      const tokenCost = TOKEN_PRICING[category] ?? 1;

      // Check wallet balance
      const wallet = WalletService.getWallet(userId);
      if (wallet.balance < tokenCost) {
        return res.status(402).json({
          success: false,
          error: 'INSUFFICIENT_BALANCE',
          required_tokens: tokenCost,
          current_balance: wallet.balance,
          message: `Insufficient token balance. This unlock requires ${tokenCost} token(s), but your wallet has ${wallet.balance}.`
        });
      }

      // Unlock intelligence category
      const unlockResult = await PropertyService.unlockCategory(id, category, userId);

      // If category was not previously unlocked, deduct tokens
      if (!unlockResult.already_unlocked && tokenCost > 0) {
        WalletService.deductTokens(
          userId,
          tokenCost,
          `Unlocked ${category} for Property ID ${id}`
        );
      }

      // Return updated full report
      const updatedReport = await PropertyService.getPropertyReport(id, userId);

      return res.json({
        success: true,
        unlocked: unlockResult,
        updated_report: updatedReport
      });
    } catch (err: any) {
      if (err.message === 'CATEGORY_DATA_UNAVAILABLE') {
        return res.status(400).json({
          success: false,
          error: 'DATA_UNAVAILABLE',
          message: 'Zero tokens charged. No verified information exists for this category on this parcel.'
        });
      }
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}
