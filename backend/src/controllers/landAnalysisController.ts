import { Request, Response } from 'express';
import { LandAnalysisService } from '../services/landAnalysisService';
import { AuthService } from '../services/authService';

export class LandAnalysisController {
  
  public static async getOverview(req: Request, res: Response) {
    try {
      const stats = await LandAnalysisService.getOverviewStats();
      return res.json({
        success: true,
        data: stats,
        disclaimer: LandAnalysisService.LEGAL_DISCLAIMER
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  public static async getAllAnalyses(req: Request, res: Response) {
    try {
      const analyses = await LandAnalysisService.getAllAnalyses();
      return res.json({
        success: true,
        count: analyses.length,
        data: analyses,
        disclaimer: LandAnalysisService.LEGAL_DISCLAIMER
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  public static async getPropertyAnalysis(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      const result = await LandAnalysisService.getAnalysisByPropertyId(propertyId);
      return res.json({
        success: true,
        data: result
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  public static async triggerScan(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      const { propertyCode, khasraNumber } = req.body;
      const result = await LandAnalysisService.runSatelliteAnalysis(
        propertyId, 
        propertyCode || 'RJ-KOT-RAN-CUSTOM', 
        khasraNumber || '101'
      );
      return res.status(201).json({
        success: true,
        message: 'Satellite imagery analysis completed successfully.',
        data: result,
        disclaimer: LandAnalysisService.LEGAL_DISCLAIMER
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  public static async confirmClassification(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { property_id, classification, detection_method, notes, password } = req.body;

      if (!property_id || !classification) {
        return res.status(400).json({ 
          success: false, 
          error: 'MISSING_FIELDS', 
          message: 'Property ID and classification are required.' 
        });
      }

      // Check reauthentication if password provided or if sensitive change
      if (password) {
        const isValid = await AuthService.verifyAdminPassword(user.id, password);
        if (!isValid) {
          return res.status(403).json({
            success: false,
            error: 'INVALID_ADMIN_PASSWORD',
            message: 'Admin password confirmation failed.'
          });
        }
      }

      const result = await LandAnalysisService.confirmClassification({
        property_id,
        classification,
        detection_method: detection_method || 'MANUAL_SURVEYOR',
        notes,
        reviewer_id: user.id,
        reviewer_name: user.full_name || 'Admin Officer'
      });

      return res.json({
        success: true,
        message: `Land classification for parcel confirmed as [${classification}].`,
        data: result.record
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  public static async getMarkings(req: Request, res: Response) {
    try {
      const markings = await LandAnalysisService.getMarkings();
      return res.json({
        success: true,
        count: markings.length,
        data: markings
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  public static async saveMarking(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { property_id, marking_type, coordinates, description } = req.body;

      if (!coordinates || !Array.isArray(coordinates) || coordinates.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_COORDINATES',
          message: 'Polygon coordinates ring is required.'
        });
      }

      const record = await LandAnalysisService.saveMarking({
        property_id,
        marking_type: marking_type || 'VACANT_POLYGON',
        coordinates,
        description,
        creator_name: user.full_name || 'Field Surveyor'
      });

      return res.status(201).json({
        success: true,
        message: 'Land marking polygon saved successfully.',
        data: record
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  public static async deleteMarking(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await LandAnalysisService.deleteMarking(id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'MARKING_NOT_FOUND' });
      }
      return res.json({
        success: true,
        message: 'Marking deleted successfully.'
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}
