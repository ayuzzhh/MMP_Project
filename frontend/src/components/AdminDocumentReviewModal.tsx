import React, { useState, useEffect } from 'react';
import { 
  X, FileText, Upload, ShieldCheck, AlertTriangle, CheckCircle2, 
  ExternalLink, FileCheck, RefreshCw, Eye, Edit3, ArrowRight, Sparkles 
} from 'lucide-react';
import { LandGuardApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface AdminDocumentReviewModalProps {
  property: {
    id: string;
    khasra_number: string;
    property_id_code: string;
  };
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const AdminDocumentReviewModal: React.FC<AdminDocumentReviewModalProps> = ({
  property,
  onClose,
  onSuccess
}) => {
  const { isSuperAdmin } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDoc, setActiveDoc] = useState<any | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Upload Form State
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadDocType, setUploadDocType] = useState('JAMABANDI_NAKAL');
  const [uploadTitle, setUploadTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawTextHint, setRawTextHint] = useState('');

  // Human Review Form State
  const [editingFields, setEditingFields] = useState<any>({});
  const [isSavingVerification, setIsSavingVerification] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const docs = await LandGuardApi.getDocuments(property.id);
      setDocuments(docs || []);
      if (docs && docs.length > 0 && !activeDoc) {
        setActiveDoc(docs[0]);
        setEditingFields(docs[0].extracted_fields || {});
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [property.id]);

  useEffect(() => {
    if (activeDoc) {
      setEditingFields(activeDoc.extracted_fields || {});
    }
  }, [activeDoc]);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setNotice(null);

    try {
      const formData = new FormData();
      formData.append('property_id', property.id);
      formData.append('document_type', uploadDocType);
      formData.append('title', uploadTitle || `${uploadDocType.replace('_', ' ')} - Khasra ${property.khasra_number}`);
      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      if (rawTextHint) {
        formData.append('raw_text_hint', rawTextHint);
      }

      const res = await LandGuardApi.uploadDocument(formData);
      setNotice(res.message);
      setShowUploadForm(false);
      setSelectedFile(null);
      setUploadTitle('');
      setRawTextHint('');
      await loadDocuments();
      if (res.data) {
        setActiveDoc(res.data);
      }
    } catch (err: any) {
      alert(`Upload failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleVerifyOcr = async (submitForCommit: boolean) => {
    if (!activeDoc) return;
    setIsSavingVerification(true);
    setNotice(null);

    try {
      const res = await LandGuardApi.verifyOcrFields(activeDoc.id, editingFields, submitForCommit);
      setNotice(res.message);
      loadDocuments();
      onSuccess(res.message);
    } catch (err: any) {
      alert(`Verification failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsSavingVerification(false);
    }
  };

  const handleDirectCommit = async () => {
    if (!activeDoc || !isSuperAdmin) return;
    try {
      const res = await LandGuardApi.commitDocument(activeDoc.id);
      setNotice(res.message);
      loadDocuments();
      onSuccess(res.message);
    } catch (err: any) {
      alert(`Commit failed: ${err.response?.data?.error || err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Document Dossier & OCR Pipeline</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  TESSERACT REVENUE PARSER
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Khasra <span className="font-bold text-white">{property.khasra_number}</span> · Ranpur Cadastre (<span className="font-mono text-slate-300">{property.property_id_code}</span>)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Document
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {notice && (
          <div className="bg-emerald-950/40 border-b border-emerald-500/20 px-6 py-2.5 text-xs text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{notice}</span>
            </div>
            <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
          </div>
        )}

        {/* Upload Form Accordion */}
        {showUploadForm && (
          <form onSubmit={handleFileUpload} className="p-5 bg-slate-950/70 border-b border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-400" />
                Upload New Land Record Document & Trigger OCR
              </span>
              <button 
                type="button" 
                onClick={() => setShowUploadForm(false)} 
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Document Type *</label>
                <select
                  value={uploadDocType}
                  onChange={(e) => setUploadDocType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="JAMABANDI_NAKAL">Apna Khata Jamabandi Nakal (ROR)</option>
                  <option value="REGISTRY_SALE_DEED">Registered Sale Deed (Bikray Patra)</option>
                  <option value="COURT_ORDER">Court Stay Order / Interim Injunction</option>
                  <option value="MUTATION_INTKAL">Hereditary Mutation (Virasat Intkal)</option>
                  <option value="REVENUE_MAP">Bhunaksha Certified Field Map</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Document Title / Reference</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder={`e.g. Certified Jamabandi 1431 Fasli Khasra ${property.khasra_number}`}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Upload File (PDF / PNG / JPG)</label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-300 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:bg-brand-600 file:text-white"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Optional Hindi/English OCR Text Extract (Assisted Parser Input)
                </label>
                <input
                  type="text"
                  value={rawTextHint}
                  onChange={(e) => setRawTextHint(e.target.value)}
                  placeholder="e.g. खाता संख्या: 14/89, खसरा नंबर: 101, खातेदार का नाम: रामप्रसाद मीणा पुत्र स्व. मांगीलाल मीणा"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isUploading}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-md shadow-brand-600/30 flex items-center gap-2"
              >
                {isUploading ? (
                  <span>Processing OCR Engine...</span>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload & Execute Structured OCR</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Content Body: Left Document List + Right OCR Extracted Fields */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Left Column: Documents List */}
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/40 p-4 space-y-3 overflow-y-auto">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Dossier Archives ({documents.length})
            </span>

            {documents.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No documents uploaded for this parcel yet.
              </div>
            ) : (
              documents.map((doc) => {
                const isSelected = activeDoc?.id === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setActiveDoc(doc)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-slate-800/90 border-brand-500/60 shadow-lg'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {doc.document_type}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        doc.ocr_status === 'VERIFIED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {doc.ocr_status}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-white line-clamp-1">{doc.title}</div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span>{doc.file_name}</span>
                      <span className="font-mono text-cyan-400">
                        {doc.extracted_fields?.confidence_score 
                          ? `${Math.round(doc.extracted_fields.confidence_score * 100)}% Conf.` 
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: OCR Inspector & Human Verification */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeDoc ? (
              <div className="space-y-6">
                
                {/* Active Document Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{activeDoc.title}</h3>
                      <span className="text-[10px] font-mono text-slate-400">{activeDoc.id}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Uploaded by {activeDoc.uploaded_by} on {new Date(activeDoc.uploaded_at).toLocaleDateString('en-IN')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-cyan-300 font-mono text-xs border border-slate-700 font-bold">
                      OCR Confidence: {Math.round((activeDoc.extracted_fields?.confidence_score || 0) * 100)}%
                    </span>
                  </div>
                </div>

                {/* Discrepancy Warnings */}
                {activeDoc.extracted_fields?.discrepancies?.length > 0 && (
                  <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-rose-300 text-xs space-y-1">
                    <div className="font-bold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      Cadastral Cross-Validation Discrepancy Detected:
                    </div>
                    {activeDoc.extracted_fields.discrepancies.map((d: string, i: number) => (
                      <p key={i} className="pl-6 text-[11px] leading-relaxed">{d}</p>
                    ))}
                  </div>
                )}

                {/* Human-in-the-Loop Verification Fields */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-brand-400" />
                        Human-in-the-Loop Verification & Entity Extraction
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Review and correct OCR-extracted entities before submitting to the Two-Man Rule queue.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Khasra Number</label>
                      <input
                        type="text"
                        value={editingFields.khasra_number || ''}
                        onChange={(e) => setEditingFields({ ...editingFields, khasra_number: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Khata / Khewat Number</label>
                      <input
                        type="text"
                        value={editingFields.khata_number || ''}
                        onChange={(e) => setEditingFields({ ...editingFields, khata_number: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Khatedar / Titleholder Name</label>
                      <input
                        type="text"
                        value={editingFields.owner_name || ''}
                        onChange={(e) => setEditingFields({ ...editingFields, owner_name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Father / Parentage Name</label>
                      <input
                        type="text"
                        value={editingFields.father_name || ''}
                        onChange={(e) => setEditingFields({ ...editingFields, father_name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Area in Hectares</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={editingFields.area_hectares || ''}
                        onChange={(e) => setEditingFields({ ...editingFields, area_hectares: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Area in Pucca Bigha</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingFields.area_bigha || ''}
                        onChange={(e) => setEditingFields({ ...editingFields, area_bigha: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>

                    {editingFields.cnr_number !== undefined && (
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-300 mb-1">e-Courts 16-Digit CNR Number</label>
                        <input
                          type="text"
                          value={editingFields.cnr_number || ''}
                          onChange={(e) => setEditingFields({ ...editingFields, cnr_number: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-cyan-300 focus:outline-none focus:border-brand-500"
                        />
                      </div>
                    )}

                    {editingFields.sro_registration_number !== undefined && (
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-300 mb-1">SRO Registration Reference</label>
                        <input
                          type="text"
                          value={editingFields.sro_registration_number || ''}
                          onChange={(e) => setEditingFields({ ...editingFields, sro_registration_number: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-amber-300 focus:outline-none focus:border-brand-500"
                        />
                      </div>
                    )}

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Encumbrance / Remarks (Column 8)</label>
                      <textarea
                        rows={2}
                        value={editingFields.encumbrance_note || ''}
                        onChange={(e) => setEditingFields({ ...editingFields, encumbrance_note: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-400">
                    Status: <span className="font-bold text-white">{activeDoc.ocr_status}</span>
                    {activeDoc.human_verified_by && (
                      <span className="text-emerald-400 ml-2">✓ Verified by {activeDoc.human_verified_by}</span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      disabled={isSavingVerification}
                      onClick={() => handleVerifyOcr(false)}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
                    >
                      Save Corrections
                    </button>

                    <button
                      type="button"
                      disabled={isSavingVerification}
                      onClick={() => handleVerifyOcr(true)}
                      className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-md shadow-brand-600/30 flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verify & Propose Change (Two-Man Rule)</span>
                    </button>

                    {isSuperAdmin && (
                      <button
                        type="button"
                        onClick={handleDirectCommit}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
                        title="Direct Super Admin Commit"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Direct Commit</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 text-xs">
                Select a document from the left archive to inspect its OCR fields.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
