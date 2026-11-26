import React, { useState, useEffect } from 'react';
import { 
  X, Check, Palette, Sparkles, Building2, Landmark, 
  Scale, AlertCircle, ShieldCheck, MapPin, Layers 
} from 'lucide-react';
import { LandGuardApi } from '../services/api';

interface AdminDrawParcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  drawnPoints: [number, number][];
  onParcelCreated: (newParcel: any) => void;
  defaultColor?: string;
  continuousDrawing?: boolean;
  onToggleContinuousDrawing?: () => void;
}

const PRESET_COLORS = [
  { label: 'Farm Land', color: '#16a34a', desc: 'Agricultural' },
  { label: 'Residential', color: '#10b981', desc: 'Housing / Abadi' },
  { label: 'Commercial', color: '#0284c7', desc: 'Shops & Markets' },
  { label: 'Grazing Land', color: '#eab308', desc: 'Charagah Pasture' },
  { label: 'Court Dispute', color: '#dc2626', desc: 'Litigated / Stay' },
  { label: 'Government', color: '#7c3aed', desc: 'Reserved State' },
  { label: 'Water Body', color: '#06b6d4', desc: 'Catchment / Nallah' },
  { label: 'Industrial', color: '#ea580c', desc: 'Factory / RIICO' },
  { label: 'Special Plot', color: '#ec4899', desc: 'Institutional' },
  { label: 'Slate Ground', color: '#475569', desc: 'Rock / Barren' },
];

export function calculatePolygonAreaSqm(coords: [number, number][]): number {
  if (!coords || coords.length < 3) return 5000;
  const latMeters = 110800;
  const lngMeters = 100850;
  let area = 0;
  const n = coords.length;
  for (let i = 0; i < n - 1; i++) {
    const x1 = coords[i][0] * lngMeters;
    const y1 = coords[i][1] * latMeters;
    const x2 = coords[i + 1][0] * lngMeters;
    const y2 = coords[i + 1][1] * latMeters;
    area += (x1 * y2 - x2 * y1);
  }
  if (coords[0][0] !== coords[n - 1][0] || coords[0][1] !== coords[n - 1][1]) {
    const x1 = coords[n - 1][0] * lngMeters;
    const y1 = coords[n - 1][1] * latMeters;
    const x2 = coords[0][0] * lngMeters;
    const y2 = coords[0][1] * latMeters;
    area += (x1 * y2 - x2 * y1);
  }
  return Math.round(Math.abs(area / 2)) || 5000;
}

