import React, { useState } from 'react';
import { 
  X, ShieldCheck, AlertTriangle, FileText, Landmark, Scale, 
  History, Building, CheckCircle2, ChevronRight 
} from 'lucide-react';
import { LandGuardApi } from '../services/api';

interface AdminRecordEditorModalProps {
  property: {
    id: string;
    khasra_number: string;
    property_id_code: string;
    land_classification?: string;
  };
  onClose: () => void;
  onSuccess: (message: string) => void;
}

type RecordCategory = 'OWNERSHIP' | 'OWNERSHIP_HISTORY' | 'GOVERNMENT_LAND' | 'LEGAL_DISPUTES' | 'ENCUMBRANCE';

export const AdminRecordEditorModal: React.FC<AdminRecordEditorModalProps> = ({
  property,
  onClose,
  onSuccess
}) => {
  const [activeCategory, setActiveCategory] = useState<RecordCategory>('OWNERSHIP');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State for each category
  const [ownershipForm, setOwnershipForm] = useState({
    owner_name: '',
    relation_name: '',
    relation_type: 'SON_OF',
    ownership_type: 'KHATEDARI',
    share_fraction: '1/1',
    source: 'Apna Khata (e-Dharti) Rajasthan Jamabandi',
    record_date: new Date().toISOString().split('T')[0]
  });

  const [historyForm, setHistoryForm] = useState({
    previous_owner_name: '',
    transfer_type: 'SALE_DEED',
    transfer_date: new Date().toISOString().split('T')[0],
    registration_number: '',
    sub_registrar_office: 'Sub-Registrar Ladpura, Kota',
    consideration_amount: '2500000'
  });

  const [govForm, setGovForm] = useState({
    government_type: 'REVENUE_DEPARTMENT_RAJASTHAN',
    public_purpose_classification: 'SIWAY_CHAK',
    restricting_authority: 'District Collector, Kota',
    gazette_notification_number: 'RJ-GAZETTE-REV-2022/88',
    restriction_details: 'Protected public grazing or municipal utility land; alienation prohibited under Rajasthan Tenancy Act 1955.',
    source: 'Board of Revenue Rajasthan'
  });

  const [disputeForm, setDisputeForm] = useState({
    dispute_type: 'PARTITION_SUIT',
    dispute_status: 'ACTIVE',
    description: 'Title claim and partition suit pending before court; injunction restraining registry or physical alterations.',
    cnr_number: 'RJKO010045212023',
    case_number: 'Civil Suit 182/2023',
    court_name: 'Court of Additional District Judge No. 2, Kota',
    court_type: 'CIVIL_COURT_KOTA',
    petitioner: '',
    respondent: '',
    stay_order_details: 'Status quo order issued under Order 39 Rules 1 & 2 CPC.'
  });

  const [encumbranceForm, setEncumbranceForm] = useState({
    encumbrance_type: 'REGISTERED_BANK_MORTGAGE',
    financial_institution: 'State Bank of India, SME Branch Ranpur Kota',
    loan_account_reference: 'SBI-AGRI-TERM-99120',
    amount_inr: '3500000',
    registration_number: 'SRO-LADPURA-MORT-2023-45',
    mortgage_date: new Date().toISOString().split('T')[0],
    satisfaction_status: 'ACTIVE'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    let proposedData: any = null;

    if (activeCategory === 'OWNERSHIP') {
      if (!ownershipForm.owner_name) {
        setError('Recorded Khatedar / Owner Name is required.');
        setSubmitting(false);
        return;
      }
      proposedData = { ...ownershipForm };
    } else if (activeCategory === 'OWNERSHIP_HISTORY') {
      if (!historyForm.previous_owner_name) {
        setError('Previous Owner Name is required.');
        setSubmitting(false);
        return;
      }
      proposedData = { ...historyForm };
    } else if (activeCategory === 'GOVERNMENT_LAND') {
      if (!govForm.restriction_details) {
        setError('Restriction details and statutory notification are required.');
        setSubmitting(false);
        return;
      }
      proposedData = { ...govForm };
    } else if (activeCategory === 'LEGAL_DISPUTES') {
      if (!disputeForm.description || !disputeForm.case_number) {
        setError('Dispute description and Court Case number are required.');
        setSubmitting(false);
        return;
      }
      proposedData = {
        dispute_type: disputeForm.dispute_type,
        dispute_status: disputeForm.dispute_status,
        description: disputeForm.description,
        court_case: {
          cnr_number: disputeForm.cnr_number,
          case_number: disputeForm.case_number,
          court_name: disputeForm.court_name,
          court_type: disputeForm.court_type,
          petitioner: disputeForm.petitioner || 'Aggrieved Party',
          respondent: disputeForm.respondent || 'Recorded Khatedar',
          filing_date: new Date().toISOString().split('T')[0],
          case_status: disputeForm.dispute_status,
          stay_order_details: disputeForm.stay_order_details
        }
      };
    } else if (activeCategory === 'ENCUMBRANCE') {
      if (!encumbranceForm.financial_institution || !encumbranceForm.amount_inr) {
        setError('Financial institution name and mortgage amount are required.');
        setSubmitting(false);
        return;
      }
      proposedData = { ...encumbranceForm };
    }

    try {
      const res = await LandGuardApi.proposeRecordMutation(
        property.id,
        activeCategory,
        'UPDATE',
        proposedData
      );
      onSuccess(res.message || 'Record mutation successfully submitted to Two-Man Rule queue.');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to submit proposal.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Record Intelligence Editor</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  MAKER MODE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Khasra <span className="font-bold text-white">{property.khasra_number}</span> · Ranpur Revenue Cadastre (<span className="font-mono text-slate-300">{property.property_id_code}</span>)
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Two-Man Rule Notice */}
        <div className="bg-amber-950/30 border-b border-amber-500/20 px-6 py-2.5 text-xs text-amber-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>
            <strong>Two-Man Rule Governance:</strong> Submitting will not immediately modify public records. It will be quarantined in the Super Admin Verification Queue with a cryptographic audit trail.
          </span>
        </div>

        {/* Category Tabs & Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Side Tabs */}
          <div className="w-full md:w-60 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/40 p-3 space-y-1 overflow-y-auto">
            <button
              type="button"
              onClick={() => setActiveCategory('OWNERSHIP')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeCategory === 'OWNERSHIP'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4" />
                <span>Recorded Khatedar</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('OWNERSHIP_HISTORY')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeCategory === 'OWNERSHIP_HISTORY'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <History className="w-4 h-4" />
                <span>Ownership History</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('GOVERNMENT_LAND')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeCategory === 'GOVERNMENT_LAND'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Building className="w-4 h-4" />
                <span>Government & Commons</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('LEGAL_DISPUTES')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeCategory === 'LEGAL_DISPUTES'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Scale className="w-4 h-4" />
                <span>Court & Legal Disputes</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('ENCUMBRANCE')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeCategory === 'ENCUMBRANCE'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Landmark className="w-4 h-4" />
                <span>Bank Encumbrance</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form id="record-form" onSubmit={handleSubmit} className="space-y-4">
              
              {/* Category 1: OWNERSHIP */}
              {activeCategory === 'OWNERSHIP' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">Apna Khata (e-Dharti) Jamabandi Record</h3>
                    <p className="text-xs text-slate-400">Record current primary titleholder registered in Rajasthan Revenue records.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Recorded Owner / Khatedar Name *</label>
                      <input
                        type="text"
                        value={ownershipForm.owner_name}
                        onChange={(e) => setOwnershipForm({ ...ownershipForm, owner_name: e.target.value })}
                        placeholder="e.g. Ramprasad Meena"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Father / Husband / Co-tenant Name</label>
                      <input
                        type="text"
                        value={ownershipForm.relation_name}
                        onChange={(e) => setOwnershipForm({ ...ownershipForm, relation_name: e.target.value })}
                        placeholder="e.g. Late Shri Mangilal Meena"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Tenure / Khatedari Type</label>
                      <select
                        value={ownershipForm.ownership_type}
                        onChange={(e) => setOwnershipForm({ ...ownershipForm, ownership_type: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                      >
                        <option value="KHATEDARI">Khatedari (Permanent Hereditary & Transferable)</option>
                        <option value="GAIR_KHATEDARI">Gair-Khatedari (Non-permanent / Conditional)</option>
                        <option value="GOVERNMENT">Government / Siway Chak / Charagah</option>
                        <option value="RIICO_LEASE">RIICO 99-Year Industrial Lease</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Share Fraction</label>
                      <input
                        type="text"
                        value={ownershipForm.share_fraction}
                        onChange={(e) => setOwnershipForm({ ...ownershipForm, share_fraction: e.target.value })}
                        placeholder="e.g. 1/1 (Sole) or 1/2 (Joint)"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Public Verification Source</label>
                      <input
                        type="text"
                        value={ownershipForm.source}
                        onChange={(e) => setOwnershipForm({ ...ownershipForm, source: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Category 2: OWNERSHIP HISTORY */}
              {activeCategory === 'OWNERSHIP_HISTORY' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">Historical Chain of Title (IGRS Rajasthan)</h3>
                    <p className="text-xs text-slate-400">Record previous conveyances, registered sale deeds, or hereditary mutations.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Prior Transferor / Owner Name *</label>
                      <input
                        type="text"
                        value={historyForm.previous_owner_name}
                        onChange={(e) => setHistoryForm({ ...historyForm, previous_owner_name: e.target.value })}
                        placeholder="e.g. Mohan Lal Meena"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Conveyance Type</label>
                      <select
                        value={historyForm.transfer_type}
                        onChange={(e) => setHistoryForm({ ...historyForm, transfer_type: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                      >
                        <option value="SALE_DEED">Registered Sale Deed (Bikray Patra)</option>
                        <option value="INHERITANCE_VIRASAT">Hereditary Mutation (Virasat Intkal)</option>
                        <option value="GIFT_DEED">Gift Deed (Daan Patra)</option>
                        <option value="PARTITION_DEED">Partition Deed (Batwara)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Sub-Registrar Registration No.</label>
                      <input
                        type="text"
                        value={historyForm.registration_number}
                        onChange={(e) => setHistoryForm({ ...historyForm, registration_number: e.target.value })}
                        placeholder="e.g. SRO-LADPURA-2018-REG-4412"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Registered Consideration (₹ INR)</label>
                      <input
                        type="number"
                        value={historyForm.consideration_amount}
                        onChange={(e) => setHistoryForm({ ...historyForm, consideration_amount: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Category 3: GOVERNMENT LAND */}
              {activeCategory === 'GOVERNMENT_LAND' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">Government Land & Commons Classification</h3>
                    <p className="text-xs text-slate-400">Classify sovereign, municipal, or communal land restrictions (Charagah, Siway Chak).</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Statutory Classification</label>
                      <select
                        value={govForm.public_purpose_classification}
                        onChange={(e) => setGovForm({ ...govForm, public_purpose_classification: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                      >
                        <option value="CHARAGAH">Village Commons / Pasture Land (Charagah)</option>
                        <option value="SIWAY_CHAK">State Revenue Land (Siway Chak)</option>
                        <option value="INDUSTRIAL_RIICO">RIICO Industrial Estate</option>
                        <option value="FOREST_CONSERVATION">State Forest Conservation Buffer</option>
                        <option value="WATER_BODY_TALAB">Public Water Body / Talab / Nallah</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Custodian Authority</label>
                      <input
                        type="text"
                        value={govForm.restricting_authority}
                        onChange={(e) => setGovForm({ ...govForm, restricting_authority: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Alienation Restriction Details *</label>
                      <textarea
                        rows={3}
                        value={govForm.restriction_details}
                        onChange={(e) => setGovForm({ ...govForm, restriction_details: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Category 4: LEGAL DISPUTES */}
              {activeCategory === 'LEGAL_DISPUTES' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">e-Courts Legal Disputes & Lis Pendens</h3>
                    <p className="text-xs text-slate-400">Record active litigation, injunctions, or adverse claims filed in Indian civil courts.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Case Number *</label>
                      <input
                        type="text"
                        value={disputeForm.case_number}
                        onChange={(e) => setDisputeForm({ ...disputeForm, case_number: e.target.value })}
                        placeholder="e.g. Civil Suit 182/2023"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">e-Courts 16-Digit CNR Number</label>
                      <input
                        type="text"
                        value={disputeForm.cnr_number}
                        onChange={(e) => setDisputeForm({ ...disputeForm, cnr_number: e.target.value })}
                        placeholder="e.g. RJKO010045212023"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Adjudicating Court Name</label>
                      <input
                        type="text"
                        value={disputeForm.court_name}
                        onChange={(e) => setDisputeForm({ ...disputeForm, court_name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Dispute Summary & Lis Pendens Notice *</label>
                      <textarea
                        rows={2}
                        value={disputeForm.description}
                        onChange={(e) => setDisputeForm({ ...disputeForm, description: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Stay Order / Injunction Specifics</label>
                      <input
                        type="text"
                        value={disputeForm.stay_order_details}
                        onChange={(e) => setDisputeForm({ ...disputeForm, stay_order_details: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Category 5: ENCUMBRANCE */}
              {activeCategory === 'ENCUMBRANCE' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">Registered Financial Encumbrance & Mortgage</h3>
                    <p className="text-xs text-slate-400">Record institutional bank charges, Kisan Credit Cards, or term loan mortgages.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Financial Institution / Bank *</label>
                      <input
                        type="text"
                        value={encumbranceForm.financial_institution}
                        onChange={(e) => setEncumbranceForm({ ...encumbranceForm, financial_institution: e.target.value })}
                        placeholder="e.g. State Bank of India, Kota"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Registered Charge Amount (₹ INR) *</label>
                      <input
                        type="number"
                        value={encumbranceForm.amount_inr}
                        onChange={(e) => setEncumbranceForm({ ...encumbranceForm, amount_inr: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Loan Account Reference</label>
                      <input
                        type="text"
                        value={encumbranceForm.loan_account_reference}
                        onChange={(e) => setEncumbranceForm({ ...encumbranceForm, loan_account_reference: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">SRO Registered Entry No.</label>
                      <input
                        type="text"
                        value={encumbranceForm.registration_number}
                        onChange={(e) => setEncumbranceForm({ ...encumbranceForm, registration_number: e.target.value })}
                        placeholder="e.g. SRO-LADPURA-MORT-2023-45"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>
                </div>
              )}

            </form>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            Selected: <span className="font-semibold text-white">{activeCategory.replace('_', ' ')}</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="record-form"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-brand-600/30 flex items-center gap-2"
            >
              {submitting ? (
                <span>Submitting Proposal...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit for Super Admin Approval</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
