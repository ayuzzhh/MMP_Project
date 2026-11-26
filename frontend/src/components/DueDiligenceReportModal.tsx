import React from 'react';
import { 
  X, Printer, ShieldCheck, AlertTriangle, FileText, Landmark, 
  Scale, Building, CheckCircle2, QrCode, MapPin, Calendar, ExternalLink, Award 
} from 'lucide-react';
import { PropertyReport } from '../types';

interface DueDiligenceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: PropertyReport;
}

export const DueDiligenceReportModal: React.FC<DueDiligenceReportModalProps> = ({
  isOpen,
  onClose,
  report
}) => {
  if (!isOpen) return null;

  const basic = report.basic;
  const records = report.records;
  const certId = `LG-RJ-KOT-03807600-KH${basic.khasra_number.replace('/', '-')}`;
  const issueDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white print:static">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden print:max-h-none print:shadow-none print:border-none print:bg-white print:text-black">
        
        {/* Modal Controls (Hidden in Print) */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-[#0f2b1d] text-white print:hidden">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-[#e5b03c]/20 text-[#e5b03c] border border-[#e5b03c]/30">
              OFFICIAL CADASTRAL TITLE DOSSIER
            </span>
            <span className="text-xs text-stone-300 font-mono">Ref: {certId}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-[#e5b03c] hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center gap-2 transition-all shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Document Body */}
        <div className="flex-1 overflow-y-auto p-8 sm:p-12 space-y-8 bg-stone-900 text-stone-200 print:bg-white print:text-black print:overflow-visible print:p-6 print:space-y-6">
          
          {/* Architectural Master Plan Title Block */}
          <div className="border-b-2 border-stone-700 print:border-black pb-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#e5b03c] print:text-stone-700 block mb-1">
                  REVENUE CADASTRE ARCHITECTURAL MASTER PLAN & TITLE AUDIT
                </span>
                <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-white print:text-black">
                  Ranpur Cadastral Due Diligence Dossier
                </h1>
                <p className="text-xs text-stone-400 print:text-gray-600 mt-1 font-sans">
                  Census Village: 03807600 • Tehsil Ladpura • District Kota, Rajasthan (PIN 325003)
                </p>
              </div>

              {/* Title Block Stamp & QR Seal */}
              <div className="text-right flex items-center gap-3">
                <div className="hidden sm:block border border-stone-700 print:border-gray-400 rounded-lg p-2 bg-stone-950/40 print:bg-gray-50 font-mono text-[10px] text-right text-stone-300 print:text-black leading-tight">
                  <div className="font-bold">DOCUMENT NO: LG-RJ-KOT-03807600-REV4</div>
                  <div className="text-stone-400 print:text-gray-600">PROJECTION: EPSG:3857 / UTM 43N</div>
                  <div className="font-bold text-[#e5b03c] print:text-black">E-STAHL INTELLIGENCE</div>
                </div>

                <div className="w-16 h-16 border-2 border-dashed border-stone-700 print:border-gray-400 rounded-xl flex items-center justify-center p-1 bg-stone-950/40 print:bg-gray-50">
                  <QrCode className="w-12 h-12 text-stone-300 print:text-black" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-stone-950/60 print:bg-gray-100 p-3.5 rounded-xl border border-stone-800 print:border-gray-300 font-mono">
              <div>
                <span className="text-[10px] text-stone-400 print:text-gray-500 uppercase font-bold block">Dossier Cert ID</span>
                <span className="font-bold text-[#e5b03c] print:text-black">{certId}</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 print:text-gray-500 uppercase font-bold block">Issue Date</span>
                <span className="font-semibold text-white print:text-black">{issueDate}</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 print:text-gray-500 uppercase font-bold block">Cadastral State</span>
                <span className="font-semibold text-white print:text-black">{basic.state} (08)</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 print:text-gray-500 uppercase font-bold block">Datum Baseline</span>
                <span className="font-semibold text-white print:text-black">WGS 84 / UTM 43N</span>
              </div>
            </div>
          </div>

          {/* Section 1: Parcel Identification */}
          <div className="space-y-3">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#e5b03c] print:text-black border-b border-stone-800 print:border-gray-300 pb-1.5 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              01 Revenue Cadastre & Spatial Coordinates
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-sans">
              <div className="p-3 rounded-xl bg-stone-950/40 print:bg-gray-50 border border-stone-800 print:border-gray-200">
                <span className="text-stone-400 print:text-gray-500 block text-[11px]">Khasra Number:</span>
                <span className="text-base font-extrabold text-white print:text-black font-mono">
                  {basic.khasra_number}
                  {basic.sub_khasra ? `/${basic.sub_khasra}` : ''}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-stone-950/40 print:bg-gray-50 border border-stone-800 print:border-gray-200">
                <span className="text-stone-400 print:text-gray-500 block text-[11px]">Land Classification:</span>
                <span className="text-sm font-bold text-white print:text-black">
                  {basic.land_classification.replace('_', ' ')}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-stone-950/40 print:bg-gray-50 border border-stone-800 print:border-gray-200">
                <span className="text-stone-400 print:text-gray-500 block text-[11px]">Cadastral Area:</span>
                <span className="text-sm font-bold text-white print:text-black font-mono">
                  {basic.area_hectares} Ha ({basic.area_bigha} Pucca Bigha)
                </span>
              </div>

              <div className="p-3 rounded-xl bg-stone-950/40 print:bg-gray-50 border border-stone-800 print:border-gray-200">
                <span className="text-stone-400 print:text-gray-500 block text-[11px]">Tehsil & District:</span>
                <span className="font-semibold text-white print:text-black">{basic.tehsil}, {basic.district}</span>
              </div>

              <div className="p-3 rounded-xl bg-stone-950/40 print:bg-gray-50 border border-stone-800 print:border-gray-200">
                <span className="text-stone-400 print:text-gray-500 block text-[11px]">Postal Delivery PIN:</span>
                <span className="font-mono text-white print:text-black">{basic.pin_code} (Non-cadastral delivery zone)</span>
              </div>

              <div className="p-3 rounded-xl bg-stone-950/40 print:bg-gray-50 border border-stone-800 print:border-gray-200">
                <span className="text-stone-400 print:text-gray-500 block text-[11px]">Verification Status:</span>
                <span className="font-bold text-emerald-400 print:text-black">{basic.verification_status}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Ownership & Title Lineage */}
          <div className="space-y-3">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#e5b03c] print:text-black border-b border-stone-800 print:border-gray-300 pb-1.5 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              02 Title Registry & Ownership Lineage (Apna Khata e-Dharti)
            </h2>

            {records.ownership ? (
              <div className="p-4 rounded-xl bg-stone-950/40 print:bg-gray-50 border border-stone-800 print:border-gray-200 space-y-2 text-xs font-sans">
                <div className="flex justify-between">
                  <span className="text-stone-400 print:text-gray-500">Recorded Khatedar (Owner):</span>
                  <span className="font-bold text-white print:text-black">{records.ownership.owner_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400 print:text-gray-500">Parentage / Relation:</span>
                  <span className="text-white print:text-black">{records.ownership.relation_name} ({records.ownership.relation_type})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400 print:text-gray-500">Tenure Classification:</span>
                  <span className="font-mono text-cyan-300 print:text-black">{records.ownership.ownership_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400 print:text-gray-500">Share Ratio:</span>
                  <span className="font-mono text-white print:text-black">{records.ownership.share_fraction}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400 print:text-gray-500">Source Public Record:</span>
                  <span className="text-stone-300 print:text-gray-700">{records.ownership.source}</span>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-stone-950/40 print:bg-gray-50 border border-stone-800 print:border-gray-200 text-xs text-stone-400 print:text-gray-600">
                Detailed ownership intelligence not unlocked or pending revenue upload.
              </div>
            )}
          </div>

          {/* Section 3: Legal Disputes & e-Courts Injunctions */}
          <div className="space-y-3">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400 print:text-black border-b border-stone-800 print:border-gray-300 pb-1.5 flex items-center gap-2">
              <Scale className="w-4 h-4" />
              03 Litigation & e-Courts Injunction Audit (Lis Pendens Check)
            </h2>

            {records.legal_disputes ? (
              <div className="p-4 rounded-xl bg-rose-950/20 print:bg-gray-50 border border-rose-500/30 print:border-gray-300 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded font-bold font-mono text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 print:border-black print:text-black">
                    {records.legal_disputes.dispute_status}
                  </span>
                  <span className="font-bold text-white print:text-black">{records.legal_disputes.dispute_type}</span>
                </div>
                <p className="text-stone-300 print:text-gray-800 leading-relaxed">
                  {records.legal_disputes.description}
                </p>
                {records.court_cases && records.court_cases.length > 0 && (
                  <div className="pt-2 border-t border-rose-500/20 print:border-gray-300 space-y-1 text-[11px] font-sans">
                    <div className="flex justify-between">
                      <span className="text-stone-400 print:text-gray-600">e-Courts CNR Number:</span>
                      <span className="font-mono font-bold text-rose-300 print:text-black">{records.court_cases[0].cnr_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400 print:text-gray-600">Court:</span>
                      <span className="text-white print:text-black">{records.court_cases[0].court_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400 print:text-gray-600">Stay Order Specifics:</span>
                      <span className="font-semibold text-rose-300 print:text-black">{records.court_cases[0].stay_order_details}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-950/20 print:bg-gray-50 border border-emerald-500/30 print:border-gray-200 text-xs text-emerald-300 print:text-black flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400 print:text-black" />
                <span>Zero active adverse civil suits or stay orders recorded in e-Courts Kota index for this parcel.</span>
              </div>
            )}
          </div>

          {/* Section 4: Financial Encumbrances & Mortgages */}
          <div className="space-y-3">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 print:text-black border-b border-stone-800 print:border-gray-300 pb-1.5 flex items-center gap-2">
              <Landmark className="w-4 h-4" />
              04 Financial Encumbrances & Bank Charges (IGRS Rajasthan)
            </h2>

            {records.encumbrance ? (
              <div className="p-4 rounded-xl bg-amber-950/20 print:bg-gray-50 border border-amber-500/30 print:border-gray-300 space-y-2 text-xs font-sans">
                <div className="flex justify-between">
                  <span className="text-stone-400 print:text-gray-500">Financial Institution:</span>
                  <span className="font-bold text-white print:text-black">{records.encumbrance.financial_institution}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400 print:text-gray-500">Registered Charge Amount:</span>
                  <span className="font-mono font-bold text-amber-300 print:text-black">
                    ₹ {records.encumbrance.amount_inr?.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400 print:text-gray-500">SRO Registration Reference:</span>
                  <span className="font-mono text-stone-300 print:text-black">{records.encumbrance.registration_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400 print:text-gray-500">Satisfaction Status:</span>
                  <span className="font-bold text-amber-400 print:text-black">{records.encumbrance.satisfaction_status}</span>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-stone-950/40 print:bg-gray-50 border border-stone-800 print:border-gray-200 text-xs text-stone-400 print:text-gray-600">
                No active registered institutional bank mortgage identified at Sub-Registrar Ladpura.
              </div>
            )}
          </div>

          {/* Section 5: Government Commons / Restrictions */}
          <div className="space-y-3">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 print:text-black border-b border-stone-800 print:border-gray-300 pb-1.5 flex items-center gap-2">
              <Building className="w-4 h-4" />
              05 Government Classification & Alienation Prohibitions
            </h2>

            {records.government_land ? (
              <div className="p-4 rounded-xl bg-cyan-950/20 print:bg-gray-50 border border-cyan-500/30 print:border-gray-300 space-y-2 text-xs font-sans">
                <div className="flex justify-between">
                  <span className="text-stone-400 print:text-gray-500">Sovereign / Public Classification:</span>
                  <span className="font-bold text-cyan-300 print:text-black">{records.government_land.public_purpose_classification}</span>
                </div>
                <p className="text-stone-300 print:text-gray-800 leading-relaxed text-[11px]">
                  {records.government_land.restriction_details}
                </p>
                <div className="text-[10px] text-stone-400 print:text-gray-600 font-mono">
                  Authority: {records.government_land.restricting_authority}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-stone-950/40 print:bg-gray-50 border border-stone-800 print:border-gray-200 text-xs text-stone-400 print:text-gray-600">
                Privately held revenue khatedari land. Not classified as Siway Chak, Charagah, or municipal forest.
              </div>
            )}
          </div>

          {/* Section 6: Official Sources & Disclaimers */}
          <div className="pt-6 border-t-2 border-stone-800 print:border-black space-y-4">
            <div className="text-[10px] text-stone-400 print:text-gray-600 space-y-1">
              <span className="font-bold block text-stone-300 print:text-black uppercase">Official Sources Referenced:</span>
              <p>• Apna Khata (e-Dharti) – Board of Revenue Rajasthan, Ladpura Tehsil</p>
              <p>• Bhunaksha Rajasthan – National Informatics Centre (NIC) Cadastral Division, Kota</p>
              <p>• e-Courts Case Information System (CIS 3.2) – District Court Kota</p>
              <p>• Inspector General of Registration and Stamps (IGRS) – SRO Ladpura</p>
            </div>

            {/* Mandatory Statutory Disclaimer */}
            <div className="p-3 rounded-xl bg-stone-950 print:bg-gray-100 border border-stone-800 print:border-gray-300 text-[10px] text-stone-400 print:text-gray-700 leading-relaxed">
              <strong>STATUTORY LEGAL DISCLAIMER:</strong> This Due Diligence Dossier is generated for informational and investigative purposes based on digitally accessible records. Under the Rajasthan Tenancy Act 1955 and Section 52 Transfer of Property Act 1882, the absence of an adverse entry in digital databases does not guarantee freedom from unrecorded testamentary successions, pending oral family settlements, or unregistered agreements to sell. Prospective purchasers must conduct independent physical site inspections and inspect original title instruments with a practicing advocate.
            </div>

            <div className="flex justify-between items-center text-[10px] font-mono text-stone-500 pt-2">
              <span>e-Stahl Automated Cryptographic Verification Ledger</span>
              <span>Ranpur Revenue Boundary (Census 03807600)</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};