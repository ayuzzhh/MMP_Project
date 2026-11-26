import React from 'react';
import { ShieldCheck, AlertCircle, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Simple Legal Disclaimer */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex items-start space-x-3.5 shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-slate-700 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] block">
              Important Guidance & Information Note
            </span>
            <p className="leading-relaxed">
              e-Stahl is an independent land verification tool created to help property buyers make safe decisions. 
              The information shown comes from publicly accessible state records (Jamabandi, Bhunaksha, and court portals). 
              This website provides helpful guidance and due diligence checks, but does not replace official certified copies 
              issued by the Sub-Registrar office or advice from your legal advocate.
            </p>
          </div>
        </div>

        {/* Links & Attributions */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-200 dark:border-slate-800/60 text-slate-500">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>e-Stahl © 2026. Pilot Village: Ranpur (Ladpura, Kota, Rajasthan - 325003).</span>
          </div>

          <div className="flex items-center space-x-4 text-slate-600 dark:text-slate-400 text-xs">
            <a 
              href="https://apnakhata.rajasthan.gov.in" 
              target="_blank" 
              rel="noreferrer"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors"
            >
              Apna Khata (Land Records) <ExternalLink className="w-3 h-3" />
            </a>
            <a 
              href="https://bhunaksha.rajasthan.gov.in" 
              target="_blank" 
              rel="noreferrer"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors"
            >
              Bhunaksha Maps <ExternalLink className="w-3 h-3" />
            </a>
            <a 
              href="https://services.ecourts.gov.in" 
              target="_blank" 
              rel="noreferrer"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors"
            >
              e-Courts Disputes <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};
