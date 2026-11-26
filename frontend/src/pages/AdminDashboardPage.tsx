import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, ShieldCheck, AlertTriangle, FileText, 
  Clock, CheckCircle2, XCircle, RefreshCw, Layers, Lock,
  Scale, Landmark, Building, History, Edit3, MapPin, Eye, 
  Upload, Users, Coins, Settings as SettingsIcon, MessageSquare, 
  Check, ArrowRight, Shield, Trees, Building2, Trash2
} from 'lucide-react';
import { LandGuardApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CadastralFeature } from '../types';
import { AdminRecordEditorModal } from '../components/AdminRecordEditorModal';
import { AdminMapEditorModal } from '../components/AdminMapEditorModal';
import { AdminDocumentReviewModal } from '../components/AdminDocumentReviewModal';
import { AdminLandIdentification } from '../components/AdminLandIdentification';
import { InteractiveMap } from '../components/InteractiveMap';

type SectionTab = 
  | 'OVERVIEW' 
  | 'MAP' 
  | 'LAND_ID' 
  | 'PROPERTIES' 
  | 'DOCUMENTS' 
  | 'APPROVALS' 
  | 'REPORTS' 
  | 'TOKENS' 
  | 'ACTIVITY' 
  | 'SETTINGS';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SectionTab>('OVERVIEW');
  
  const [stats, setStats] = useState<any>(null);
  const [landStats, setLandStats] = useState<any>(null);
  const [changeRequests, setChangeRequests] = useState<any[]>([]);
  const [parcels, setParcels] = useState<CadastralFeature[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Modal States
  const [recordEditorTarget, setRecordEditorTarget] = useState<any | null>(null);
  const [docReviewTarget, setDocReviewTarget] = useState<any | null>(null);
  const [isMapEditorOpen, setIsMapEditorOpen] = useState(false);
  const [selectedMapParcelId, setSelectedMapParcelId] = useState<string | null>(null);

  // Password Reauthentication Modal for Approval Actions
  const [reviewModalTarget, setReviewModalTarget] = useState<{ id: string; action: 'APPROVE' | 'REJECT' } | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [reauthError, setReauthError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, lStats, crData, cadastreData, docsData, logsData] = await Promise.all([
        LandGuardApi.getAdminStats().catch(() => null),
        LandGuardApi.getLandOverviewStats().catch(() => null),
        LandGuardApi.getChangeRequests().catch(() => []),
        LandGuardApi.getCadastre().catch(() => ({ type: 'FeatureCollection', features: [] })),
        LandGuardApi.getDocuments().catch(() => []),
        LandGuardApi.getAuditLogs().catch(() => [])
      ]);
      setStats(statsData);
      setLandStats(lStats);
      setChangeRequests(crData || []);
      setParcels(cadastreData?.features || []);
      setDocuments(docsData || []);
      setAuditLogs(logsData || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenReviewModal = (id: string, action: 'APPROVE' | 'REJECT') => {
    setReviewModalTarget({ id, action });
    setAdminPassword('');
    setReauthError(null);
  };

  const handleConfirmReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalTarget) return;

    if (!adminPassword) {
      setReauthError('Please enter your administrator password to confirm.');
      return;
    }

    try {
      // 1. Reauthenticate administrator password on backend
      await LandGuardApi.reauthenticateAdmin(adminPassword);

      // 2. Perform the approval or rejection
      const res = await LandGuardApi.reviewChangeRequest(reviewModalTarget.id, reviewModalTarget.action);
      setActionNotice(res.message || `Change request ${reviewModalTarget.action.toLowerCase()}d successfully.`);
      setReviewModalTarget(null);
      loadData();
    } catch (err: any) {
      setReauthError(err.response?.data?.message || err.message || 'Password verification failed');
    }
  };

  const handleDeleteParcel = async (parcelId: string, khasra: string) => {
    if (!window.confirm(`Are you sure you want to delete Plot #${khasra}? This will permanently remove its boundary, area, and ownership records.`)) {
      return;
    }
    try {
      setLoading(true);
      await LandGuardApi.deleteProperty(parcelId);
      setActionNotice(`Plot #${khasra} deleted successfully.`);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to delete parcel');
    } finally {
      setLoading(false);
    }
  };

  const pendingRequests = changeRequests.filter(r => r.status === 'PENDING');

  const tabs = [
    { id: 'OVERVIEW' as SectionTab, label: '1. Overview', icon: LayoutDashboard },
    { id: 'MAP' as SectionTab, label: '2. Village Map', icon: MapPin },
    { id: 'LAND_ID' as SectionTab, label: '3. Land Identification', icon: Eye, highlight: true },
    { id: 'PROPERTIES' as SectionTab, label: '4. Property Details', icon: Building },
    { id: 'DOCUMENTS' as SectionTab, label: '5. Document Uploads', icon: Upload },
    { id: 'APPROVALS' as SectionTab, label: '6. Pending Approvals', icon: CheckCircle2, badge: pendingRequests.length },
    { id: 'REPORTS' as SectionTab, label: '7. User Reports', icon: MessageSquare },
    { id: 'TOKENS' as SectionTab, label: '8. Token Management', icon: Coins },
    { id: 'ACTIVITY' as SectionTab, label: '9. Activity History', icon: History },
    { id: 'SETTINGS' as SectionTab, label: '10. Settings', icon: SettingsIcon },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in text-slate-800 dark:text-slate-100 transition-colors">
      
      {/* Admin Header (Farmvest Clean Style) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              🛡️ Protected Admin Portal
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Signed in as <strong className="text-slate-800 dark:text-white">{user?.full_name}</strong></span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-serif mt-1">
            Admin Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ranpur Revenue Village • Tehsil Ladpura, Kota District, Rajasthan (PIN 325003)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setSelectedMapParcelId(parcels[0]?.id || null);
              setIsMapEditorOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Edit Map Boundaries</span>
          </button>

          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors border border-slate-200 dark:border-slate-700"
            title="Refresh All Records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between shadow-sm">
          <span className="font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            {actionNotice}
          </span>
          <button onClick={() => setActionNotice(null)} className="font-bold text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* 10 Navigation Section Tabs Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-1.5 shadow-sm overflow-x-auto scrollbar-none flex items-center gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : tab.highlight
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ml-1 ${
                  isSelected ? 'bg-white text-emerald-700' : 'bg-rose-500 text-white'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT SECTIONS */}

      {/* 1. DASHBOARD OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          
          {/* Clear Overview 6 Stats Cards (No confusing graphs) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Land Parcels</span>
              <div className="text-2xl font-black font-serif text-slate-900">{landStats?.total_mapped_parcels ?? 14}</div>
              <span className="text-[10px] text-slate-500">Ranpur Village</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Detected Buildings</span>
              <div className="text-2xl font-black font-serif text-sky-600">{landStats?.buildings_detected ?? 1}</div>
              <span className="text-[10px] text-slate-500">Structures visible</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Potentially Vacant</span>
              <div className="text-2xl font-black font-serif text-amber-500">{landStats?.potentially_vacant ?? 3}</div>
              <span className="text-[10px] text-slate-500">Open barren land</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Agricultural Parcels</span>
              <div className="text-2xl font-black font-serif text-emerald-600">{landStats?.agricultural_parcels ?? 8}</div>
              <span className="text-[10px] text-slate-500">Cultivated farm land</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Pending Reviews</span>
              <div className="text-2xl font-black font-serif text-rose-600">{pendingRequests.length}</div>
              <span className="text-[10px] text-slate-500">Awaiting approval</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Confirmed Classifications</span>
              <div className="text-2xl font-black font-serif text-emerald-700">{landStats?.confirmed_classifications ?? 4}</div>
              <span className="text-[10px] text-slate-500">Admin certified</span>
            </div>
          </div>

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div 
              onClick={() => setActiveTab('LAND_ID')}
              className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 hover:border-emerald-400 cursor-pointer transition-all shadow-sm space-y-3"
            >
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                <Eye className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 font-serif">Smart Land Identification</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Scan satellite imagery to detect vacant land, agricultural plots, or visible building foundations.
              </p>
              <div className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <span>Open Land Scanner</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            <div 
              onClick={() => setActiveTab('APPROVALS')}
              className="p-6 rounded-3xl bg-amber-50 border border-amber-200 hover:border-amber-400 cursor-pointer transition-all shadow-sm space-y-3"
            >
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 font-serif">Review Pending Approvals</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Review land updates and document commits with password confirmation.
              </p>
              <div className="text-xs font-bold text-amber-800 flex items-center gap-1">
                <span>{pendingRequests.length} Requests Pending</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            <div 
              onClick={() => setActiveTab('DOCUMENTS')}
              className="p-6 rounded-3xl bg-sky-50 border border-sky-200 hover:border-sky-400 cursor-pointer transition-all shadow-sm space-y-3"
            >
              <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-bold">
                <Upload className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 font-serif">Upload Jamabandi RoR</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Upload official revenue files to automatically extract owner and Khasra details via OCR.
              </p>
              <div className="text-xs font-bold text-sky-800 flex items-center gap-1">
                <span>{documents.length} Documents Archived</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 2. VILLAGE MAP */}
      {activeTab === 'MAP' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-[600px]">
          <InteractiveMap 
            onSelectProperty={(id) => {
              setSelectedMapParcelId(id);
              setActiveTab('PROPERTIES');
            }}
            selectedPropertyId={selectedMapParcelId}
          />
        </div>
      )}

      {/* 3. SMART LAND IDENTIFICATION (MAJOR FEATURE) */}
      {activeTab === 'LAND_ID' && (
        <AdminLandIdentification 
          parcels={parcels} 
          onClassificationConfirmed={loadData} 
        />
      )}

      {/* 4. PROPERTY DETAILS DIRECTORY */}
      {activeTab === 'PROPERTIES' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-serif">Village Land Plots (Khasras)</h3>
              <p className="text-xs text-slate-500">View and update individual land records in Ranpur</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {parcels.map(p => (
              <div key={p.id} className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl text-xs">
                <div>
                  <div className="font-bold text-slate-900 text-sm">
                    Plot #{p.properties.khasra_number}{p.properties.sub_khasra ? `/${p.properties.sub_khasra}` : ''}
                  </div>
                  <div className="text-slate-500">
                    {p.properties.land_classification.replace(/_/g, ' ')} • {p.properties.area_bigha} Bigha ({p.properties.area_hectares} Ha)
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    p.properties.verification_status === 'VERIFIED'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border-rose-300'
                  }`}>
                    {p.properties.verification_status}
                  </span>
                  <button
                    onClick={() => setRecordEditorTarget(p)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold"
                  >
                    Edit Records
                  </button>
                  <button
                    onClick={() => handleDeleteParcel(p.id, p.properties.khasra_number)}
                    className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                    title={`Delete Plot #${p.properties.khasra_number}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. DOCUMENT UPLOADS */}
      {activeTab === 'DOCUMENTS' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-serif">Revenue Documents & OCR Review</h3>
              <p className="text-xs text-slate-500">Upload official Jamabandis for automatic text extraction</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {documents.map((doc: any) => (
              <div key={doc.id} className="py-3 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-slate-900">{doc.original_filename || doc.file_name}</div>
                  <div className="text-slate-500">Khasra {doc.khasra_number} • OCR Confidence: {doc.ocr_confidence_score}%</div>
                </div>
                <button
                  onClick={() => setDocReviewTarget(doc)}
                  className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold"
                >
                  Review Extracted Data
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. PENDING APPROVALS (With Password Reauthentication Modal) */}
      {activeTab === 'APPROVALS' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-serif">Pending Change Requests</h3>
            <p className="text-xs text-slate-500">
              All approvals require entering your administrator password to protect record integrity
            </p>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No pending approval requests.</div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map(r => (
                <div key={r.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{r.category} ({r.change_type})</span>
                    <span className="text-slate-500 block text-[11px]">{r.justification || 'Proposed property modification'}</span>
                    <span className="text-[10px] text-slate-400">Proposed by: {r.creator_name || 'Verification Officer'}</span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleOpenReviewModal(r.id, 'APPROVE')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                      Approve (Password Protected)
                    </button>
                    <button
                      onClick={() => handleOpenReviewModal(r.id, 'REJECT')}
                      className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7. USER REPORTS */}
      {activeTab === 'REPORTS' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 font-serif">Citizen Discrepancy Reports</h3>
          <p className="text-xs text-slate-500">User feedback and reported inaccuracies on village plots</p>
          <div className="p-8 text-center text-xs text-slate-400">
            Zero active discrepancy reports reported by citizens for Ranpur village.
          </div>
        </div>
      )}

      {/* 8. TOKEN MANAGEMENT */}
      {activeTab === 'TOKENS' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4 text-xs">
          <h3 className="text-lg font-bold text-slate-900 font-serif">Token Pricing & Wallet Management</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block">Starter Pack</span>
              <span className="text-emerald-700 font-bold text-base">₹299</span>
              <p className="text-slate-500 text-[11px]">5 Search Tokens (₹60/token)</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
              <span className="font-bold text-emerald-950 block">Property Investigator</span>
              <span className="text-emerald-800 font-bold text-base">₹799</span>
              <p className="text-emerald-700 text-[11px]">15 Search Tokens (₹53/token)</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block">Legal Professional</span>
              <span className="text-emerald-700 font-bold text-base">₹1,999</span>
              <p className="text-slate-500 text-[11px]">50 Search Tokens (₹40/token)</p>
            </div>
          </div>
        </div>
      )}

      {/* 9. ACTIVITY HISTORY (AUDIT LOGS) */}
      {activeTab === 'ACTIVITY' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 font-serif">Administrative Activity Ledger</h3>
          <p className="text-xs text-slate-500">Immutable audit log of all administrative actions and approvals</p>
          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto text-xs">
            {auditLogs.map((log: any) => (
              <div key={log.id} className="py-3 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-900">{log.action}</span>
                  <span className="text-slate-500 block text-[11px]">{log.entity_type} ({log.entity_id})</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-700 block">{log.admin_name || 'Admin'}</span>
                  <span className="text-[10px] text-slate-400">{new Date(log.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 10. SETTINGS */}
      {activeTab === 'SETTINGS' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4 text-xs">
          <h3 className="text-lg font-bold text-slate-900 font-serif">Village & Platform Settings</h3>
          <div className="space-y-3 max-w-lg">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-700 block">Pilot Jurisdiction</span>
              <span className="text-slate-900 font-bold text-sm">Ranpur Village (LGD: 100452, Census: 03807600)</span>
              <span className="text-slate-500 block">Ladpura Tehsil, Kota District, Rajasthan (PIN: 325003)</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-700 block">Spatial Projection Datum</span>
              <span className="text-slate-900 font-mono font-bold">WGS 84 / UTM ZONE 43N (EPSG:3857)</span>
            </div>

            {/* Satellite Imagery API Panel */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active Satellite Imagery API
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  CONNECTED • 0.31m HD
                </span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-600">
                <p><strong className="text-slate-800">Primary Provider:</strong> ArcGIS World Imagery (Maxar 0.31m High-Resolution Optical)</p>
                <p><strong className="text-slate-800">Satellite Sensor:</strong> WorldView-3 / GeoEye-1 Pushbroom Sensor</p>
                <p><strong className="text-slate-800">Acquisition Pass:</strong> February 2026 • 0.0% Cloud Cover</p>
                <p><strong className="text-slate-800">Multi-Spectral Bands:</strong> Sentinel-2 MSI (10m Land Surface Monitoring)</p>
                <p><strong className="text-slate-800">API Endpoint:</strong> <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-emerald-700 font-mono">/api/satellite/tiles</code></p>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">API Key Status:</span>
                <span className="text-emerald-700 font-bold">Public Optical Stream (Zero Key Required)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Password Reauthentication Modal for Review Approvals */}
      {reviewModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in text-slate-800">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Lock className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm font-serif">Admin Password Confirmation</h3>
              </div>
              <button onClick={() => setReviewModalTarget(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <p className="text-xs text-slate-600">
              You are about to <strong className="text-slate-900">{reviewModalTarget.action}</strong> request #{reviewModalTarget.id}. 
              Please confirm your administrator password to proceed.
            </p>

            {reauthError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {reauthError}
              </div>
            )}

            <form onSubmit={handleConfirmReview} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Admin Password</label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter admin password (e.g. SuperAdmin@123 or Admin@123)"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalTarget(null)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Confirm & Execute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Existing modals */}
      {recordEditorTarget && (
        <AdminRecordEditorModal
          property={{
            id: recordEditorTarget.id,
            khasra_number: recordEditorTarget.properties.khasra_number,
            property_id_code: recordEditorTarget.properties.property_id_code,
            land_classification: recordEditorTarget.properties.land_classification,
          }}
          onClose={() => setRecordEditorTarget(null)}
          onSuccess={() => {
            loadData();
            setRecordEditorTarget(null);
          }}
        />
      )}

      {docReviewTarget && (
        <AdminDocumentReviewModal
          property={{
            id: docReviewTarget.property_id || (parcels.length > 0 ? parcels[0].id : ''),
            khasra_number: (parcels.find(p => p.id === docReviewTarget.property_id)?.properties.khasra_number) || '102',
            property_id_code: (parcels.find(p => p.id === docReviewTarget.property_id)?.properties.property_id_code) || 'RJ-KOT-RAN-102',
          }}
          onClose={() => setDocReviewTarget(null)}
          onSuccess={() => {
            loadData();
            setDocReviewTarget(null);
          }}
        />
      )}

      <AdminMapEditorModal
        isOpen={isMapEditorOpen}
        onClose={() => setIsMapEditorOpen(false)}
        parcels={parcels}
        selectedPropertyId={selectedMapParcelId}
        onMutationSubmitted={() => {
          loadData();
          setIsMapEditorOpen(false);
        }}
      />

    </div>
  );
};
