import React, { useState } from 'react';
import { X, Layers, Plus, Edit3, Shield, Check, AlertCircle, ArrowRight } from 'lucide-react';
import { CadastralFeature } from '../types';
import { LandGuardApi } from '../services/api';

interface AdminMapEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  parcels: CadastralFeature[];
  selectedPropertyId: string | null;
  onMutationSubmitted: () => void;
}

export const AdminMapEditorModal: React.FC<AdminMapEditorModalProps> = ({
  isOpen,
  onClose,
  parcels,
  selectedPropertyId,
  onMutationSubmitted
}) => {
  const [tab, setTab] = useState<'EDIT_BOUNDARY' | 'ADD_PARCEL'>('EDIT_BOUNDARY');
  
  // Edit Boundary State
  const initialParcelId = selectedPropertyId || (parcels.length > 0 ? parcels[0].id : '');
  const [targetPropertyId, setTargetPropertyId] = useState<string>(initialParcelId);
  const selectedParcel = parcels.find(p => p.id === targetPropertyId) || parcels[0];
  
  const [coordText, setCoordText] = useState<string>(() => {
    return selectedParcel ? JSON.stringify(selectedParcel.geometry.coordinates[0], null, 2) : '';
  });
  const [justification, setJustification] = useState('Surveyed boundary realignment based on certified Bhunaksha field sheet.');

  // Add Parcel State
  const [newKhasra, setNewKhasra] = useState('106');
  const [newSubKhasra, setNewSubKhasra] = useState('');
  const [newClassification, setNewClassification] = useState('AGRICULTURAL_IRRIGATED');
  const [newAreaSqm, setNewAreaSqm] = useState(12000);
  const [newOwner, setNewOwner] = useState('Sita Devi w/o Rameshwar Gurjar');
  const [newCoordsText, setNewCoordsText] = useState(
    JSON.stringify([
      [75.8285, 25.0420],
      [75.8325, 25.0420],
      [75.8325, 25.0448],
      [75.8285, 25.0448],
      [75.8285, 25.0420]
    ], null, 2)
  );

  const [loading, setLoading] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleParcelSelect = (pId: string) => {
    setTargetPropertyId(pId);
    const p = parcels.find(item => item.id === pId);
    if (p) {
      setCoordText(JSON.stringify(p.geometry.coordinates[0], null, 2));
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);
    setLoading(true);

    try {
      let parsedCoords: [number, number][];
      try {
        parsedCoords = JSON.parse(coordText);
      } catch (err) {
        throw new Error('Invalid JSON format for coordinates array. Must be [[lng, lat], [lng, lat], ...]');
      }

      const res = await LandGuardApi.proposeBoundaryUpdate(targetPropertyId, parsedCoords, justification, true);
      setSuccessNotice(res.message);
      onMutationSubmitted();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to submit boundary update');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);
    setLoading(true);

    try {
      let parsedCoords: [number, number][];
      try {
        parsedCoords = JSON.parse(newCoordsText);
      } catch (err) {
        throw new Error('Invalid JSON format for coordinates array.');
      }

      const res = await LandGuardApi.createProperty({
        khasra_number: newKhasra,
        sub_khasra: newSubKhasra || undefined,
        land_classification: newClassification,
        area_sqm: Number(newAreaSqm),
        coordinates: parsedCoords,
        owner_name: newOwner,
        is_direct_commit: true,
        auto_commit: true
      });

      setSuccessNotice(res.message);
      onMutationSubmitted();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to submit new parcel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center border border-brand-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Cadastre GIS Map Editor</h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  TWO-MAN RULE
                </span>
              </div>
              <p className="text-xs text-slate-400">Ranpur Cadastre Boundary Digitization & Realignment Suite</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-950">
          <button
            onClick={() => { setTab('EDIT_BOUNDARY'); setErrorMessage(null); setSuccessNotice(null); }}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 transition-colors border-b-2 ${
              tab === 'EDIT_BOUNDARY'
                ? 'border-brand-500 text-brand-400 bg-slate-900/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Modify Parcel Geometry
          </button>
          <button
            onClick={() => { setTab('ADD_PARCEL'); setErrorMessage(null); setSuccessNotice(null); }}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 transition-colors border-b-2 ${
              tab === 'ADD_PARCEL'
                ? 'border-brand-500 text-brand-400 bg-slate-900/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Digitize New Khasra Parcel
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {successNotice && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {tab === 'EDIT_BOUNDARY' ? (
            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">Select Target Parcel</label>
                <select
                  value={targetPropertyId}
                  onChange={(e) => handleParcelSelect(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {parcels.map((p) => (
                    <option key={p.id} value={p.id}>
                      Khasra {p.properties.khasra_number}{p.properties.sub_khasra ? `/${p.properties.sub_khasra}` : ''} ({p.properties.property_id_code}) - {p.properties.land_classification}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-semibold block">Polygon Coordinates (WGS 84 [Longitude, Latitude])</label>
                  <span className="text-[10px] text-slate-500 font-mono">EPSG:4326 Ring Array</span>
                </div>
                <textarea
                  rows={8}
                  value={coordText}
                  onChange={(e) => setCoordText(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">Administrative Survey Justification</label>
                <input
                  type="text"
                  required
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed flex items-start gap-2">
                <Shield className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Two-Man Rule Protocol:</strong> This boundary adjustment will be registered in <code>property_change_requests</code> in <strong>PENDING</strong> state. The live cadastral map will only update after formal review by a Super Admin.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{loading ? 'Validating Geometry...' : 'Submit Boundary Change for Approval'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold block">Khasra Number</label>
                  <input
                    type="text"
                    required
                    value={newKhasra}
                    onChange={(e) => setNewKhasra(e.target.value)}
                    placeholder="e.g. 106"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold block">Subdivision / Min-Khasra</label>
                  <input
                    type="text"
                    value={newSubKhasra}
                    onChange={(e) => setNewSubKhasra(e.target.value)}
                    placeholder="e.g. 1 (optional)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold block">Land Classification</label>
                  <select
                    value={newClassification}
                    onChange={(e) => setNewClassification(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="AGRICULTURAL_IRRIGATED">Agricultural Irrigated (Chahi)</option>
                    <option value="AGRICULTURAL_UNIRRIGATED">Agricultural Unirrigated (Barani)</option>
                    <option value="COMMERCIAL">Commercial Real Estate</option>
                    <option value="INDUSTRIAL_RIICO">Industrial (RIICO Allotment)</option>
                    <option value="RESIDENTIAL">Residential (Abadi Deh)</option>
                    <option value="CHARAGAH_PASTURE">Charagah (Pasture Commons)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold block">Metric Area (Square Metres)</label>
                  <input
                    type="number"
                    required
                    value={newAreaSqm}
                    onChange={(e) => setNewAreaSqm(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">Initial Recorded Tenure Holder / Owner</label>
                <input
                  type="text"
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">Boundary Coordinates Ring (GeoJSON Polygon)</label>
                <textarea
                  rows={5}
                  value={newCoordsText}
                  onChange={(e) => setNewCoordsText(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{loading ? 'Submitting...' : 'Submit New Khasra to Verification Queue'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
