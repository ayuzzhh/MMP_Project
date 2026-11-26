import React from 'react';

interface VillageSketchProps {
  /** Adds the concentric-circle callout overlay used in the hero. */
  overlay?: boolean;
  className?: string;
}

const MONO = "'JetBrains Mono', monospace";

/** Illustrated sketch of the pilot village's plots (decorative; not live GIS data). */
export const VillageSketch: React.FC<VillageSketchProps> = ({ overlay = false, className = '' }) => {
  const label = (x: number, y: number, text: string) => (
    <g>
      <rect x={x - 4} y={y - 12} width={text.length * 7.2 + 8} height={18} rx={3} fill="#0f2b1d" opacity={0.82} />
      <text x={x} y={y} fontFamily={MONO} fontSize={11} fill="#f6f3eb" letterSpacing={1}>{text}</text>
    </g>
  );

  const trees: Array<[number, number]> = [
    [30, 24], [60, 18], [270, 22], [300, 16], [455, 30], [540, 24], [20, 420], [48, 440], [330, 430],
    [350, 455], [400, 440], [520, 430], [560, 455], [95, 530], [250, 520], [470, 520],
  ];

  return (
    <svg
      viewBox="0 0 600 560"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="img"
      aria-label="Illustrated sketch of village land plots, roads and a pond"
    >
      <defs>
        <pattern id="vs-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="#e5b03c" strokeWidth="2" opacity="0.7" />
        </pattern>
      </defs>

      {/* Terrain */}
      <rect width="600" height="560" fill="#5b7d45" />

      {/* Plots */}
      <g stroke="#f6f3eb" strokeWidth="1.5" strokeDasharray="6 4" strokeLinejoin="round">
        <polygon points="30,50 238,38 252,196 46,212" fill="#7a9a55" />
        <polygon points="278,40 440,64 424,204 290,194" fill="#6b8f4a" />
        <polygon points="46,236 252,222 268,384 62,404" fill="#8aa55f" />
        <polygon points="290,226 424,220 440,386 304,378" fill="#9bb26c" />
        <polygon points="462,70 590,92 580,380 452,388" fill="#6f9150" />
        <polygon points="278,40 440,64 424,204 290,194" fill="url(#vs-hatch)" />
      </g>

      {/* Roads */}
      <g fill="none" strokeLinecap="round">
        <path d="M0,216 C140,228 300,208 600,226" stroke="#d9bf8a" strokeWidth="12" />
        <path d="M265,0 C256,150 276,300 262,560" stroke="#d9bf8a" strokeWidth="12" />
        <path d="M447,60 C440,200 456,300 446,560" stroke="#d9bf8a" strokeWidth="8" />
        <path d="M0,216 C140,228 300,208 600,226" stroke="#f1dfb5" strokeWidth="2" strokeDasharray="10 8" />
      </g>

      {/* Pond */}
      <ellipse cx="150" cy="486" rx="108" ry="44" fill="#6ec3d6" stroke="#2c6f7e" strokeWidth="2" />
      <ellipse cx="136" cy="478" rx="60" ry="18" fill="#9bdbe8" opacity="0.6" />

      {/* Homes on the loan-flagged plot */}
      <g fill="#a8473a" stroke="#4a1f18" strokeWidth="1">
        <rect x="100" y="270" width="16" height="14" /><rect x="140" y="300" width="16" height="14" />
        <rect x="190" y="276" width="16" height="14" /><rect x="120" y="340" width="16" height="14" />
      </g>

      {/* Trees */}
      <g fill="#2f5a34" stroke="#1d3b22" strokeWidth="1">
        {trees.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={11} />)}
      </g>

      {/* Plot labels */}
      {label(78, 128, 'PLOT 101')}
      {label(310, 128, 'PLOT 102/1')}
      {label(92, 318, 'PLOT 103')}
      {label(322, 308, 'PLOT 104')}

      {overlay && (
        <g fill="none">
          <circle cx="430" cy="410" r="150" stroke="#e5b03c" strokeWidth="1" opacity="0.85" />
          <circle cx="395" cy="370" r="125" stroke="#f6f3eb" strokeWidth="1" opacity="0.6" />
          <circle cx="418" cy="392" r="26" fill="#0f2b1d" stroke="#e5b03c" strokeWidth="1.5" />
          <text x="410" y="396" fontFamily={MONO} fontSize="11" fill="#f6f3eb">01</text>
          <circle cx="436" cy="392" r="2.5" fill="#e5b03c" />
          <text x="390" y="262" fontFamily={MONO} fontSize="10" fill="#f6f3eb" letterSpacing="2">OWNER</text>
          <text x="500" y="300" fontFamily={MONO} fontSize="10" fill="#f6f3eb" letterSpacing="2">COURT</text>
          <text x="470" y="540" fontFamily={MONO} fontSize="10" fill="#f6f3eb" letterSpacing="2">LOANS</text>
        </g>
      )}
    </svg>
  );
};

export default VillageSketch;
