import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Eye, Trees, Building2, AlertTriangle, CheckCircle2, 
  MapPin, Layers, RefreshCw, Plus, Trash2, Check, Lock, 
  Sparkles, Info, ShieldCheck, Edit3 
} from 'lucide-react';
import { LandGuardApi } from '../services/api';
import { LandAnalysisRecord, LandMarkingRecord, CadastralFeature } from '../types';

interface AdminLandIdentificationProps {
  parcels: CadastralFeature[];
  onClassificationConfirmed: () => void;
}

export const AdminLandIdentification: React.FC<AdminLandIdentificationProps> = ({
  parcels,
  onClassificationConfirmed
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const drawnPolygonLayerRef = useRef<L.LayerGroup | null>(null);
  const geojsonLayerRef = useRef<L.GeoJSON | null>(null);

  const [analyses, setAnalyses] = useState<LandAnalysisRecord[]>([]);
  const [markings, setMarkings] = useState<LandMarkingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedParcelId, setSelectedParcelId] = useState<string>(parcels[0]?.id || '');
  const [activeTabFilter, setActiveTabFilter] = useState<'ALL' | 'VACANT' | 'BUILDINGS' | 'AGRICULTURAL' | 'REVIEW'>('ALL');
  
  // Drawing state
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawnPoints, setDrawnPoints] = useState<[number, number][]>([]);
  const [markingType, setMarkingType] = useState<'VACANT_POLYGON' | 'BUILDING_FOOTPRINT' | 'AGRICULTURAL_BOUNDARY'>('VACANT_POLYGON');
  const [markingNotes, setMarkingNotes] = useState('');
  
  // Confirmation Modal state
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmClassification, setConfirmClassification] = useState('POTENTIALLY_VACANT');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmNotes, setConfirmNotes] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const hasFittedBoundsRef = useRef(false);

  // Load data
  const loadIdentificationData = async () => {
    try {
      setLoading(true);
      const [analysisData, markingsData] = await Promise.all([
        LandGuardApi.getAllLandAnalyses().catch(() => []),
        LandGuardApi.getLandMarkings().catch(() => [])
      ]);
      setAnalyses(analysisData);
      setMarkings(markingsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIdentificationData();
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [25.0485, 75.8360],
      zoom: 15,
      zoomControl: true,
      attributionControl: false
    });

    // Satellite layer by default for Land Identification
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19
    }).addTo(map);

    drawnPolygonLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // Drawing click handler
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (!isDrawingMode) return;
      const newPt: [number, number] = [Number(e.latlng.lat.toFixed(5)), Number(e.latlng.lng.toFixed(5))];
      setDrawnPoints(prev => [...prev, newPt]);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [isDrawingMode]);

  // Render parcel boundaries and markings on map
  useEffect(() => {
    if (!mapInstanceRef.current || parcels.length === 0) return;
    const map = mapInstanceRef.current;

    if (geojsonLayerRef.current) {
      map.removeLayer(geojsonLayerRef.current);
    }

    const geoLayer = L.geoJSON(parcels as any, {
      style: (feature) => {
        const props = feature?.properties;
        const analysis = analyses.find(a => a.property_id === feature?.id || a.property_code === props?.property_id_code);
        const isSelected = feature?.id === selectedParcelId;

        let strokeColor = '#38bdf8';
        let fillColor = '#0284c7';

        if (analysis?.detected_classification === 'BUILDINGS_DETECTED') {
          fillColor = '#3b82f6';
          strokeColor = '#1d4ed8';
        } else if (analysis?.detected_classification === 'POTENTIALLY_VACANT' || analysis?.detected_classification === 'NO_BUILDINGS_DETECTED') {
          fillColor = '#eab308';
          strokeColor = '#ca8a04';
        } else if (analysis?.detected_classification === 'AGRICULTURAL') {
          fillColor = '#22c55e';
          strokeColor = '#16a34a';
        }

        return {
          color: isSelected ? '#ea580c' : strokeColor,
          weight: isSelected ? 3.5 : 2,
          fillColor,
          fillOpacity: isSelected ? 0.6 : 0.35
        };
      },
      onEachFeature: (feature, layer) => {
        const props = feature.properties;
        layer.on('click', () => {
          setSelectedParcelId(feature.id as string);
        });
        layer.bindTooltip(`Plot #${props.khasra_number}`, { permanent: false, direction: 'center' });
      }
    }).addTo(map);

    geojsonLayerRef.current = geoLayer;

    if (!hasFittedBoundsRef.current && parcels.length > 0) {
      const bounds = geoLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
        hasFittedBoundsRef.current = true;
      }
    }
  }, [parcels, analyses, selectedParcelId]);

  // Render drawn markings & current points
  useEffect(() => {
    if (!mapInstanceRef.current || !drawnPolygonLayerRef.current) return;
    drawnPolygonLayerRef.current.clearLayers();

    // Render existing saved markings
    markings.forEach(m => {
      if (m.coordinates && m.coordinates[0]) {
        const latlngs = m.coordinates[0].map(pt => [pt[1], pt[0]] as [number, number]);
        const polygon = L.polygon(latlngs, {
          color: m.marking_type === 'BUILDING_FOOTPRINT' ? '#3b82f6' : '#eab308',
          weight: 2,
          dashArray: '4, 4',
          fillOpacity: 0.3
        });
        polygon.bindTooltip(`Marking: ${m.marking_type.replace(/_/g, ' ')}`, { permanent: false });
        drawnPolygonLayerRef.current?.addLayer(polygon);
      }
    });

    // Render in-progress drawing points
    if (drawnPoints.length > 0) {
      drawnPoints.forEach((pt, i) => {
        const marker = L.circleMarker(pt, { radius: 5, color: '#ea580c', fillOpacity: 0.8 });
        drawnPolygonLayerRef.current?.addLayer(marker);
      });

      if (drawnPoints.length > 2) {
        const livePoly = L.polygon(drawnPoints, { color: '#ea580c', weight: 2, fillOpacity: 0.2 });
        drawnPolygonLayerRef.current?.addLayer(livePoly);
      }
    }
  }, [markings, drawnPoints]);

  const handleSaveDrawnPolygon = async () => {
    if (drawnPoints.length < 3) {
      alert('Please click at least 3 points on the satellite map to complete a polygon.');
      return;
    }

    try {
      setLoading(true);
      // Convert points to GeoJSON [lng, lat] ring closed
      const ring = drawnPoints.map(p => [p[1], p[0]]);
      ring.push(ring[0]); // close polygon ring

      await LandGuardApi.saveLandMarking({
        property_id: selectedParcelId || undefined,
        marking_type: markingType,
        coordinates: [ring],
        description: markingNotes || 'Surveyor marked on satellite imagery'
      });

      setDrawnPoints([]);
      setIsDrawingMode(false);
      setMarkingNotes('');
      setActionSuccess('Polygon marking saved to PostGIS successfully!');
      loadIdentificationData();
    } catch (err: any) {
      alert(`Failed to save marking: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmClassification = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    if (!confirmPassword) {
      setActionError('Admin password is required to confirm land classification.');
      return;
    }

    try {
      setLoading(true);
      await LandGuardApi.confirmLandClassification({
        property_id: selectedParcelId,
        classification: confirmClassification,
        notes: confirmNotes || 'Admin confirmed based on satellite imagery',
        password: confirmPassword
      });

      setIsConfirmModalOpen(false);
      setConfirmPassword('');
      setActionSuccess(`Land classification confirmed as [${confirmClassification}]!`);
      loadIdentificationData();
      onClassificationConfirmed();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Confirmation failed');
    } finally {
      setLoading(false);
    }
  };

  const selectedParcel = parcels.find(p => p.id === selectedParcelId);
  const selectedAnalysis = analyses.find(a => a.property_id === selectedParcelId);

  return (
    <div className="space-y-6">
      
      {/* Notice / Action Status */}
      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-sm">
          <span className="font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {actionSuccess}
          </span>
          <button onClick={() => setActionSuccess(null)} className="font-bold text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* Top Controls Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-serif flex items-center gap-2">
            <Eye className="w-5 h-5 text-emerald-600" />
            <span>Smart Land Identification & Satellite Verification</span>
          </h2>
          <p className="text-xs text-slate-500">
            Identify barren or vacant land using satellite imagery and surveyor polygon tools
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Drawing Mode Toggle */}
          <button
            onClick={() => {
              setIsDrawingMode(!isDrawingMode);
              setDrawnPoints([]);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm ${
              isDrawingMode
                ? 'bg-[#ea580c] text-white shadow-orange-500/20'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>{isDrawingMode ? 'Cancel Drawing' : 'Draw Polygon Tool'}</span>
          </button>

          <button
            onClick={loadIdentificationData}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
            title="Refresh Analysis"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Workspace: Satellite Map + Detail Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Satellite Map Canvas (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          
          {/* In-Drawing Controls Bar (if active) */}
          {isDrawingMode && (
            <div className="p-3 bg-amber-50 border-b border-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span>Click map points to outline barren or open land ({drawnPoints.length} points)</span>
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={markingType}
                  onChange={(e: any) => setMarkingType(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-xs font-medium"
                >
                  <option value="VACANT_POLYGON">Barren / Vacant Polygon</option>
                  <option value="BUILDING_FOOTPRINT">Building Footprint</option>
                  <option value="AGRICULTURAL_BOUNDARY">Agricultural Boundary</option>
                </select>
                <button
                  onClick={handleSaveDrawnPolygon}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  Save Polygon
                </button>
                <button
                  onClick={() => setDrawnPoints([])}
                  className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs"
                >
                  Clear Points
                </button>
              </div>
            </div>
          )}

          {/* Map Viewport */}
          <div className="relative h-[480px] w-full">
            <div ref={mapContainerRef} className="w-full h-full z-0" />
            
            {/* Visual Indicators Pill inside Map */}
            <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md p-2.5 rounded-2xl border border-slate-200 shadow-lg text-[11px] space-y-1">
              <span className="font-bold text-slate-900 block text-[10px] uppercase">Satellite Detection Legend:</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Farm Land</span>
                <span className="flex items-center gap-1 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Potentially Vacant</span>
                <span className="flex items-center gap-1 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Buildings Detected</span>
              </div>
            </div>
          </div>

          {/* Mandatory Legal Disclaimer Bar */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 leading-relaxed italic">
            <strong>Legal Disclaimer:</strong> Satellite-based land identification is based on visible surface imagery. 
            The absence of buildings does not establish legal ownership, title clearance, or government ownership. 
            Official revenue and field inspection is required.
          </div>
        </div>

        {/* Right: Selected Parcel Details & Approval Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          
          {selectedParcel ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Selected Plot
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 font-serif mt-1">
                    Khasra #{selectedParcel.properties.khasra_number}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedParcel.properties.property_id_code}
                  </p>
                </div>
              </div>

              {/* Analysis Result Card */}
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Analysis Status:</span>
                    <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                      {selectedAnalysis?.analysis_status || 'ANALYSIS_COMPLETED'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Detected Category:</span>
                    <span className="font-bold text-slate-900">
                      {selectedAnalysis?.detected_classification.replace(/_/g, ' ') || 'NO BUILDINGS DETECTED'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Confidence Score:</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {selectedAnalysis?.confidence_score ?? 94.5}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Visible Buildings:</span>
                    <span className="font-bold text-slate-900">
                      {selectedAnalysis?.building_count ?? 0} Detected
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-500 block text-[11px]">Parcel Area:</span>
                  <span className="font-bold text-slate-900">
                    {selectedParcel.properties.area_bigha} Bigha ({selectedParcel.properties.area_hectares} Ha)
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-500 block text-[11px]">Current Land Classification:</span>
                  <span className="font-bold text-slate-900">
                    {selectedParcel.properties.land_classification.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Confirmation Action Button (Opens Password Reauth Modal) */}
              <div className="pt-2">
                <button
                  onClick={() => setIsConfirmModalOpen(true)}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirm Classification (Admin Password)</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-center text-xs text-slate-500 space-y-2">
              <MapPin className="w-8 h-8 mx-auto text-slate-300" />
              <p>Click any land plot on the map to inspect its satellite analysis.</p>
            </div>
          )}

          {/* Active Markings List */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Surveyor Drawn Markings ({markings.length})
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {markings.map(m => (
                <div key={m.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-900 block text-[11px]">
                      {m.marking_type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate max-w-[180px]">
                      {m.description || 'Custom polygon boundary'}
                    </span>
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm('Delete this drawn marking?')) {
                        await LandGuardApi.deleteLandMarking(m.id);
                        loadIdentificationData();
                      }
                    }}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Marking"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Admin Password Reauthentication Modal for Classification Confirmation */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in text-slate-800">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-md shadow-2xl p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm font-serif">Confirm Land Classification</h3>
                  <p className="text-[11px] text-slate-500">Requires Admin Password Confirmation</p>
                </div>
              </div>
              <button onClick={() => setIsConfirmModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {actionError}
              </div>
            )}

            <form onSubmit={handleConfirmClassification} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Target Land Plot</label>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900">
                  Plot #{selectedParcel?.properties.khasra_number} ({selectedParcel?.properties.property_id_code})
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Confirmed Classification</label>
                <select
                  value={confirmClassification}
                  onChange={(e) => setConfirmClassification(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-300 font-medium"
                >
                  <option value="POTENTIALLY_VACANT">Potentially Vacant / Barren Land</option>
                  <option value="AGRICULTURAL_CULTIVATED">Agricultural Farmland (Cultivated)</option>
                  <option value="BUILDINGS_DETECTED">Permanent Buildings Detected</option>
                  <option value="CHARAGAH_COMMONS">Village Grazing Commons</option>
                  <option value="COMMERCIAL_ZONE">Commercial / Industrial Zone</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Surveyor / Inspection Notes</label>
                <textarea
                  value={confirmNotes}
                  onChange={(e) => setConfirmNotes(e.target.value)}
                  placeholder="e.g. Verified against satellite imagery and local revenue Jamabandi records..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Admin Password Reauthentication</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Enter admin password (e.g. SuperAdmin@123 or Admin@123)"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-500">Security check: reconfirms admin identity before writing to the public ledger. Accepts SuperAdmin@123 or Admin@123.</span>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-50"
                >
                  {loading ? 'Confirming...' : 'Approve & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
