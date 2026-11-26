import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { InteractiveMap } from '../components/InteractiveMap';
import { PropertyDrawer } from '../components/PropertyDrawer';
import { LandGuardApi } from '../services/api';

interface MapExplorerPageProps {
  walletBalance: number;
  onTokenSpent: () => void;
  onOpenWallet: () => void;
}

export const MapExplorerPage: React.FC<MapExplorerPageProps> = ({
  walletBalance,
  onTokenSpent,
  onOpenWallet
}) => {
  const [searchParams] = useSearchParams();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [editingBoundaryPropertyId, setEditingBoundaryPropertyId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Check URL query parameters on load (e.g. ?khasra=101)
  useEffect(() => {
    const khasraQuery = searchParams.get('khasra');
    if (khasraQuery) {
      async function resolveKhasra() {
        try {
          const results = await LandGuardApi.searchProperties(khasraQuery!);
          if (results && results.length > 0) {
            setSelectedPropertyId(results[0].id);
          }
        } catch (err) {
          console.error(err);
        }
      }
      resolveKhasra();
    }
  }, [searchParams]);

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden">
      
      {/* Central Map Canvas */}
      <InteractiveMap
        onSelectProperty={(id) => setSelectedPropertyId(id)}
        selectedPropertyId={selectedPropertyId}
        editingBoundaryPropertyId={editingBoundaryPropertyId}
        onFinishBoundaryEdit={() => setEditingBoundaryPropertyId(null)}
        onPropertyMutated={() => setRefreshTrigger(t => t + 1)}
        refreshTrigger={refreshTrigger}
      />

      {/* Side Intelligence Drawer */}
      <PropertyDrawer
        propertyId={selectedPropertyId}
        onClose={() => {
          setSelectedPropertyId(null);
          setEditingBoundaryPropertyId(null);
        }}
        walletBalance={walletBalance}
        onTokenSpent={onTokenSpent}
        onOpenWallet={onOpenWallet}
        onPropertyUpdated={() => setRefreshTrigger(t => t + 1)}
        onStartBoundaryEdit={(id) => setEditingBoundaryPropertyId(id)}
        onPropertyDeleted={() => {
          setSelectedPropertyId(null);
          setEditingBoundaryPropertyId(null);
          setRefreshTrigger(t => t + 1);
        }}
      />

    </div>
  );
};
