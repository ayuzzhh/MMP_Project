import { Router } from 'express';
import { VillageController } from '../controllers/villageController';
import { PropertyController } from '../controllers/propertyController';
import { WalletController } from '../controllers/walletController';
import { AuthController } from '../controllers/authController';
import { AdminController } from '../controllers/adminController';
import { DocumentController, documentUpload } from '../controllers/documentController';
import { LandAnalysisController } from '../controllers/landAnalysisController';
import { SatelliteController } from '../controllers/satelliteController';
import { requireAuth, requireRole, requirePermission, optionalAuth } from '../middleware/authMiddleware';
import { validateBody, registerSchema, loginSchema, createAdminSchema } from '../middleware/validationMiddleware';

const router = Router();

// ============================================================================
// 1. Authentication Endpoints
// ============================================================================
router.post('/auth/register', validateBody(registerSchema), AuthController.register);
router.post('/auth/login', validateBody(loginSchema), AuthController.login);
router.post('/auth/logout', AuthController.logout);
router.get('/auth/me', requireAuth, AuthController.getMe);
router.get('/auth/users', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), AuthController.listUsers);
router.post('/super-admin/admins', requireAuth, requireRole('SUPER_ADMIN'), validateBody(createAdminSchema), AuthController.createAdmin);

// ============================================================================
// 2. Village & Cadastre Endpoints (Public)
// ============================================================================
router.get('/villages', VillageController.getVillages);
router.get('/villages/:code/cadastre', VillageController.getVillageCadastre);

// ============================================================================
// 3. Property Exploration Endpoints
// ============================================================================
router.get('/properties', PropertyController.getProperties);
router.get('/properties/search', PropertyController.searchProperties);
router.get('/properties/identify', PropertyController.identifyProperty);
router.get('/properties/:id', PropertyController.getPropertyById);
router.get('/properties/:id/records', optionalAuth, AdminController.getPropertyRecordDetails);
router.get('/properties/:id/report', optionalAuth, PropertyController.getPropertyReport);

// Token-gated intelligence unlock (Requires authenticated user)
router.post('/properties/:id/unlock', requireAuth, PropertyController.unlockPropertyCategory);

// ============================================================================
// 4. Wallet & Token Endpoints (Requires authentication)
// ============================================================================
router.get('/wallet', requireAuth, WalletController.getWallet);
router.post('/wallet/order', requireAuth, WalletController.createOrder);
router.post('/wallet/verify-payment', requireAuth, WalletController.verifyPayment);

// ============================================================================
// 5. Admin Oversight & Verification (Requires ADMIN or SUPER_ADMIN role)
// ============================================================================
router.get('/admin/stats', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), AdminController.getDashboardStats);
router.get('/admin/change-requests', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), AdminController.getChangeRequests);
router.get('/admin/audit-logs', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), AdminController.getAuditLogs);

// Admin-Only Cadastre & Record Management
router.post('/admin/properties', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), AdminController.createProperty);
router.put('/admin/properties/:id', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), AdminController.updateProperty);
router.delete('/admin/properties/:id', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), AdminController.deleteProperty);
router.put('/admin/properties/:id/boundary', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), AdminController.proposeBoundaryUpdate);
router.post('/admin/properties/:id/records', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), AdminController.proposeRecordMutation);

// Two-Man Rule maker-checker approval (Strictly requires SUPER_ADMIN role)
router.post(
  '/admin/change-requests/:id/review',
  requireAuth,
  requireRole('SUPER_ADMIN'),
  requirePermission('verification:approve_change'),
  AdminController.reviewChangeRequest
);

// ============================================================================
// 6. Document Storage & OCR Pipeline (Requires ADMIN or SUPER_ADMIN role)
// ============================================================================
router.get('/documents', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), DocumentController.getAllDocuments);
router.get('/documents/:id', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), DocumentController.getDocumentById);
router.post(
  '/documents/upload',
  requireAuth,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  documentUpload.single('file'),
  DocumentController.uploadDocument
);
router.put('/documents/:id/verify-ocr', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), DocumentController.verifyOcrFields);
router.post(
  '/documents/:id/commit',
  requireAuth,
  requireRole('SUPER_ADMIN'),
  requirePermission('verification:approve_change'),
  DocumentController.commitDocument
);

// ============================================================================
// 7. Admin Reauthentication & Land Identification Endpoints
// ============================================================================
router.post('/admin/reauth', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), AuthController.reauthenticate);

router.get('/land-analysis/overview', LandAnalysisController.getOverview);
router.get('/land-analysis', LandAnalysisController.getAllAnalyses);
router.get('/land-analysis/markings', LandAnalysisController.getMarkings);
router.get('/land-analysis/:propertyId', LandAnalysisController.getPropertyAnalysis);
router.post('/land-analysis/:propertyId/scan', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), LandAnalysisController.triggerScan);
router.post('/land-analysis/classify', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), LandAnalysisController.confirmClassification);
router.post('/land-analysis/markings', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), LandAnalysisController.saveMarking);
router.delete('/land-analysis/markings/:id', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), LandAnalysisController.deleteMarking);

// ============================================================================
// 8. Dedicated Satellite Imagery & Spatial Sensor API
// ============================================================================
router.get('/satellite/providers', SatelliteController.getProviders);
router.get('/satellite/tiles', SatelliteController.getTiles);
router.get('/satellite/metadata', SatelliteController.getMetadata);
router.get('/satellite/parcel/:propertyId', SatelliteController.getParcelIntelligence);
router.post('/satellite/analyze', SatelliteController.analyzeCoordinates);
router.post('/satellite/config', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), SatelliteController.updateConfig);

export default router;