export const AdminDrawParcelModal: React.FC<AdminDrawParcelModalProps> = ({
  isOpen,
  onClose,
  drawnPoints,
  onParcelCreated,
  defaultColor = '#16a34a',
  continuousDrawing = false,
  onToggleContinuousDrawing
}) => {
  const [color, setColor] = useState(defaultColor);
  const [khasraNumber, setKhasraNumber] = useState('106');
  const [subKhasra, setSubKhasra] = useState('');
  const [landClassification, setLandClassification] = useState('AGRICULTURAL_IRRIGATED');
  const [areaSqm, setAreaSqm] = useState(10000);
  const [ownerName, setOwnerName] = useState('Rameshwar Lal Gurjar s/o Devaram Gurjar');
  const [shareFraction, setShareFraction] = useState('1/1');
  const [verificationStatus, setVerificationStatus] = useState<'VERIFIED' | 'PENDING_VERIFICATION' | 'DISPUTED'>('VERIFIED');
  const [disputeCaseNumber, setDisputeCaseNumber] = useState('');
  const [disputeCourt, setDisputeCourt] = useState('District & Sessions Court, Kota');
  const [encumbranceBank, setEncumbranceBank] = useState('');
  const [encumbranceAmount, setEncumbranceAmount] = useState('');
  const [surveyNotes, setSurveyNotes] = useState('Custom shape surveyed and drawn on satellite imagery map.');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recalculate area whenever drawn points change
  useEffect(() => {
    if (drawnPoints && drawnPoints.length >= 3) {
      const calculated = calculatePolygonAreaSqm(drawnPoints);
      setAreaSqm(calculated);
    }
  }, [drawnPoints]);

  if (!isOpen) return null;

  const bigha = (areaSqm / 2529.28).toFixed(2);
  const hectares = (areaSqm / 10000).toFixed(4);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!khasraNumber.trim()) {
      setError('Please provide a Khasra / Plot number.');
      return;
    }
    if (drawnPoints.length < 3) {
      setError('A valid parcel requires at least 3 points on the map.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Ensure the polygon ring is closed
      const ringCoords = [...drawnPoints];
      const first = ringCoords[0];
      const last = ringCoords[ringCoords.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        ringCoords.push([first[0], first[1]]);
      }

      const res = await LandGuardApi.createProperty({
        khasra_number: khasraNumber.trim(),
        sub_khasra: subKhasra.trim() || undefined,
        land_classification: landClassification,
        area_sqm: Number(areaSqm),
        coordinates: ringCoords,
        owner_name: ownerName.trim() || 'Direct Survey Record',
        share_fraction: shareFraction.trim() || '1/1',
        color: color,
        verification_status: verificationStatus,
        dispute_case_number: verificationStatus === 'DISPUTED' ? (disputeCaseNumber.trim() || 'CS-2026/01') : undefined,
        encumbrance: encumbranceBank.trim() || undefined,
        encumbrance_amount: encumbranceAmount ? Number(encumbranceAmount) : undefined,
        notes: surveyNotes.trim() || undefined,
        is_direct_commit: true,
        auto_commit: true
      });

      onParcelCreated(res.parcel);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to save parcel to map');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in text-slate-800 dark:text-slate-100">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div 
              style={{ backgroundColor: color }} 
              className="w-9 h-9 rounded-2xl flex items-center justify-center text-white font-bold shadow-md transition-colors"
            >
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-serif">Add Custom Parcel to Map</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Shape: <strong>{drawnPoints.length} vertices</strong> • Surface Area: ~{areaSqm.toLocaleString()} m² ({bigha} Bigha)
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. COLOR & VISUAL STYLING */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 block text-xs">
                Parcel Map Color & Theme
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-500 uppercase">{color}</span>
                <input 
                  type="color" 
                  value={color} 
                  onChange={e => setColor(e.target.value)}
                  className="w-7 h-7 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
                  title="Pick Any Custom Color"
                />
              </div>
            </div>

            {/* Color Swatches */}
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {PRESET_COLORS.map(p => (
                <button
                  type="button"
                  key={p.color}
                  onClick={() => setColor(p.color)}
                  className={`h-9 rounded-xl flex flex-col items-center justify-center transition-all transform ${
                    color.toLowerCase() === p.color.toLowerCase()
                      ? 'ring-2 ring-slate-900 ring-offset-2 scale-105 shadow-md'
                      : 'hover:scale-105 shadow-sm opacity-90 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: p.color }}
                  title={`${p.label} (${p.desc})`}
                >
                  {color.toLowerCase() === p.color.toLowerCase() && (
                    <Check className="w-4 h-4 text-white drop-shadow" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 2. PLOT IDENTIFIERS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Khasra / Plot No. *</label>
              <input
                type="text"
                required
                value={khasraNumber}
                onChange={e => setKhasraNumber(e.target.value)}
                placeholder="e.g. 106"
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Sub-Khasra / Division</label>
              <input
                type="text"
                value={subKhasra}
                onChange={e => setSubKhasra(e.target.value)}
                placeholder="e.g. 1 or A (optional)"
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Type of Land</label>
              <select
                value={landClassification}
                onChange={e => setLandClassification(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="AGRICULTURAL_IRRIGATED">🌾 Agricultural (Irrigated / Chahi)</option>
                <option value="AGRICULTURAL_UNIRRIGATED">🌾 Agricultural (Unirrigated / Barani)</option>
                <option value="RESIDENTIAL">🏡 Residential Plot (Abadi)</option>
                <option value="COMMERCIAL">🏢 Commercial / Market Plot</option>
                <option value="INDUSTRIAL_RIICO">🏭 Industrial / RIICO Zone</option>
                <option value="CHARAGAH_PASTURE">🐄 Village Grazing Land (Charagah)</option>
                <option value="GOVERNMENT_RESERVED">🏛️ Government Reserved</option>
                <option value="WATER_BODY">💧 Water Body / Catchment</option>
              </select>
            </div>
          </div>

          {/* 3. AREA & CONVERSIONS */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">Calculated Land Area</span>
              <span className="font-mono text-xs font-bold text-emerald-700">
                {bigha} Bigha ({hectares} Hectares)
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Square Meters</span>
                <input
                  type="number"
                  value={areaSqm}
                  onChange={e => setAreaSqm(Number(e.target.value))}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs font-mono font-bold"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Rajasthan Bigha</span>
                <input
                  type="text"
                  readOnly
                  value={`${bigha} Bigha`}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-slate-100 text-xs font-mono"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Hectares</span>
                <input
                  type="text"
                  readOnly
                  value={`${hectares} Ha`}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-slate-100 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* 4. OWNERSHIP DETAILS */}
          <div className="space-y-3 pt-2">
            <h3 className="font-bold text-slate-900 font-serif text-xs uppercase tracking-wide">
              Ownership Record
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Primary Owner / Khatedar Name</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={e => setOwnerName(e.target.value)}
                  placeholder="e.g. Rameshwar Lal Gurjar s/o Devaram"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Ownership Share</label>
                <input
                  type="text"
                  value={shareFraction}
                  onChange={e => setShareFraction(e.target.value)}
                  placeholder="e.g. 1/1"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* 5. LEGAL DISPUTES & BANK LOAN (ENCUMBRANCE) */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="font-bold text-slate-900 font-serif text-xs uppercase tracking-wide">
              Legal Status & Financial Encumbrance
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Legal Dispute Status</label>
                <select
                  value={verificationStatus}
                  onChange={e => setVerificationStatus(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="VERIFIED">✅ Verified Safe (Clear Title)</option>
                  <option value="PENDING_VERIFICATION">⏳ Under Verification</option>
                  <option value="DISPUTED">⚠️ Active Court Dispute / Stay</option>
                </select>
              </div>

              {verificationStatus === 'DISPUTED' ? (
                <>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Court Name</label>
                    <input
                      type="text"
                      value={disputeCourt}
                      onChange={e => setDisputeCourt(e.target.value)}
                      placeholder="e.g. Civil Court Kota"
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Case / CNR Number</label>
                    <input
                      type="text"
                      value={disputeCaseNumber}
                      onChange={e => setDisputeCaseNumber(e.target.value)}
                      placeholder="e.g. CS-2026/182"
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Bank Mortgage / Loan</label>
                    <input
                      type="text"
                      value={encumbranceBank}
                      onChange={e => setEncumbranceBank(e.target.value)}
                      placeholder="e.g. State Bank of India (or blank)"
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Mortgage Amount (INR)</label>
                    <input
                      type="number"
                      value={encumbranceAmount}
                      onChange={e => setEncumbranceAmount(e.target.value)}
                      placeholder="e.g. 2500000"
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 6. SURVEYOR NOTES */}
          <div className="pt-2 border-t border-slate-100">
            <label className="font-bold text-slate-700 block mb-1">Field Survey Notes / Description</label>
            <textarea
              rows={2}
              value={surveyNotes}
              onChange={e => setSurveyNotes(e.target.value)}
              placeholder="Add physical landmarks, boundary details, or surveyor notes..."
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Continuous Drawing Option */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={continuousDrawing}
                onChange={() => onToggleContinuousDrawing?.()}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 dark:bg-slate-800"
              />
              <span>Draw another parcel immediately after saving</span>
            </label>
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{ backgroundColor: color }}
              className="px-6 py-2.5 rounded-xl text-white font-bold text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving Parcel...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save & Add to Map Immediately</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
