import axios from 'axios';
import { CadastralCollection, CadastralProperty, PropertyReport, WalletData, UserProfile, AuthResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization Bearer token from localStorage if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('landguard_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export const LandGuardApi = {
  // Authentication & RBAC
  auth: {
    register: async (data: { email: string; password: string; full_name: string; phone_number?: string }): Promise<AuthResponse> => {
      const res = await api.post('/auth/register', data);
      return res.data;
    },
    login: async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
      const res = await api.post('/auth/login', credentials);
      return res.data;
    },
    logout: async () => {
      const res = await api.post('/auth/logout');
      return res.data;
    },
    getMe: async (): Promise<{ success: boolean; user: UserProfile }> => {
      const res = await api.get('/auth/me');
      return res.data;
    },
    listUsers: async (): Promise<UserProfile[]> => {
      const res = await api.get('/auth/users');
      return res.data.data;
    },
    createAdmin: async (adminData: any): Promise<AuthResponse> => {
      const res = await api.post('/super-admin/admins', adminData);
      return res.data;
    }
  },

  // Village & Cadastre
  getVillages: async () => {
    const res = await api.get('/villages');
    return res.data;
  },
  getCadastre: async (params?: { villageCode?: string; category?: string; status?: string }): Promise<CadastralCollection> => {
    const code = params?.villageCode || '03807600';
    const queryParts: string[] = [];
    if (params?.category) queryParts.push(`category=${encodeURIComponent(params.category)}`);
    if (params?.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
    const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

    const res = await api.get(`/villages/${code}/cadastre${qs}`);
    return res.data.data;
  },
  
  // Properties
  searchProperties: async (q: string) => {
    const res = await api.get(`/properties/search?q=${encodeURIComponent(q)}`);
    return res.data.data;
  },
  identifyProperty: async (lat: number, lng: number) => {
    const res = await api.get(`/properties/identify?lat=${lat}&lng=${lng}`);
    return res.data.data;
  },
  getPropertyById: async (id: string) => {
    const res = await api.get(`/properties/${id}`);
    return res.data.data;
  },
  getPropertyRecords: async (id: string) => {
    const res = await api.get(`/properties/${id}/records`);
    return res.data.data;
  },
  getPropertyReport: async (id: string): Promise<PropertyReport> => {
    const res = await api.get(`/properties/${id}/report`);
    return res.data.data;
  },
  unlockCategory: async (id: string, category: string) => {
    const res = await api.post(`/properties/${id}/unlock`, { category });
    return res.data;
  },

  // Wallet & Tokens
  getWallet: async (): Promise<WalletData> => {
    const res = await api.get('/wallet');
    return res.data.data;
  },
  createOrder: async (packageId: string) => {
    const res = await api.post('/wallet/order', { packageId });
    return res.data.data;
  },
  verifyPayment: async (paymentData: any) => {
    const res = await api.post('/wallet/verify-payment', paymentData);
    return res.data.data;
  },

  // Admin & Cadastre Management
  getAdminStats: async () => {
    const res = await api.get('/admin/stats');
    return res.data.data;
  },
  getChangeRequests: async () => {
    const res = await api.get('/admin/change-requests');
    return res.data.data;
  },
  reviewChangeRequest: async (id: string, action: 'APPROVE' | 'REJECT', notes?: string) => {
    const res = await api.post(`/admin/change-requests/${id}/review`, { action, notes });
    return res.data;
  },
  proposeBoundaryUpdate: async (propertyId: string, coordinates: [number, number][], justification?: string, isDirectCommit: boolean = false) => {
    const res = await api.put(`/admin/properties/${propertyId}/boundary`, {
      property_id: propertyId,
      coordinates,
      justification,
      is_direct_commit: isDirectCommit,
      auto_commit: isDirectCommit
    });
    return res.data;
  },
  updateBoundary: async (propertyId: string, coordinates: [number, number][], isDirectCommit: boolean = true) => {
    const res = await api.put(`/admin/properties/${propertyId}/boundary`, {
      property_id: propertyId,
      coordinates,
      is_direct_commit: isDirectCommit,
      auto_commit: isDirectCommit
    });
    return res.data;
  },
  updateProperty: async (propertyId: string, updateData: {
    khasra_number?: string;
    sub_khasra?: string;
    land_classification?: string;
    area_sqm?: number;
    custom_color?: string;
    notes?: string;
    verification_status?: string;
    owner_name?: string;
    share_fraction?: string;
    encumbrance?: string;
    encumbrance_amount?: number;
    dispute_case_number?: string;
  }) => {
    const res = await api.put(`/admin/properties/${propertyId}`, updateData);
    return res.data;
  },
  deleteProperty: async (propertyId: string) => {
    const res = await api.delete(`/admin/properties/${propertyId}`);
    return res.data;
  },
  createProperty: async (propertyData: {
    khasra_number: string;
    sub_khasra?: string;
    land_classification: string;
    area_sqm: number;
    coordinates: [number, number][];
    owner_name?: string;
    color?: string;
    notes?: string;
    verification_status?: string;
    share_fraction?: string;
    encumbrance?: string;
    encumbrance_amount?: number;
    dispute_case_number?: string;
    is_direct_commit?: boolean;
    auto_commit?: boolean;
  }) => {
    const res = await api.post('/admin/properties', propertyData);
    return res.data;
  },
  proposeRecordMutation: async (propertyId: string, category: string, changeType: string = 'UPDATE', proposedData: any) => {
    const res = await api.post(`/admin/properties/${propertyId}/records`, {
      category,
      changeType,
      proposedData
    });
    return res.data;
  },
  getAuditLogs: async () => {
    const res = await api.get('/admin/audit-logs');
    return res.data.data;
  },

  // Document Storage & OCR Pipeline
  getDocuments: async (propertyId?: string) => {
    const url = propertyId ? `/documents?propertyId=${encodeURIComponent(propertyId)}` : '/documents';
    const res = await api.get(url);
    return res.data.data;
  },
  getDocumentById: async (id: string) => {
    const res = await api.get(`/documents/${id}`);
    return res.data.data;
  },
  uploadDocument: async (formData: FormData) => {
    const res = await api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  verifyOcrFields: async (id: string, verified_fields: any, submit_for_commit: boolean = false) => {
    const res = await api.put(`/documents/${id}/verify-ocr`, {
      verified_fields,
      submit_for_commit
    });
    return res.data;
  },
  commitDocument: async (id: string) => {
    const res = await api.post(`/documents/${id}/commit`);
    return res.data;
  },

  // Smart Land Identification & Admin Reauthentication
  reauthenticateAdmin: async (password: string) => {
    const res = await api.post('/admin/reauth', { password });
    return res.data;
  },
  getLandOverviewStats: async () => {
    const res = await api.get('/land-analysis/overview');
    return res.data.data;
  },
  getAllLandAnalyses: async () => {
    const res = await api.get('/land-analysis');
    return res.data.data;
  },
  getPropertyLandAnalysis: async (propertyId: string) => {
    const res = await api.get(`/land-analysis/${propertyId}`);
    return res.data.data;
  },
  triggerSatelliteScan: async (propertyId: string, propertyCode?: string, khasraNumber?: string) => {
    const res = await api.post(`/land-analysis/${propertyId}/scan`, { propertyCode, khasraNumber });
    return res.data;
  },
  confirmLandClassification: async (data: {
    property_id: string;
    classification: string;
    detection_method?: string;
    notes?: string;
    password?: string;
  }) => {
    const res = await api.post('/land-analysis/classify', data);
    return res.data;
  },
  getLandMarkings: async () => {
    const res = await api.get('/land-analysis/markings');
    return res.data.data;
  },
  saveLandMarking: async (data: {
    property_id?: string;
    marking_type: string;
    coordinates: number[][][];
    description?: string;
  }) => {
    const res = await api.post('/land-analysis/markings', data);
    return res.data;
  },
  deleteLandMarking: async (id: string) => {
    const res = await api.delete(`/land-analysis/markings/${id}`);
    return res.data;
  },

  // Dedicated Satellite Imagery & Spatial API
  getSatelliteProviders: async () => {
    const res = await api.get('/satellite/providers');
    return res.data.providers;
  },
  getSatelliteTiles: async () => {
    const res = await api.get('/satellite/tiles');
    return res.data.config;
  },
  getSatelliteMetadata: async () => {
    const res = await api.get('/satellite/metadata');
    return res.data.metadata;
  },
  getSatelliteParcelIntelligence: async (propertyId: string, khasra?: string) => {
    const res = await api.get(`/satellite/parcel/${propertyId}${khasra ? `?khasra=${khasra}` : ''}`);
    return res.data.intelligence;
  },
  analyzeSatelliteCoordinates: async (lat: number, lng: number) => {
    const res = await api.post('/satellite/analyze', { lat, lng });
    return res.data.result;
  },
  updateSatelliteConfig: async (data: { provider_id: string; google_maps_key?: string; mapbox_token?: string }) => {
    const res = await api.post('/satellite/config', data);
    return res.data;
  },

  // System Health
  checkHealth: async () => {
    const res = await api.get('/health');
    return res.data;
  }
};
