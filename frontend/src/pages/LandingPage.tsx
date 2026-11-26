import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search, ArrowRight, ArrowDown, ShieldCheck, Scale, Landmark,
  MapPin, Check, Eye
} from 'lucide-react';
import { VillageSketch } from '../components/VillageSketch';

const samplePlots = [
  { key: '01', khasra: '101', title: 'Plot 101', note: 'Clean farmland', swatch: 'bg-[#7a9a55]' },
  { key: '02', khasra: '102/1', title: 'Plot 102/1', note: 'Court dispute', swatch: 'bg-[#e5b03c]' },
  { key: '03', khasra: '103', title: 'Plot 103', note: 'Bank loan', swatch: 'bg-[#a8473a]' },
  { key: '04', khasra: '104', title: 'Plot 104', note: 'Village grazing land', swatch: 'bg-[#9bb26c]' },
];

const checks = [
  {
    icon: ShieldCheck,
    title: 'Check land owner',
    body: "See the legal owner's name, their parent's name, ownership share, and land type from official government Jamabandi records.",
    source: 'Official Apna Khata Jamabandi',
  },
  {
    icon: Scale,
    title: 'Find land disputes',
    body: 'Check whether any family dispute, court case, or stay order exists against the land in District Court Kota or Civil Courts.',
    source: 'e-Courts Case Repository',
  },
  {
    icon: Landmark,
    title: 'Check bank loans',
    body: 'Find out if the seller took a bank loan or mortgage on the land that was not cleared at the Sub-Registrar Office.',
    source: 'SRO Ladpura Loan Indexes',
  },
  {
    icon: Eye,
    title: 'Satellite & buildings',
    body: 'Inspect satellite photos to verify whether the land is vacant, cultivated, or has visible building structures.',
    source: 'Smart Satellite Scan',
  },
];

