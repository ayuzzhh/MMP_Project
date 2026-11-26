import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ShieldCheck, Scale, Satellite } from 'lucide-react';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

const highlights = [
  { icon: ShieldCheck, text: 'Owner and Jamabandi records checked in seconds' },
  { icon: Scale, text: 'Court disputes and bank loans flagged before you pay' },
  { icon: Satellite, text: 'Satellite view to see if land is vacant or built on' },
];

/** Shared split-screen layout for the Sign In and Create Account pages (UI only). */
export const AuthShell: React.FC<AuthShellProps> = ({ title, subtitle, children }) => {
  return (
    <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2 bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Brand panel (desktop only) */}
      <aside className="hidden lg:flex relative overflow-hidden flex-col justify-between p-12 text-white bg-civic-forest">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-sky-500/10 blur-3xl" />

        <Link to="/" className="relative flex items-center gap-3 w-fit">
          <span className="flex items-end gap-0.5 h-6" aria-hidden="true">
            <span className="w-1 h-3 bg-civic-ochre" /><span className="w-1 h-5 bg-emerald-400" /><span className="w-1 h-4 bg-emerald-400" />
          </span>
          <span className="text-xl font-bold tracking-tight">e-stahl <span className="text-civic-muted font-normal">/ land</span></span>
        </Link>

        <div className="relative space-y-8 max-w-md">
          <h2 className="text-5xl xl:text-6xl font-sans font-extrabold tracking-[-0.04em] leading-[1]">
            Know your land <span className="text-civic-ochre">before</span> you buy.
          </h2>
          <ul className="space-y-4">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-emerald-50/90">
                <span className="mt-0.5 w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-emerald-300" />
                </span>
                <span className="leading-relaxed pt-1">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative eyebrow text-civic-muted">
          Pilot village · Ranpur, Kota, Rajasthan
        </p>
      </aside>

      {/* Form side */}
      <section className="flex items-center justify-center px-4 sm:px-8 py-10">
        <div className="w-full max-w-md space-y-7 animate-fade-in">
          <div className="space-y-2 text-center lg:text-left">
            <div className="lg:hidden w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-sky-500 mx-auto flex items-center justify-center text-white shadow-lg shadow-emerald-600/20 mb-3">
              <Compass className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-serif">
              {title}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
          {children}
        </div>
      </section>
    </div>
  );
};

export default AuthShell;
