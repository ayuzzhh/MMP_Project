import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { 
  Layers, Search, MapPin, ZoomIn, ZoomOut, AlertTriangle, 
  CheckCircle2, Compass, Edit3, Filter, Crosshair, Maximize2, 
  FileText, ShieldCheck, Eye, Trees, Building2, Check, X, Palette, 
  RotateCcw, Trash2, Scale, Save, Move
} from 'lucide-react';
import { CadastralCollection, CadastralFeature } from '../types';
import { LandGuardApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AdminMapEditorModal } from './AdminMapEditorModal';
import { AdminDrawParcelModal, calculatePolygonAreaSqm } from './AdminDrawParcelModal';

interface InteractiveMapProps {
  onSelectProperty: (propertyId: string | null) => void;
  selectedPropertyId: string | null;
  editingBoundaryPropertyId?: string | null;
  onFinishBoundaryEdit?: () => void;
  onPropertyMutated?: () => void;
  refreshTrigger?: number;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  onSelectProperty,
  selectedPropertyId,
  editingBoundaryPropertyId,
  onFinishBoundaryEdit,
  onPropertyMutated,
  refreshTrigger
}) => {
  const { isAdmin } = useAuth();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geojsonLayerRef = useRef<L.GeoJSON | null>(null);
  const centroidMarkersRef = useRef<L.LayerGroup | null>(null);
  const drawingLayerRef = useRef<L.LayerGroup | null>(null);
  const boundaryEditLayerRef = useRef<L.LayerGroup | null>(null);
  const isDrawingModeRef = useRef<boolean>(false);

  const [viewMode, setViewMode] = useState<'normal' | 'sheet'>('normal');
  const [mapType, setMapType] = useState<'street' | 'satellite' | 'topo'>('street');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [cadastreData, setCadastreData] = useState<CadastralCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [currentZoom, setCurrentZoom] = useState(15);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const hasFittedBoundsRef = useRef(false);

  // Freehand / Polygon Map Drawing State
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawnPoints, setDrawnPoints] = useState<[number, number][]>([]);
  const [isDrawModalOpen, setIsDrawModalOpen] = useState(false);
  const [drawColor, setDrawColor] = useState('#16a34a');
  const [newlyCreatedParcelNotice, setNewlyCreatedParcelNotice] = useState<string | null>(null);
  const [continuousDrawing, setContinuousDrawing] = useState(false);

  // Boundary Vertex Editing State
  const [editingVertices, setEditingVertices] = useState<[number, number][]>([]);
  const [initialVertices, setInitialVertices] = useState<[number, number][]>([]);
  const [savingBoundary, setSavingBoundary] = useState(false);
  const [boundarySaveError, setBoundarySaveError] = useState<string | null>(null);

  // 100% Free, Reliable, Zero-Watermark & No API Key Tile Providers
  const streetTileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const satelliteTileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
  const topoTileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const getTileUrl = (type: 'street' | 'satellite' | 'topo') => {
    if (type === 'satellite') return satelliteTileUrl;
    if (type === 'topo') return topoTileUrl;
    return streetTileUrl;
  };

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Ranpur coordinates: 25.0485° N, 75.8360° E
    const map = L.map(mapContainerRef.current, {
      center: [25.0485, 75.8360],
      zoom: 15,
      zoomControl: false,
      attributionControl: false
    });

    const initialTileUrl = getTileUrl(mapType);
    const tileLayer = L.tileLayer(initialTileUrl, {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c']
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    mapInstanceRef.current = map;
    centroidMarkersRef.current = L.layerGroup().addTo(map);
    drawingLayerRef.current = L.layerGroup().addTo(map);
    boundaryEditLayerRef.current = L.layerGroup().addTo(map);

    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setCursorCoords({
        lat: Number(e.latlng.lat.toFixed(5)),
        lng: Number(e.latlng.lng.toFixed(5))
      });
    });

    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    // Point-in-polygon click or drawing mode point placement
    map.on('click', async (e: L.LeafletMouseEvent) => {
      if (isDrawingModeRef.current) {
        const pt: [number, number] = [
          Number(e.latlng.lng.toFixed(6)),
          Number(e.latlng.lat.toFixed(6))
        ];
        setDrawnPoints(prev => [...prev, pt]);
        return;
      }

      // If in boundary editing mode, clicks don't deselect
      if (editingBoundaryPropertyId) {
        return;
      }

      try {
        const identified = await LandGuardApi.identifyProperty(e.latlng.lat, e.latlng.lng);
        if (identified && identified.id) {
          onSelectProperty(identified.id);
        }
      } catch (err) {
        // No parcel
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 200);
    }
  }, [viewMode]);

  // Adjust cursor style during drawing mode
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (isDrawingMode) {
      mapContainerRef.current.style.cursor = 'crosshair';
    } else {
      mapContainerRef.current.style.cursor = '';
    }
  }, [isDrawingMode]);

  // 2. Load Cadastre GeoJSON (Supports silent background reload to prevent blocking overlays)
  const loadCadastre = async (silent: boolean = false) => {
    try {
      if (!silent && !cadastreData) {
        setLoading(true);
      }
      const data = await LandGuardApi.getCadastre({ villageCode: '03807600' });
      setCadastreData(data);
    } catch (err) {
      console.error('Failed to load land data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCadastre(false);
  }, []);

  // Silent refresh on external triggers
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      loadCadastre(true);
    }
  }, [refreshTrigger]);

  // 3. Switch Tile Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    tileLayerRef.current.setUrl(getTileUrl(mapType));
  }, [mapType]);

  // 4. Render live drawing pins and preview polygon
  useEffect(() => {
    if (!drawingLayerRef.current || !mapInstanceRef.current) return;
    const layer = drawingLayerRef.current;
    layer.clearLayers();

    if (!isDrawingMode || drawnPoints.length === 0) return;

    // Render vertex points with numbered markers
    drawnPoints.forEach((pt, index) => {
      const marker = L.circleMarker([pt[1], pt[0]], {
        radius: 6,
        color: '#ffffff',
        fillColor: drawColor || '#ea580c',
        fillOpacity: 1,
        weight: 2
      });
      marker.bindTooltip(`Point #${index + 1}`, { permanent: false, direction: 'top' });
      layer.addLayer(marker);
    });

    const latlngs = drawnPoints.map(pt => [pt[1], pt[0]] as [number, number]);

    // Render polyline if 2+ points
    if (drawnPoints.length >= 2) {
      const polyline = L.polyline(latlngs, {
        color: drawColor || '#ea580c',
        weight: 2.5,
        dashArray: '5, 5'
      });
      layer.addLayer(polyline);
    }

    // Render filled preview polygon if 3+ points
    if (drawnPoints.length >= 3) {
      const polygon = L.polygon(latlngs, {
        color: drawColor || '#ea580c',
        weight: 2.5,
        fillColor: drawColor || '#ea580c',
        fillOpacity: 0.35,
        dashArray: '4, 4'
      });
      layer.addLayer(polygon);
    }
  }, [drawnPoints, isDrawingMode, drawColor]);

  // 5. Initialize Boundary Vertex Editing when requested
  useEffect(() => {
    if (!editingBoundaryPropertyId || !cadastreData) {
      setEditingVertices([]);
      setInitialVertices([]);
      if (boundaryEditLayerRef.current) {
        boundaryEditLayerRef.current.clearLayers();
      }
      return;
    }

    const feature = cadastreData.features.find(f => f.id === editingBoundaryPropertyId);
    if (feature && feature.geometry && feature.geometry.coordinates) {
      const ring = feature.geometry.coordinates[0];
      // Strip duplicated last closing point for vertex handles
      const points = (ring as any[]).slice(0, -1).map((pt: any) => [Number(pt[0]), Number(pt[1])] as [number, number]);
      setEditingVertices(points);
      setInitialVertices(points);

      // Center map on this parcel
      if (mapInstanceRef.current) {
        const bounds = L.geoJSON(feature as any).getBounds();
        mapInstanceRef.current.flyToBounds(bounds, { duration: 0.8, padding: [100, 100] });
      }
    }
  }, [editingBoundaryPropertyId, cadastreData]);

  // 6. Render Draggable Vertex Markers for Boundary Editing
  useEffect(() => {
    if (!boundaryEditLayerRef.current || !mapInstanceRef.current) return;
    const layer = boundaryEditLayerRef.current;
    layer.clearLayers();

    if (!editingBoundaryPropertyId || editingVertices.length < 3) return;

    // Outer polygon preview
    const latlngs = editingVertices.map(pt => [pt[1], pt[0]] as [number, number]);
    const polygon = L.polygon(latlngs, {
      color: '#f59e0b',
      weight: 3.5,
      dashArray: '6, 6',
      fillColor: '#f59e0b',
      fillOpacity: 0.25
    });
    layer.addLayer(polygon);

    // Draggable vertex handles
    editingVertices.forEach((pt, index) => {
      const vertexIcon = L.divIcon({
        className: 'custom-vertex-marker',
        html: `<div class="w-5 h-5 rounded-full bg-amber-500 border-2 border-white shadow-xl cursor-grab active:cursor-grabbing hover:scale-125 transition-transform flex items-center justify-center text-[10px] text-white font-black">${index + 1}</div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const marker = L.marker([pt[1], pt[0]], {
        icon: vertexIcon,
        draggable: true
      });

      marker.on('drag', (e: L.LeafletEvent) => {
        const newPos = (e.target as L.Marker).getLatLng();
        setEditingVertices(prev => {
          const next = [...prev];
          next[index] = [
            Number(newPos.lng.toFixed(6)),
            Number(newPos.lat.toFixed(6))
          ];
          return next;
        });
      });

      layer.addLayer(marker);
    });
  }, [editingVertices, editingBoundaryPropertyId]);

  // 7. Render GeoJSON Polygons & Centroid Badges
  useEffect(() => {
    if (!mapInstanceRef.current || !cadastreData) return;

    const map = mapInstanceRef.current;

    if (geojsonLayerRef.current) {
      map.removeLayer(geojsonLayerRef.current);
    }
    if (centroidMarkersRef.current) {
      centroidMarkersRef.current.clearLayers();
    }

    const geoLayer = L.geoJSON(cadastreData as any, {
      style: (feature) => {
        const props = feature?.properties;
        const isSelected = feature?.id === selectedPropertyId || props?.property_id_code === selectedPropertyId;
        const isBeingEdited = feature?.id === editingBoundaryPropertyId;
        const matchesCategory = selectedCategory === 'ALL' || props?.land_classification === selectedCategory;

        // Village Perimeter Boundary
        if (props?.land_classification === 'REVENUE_VILLAGE_PERIMETER') {
          return {
            color: '#0284c7',
            weight: 3,
            dashArray: '8, 6',
            fillOpacity: 0.02,
            fillColor: '#0284c7'
          };
        }

        // Hide original boundary if active in boundary editing mode
        if (isBeingEdited) {
          return {
            color: 'transparent',
            weight: 0,
            fillColor: 'transparent',
            fillOpacity: 0
          };
        }

        // Friendly color coding
        let fillColor = '#16a34a';
        let strokeColor = '#15803d';

        if (props?.custom_color) {
          fillColor = props.custom_color;
          strokeColor = props.custom_color;
        } else if (props?.verification_status === 'DISPUTED') {
          fillColor = '#e11d48';
          strokeColor = '#be123c';
        } else if (props?.land_classification === 'CHARAGAH_PASTURE') {
          fillColor = '#eab308';
          strokeColor = '#ca8a04';
        } else if (props?.land_classification === 'COMMERCIAL' || props?.land_classification === 'INDUSTRIAL_RIICO') {
          fillColor = '#0284c7';
          strokeColor = '#0369a1';
        }

        const opacity = matchesCategory ? (isSelected ? 0.85 : 0.5) : 0.15;
        const weight = isSelected ? 3.5 : (matchesCategory ? 2 : 1);

        return {
          color: isSelected ? '#ea580c' : (props?.custom_color || (matchesCategory ? strokeColor : '#94a3b8')),
          weight: weight,
          fillColor: fillColor,
          fillOpacity: opacity
        };
      },
      onEachFeature: (feature, layer) => {
        const props = feature.properties;
        if (props.land_classification === 'REVENUE_VILLAGE_PERIMETER') return;

        // Tooltip in simple English
        layer.bindTooltip(
          `<div class="text-xs p-1 font-sans">
            <div class="flex items-center gap-1.5">
              ${props.custom_color ? `<span class="w-2.5 h-2.5 rounded-full" style="background-color: ${props.custom_color}"></span>` : ''}
              <strong class="text-slate-900">Plot #${props.khasra_number}${props.sub_khasra ? '/' + props.sub_khasra : ''}</strong>
            </div>
            <span class="text-[11px] text-emerald-700 font-medium">${props.land_classification.replace(/_/g, ' ')}</span><br/>
            <span class="text-[11px] text-slate-600 font-bold">${props.area_bigha} Bigha (${props.area_sqm} m²)</span>
            ${props.notes ? `<p class="text-[10px] text-slate-500 italic mt-0.5 border-t border-slate-100 pt-0.5">${props.notes}</p>` : ''}
          </div>`,
          { permanent: false, direction: 'top', className: 'bg-white text-slate-900 rounded-xl border border-slate-200 shadow-xl' }
        );

        layer.on({
          click: (e) => {
            // If actively drawing a new parcel, add point to drawing instead of opening drawer!
            if (isDrawingModeRef.current) {
              const pt: [number, number] = [
                Number(e.latlng.lng.toFixed(6)),
                Number(e.latlng.lat.toFixed(6))
              ];
              setDrawnPoints(prev => [...prev, pt]);
              return;
            }

            if (editingBoundaryPropertyId) {
              return;
            }

            L.DomEvent.stopPropagation(e);
            onSelectProperty(feature.id as string);
            const bounds = (layer as any).getBounds();
            map.flyToBounds(bounds, { duration: 0.8, padding: [80, 80] });
          }
        });

        // Centroid Khasra Plot Badge
        if (props.centroid && centroidMarkersRef.current) {
          const isSelected = feature.id === selectedPropertyId || props.property_id_code === selectedPropertyId;

          let badgeBorderClass = 'border-emerald-500 text-emerald-900 dark:text-emerald-200 bg-white/95 dark:bg-slate-900/95';
          let dotColorClass = 'bg-emerald-500';
          let customDotStyle = '';
          let customBorderStyle = '';

          if (props.custom_color) {
            customBorderStyle = `border-color: ${props.custom_color};`;
            customDotStyle = `background-color: ${props.custom_color};`;
          } else if (props.verification_status === 'DISPUTED') {
            badgeBorderClass = 'border-rose-500 text-rose-900 dark:text-rose-200 bg-white/95 dark:bg-slate-900/95';
            dotColorClass = 'bg-rose-500';
          } else if (props.land_classification === 'CHARAGAH_PASTURE') {
            badgeBorderClass = 'border-amber-500 text-amber-900 dark:text-amber-200 bg-white/95 dark:bg-slate-900/95';
            dotColorClass = 'bg-amber-500';
          } else if (props.land_classification === 'COMMERCIAL' || props.land_classification === 'INDUSTRIAL_RIICO') {
            badgeBorderClass = 'border-sky-500 text-sky-900 dark:text-sky-200 bg-white/95 dark:bg-slate-900/95';
            dotColorClass = 'bg-sky-500';
          }

          if (isSelected) {
            badgeBorderClass = 'border-orange-500 text-orange-950 dark:text-orange-100 bg-amber-50 dark:bg-orange-950/90 ring-2 ring-orange-400';
            dotColorClass = 'bg-orange-500';
          }

          const labelHtml = `
            <div style="${customBorderStyle}" class="custom-plot-centroid-marker px-2 py-0.5 rounded-full border shadow-md font-sans text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-transform hover:scale-110 whitespace-nowrap ${badgeBorderClass}">
              <span style="${customDotStyle}" class="w-1.5 h-1.5 rounded-full ${dotColorClass}"></span>
              <span>#${props.khasra_number}${props.sub_khasra ? '/' + props.sub_khasra : ''}</span>
            </div>
          `;

          const centroidIcon = L.divIcon({
            className: 'custom-plot-centroid-marker',
            html: labelHtml,
            iconSize: [60, 24],
            iconAnchor: [30, 12]
          });

          const marker = L.marker([props.centroid[1], props.centroid[0]], { icon: centroidIcon });
          marker.on('click', (e) => {
            if (isDrawingModeRef.current) return;
            L.DomEvent.stopPropagation(e);
            onSelectProperty(feature.id as string);
            const bounds = (layer as any).getBounds();
            map.flyToBounds(bounds, { duration: 0.8, padding: [80, 80] });
          });

          centroidMarkersRef.current.addLayer(marker);
        }
      }
    }).addTo(map);

    geojsonLayerRef.current = geoLayer;

    // Auto-fit bounds on initial load
    if (!hasFittedBoundsRef.current && cadastreData.features.length > 0) {
      const bounds = geoLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        hasFittedBoundsRef.current = true;
      }
    }
  }, [cadastreData, selectedPropertyId, selectedCategory, editingBoundaryPropertyId]);

  // Autocomplete search suggestions
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim() || !cadastreData) return [];
    const term = searchQuery.trim().toLowerCase();
    return cadastreData.features
      .filter(f => f.properties.land_classification !== 'REVENUE_VILLAGE_PERIMETER')
      .filter(f => 
        f.properties.khasra_number.toLowerCase().includes(term) ||
        f.properties.property_id_code.toLowerCase().includes(term) ||
        (f.properties.sub_khasra && `${f.properties.khasra_number}/${f.properties.sub_khasra}`.includes(term))
      );
  }, [searchQuery, cadastreData]);

  const handleSelectSuggestion = (feature: CadastralFeature) => {
    onSelectProperty(feature.id);
    setSearchQuery(`Plot #${feature.properties.khasra_number}${feature.properties.sub_khasra ? '/' + feature.properties.sub_khasra : ''}`);
    setSearchFocused(false);

    if (mapInstanceRef.current) {
      const bounds = L.geoJSON(feature as any).getBounds();
      mapInstanceRef.current.flyToBounds(bounds, { duration: 1.0, padding: [80, 80] });
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchSuggestions.length > 0) {
      handleSelectSuggestion(searchSuggestions[0]);
    }
  };

  const categories = [
    { id: 'ALL', label: 'All Land Plots' },
    { id: 'AGRICULTURAL_IRRIGATED', label: '🌾 Farm Land' },
    { id: 'COMMERCIAL', label: '🏢 Built / Commercial' },
    { id: 'CHARAGAH_PASTURE', label: '🐄 Village Grazing Land' },
    { id: 'DISPUTED', label: '⚠️ Land with Disputes' }
  ];

  const parcelsList = useMemo(() => {
    return cadastreData?.features.filter(f => f.properties.land_classification !== 'REVENUE_VILLAGE_PERIMETER') || [];
  }, [cadastreData]);

  const editingParcel = useMemo(() => {
    if (!editingBoundaryPropertyId || !cadastreData) return null;
    return cadastreData.features.find(f => f.id === editingBoundaryPropertyId) || null;
  }, [editingBoundaryPropertyId, cadastreData]);

  // Save Boundary Changes
  const handleSaveBoundaryChanges = async () => {
    if (!editingBoundaryPropertyId || editingVertices.length < 3) return;
    setSavingBoundary(true);
    setBoundarySaveError(null);

    try {
      // Auto-close polygon ring
      const ringCoords = [...editingVertices];
      const first = ringCoords[0];
      const last = ringCoords[ringCoords.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        ringCoords.push([first[0], first[1]]);
      }

      await LandGuardApi.updateBoundary(editingBoundaryPropertyId, ringCoords, true);
      setNewlyCreatedParcelNotice(`Boundary for Khasra ${editingParcel?.properties.khasra_number} saved!`);
      setTimeout(() => setNewlyCreatedParcelNotice(null), 4000);

      await loadCadastre(true);
      onFinishBoundaryEdit?.();
      onPropertyMutated?.();
    } catch (err: any) {
      setBoundarySaveError(err.response?.data?.message || err.message || 'Failed to save boundary');
    } finally {
      setSavingBoundary(false);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-slate-100 dark:bg-slate-950">
      
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Search Bar (Farmvest Style) */}
      <div className="absolute top-4 left-4 z-30 w-80 sm:w-96">
        <form onSubmit={handleSearchSubmit} className="relative shadow-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors">
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setSearchFocused(true)}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search plot number (e.g. 101, 102/1)..."
            className="w-full pl-10 pr-24 py-3 rounded-2xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          />
          <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400 absolute left-3.5 top-3.5" />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
          >
            Find
          </button>
        </form>

        {/* Search Results Dropdown */}
        {searchFocused && searchSuggestions.length > 0 && (
          <div className="mt-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs animate-fade-in">
            {searchSuggestions.map((f) => (
              <div
                key={f.id}
                onMouseDown={() => handleSelectSuggestion(f)}
                className="p-3 hover:bg-emerald-50 dark:hover:bg-slate-800 cursor-pointer transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    Plot #{f.properties.khasra_number}{f.properties.sub_khasra ? `/${f.properties.sub_khasra}` : ''}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {f.properties.land_classification.replace(/_/g, ' ')} • {f.properties.area_bigha} Bigha
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  f.properties.verification_status === 'VERIFIED'
                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                    : f.properties.verification_status === 'DISPUTED'
                    ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                    : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                }`}>
                  {f.properties.verification_status === 'VERIFIED' ? 'Safe' : 'Dispute'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Category Filter Chips Bar */}
        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
                selectedCategory === c.id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* PERSISTENT ADMIN CONTROLS (Positioned so they never hide under drawer)*/}
      {/* ===================================================================== */}
      {isAdmin && (
        <div className="absolute top-4 left-[340px] sm:left-[415px] z-30 flex items-center gap-2">
          <button
            onClick={() => {
              if (isDrawingMode) {
                setIsDrawingMode(false);
                isDrawingModeRef.current = false;
                setDrawnPoints([]);
              } else {
                setIsDrawingMode(true);
                isDrawingModeRef.current = true;
                setDrawnPoints([]);
              }
            }}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xl backdrop-blur-md transition-all ${
              isDrawingMode
                ? 'bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-400 ring-offset-2 animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
            title="Click to place boundary vertices and draw a custom parcel"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isDrawingMode ? 'Drawing (Click Map)' : '✏️ Draw Parcel'}</span>
          </button>

          <button
            onClick={() => setIsEditorOpen(true)}
            className="px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-xl transition-all"
            title="Open Cadastre Management Tools"
          >
            <span>Admin Tools</span>
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* FLOATING DRAWING TOOLBAR (Active when drawing a new parcel)            */}
      {/* ===================================================================== */}
      {isDrawingMode && (
        <div className="absolute top-16 sm:top-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md px-5 py-3 rounded-2xl border border-slate-700 shadow-2xl flex flex-wrap items-center gap-3 text-white max-w-xl animate-fade-in">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
                Drawing Mode Active
              </span>
              <span className="text-[10px] text-slate-300">
                Click map to place points ({drawnPoints.length} points placed)
              </span>
            </div>
          </div>

          {drawnPoints.length >= 3 && (
            <div className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-[11px] font-mono text-emerald-300">
              ~{(calculatePolygonAreaSqm(drawnPoints) / 1618.7).toFixed(2)} Bigha
            </div>
          )}

          <div className="h-6 w-px bg-slate-700 mx-1 hidden sm:block"></div>

          <div className="flex items-center gap-1.5 ml-auto">
            <button
              onClick={() => setDrawnPoints(prev => prev.slice(0, -1))}
              disabled={drawnPoints.length === 0}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium text-slate-200 transition-colors flex items-center gap-1"
              title="Undo last point"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Undo</span>
            </button>
            <button
              onClick={() => setDrawnPoints([])}
              disabled={drawnPoints.length === 0}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium text-rose-300 transition-colors flex items-center gap-1"
              title="Clear all points"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
            <button
              onClick={() => setIsDrawModalOpen(true)}
              disabled={drawnPoints.length < 3}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-xs font-bold text-white transition-all shadow-md flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Parcel ({drawnPoints.length >= 3 ? 'Ready' : `${3 - drawnPoints.length} more`})</span>
            </button>
            <button
              onClick={() => {
                setIsDrawingMode(false);
                isDrawingModeRef.current = false;
                setDrawnPoints([]);
              }}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Cancel Drawing"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* FLOATING BOUNDARY VERTEX EDITING TOOLBAR                              */}
      {/* ===================================================================== */}
      {editingBoundaryPropertyId && (
        <div className="absolute top-16 sm:top-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md px-5 py-3 rounded-2xl border border-amber-500/60 shadow-2xl flex flex-wrap items-center gap-3 text-white max-w-xl animate-fade-in">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5 text-amber-400" />
                Adjusting Boundary: Plot #{editingParcel?.properties.khasra_number || ''}
              </span>
              <span className="text-[10px] text-slate-300">
                Drag amber vertex handles to move polygon corners ({editingVertices.length} vertices)
              </span>
            </div>
          </div>

          {editingVertices.length >= 3 && (
            <div className="px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-500/40 text-[11px] font-mono text-amber-300">
              ~{(calculatePolygonAreaSqm(editingVertices) / 1618.7).toFixed(2)} Bigha
            </div>
          )}

          <div className="h-6 w-px bg-slate-700 mx-1 hidden sm:block"></div>

          <div className="flex items-center gap-1.5 ml-auto">
            <button
              onClick={() => setEditingVertices(initialVertices)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors flex items-center gap-1"
              title="Reset to original boundary"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
            <button
              disabled={savingBoundary}
              onClick={handleSaveBoundaryChanges}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-xs font-bold text-white transition-all shadow-md flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingBoundary ? 'Saving...' : 'Save Boundary'}</span>
            </button>
            <button
              onClick={() => onFinishBoundaryEdit?.()}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Cancel Editing"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {boundarySaveError && (
            <div className="w-full text-[11px] text-rose-400 pt-1 border-t border-slate-700 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
              <span>{boundarySaveError}</span>
            </div>
          )}
        </div>
      )}

      {/* Success Notification Banner */}
      {newlyCreatedParcelNotice && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{newlyCreatedParcelNotice}</span>
        </div>
      )}

      {/* Top Right Controls (Road / Satellite & Zoom) */}
      <div className={`absolute top-4 ${selectedPropertyId ? 'right-4 lg:right-[540px]' : 'right-4'} z-20 flex flex-col items-end space-y-2 transition-all duration-300`}>
        
        {/* Map Layer Switcher: 100% Free, Zero API Key Watermarks */}
        <div className="bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 flex shadow-lg">
          <button
            onClick={() => setMapType('street')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              mapType === 'street'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="OpenStreetMap Roads & Boundaries"
          >
            <MapPin className="w-3.5 h-3.5" />
            Road Map
          </button>
          <button
            onClick={() => setMapType('satellite')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              mapType === 'satellite'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="ArcGIS High-Resolution Satellite"
          >
            <Layers className="w-3.5 h-3.5" />
            Satellite
          </button>
          <button
            onClick={() => setMapType('topo')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              mapType === 'topo'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="ArcGIS Topographic & Contour Map"
          >
            <Compass className="w-3.5 h-3.5" />
            Terrain
          </button>
        </div>

        {/* Zoom */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col shadow-lg overflow-hidden">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="p-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="p-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Satellite Feed Status Indicator (Bottom Left) */}
      {mapType === 'satellite' && (
        <div className="absolute bottom-6 left-4 z-20 bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-700 text-white text-[11px] shadow-2xl flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <span className="font-bold text-amber-400">🛰️ Satellite API Active:</span>
            <span className="text-slate-200">ArcGIS 0.31m High-Res Optical Feed</span>
            <span className="text-slate-400 hidden md:inline">• Cloud Cover: 0.0% • WGS 84</span>
          </div>
        </div>
      )}

      {/* Map Legend (Bottom Right) */}
      <div className={`absolute bottom-6 ${selectedPropertyId ? 'right-4 lg:right-[540px]' : 'right-4'} z-20 bg-white dark:bg-slate-900/95 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 shadow-xl max-w-xs hidden sm:block transition-all duration-300`}>
        <div className="font-bold text-slate-900 dark:text-white mb-2 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            Ranpur Village Plots
          </span>
          <span className="text-[10px] text-slate-400 font-mono">325003</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500 border border-emerald-600"></span>
            <span>Farm Land</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-sky-500 border border-sky-600"></span>
            <span>Factory / Built</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-400 border border-amber-500"></span>
            <span>Grazing Land</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500 border border-rose-600"></span>
            <span>Court Dispute</span>
          </div>
        </div>
      </div>

      {/* Initial Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/70 dark:bg-slate-950/70 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-9 h-9 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Loading village map and plots...</span>
          </div>
        </div>
      )}

      {/* Admin Map Editor Modal */}
      <AdminMapEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        parcels={parcelsList}
        selectedPropertyId={selectedPropertyId}
        onMutationSubmitted={() => {
          loadCadastre(true);
          setIsEditorOpen(false);
          onPropertyMutated?.();
        }}
      />

      {/* Admin Freehand Draw Parcel Details Modal */}
      <AdminDrawParcelModal
        isOpen={isDrawModalOpen}
        onClose={() => {
          setIsDrawModalOpen(false);
        }}
        drawnPoints={drawnPoints}
        onParcelCreated={(parcel) => {
          setIsDrawModalOpen(false);
          setNewlyCreatedParcelNotice(`Plot #${parcel?.properties?.khasra_number || 'New'} created and added to map!`);
          setTimeout(() => setNewlyCreatedParcelNotice(null), 4000);

          // Silent cadastre reload
          loadCadastre(true);
          onPropertyMutated?.();

          if (continuousDrawing) {
            // Keep drawing mode active!
            setDrawnPoints([]);
            setIsDrawingMode(true);
            isDrawingModeRef.current = true;
          } else {
            setIsDrawingMode(false);
            isDrawingModeRef.current = false;
            setDrawnPoints([]);
            if (parcel?.id) {
              onSelectProperty(parcel.id);
            }
          }
        }}
        continuousDrawing={continuousDrawing}
        onToggleContinuousDrawing={() => setContinuousDrawing(prev => !prev)}
      />

    </div>
  );
};