const steps = [
  { title: 'Open the village map', body: 'Explore the entire village of Ranpur on an interactive map. Switch between satellite and normal road views.' },
  { title: 'Select your plot', body: 'Click on any land plot or type your Khasra number in the search bar to see basic land details for free.' },
  { title: 'Unlock detailed report', body: 'Use tokens to view owner history, court stay orders, bank loans, and download an official verification report.' },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [khasraInput, setKhasraInput] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (khasraInput.trim()) {
      navigate(`/map?khasra=${encodeURIComponent(khasraInput.trim())}`);
    } else {
      navigate('/map');
    }
  };

  return (
    <div className="animate-fade-in bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">

      {/* 1. Hero: forest panel + village sketch */}
      <section className="grid lg:grid-cols-2 bg-civic-forest text-civic-cream">
        <div className="relative px-6 sm:px-10 lg:px-14 pt-14 pb-12 flex flex-col justify-between gap-12 min-h-[540px]">
          <div className="space-y-7">
            <div className="eyebrow flex items-center gap-2 text-civic-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-civic-ochre" />
              <span>Pilot location: Ranpur village, Kota (PIN 325003)</span>
            </div>

            <h1 className="font-sans font-extrabold tracking-[-0.04em] leading-[0.98] text-5xl sm:text-6xl xl:text-7xl">
              Know your land <br />
              <span className="text-civic-ochre">before</span> you buy.
            </h1>

            <p className="text-base text-civic-cream/80 max-w-md leading-relaxed">
              Simple land checks for Indian buyers. Check land owners, court disputes,
              bank loans, and boundaries in just a few clicks.
            </p>

            <form onSubmit={handleSearch} className="max-w-lg">
              <label htmlFor="khasra-search" className="sr-only">Khasra number</label>
              <div className="flex items-stretch border border-civic-cream/30 focus-within:border-civic-ochre rounded-lg overflow-hidden bg-civic-forest-dark/60 transition-colors">
                <span className="pl-4 flex items-center text-civic-muted"><Search className="w-4 h-4" /></span>
                <input
                  id="khasra-search"
                  type="text"
                  value={khasraInput}
                  onChange={(e) => setKhasraInput(e.target.value)}
                  placeholder="Khasra number in Ranpur (e.g. 101, 102/1)"
                  className="w-full bg-transparent px-3 py-3.5 text-sm text-civic-cream placeholder-civic-muted/80 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-5 bg-civic-ochre hover:bg-civic-ochre-light text-civic-forest-dark font-bold text-sm flex items-center gap-2 transition-colors flex-shrink-0"
                >
                  <span>Check land</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
              <span className="text-civic-muted uppercase tracking-widest mr-1">Try</span>
              {samplePlots.map((p) => (
                <button
                  key={p.khasra}
                  onClick={() => navigate(`/map?khasra=${p.khasra}`)}
                  className="px-2.5 py-1 rounded border border-civic-cream/25 hover:border-civic-ochre hover:text-civic-ochre transition-colors"
                >
                  {p.title} · {p.note}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-end justify-between gap-6 border-t border-civic-cream/15 pt-5">
            <p className="eyebrow text-civic-muted leading-relaxed">
              Look up owners. Check disputes. Buy with confidence.
            </p>
            <a
              href="#checks"
              aria-label="Scroll to what you can check"
              className="w-11 h-11 rounded-full border border-civic-cream/40 hover:border-civic-ochre hover:text-civic-ochre flex items-center justify-center flex-shrink-0 transition-colors"
            >
              <ArrowDown className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="relative min-h-[320px] lg:min-h-0 overflow-hidden">
          <VillageSketch overlay className="absolute inset-0 w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-r from-civic-forest/50 via-transparent to-transparent pointer-events-none" />
          <span className="absolute bottom-4 left-4 eyebrow text-civic-cream/90">Field note 001 · Ranpur</span>
        </div>
      </section>

      {/* 2. Proof strip */}
      <section className="border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
          {[
            { n: '01', big: 'Official', title: 'Government records', body: 'Connected with Apna Khata and Bhunaksha records.' },
            { n: '02', big: 'Clear', title: 'Court & loan checks', body: 'Find stay orders and bank mortgages before paying an advance.' },
            { n: '03', big: 'Satellite', title: 'Smart land & building check', body: 'See if the land is vacant or built upon.' },
          ].map((s) => (
            <div key={s.n} className="px-6 sm:px-8 py-8 space-y-2">
              <div className="eyebrow text-slate-500 dark:text-slate-400">{s.n}</div>
              <div className="text-3xl font-serif font-black text-emerald-700 dark:text-amber-400">{s.big}</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">{s.title}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Four core checks */}
      <section id="checks" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-10">
        <div className="max-w-2xl space-y-3">
          <span className="eyebrow text-emerald-700 dark:text-amber-400">What you can check</span>
          <h2 className="text-3xl sm:text-5xl font-serif font-black text-slate-900 dark:text-white leading-tight">
            Avoid costly property mistakes
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Every year, ordinary Indian families lose life savings to disputed or government land.
            Here is how e-Stahl protects you.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          {checks.map((c, i) => (
            <div key={c.title} className="bg-slate-50 dark:bg-slate-900 p-6 flex flex-col justify-between gap-6 hover:bg-white dark:hover:bg-slate-850 transition-colors">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs px-2 py-1 rounded bg-civic-forest text-civic-cream">0{i + 1}</span>
                  <c.icon className="w-5 h-5 text-emerald-700 dark:text-amber-400" />
                </div>
                <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-white">{c.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{c.body}</p>
              </div>
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] font-mono text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> {c.source}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Plot sheet (master-plan style) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-10 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-6 border-b-2 border-slate-900 dark:border-slate-200">
            <div className="space-y-1">
              <span className="eyebrow text-emerald-700 dark:text-amber-400">Village plot sheet</span>
              <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-900 dark:text-white">Ranpur, Kota</h2>
            </div>
            <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 sm:text-right leading-relaxed">
              <div>PIN: 325003</div>
              <div>SRO: LADPURA, RAJASTHAN</div>
            </div>
          </div>

          <div className="grid lg:grid-cols-[320px_1fr] gap-8 pt-8">
            <div className="space-y-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Example plot keys</h3>
              <ul className="space-y-3">
                {samplePlots.map((p) => (
                  <li key={p.khasra}>
                    <button
                      onClick={() => navigate(`/map?khasra=${p.khasra}`)}
                      className="w-full flex items-start gap-3 text-left group"
                    >
                      <span className={`w-7 h-7 rounded-md ${p.swatch} flex-shrink-0 flex items-center justify-center font-mono text-[11px] font-bold text-civic-forest-dark`}>
                        {p.key}
                      </span>
                      <span>
                        <span className="block text-sm font-bold text-slate-900 dark:text-white group-hover:underline">{p.title}</span>
                        <span className="block text-xs text-slate-500 dark:text-slate-400">{p.note}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              <div className="rounded-xl border border-slate-300 dark:border-slate-700 p-4">
                <div className="eyebrow text-slate-500 dark:text-slate-400 mb-1">Note</div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Illustrative sketch. Open the interactive map for the official plot boundaries.
                </p>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 min-h-[300px] relative bg-civic-cream-dark">
              <VillageSketch className="absolute inset-0 w-full h-full" />
            </div>
          </div>
        </div>
      </section>

      {/* 5. Three steps */}
      <section className="bg-slate-100 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-10">
          <div className="space-y-3 max-w-xl">
            <span className="eyebrow text-emerald-700 dark:text-amber-400">How it works</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-900 dark:text-white">
              Check any plot in 3 simple steps
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              No need to visit government offices or wait weeks for paperwork.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <div key={s.title} className="border-t-2 border-slate-900 dark:border-slate-200 pt-4 space-y-2">
                <div className="font-mono text-xs text-slate-500 dark:text-slate-400">0{i + 1}</div>
                <h3 className="text-lg font-serif font-bold text-slate-900 dark:text-white">{s.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>

          <Link
            to="/map"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-civic-forest hover:bg-civic-forest-light text-civic-cream font-bold text-sm shadow-lg shadow-civic-forest/20 transition-colors"
          >
            <MapPin className="w-4 h-4 text-civic-ochre" />
            <span>Open interactive village map</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 6. Zero deduction guarantee */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
        <div className="rounded-2xl bg-civic-forest text-civic-cream p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <span className="eyebrow text-civic-ochre block">100% fair & transparent</span>
            <h3 className="text-2xl sm:text-3xl font-serif font-bold">Zero token deduction guarantee</h3>
            <p className="text-xs text-civic-cream/75 max-w-lg leading-relaxed">
              If an intelligence category has no verified records for a selected plot,
              zero tokens will be charged from your wallet. You only pay for verified data.
            </p>
          </div>
          <Link
            to="/register"
            className="px-6 py-3.5 rounded-lg bg-civic-ochre hover:bg-civic-ochre-light text-civic-forest-dark font-bold text-sm transition-colors flex-shrink-0"
          >
            Get 10 free tokens
          </Link>
        </div>
      </section>

    </div>
  );
};
