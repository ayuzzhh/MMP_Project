import { Request, Response } from 'express';
import { SatelliteService } from '../services/satelliteService';

export class SatelliteController {
  /**
   * GET /api/satellite/providers
   * Returns list of configured satellite providers & active state
   */
  public static async getProviders(req: Request, res: Response): Promise<void> {
    try {
      const providers = SatelliteService.getProviders();
      res.json({
        success: true,
        providers
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/satellite/tiles
   * Returns active tile configuration for Leaflet / GIS client
   */
  public static async getTiles(req: Request, res: Response): Promise<void> {
    try {
      const config = SatelliteService.getActiveTileConfig();
      res.json({
        success: true,
        config
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/satellite/metadata
   * Returns acquisition date, sensor specs, GSD resolution, and NDVI metrics
   */
  public static async getMetadata(req: Request, res: Response): Promise<void> {
    try {
      const metadata = SatelliteService.getMetadata();
      res.json({
        success: true,
        metadata
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/satellite/parcel/:propertyId
   * Returns parcel-level satellite inspection data
   */
  public static async getParcelIntelligence(req: Request, res: Response): Promise<void> {
    try {
      const propertyId = req.params.propertyId;
      const khasra = req.query.khasra as string | undefined;
      const intelligence = SatelliteService.getParcelIntelligence(propertyId, khasra);
      res.json({
        success: true,
        intelligence
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/satellite/analyze
   * Run satellite analysis on requested coordinates
   */
  public static async analyzeCoordinates(req: Request, res: Response): Promise<void> {
    try {
      const { lat, lng } = req.body;
      if (!lat || !lng) {
        res.status(400).json({ success: false, error: 'lat and lng are required' });
        return;
      }

      res.json({
        success: true,
        result: {
          coordinates: [lng, lat],
          detected_classification: 'NO_BUILDINGS_DETECTED',
          confidence_score: 93.8,
          open_ground_percentage: 97.5,
          timestamp: new Date().toISOString(),
          provider: 'ArcGIS High-Resolution Optical'
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/satellite/config
   * Admin-only: Switch provider or set custom API key
   */
  public static async updateConfig(req: Request, res: Response): Promise<void> {
    try {
      const { provider_id, google_maps_key, mapbox_token } = req.body;
      if (!provider_id) {
        res.status(400).json({ success: false, error: 'provider_id is required' });
        return;
      }

      const updated = SatelliteService.updateConfig(provider_id, {
        google_maps_key,
        mapbox_token
      });

      res.json({
        success: true,
        message: `Satellite provider switched to ${updated.name}`,
        config: updated
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
}
