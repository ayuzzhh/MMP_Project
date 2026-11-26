import React, { useEffect, useState } from 'react';
import { 
  X, ShieldCheck, AlertOctagon, Lock, Unlock, Landmark, 
  Scale, FileText, Ban, AlertTriangle, Coins, 
  Calculator, MapPin, Copy, Check, Eye, Building2, Trees, 
  Sparkles, Edit3, Trash2, Save, Undo, Palette, CheckCircle2
} from 'lucide-react';
import { PropertyReport, LandAnalysisRecord } from '../types';
import { LandGuardApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { DueDiligenceReportModal } from './DueDiligenceReportModal';

interface PropertyDrawerProps {
  propertyId: string | null;
  onClose: () => void;
  walletBalance: number;
  onTokenSpent: () => void;
  onOpenWallet: () => void;
  onPropertyUpdated?: () => void;
  onStartBoundaryEdit?: (propertyId: string) => void;
  onPropertyDeleted?: (propertyId: string) => void;
}

const PRESET_COLORS = [
  { label: 'Farm Land', color: '#16a34a' },
  { label: 'Residential', color: '#10b981' },
  { label: 'Commercial', color: '#0284c7' },
  { label: 'Grazing Land', color: '#eab308' },
  { label: 'Court Dispute', color: '#dc2626' },
  { label: 'Government', color: '#7c3aed' },
  { label: 'Industrial', color: '#ea580c' },
  { label: 'Water Body', color: '#06b6d4' }
];

export const PropertyDrawer: React.FC<PropertyDrawerProps> = ({
  propertyId,
  onClose,
  walletBalance,
  onTokenSpent,
  onOpenWallet,
  onPropertyUpdated,
  onStartBoundaryEdit,
  onPropertyDeleted
}) => {
  const { isAdmin } = useAuth();
  const [report, setReport] = useState<PropertyReport | null>(null);
  const [landAnalysis, setLandAnalysis] = useState<LandAnalysisRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [unlockingCategory, setUnlockingCategory] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConverter, setShowConverter] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [showDiligenceReport, setShowDiligenceReport] = useState(false);

  // Contextual Admin Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editSuccessNotice, setEditSuccessNotice] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form Fields
  const [editKhasra, setEditKhasra] = useState('');
  const [editSubKhasra, setEditSubKhasra] = useState('');
  const [editClassification, setEditClassification] = useState('AGRICULTURAL_IRRIGATED');
  const [editAreaSqm, setEditAreaSqm] = useState(10000);
  const [editOwner, setEditOwner] = useState('');
  const [editShare, setEditShare] = useState('1/1');
  const [editStatus, setEditStatus] = useState('VERIFIED');
  const [editColor, setEditColor] = useState('#16a34a');
  const [editBank, setEditBank] = useState('');
  const [editLoanAmount, setEditLoanAmount] = useState('');
  const [editDisputeCase, setEditDisputeCase] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const initEditForm = (data: PropertyReport) => {
    setEditKhasra(data.basic.khasra_number || '');
    setEditSubKhasra(data.basic.sub_khasra || '');
    setEditClassification(data.basic.land_classification || 'AGRICULTURAL_IRRIGATED');
    setEditAreaSqm(data.basic.area_sqm || 10000);
    setEditOwner(data.records.ownership?.owner_name || '');
    setEditShare(data.records.ownership?.share_fraction || '1/1');
    setEditStatus(data.basic.verification_status || 'VERIFIED');
    setEditColor((data.basic as any).custom_color || '#16a34a');
    setEditBank(data.records.encumbrance?.financial_institution || '');
    setEditLoanAmount(data.records.encumbrance ? String(data.records.encumbrance.amount_inr) : '');
    setEditDisputeCase(data.records.legal_disputes ? data.records.legal_disputes.dispute_type : '');
    setEditNotes((data.basic as any).notes || '');
  };

  const fetchData = async () => {
    if (!propertyId) return;
    try {
      setLoading(true);
      setErrorMessage(null);
      
      const [reportData, analysisData] = await Promise.all([
        LandGuardApi.getPropertyReport(propertyId),
        LandGuardApi.getPropertyLandAnalysis(propertyId).catch(() => null)
      ]);

      if (reportData) {
        setReport(reportData);
        initEditForm(reportData);
      }
      if (analysisData && analysisData.analysis) {
        setLandAnalysis(analysisData.analysis);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not load land details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!propertyId) {
      setReport(null);
      setLandAnalysis(null);
      setIsEditing(false);
      setConfirmDelete(false);
      return;
    }
    fetchData();
  }, [propertyId]);

  if (!propertyId) return null;

  const handleUnlock = async (category: string) => {
    try {
      setUnlockingCategory(category);
      setErrorMessage(null);

      const cost = report?.pricing[category] ?? 1;
      if (walletBalance < cost) {
        onOpenWallet();
        return;
      }

      const res = await LandGuardApi.unlockCategory(propertyId, category);
      if (res.success && res.updated_report) {
        setReport(res.updated_report);
        onTokenSpent();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to unlock information';
      setErrorMessage(msg);
    } finally {
      setUnlockingCategory(null);
    }
  };

  const isCategoryUnlocked = (cat: string) => {
    if (!report) return false;
    return report.unlocked_categories.includes(cat) || report.unlocked_categories.includes('COMPLETE_REPORT');
  };

  const copyCoordinates = () => {
    if (!report?.geometry?.coordinates) return;
    const coordsStr = JSON.stringify(report.geometry.coordinates);
    navigator.clipboard.writeText(coordsStr);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  // Measurement unit conversions for Rajasthan
  const sqm = isEditing ? editAreaSqm : (report?.basic.area_sqm || 0);
  const hectares = (sqm / 10000).toFixed(4);
  const puccaBigha = ((sqm / 10000) * 3.95368).toFixed(2);
  const biswa = (((sqm / 10000) * 3.95368) * 20).toFixed(1);
  const sqft = (sqm * 10.7639).toFixed(0);

  // Save changes handler
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId) return;

    if (!editKhasra.trim()) {
      setErrorMessage('Khasra / Plot Number is required.');
      return;
    }

    setSavingEdit(true);
    setErrorMessage(null);

    try {
      await LandGuardApi.updateProperty(propertyId, {
        khasra_number: editKhasra.trim(),
        sub_khasra: editSubKhasra.trim() || undefined,
        land_classification: editClassification,
        area_sqm: Number(editAreaSqm),
        custom_color: editColor,
        notes: editNotes.trim() || undefined,
        verification_status: editStatus,
        owner_name: editOwner.trim() || undefined,
        share_fraction: editShare.trim() || '1/1',
        encumbrance: editBank.trim() || undefined,
        encumbrance_amount: editLoanAmount ? Number(editLoanAmount) : undefined,
        dispute_case_number: editStatus === 'DISPUTED' ? (editDisputeCase.trim() || 'Active Dispute') : undefined
      });

      setEditSuccessNotice(`Changes to Khasra ${editKhasra} saved successfully.`);
      setTimeout(() => setEditSuccessNotice(null), 4000);
      setIsEditing(false);

      // Re-fetch report and notify parent
      await fetchData();
      onPropertyUpdated?.();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to save changes');
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete parcel handler
  const handleDeleteParcel = async () => {
    if (!propertyId) return;
    setDeleting(true);
    setErrorMessage(null);
    try {
      await LandGuardApi.deleteProperty(propertyId);
      onPropertyDeleted?.(propertyId);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to delete parcel');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[480px] lg:w-[520px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out text-slate-800 dark:text-slate-100">
      
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-emerald-50/70 dark:bg-slate-950/70">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                Plot #{report?.basic.khasra_number}{report?.basic.sub_khasra ? `/${report?.basic.sub_khasra}` : ''}
              </span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                report?.basic.verification_status === 'VERIFIED'
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : report?.basic.verification_status === 'DISPUTED'
                  ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                  : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
              }`}>
                {report?.basic.verification_status === 'VERIFIED' ? 'Verified Safe' : 
                 report?.basic.verification_status === 'DISPUTED' ? 'Court Dispute' : 'Checking'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-black tracking-tight text-slate-900 dark:text-white mt-1.5">
              Khasra {report?.basic.khasra_number}{report?.basic.sub_khasra ? `/${report?.basic.sub_khasra}` : ''}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-sans">
              Ranpur Village • Tehsil Ladpura • Kota, Rajasthan
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            title="Close Panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin Quick Action Strip */}
        {isAdmin && (
          <div className="mt-3 pt-3 border-t border-emerald-200/60 dark:border-slate-800 flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                if (report) initEditForm(report);
                setIsEditing(!isEditing);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                isEditing
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Viewing Mode' : 'Edit Parcel Details'}</span>
            </button>

            <button
              onClick={() => {
                if (propertyId && onStartBoundaryEdit) {
                  onStartBoundaryEdit(propertyId);
                }
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-slate-200 flex items-center gap-1.5 transition-all shadow-sm"
              title="Drag and adjust polygon vertices directly on the map"
            >
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              <span>Adjust Boundaries</span>
            </button>

            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition-colors ml-auto"
              title="Delete this parcel"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Banner */}
      {confirmDelete && (
        <div className="p-3 bg-rose-600 text-white text-xs flex items-center justify-between gap-2 shadow-lg animate-fade-in">
          <span>Delete Khasra #{report?.basic.khasra_number}? This cannot be undone.</span>
          <div className="flex items-center gap-1.5">
            <button
              disabled={deleting}
              onClick={handleDeleteParcel}
              className="px-2.5 py-1 rounded bg-white text-rose-700 font-bold hover:bg-rose-50 transition-colors"
            >
              {deleting ? 'Deleting...' : 'Yes, Delete'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-2 py-1 rounded hover:bg-rose-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {editSuccessNotice && (
        <div className="p-3 bg-emerald-600 text-white text-xs font-bold flex items-center gap-2 shadow-md animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{editSuccessNotice}</span>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="m-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 bg-slate-50 dark:bg-slate-950/60">
        
        {/* ==================================================================== */}
        {/* EDIT MODE: DIRECT MODIFICATION FORM                                  */}
        {/* ==================================================================== */}
        {isEditing ? (
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            
            {/* Color Swatches */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                  Map Highlight Color
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-500">{editColor}</span>
                  <input
                    type="color"
                    value={editColor}
                    onChange={e => setEditColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border border-slate-300 dark:border-slate-600 bg-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                {PRESET_COLORS.map(p => (
                  <button
                    type="button"
                    key={p.color}
                    onClick={() => setEditColor(p.color)}
                    className={`h-7 rounded-lg transition-transform ${
                      editColor.toLowerCase() === p.color.toLowerCase()
                        ? 'ring-2 ring-slate-900 dark:ring-white scale-105 shadow'
                        : 'opacity-85 hover:opacity-100 hover:scale-105'
                    }`}
                    style={{ backgroundColor: p.color }}
                    title={p.label}
                  />
                ))}
              </div>
            </div>

            {/* Khasra Identifiers */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs border-b border-slate-100 dark:border-slate-700 pb-1.5">
                1. Plot Identification
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Khasra Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={editKhasra}
                    onChange={e => setEditKhasra(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Sub-Khasra (Division)
                  </label>
                  <input
                    type="text"
                    value={editSubKhasra}
                    onChange={e => setEditSubKhasra(e.target.value)}
                    placeholder="e.g. 1"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Type of Land (Classification)
                </label>
                <select
                  value={editClassification}
                  onChange={e => setEditClassification(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="AGRICULTURAL_IRRIGATED">🌾 Farm Land (Irrigated / Chahi)</option>
                  <option value="AGRICULTURAL_UNIRRIGATED">🌾 Farm Land (Dry / Barani)</option>
                  <option value="RESIDENTIAL">🏡 Residential / Abadi Land</option>
                  <option value="COMMERCIAL">🏢 Commercial / Market Plot</option>
                  <option value="INDUSTRIAL_RIICO">🏭 Industrial / RIICO Zone</option>
                  <option value="CHARAGAH_PASTURE">🐄 Village Grazing Land (Charagah)</option>
                  <option value="GOVERNMENT_SIWAY_CHAK">🏛️ Government Land (Siway Chak)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Surface Area (Square Meters)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="100"
                    value={editAreaSqm}
                    onChange={e => setEditAreaSqm(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap text-xs">
                    ~{puccaBigha} Bigha
                  </span>
                </div>
              </div>
            </div>

            {/* Ownership & Verification */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs border-b border-slate-100 dark:border-slate-700 pb-1.5">
                2. Ownership & Verification Status
              </span>
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Registered Land Owner
                </label>
                <input
                  type="text"
                  value={editOwner}
                  onChange={e => setEditOwner(e.target.value)}
                  placeholder="e.g. Rameshwar Lal Gurjar"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Share Fraction
                  </label>
                  <input
                    type="text"
                    value={editShare}
                    onChange={e => setEditShare(e.target.value)}
                    placeholder="1/1"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Verification Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="VERIFIED">✅ Safe / Verified Record</option>
                    <option value="DISPUTED">⚠️ Active Court Dispute</option>
                    <option value="UNVERIFIED">❓ Under Survey Checking</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Financial & Legal */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs border-b border-slate-100 dark:border-slate-700 pb-1.5">
                3. Loans & Disputes (Optional)
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Bank Mortgage
                  </label>
                  <input
                    type="text"
                    value={editBank}
                    onChange={e => setEditBank(e.target.value)}
                    placeholder="e.g. State Bank of India"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Loan Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={editLoanAmount}
                    onChange={e => setEditLoanAmount(e.target.value)}
                    placeholder="3500000"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {editStatus === 'DISPUTED' && (
                <div>
                  <label className="text-[11px] font-bold text-rose-600 dark:text-rose-400 block mb-1">
                    Dispute / Court Case Details
                  </label>
                  <input
                    type="text"
                    value={editDisputeCase}
                    onChange={e => setEditDisputeCase(e.target.value)}
                    placeholder="Civil Suit No. 182/2023 - Partition"
                    className="w-full p-2.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Surveyor / Admin Notes
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  placeholder="Optional field notes or Bhunaksha certified remarks..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={savingEdit}
                className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{savingEdit ? 'Saving Changes...' : 'Save Changes'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (report) initEditForm(report);
                  setIsEditing(false);
                }}
                className="px-4 py-3 rounded-2xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
            </div>

          </form>
        ) : (
          /* ==================================================================== */
          /* VIEW MODE: NORMAL LAND DETAILS & TOKEN-GATED INTELLIGENCE           */
          /* ==================================================================== */
          <>
            {/* 1. Basic Free Land Details */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between text-xs border-b border-slate-100 dark:border-slate-700 pb-2.5">
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                  <span>Basic Land Details</span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full font-bold">
                    Free
                  </span>
                </span>
                <button
                  onClick={() => setShowConverter(!showConverter)}
                  className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-bold flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  Area Converter
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3.5 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Type of Land</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    {report?.basic.land_classification.replace(/_/g, ' ') || 'Farm Land'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Official Village Code</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                    {report?.basic.village_code || '03807600'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Land Area (Bigha)</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                    {puccaBigha} Bigha
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Metric Area (Hectares)</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                    {hectares} Ha ({sqm.toLocaleString()} m²)
                  </span>
                </div>
              </div>

              {/* Unit Converter Modal/Expansion */}
              {showConverter && (
                <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-700 space-y-2 text-xs animate-fade-in">
                  <span className="text-slate-500 dark:text-slate-400 font-bold block text-[11px]">
                    Area Breakdown in Common Indian Units:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Pucca Bigha</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">{puccaBigha} Bigha</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Biswa (1/20 Bigha)</span>
                      <span className="text-slate-800 dark:text-slate-200 font-bold">{biswa} Biswa</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Square Feet</span>
                      <span className="text-slate-800 dark:text-slate-200 font-bold">{Number(sqft).toLocaleString()} sq. ft</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Square Metres</span>
                      <span className="text-slate-800 dark:text-slate-200 font-bold">{sqm.toLocaleString()} m²</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Coordinates copy */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  GPS Map Boundary
                </span>
                <button
                  onClick={copyCoordinates}
                  className="text-[11px] text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 flex items-center gap-1 font-medium transition-colors"
                >
                  {copiedCoords ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCoords ? 'Coordinates Copied!' : 'Copy Coordinates'}
                </button>
              </div>
            </div>

            {/* 2. Smart Land & Satellite Building Check */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs border-b border-slate-100 dark:border-slate-700 pb-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>Satellite Building Check</span>
                </span>
                <span className="text-[10px] font-bold text-sky-800 dark:text-sky-300 bg-sky-100 dark:bg-sky-950/80 px-2 py-0.5 rounded-full">
                  Satellite Scan
                </span>
              </div>

              <div className="p-3 rounded-xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    {landAnalysis?.detected_classification === 'BUILDINGS_DETECTED' ? (
                      <>
                        <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span>Buildings Detected on Satellite</span>
                      </>
                    ) : (
                      <>
                        <Trees className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>No Visible Buildings (Open / Vacant Land)</span>
                      </>
                    )}
                  </span>
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                    {landAnalysis ? `${landAnalysis.confidence_score}% Confidence` : '94% Confidence'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  {landAnalysis?.detected_classification === 'BUILDINGS_DETECTED' 
                    ? 'Permanent roof or building footprints are visible on recent satellite photos.'
                    : 'Satellite view shows open ground with no visible permanent concrete foundations.'}
                </p>
              </div>

              <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed italic bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <strong>Important note:</strong> Visible satellite imagery does not establish legal ownership or government availability. Open land may still be privately owned or mortgaged.
              </div>
            </div>

            {/* 3. Detailed Token-Gated Checks */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">Verified Legal Records</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Unlock with Tokens</span>
              </div>

              {/* Owner Details */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">1. Current Land Owner</span>
                  </div>
                  
                  {!isCategoryUnlocked('OWNERSHIP') ? (
                    <button
                      disabled={!report?.availability.ownership || unlockingCategory === 'OWNERSHIP'}
                      onClick={() => handleUnlock('OWNERSHIP')}
                      className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 transition-all shadow-sm"
                    >
                      <Lock className="w-3 h-3" />
                      <span>Unlock (1 Token)</span>
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-bold">
                      <Unlock className="w-3.5 h-3.5" /> Unlocked
                    </span>
                  )}
                </div>

                {isCategoryUnlocked('OWNERSHIP') && report?.records.ownership && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700 text-xs space-y-1 text-slate-700 dark:text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Owner Name:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{report.records.ownership.owner_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Relative:</span>
                      <span>{report.records.ownership.relation_type}: {report.records.ownership.relation_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Ownership Share:</span>
                      <span>{report.records.ownership.share_fraction}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 pt-1">
                      Source: {report.records.ownership.source} (Verified: {report.records.ownership.last_verified})
                    </div>
                  </div>
                )}
              </div>

              {/* Land Disputes / Court Cases */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Scale className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">2. Land Disputes & Court Cases</span>
                  </div>

                  {!isCategoryUnlocked('LEGAL_DISPUTES') ? (
                    <button
                      disabled={!report?.availability.legal_disputes || unlockingCategory === 'LEGAL_DISPUTES'}
                      onClick={() => handleUnlock('LEGAL_DISPUTES')}
                      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-all shadow-sm ${
                        report?.availability.legal_disputes 
                          ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      <Lock className="w-3 h-3" />
                      <span>{report?.availability.legal_disputes ? 'Unlock (2 Tokens)' : 'No Disputes Found'}</span>
                    </button>
                  ) : (
                    <span className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 font-bold">
                      <Unlock className="w-3.5 h-3.5" /> Unlocked
                    </span>
                  )}
                </div>

                {isCategoryUnlocked('LEGAL_DISPUTES') && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700 text-xs space-y-2">
                    {report?.records.legal_disputes ? (
                      <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs">
                        <span className="font-bold block text-[11px] text-rose-900 dark:text-rose-200">
                          {report.records.legal_disputes.dispute_type} ({report.records.legal_disputes.dispute_status})
                        </span>
                        <p className="mt-1 text-[11px] leading-relaxed">
                          {report.records.legal_disputes.description}
                        </p>
                      </div>
                    ) : (
                      <div className="text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-1.5 font-medium">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> No court disputes found on this land.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bank Loans / Mortgages */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Landmark className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">3. Bank Loans & Mortgages</span>
                  </div>

                  {!isCategoryUnlocked('ENCUMBRANCE') ? (
                    <button
                      disabled={!report?.availability.encumbrance || unlockingCategory === 'ENCUMBRANCE'}
                      onClick={() => handleUnlock('ENCUMBRANCE')}
                      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-all shadow-sm ${
                        report?.availability.encumbrance 
                          ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      <Lock className="w-3 h-3" />
                      <span>{report?.availability.encumbrance ? 'Unlock (2 Tokens)' : 'No Bank Loan Found'}</span>
                    </button>
                  ) : (
                    <span className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1 font-bold">
                      <Unlock className="w-3.5 h-3.5" /> Unlocked
                    </span>
                  )}
                </div>

                {isCategoryUnlocked('ENCUMBRANCE') && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700 text-xs space-y-1.5">
                    {report?.records.encumbrance ? (
                      <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs">
                        <div className="font-bold flex justify-between">
                          <span>{report.records.encumbrance.financial_institution}</span>
                          <span className="text-amber-800 dark:text-amber-300">₹{report.records.encumbrance.amount_inr.toLocaleString()}</span>
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400">SRO Ref: {report.records.encumbrance.registration_number}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">Status: {report.records.encumbrance.satisfaction_status}</div>
                      </div>
                    ) : (
                      <div className="text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-1.5 font-medium">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> No registered bank loans found.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Government Land Check */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Ban className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">4. Government Land Check</span>
                  </div>

                  {!isCategoryUnlocked('GOVERNMENT_LAND') ? (
                    <button
                      disabled={!report?.availability.government_land || unlockingCategory === 'GOVERNMENT_LAND'}
                      onClick={() => handleUnlock('GOVERNMENT_LAND')}
                      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-all shadow-sm ${
                        report?.availability.government_land 
                          ? 'bg-sky-600 hover:bg-sky-700 text-white' 
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      <Lock className="w-3 h-3" />
                      <span>{report?.availability.government_land ? 'Unlock (1 Token)' : 'Private Land'}</span>
                    </button>
                  ) : (
                    <span className="text-xs text-sky-700 dark:text-sky-400 flex items-center gap-1 font-bold">
                      <Unlock className="w-3.5 h-3.5" /> Unlocked
                    </span>
                  )}
                </div>

                {isCategoryUnlocked('GOVERNMENT_LAND') && report?.records.government_land && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700 text-xs p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 text-sky-900 dark:text-sky-200">
                    <span className="font-bold block">
                      {report.records.government_land.government_type} ({report.records.government_land.public_purpose_classification})
                    </span>
                    <p className="mt-1 text-[11px] leading-relaxed">
                      {report.records.government_land.restriction_details}
                    </p>
                  </div>
                )}
              </div>

              {/* Complete Package Unlock */}
              {!isCategoryUnlocked('COMPLETE_REPORT') && (
                <button
                  onClick={() => handleUnlock('COMPLETE_REPORT')}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <Coins className="w-4 h-4" />
                  <span>Unlock Full Land Report (5 Tokens)</span>
                </button>
              )}

            </div>
          </>
        )}

      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
        <div className="text-xs text-slate-600 dark:text-slate-400">
          Your Wallet: <span className="font-bold text-emerald-700 dark:text-emerald-400">{walletBalance} Tokens</span>
        </div>
        <button
          onClick={() => setShowDiligenceReport(true)}
          className="px-4 py-2.5 rounded-full bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md"
        >
          <FileText className="w-4 h-4" />
          <span>View Official Report</span>
        </button>
      </div>

      {showDiligenceReport && report && (
        <DueDiligenceReportModal
          isOpen={showDiligenceReport}
          onClose={() => setShowDiligenceReport(false)}
          report={report}
        />
      )}

    </div>
  );
};
