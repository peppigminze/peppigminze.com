/** Inline-SVG-Icons (keine Icon-Library → kleineres Bundle). */
type P = { className?: string };

export const GitHubIcon = ({ className = 'h-4 w-4' }: P) => (
  <svg viewBox="0 0 16 16" className={className} fill="currentColor" aria-hidden="true">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
);

export const StarIcon = ({ className = 'h-3.5 w-3.5' }: P) => (
  <svg viewBox="0 0 16 16" className={className} fill="currentColor" aria-hidden="true">
    <path d="M8 .25a.75.75 0 01.67.42l1.88 3.81 4.2.61a.75.75 0 01.42 1.28l-3.04 2.96.72 4.19a.75.75 0 01-1.09.79L8 12.33l-3.76 1.98a.75.75 0 01-1.09-.79l.72-4.19L.83 6.37a.75.75 0 01.42-1.28l4.2-.61L7.33.67A.75.75 0 018 .25z" />
  </svg>
);

export const CloseIcon = ({ className = 'h-4 w-4' }: P) => (
  <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" />
  </svg>
);

export const SearchIcon = ({ className = 'h-4 w-4' }: P) => (
  <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <circle cx="7" cy="7" r="4.5" />
    <path d="M10.5 10.5L14 14" strokeLinecap="round" />
  </svg>
);

export const ExternalIcon = ({ className = 'h-3.5 w-3.5' }: P) => (
  <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M6 3H3v10h10v-3M9 3h4v4M13 3L7 9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const SyncIcon = ({ className = 'h-3.5 w-3.5' }: P) => (
  <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M13.5 6.5A5.5 5.5 0 003.2 4.8M2.5 9.5a5.5 5.5 0 0010.3 1.7" strokeLinecap="round" />
    <path d="M3 2v3h3M13 14v-3h-3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Pixel-Minzblatt – das Logo. 10×10 Raster, Blattader als Aussparung. */
const LEAF = [
  '......####',
  '....######',
  '...#######',
  '..#####.##',
  '.#####.##.',
  '.####.###.',
  '.###.###..',
  '.##.###...',
  '..###.....',
  '##........',
];
export const LeafLogo = ({ className = 'h-6 w-6' }: P) => (
  <svg viewBox="0 0 10 10" className={className} shapeRendering="crispEdges" aria-hidden="true">
    {LEAF.flatMap((row, y) =>
      row.split('').map((c, x) =>
        c === '#' ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={y > 7 && x < 3 ? '#1E8A63' : x + y < 9 ? '#3DFFB5' : '#00F5A0'} /> : null,
      ),
    )}
  </svg>
);
export const LEAF_PIXELS = LEAF;
