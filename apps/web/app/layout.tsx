import type { Metadata } from 'next';
import { Instrument_Serif, Onest } from 'next/font/google';
import './globals.css';

// Onest is variable (400–800), so no weight list. Instrument Serif ships a single
// italic cut used only for accent words.
const sans = Onest({ subsets: ['latin'], variable: '--font-onest', display: 'swap' });
const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: 'italic', variable: '--font-instrument', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'SmileCare Dental Clinic', template: '%s · SmileCare' },
  description: 'Calm, modern dentistry in Riverside, six days a week. Ask Sunny about treatments, prices and hours, or request a visit.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
