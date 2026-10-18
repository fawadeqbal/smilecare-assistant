/**
 * Brand marks from SmileCare design system 3.0 ("Night & Glow"):
 * the tooth tile with its aqua spark, the wordmark, Sunny's avatar and the soft glow.
 */

export const TOOTH_PATH =
  'M7.5 3.5C5 3.5 3.5 5.3 3.5 8c0 2.4.9 3.8 1.4 6.2.5 2.6.9 6.3 2.6 6.3 1.9 0 1.8-5.1 4.5-5.1s2.6 5.1 4.5 5.1c1.7 0 2.1-3.7 2.6-6.3.5-2.4 1.4-3.8 1.4-6.2 0-2.7-1.5-4.5-4-4.5-1.9 0-2.8 1-4.5 1s-2.6-1-4.5-1z';

/** Azure tile, white tooth, aqua spark. `inverted` gives a white tile for use on azure. */
export function SmileMark({ size = 38, inverted = false }: { size?: number; inverted?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className="flex-none">
      <rect width="40" height="40" rx="12" fill={inverted ? '#FFFFFF' : '#3355FF'} />
      <path transform="translate(8 8.5)" d={TOOTH_PATH} fill={inverted ? '#3355FF' : '#FFFFFF'} />
      <path d="M31 5.5l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" fill="#2FE0C8" />
    </svg>
  );
}

/** "SmileCare" set in Onest 700, one colour. It inherits the text colour. */
export function Wordmark({ className = 'text-2xl' }: { className?: string }) {
  return <span className={`font-bold tracking-[-0.03em] ${className}`}>SmileCare</span>;
}

/** Sunny keeps a friendly face of its own: smile, two eyes, and an optional spark. */
export function SunnyAvatar({ size = 32, light = false, spark = false }: { size?: number; light?: boolean; spark?: boolean }) {
  const face = light ? '#3355FF' : '#FFFFFF';
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className="flex-none">
      <circle cx="20" cy="20" r="20" fill={light ? '#FFFFFF' : '#3355FF'} />
      <path d="M11 19 Q20 29 29 19" stroke={face} strokeWidth="3.6" fill="none" strokeLinecap="round" />
      <circle cx="14" cy="13.5" r="2" fill={face} />
      <circle cx="26" cy="13.5" r="2" fill={face} />
      {spark && <path d="M32 3.5l.9 2.2 2.2.9-2.2.9-.9 2.2-.9-2.2-2.2-.9 2.2-.9z" fill="#2FE0C8" />}
    </svg>
  );
}

/** The four-point spark, for small decorative accents. */
export function Spark({ size = 14, color = '#2FE0C8', className = '' }: { size?: number; color?: string; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden="true" className={`flex-none ${className}`}>
      <path d="M5 0l1.2 3.8L10 5 6.2 6.2 5 10 3.8 6.2 0 5l3.8-1.2z" fill={color} />
    </svg>
  );
}

/** Instrument Serif italic accent for one or two words per headline. */
export function Accent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <span className={`sv ${className}`}>{children}</span>;
}

/** Soft radial lights for Night surfaces. Position with `className`. */
export function Glow({ className, color = 'azure' }: { className: string; color?: 'azure' | 'aqua' }) {
  const fill = color === 'azure' ? 'rgba(51,85,255,0.55)' : 'rgba(47,224,200,0.28)';
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute rounded-full blur-3xl ${className}`}
      style={{ background: `radial-gradient(closest-side, ${fill}, transparent)` }}
    />
  );
}

/** Quiet smile arc used as texture on dark dashboard cards. */
export function ArcDecoration({ className, stroke = '#1B2340', width = 22, spark = false }: { className: string; stroke?: string; width?: number; spark?: boolean }) {
  return (
    <svg aria-hidden="true" className={`pointer-events-none absolute ${className}`} viewBox="0 0 200 200">
      <path d="M30 80 Q100 170 170 80" stroke={stroke} strokeWidth={width} fill="none" strokeLinecap="round" />
      {spark && <circle cx="168" cy="44" r="9" fill="#14BFA8" />}
    </svg>
  );
}
