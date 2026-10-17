/** Brand marks from the SmileCare design system: the smile tile, Sunny's avatar and the arc underline. */

export function SmileMark({ size = 38, inverted = false }: { size?: number; inverted?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className="flex-none">
      <rect width="40" height="40" rx="12" fill={inverted ? '#FFFFFF' : '#0A66F0'} />
      <path d="M10.5 19 Q20 30 29.5 19" stroke={inverted ? '#0A66F0' : '#FFFFFF'} strokeWidth="3.6" fill="none" strokeLinecap="round" />
      <circle cx="30" cy="10.5" r="3.4" fill="#FF8A65" />
    </svg>
  );
}

export function Wordmark({ className = 'text-2xl' }: { className?: string }) {
  return (
    <span className={`font-display font-bold tracking-[-0.02em] ${className}`}>
      Smile<span className="text-ocean-600">Care</span>
    </span>
  );
}

export function SunnyAvatar({ size = 32, light = false }: { size?: number; light?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className="flex-none">
      <circle cx="20" cy="20" r="20" fill={light ? '#FFFFFF' : '#0A66F0'} />
      <path d="M11 19 Q20 29 29 19" stroke={light ? '#0A66F0' : '#FFFFFF'} strokeWidth="3.6" fill="none" strokeLinecap="round" />
      <circle cx="29" cy="11" r="3.2" fill="#FF8A65" />
    </svg>
  );
}

/** The coral smile arc drawn under one key word per page. */
export function SmileUnderline({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`relative whitespace-nowrap ${className}`}>
      {children}
      <svg
        aria-hidden="true"
        className="absolute left-0 h-[0.32em] w-full"
        style={{ bottom: '-0.16em' }}
        viewBox="0 0 200 24"
        preserveAspectRatio="none"
      >
        <path d="M6 6 Q100 30 194 6" stroke="#FF8A65" strokeWidth="7" fill="none" strokeLinecap="round" />
      </svg>
    </span>
  );
}

/** Decorative arc used on ocean and coral panels. */
export function ArcDecoration({ className, stroke = '#2F7BFF', width = 22, spark = false }: { className: string; stroke?: string; width?: number; spark?: boolean }) {
  return (
    <svg aria-hidden="true" className={`pointer-events-none absolute ${className}`} viewBox="0 0 200 200">
      <path d="M30 80 Q100 170 170 80" stroke={stroke} strokeWidth={width} fill="none" strokeLinecap="round" />
      {spark && <circle cx="168" cy="44" r="9" fill="#FF8A65" />}
    </svg>
  );
}
