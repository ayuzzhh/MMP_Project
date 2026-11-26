import React from 'react';
import { 
  ShieldCheck, BookOpen, Scale, Landmark, Database, Lock, 
  AlertCircle, Compass, ArrowRight, CheckCircle2, Award 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AboutPage: React.FC = () => {
  return (
    <div className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen transition-colors">
      
      {/* Editorial Hero Header */}
      <section className="bg-[#0f2b1d] text-[#f8fafc] py-20 px-4 sm:px-6 lg:px-12 relative overflow-hidden border-b-4 border-amber-500">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 rounded-full border border-emerald-800/30 pointer-events-none hidden md:block"></div>
        <div className="absolute right-12 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-amber-500/20 pointer-events-none hidden md:block"></div>
        <div className="absolute right-28 top-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-white/10 pointer-events-none hidden md:block"></div>

        <div className="max-w-6xl mx-auto relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-xs font-semibold text-amber-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>LAND VERIFICATION & RECORD INTELLIGENCE</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-serif font-black tracking-tight max-w-3xl leading-tight">
            A transparent village is a <span className="text-amber-400">shared future.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed font-sans">
            We help citizens and property buyers understand land ownership records, check for bank loans or court disputes, and view genuine plot boundaries before putting down money.
          </p>

          <div className="pt-6 border-t border-emerald-900/60 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-4">
            <div className="flex items-center space-x-6">
              <span>PILOT VILLAGE: RANPUR</span>
              <span>STATE: RAJASTHAN</span>
              <span>TEHSIL: LADPURA, KOTA</span>
            </div>
            <div className="text-amber-400 font-bold">
              INDIA • PUBLIC RECORDS VERIFICATION
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Body */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 py-16 space-y-16">
        
        {/* Section 01: Why We Built e-Stahl */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-4">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 block mb-1">
              01 OUR PURPOSE
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
              Protecting Buyers From Land Fraud
            </h2>
          </div>
          <div className="md:col-span-8 space-y-4 text-sm text-slate-700 leading-relaxed font-sans">
            <p>
              In India, buying rural or semi-urban land is often risky. Ordinary families face hidden problems: 
              ongoing court cases, bank mortgages that the seller didn't disclose, disputed family inheritances, 
              or illegal attempts to sell government-owned land.
            </p>
            <p>
              Common real-estate listing websites only care about connecting buyers with sellers for a commission. 
              <strong>e-Stahl</strong> is different: it is an independent verification platform. We link computerized 
              land records (Jamabandi), court dispute databases, bank loan registries, and satellite maps into one 
              simple report so you know the truth about any land parcel before paying a rupee.
            </p>
          </div>
        </div>

        {/* Section 02: Postal PIN Codes vs Official Village Boundaries */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 block mb-1">
              02 MAP ACCURACY
            </span>
            <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">
              Postal PIN Codes Do Not Define Land Boundaries
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              A common mistake is assuming that a postal PIN code (e.g., 325003) is the official boundary of a village. 
              In Indian law, land ownership is strictly tied to the official Revenue Village and Khasra survey numbers.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400 text-[11px] uppercase block mb-1">State</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">Rajasthan (08)</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400 text-[11px] uppercase block mb-1">District</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">Kota (108)</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400 text-[11px] uppercase block mb-1">Tehsil</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">Ladpura (00539)</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400 text-[11px] uppercase block mb-1">Official Village Code</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">03807600 (Ranpur)</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0f2b1d] text-white text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <span>Official Coordinate System: WGS 84 / Standard GIS</span>
            <span className="text-amber-400 font-bold">14 Official Khasra Plots Mapped in Pilot</span>
          </div>
        </div>

        {/* Section 03: Four Trusted Information Sources */}
        <div className="space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 block mb-1">
              03 RECORD SOURCES
            </span>
            <h2 className="text-2xl font-serif font-bold text-slate-900">
              Where Our Information Comes From
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Apna Khata (e-Dharti Rajasthan)
              </h3>
              <p className="text-slate-600 leading-relaxed font-sans">
                Official computer land records (Jamabandi) maintained under the Rajasthan Land Revenue Act. 
                Provides exact owner names, ownership share, and record of previous transfers.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Bhunaksha Official Maps
              </h3>
              <p className="text-slate-600 leading-relaxed font-sans">
                Official village cadastral maps prepared by the state government, showing exact shapes, 
                boundaries, and neighboring plots for each Khasra number.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                <Scale className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                e-Courts Legal Dispute Check
              </h3>
              <p className="text-slate-600 leading-relaxed font-sans">
                Court case tracking across Kota District Court and Rajasthan Revenue Board to flag stay orders, 
                family property partitions, or ongoing lawsuits before you buy.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Landmark className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Sub-Registrar (IGRS) Loan & Mortgage Check
              </h3>
              <p className="text-slate-600 leading-relaxed font-sans">
                Registered mortgage and sale deed records from Sub-Registrar Ladpura, protecting buyers 
                from undisclosed bank loans or multiple sale agreements.
              </p>
            </div>
          </div>
        </div>

        {/* Section 04: Two-Person Checking Process */}
        <div className="p-8 rounded-3xl bg-[#0f2b1d] text-[#f8fafc] border border-emerald-800 shadow-lg space-y-4">
          <div className="flex items-center gap-2 text-amber-400">
            <Lock className="w-5 h-5" />
            <span className="text-xs uppercase tracking-widest font-bold">
              04 INTEGRITY & ACCURACY
            </span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-white">
            The Two-Person Verification Rule
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            To prevent errors or improper tampering with land records, e-Stahl uses a strict two-person checking process. 
            When an inspecting officer uploads or updates record details, the changes are stored as pending. 
            A separate senior authorized officer must review the original government document and confirm the details with their password before the record is updated for the public.
          </p>
        </div>

        {/* Call to Action */}
        <div className="text-center space-y-4 pt-8 border-t border-slate-200">
          <h3 className="text-2xl font-serif font-bold text-slate-900">
            Ready to Check Land in Ranpur Village?
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            Open the village map, search any plot number, and view verified ownership details with confidence.
          </p>
          <Link
            to="/map"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md transition-all"
          >
            <span>Open Village Map</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>

      {/* Editorial Footer Note */}
      <footer className="bg-slate-900 text-slate-400 py-6 px-4 text-center text-xs font-mono border-t border-slate-800">
        ACCURATE RECORDS • HONEST LAND INTELLIGENCE • RANPUR VILLAGE PILOT
      </footer>

    </div>
  );
};
