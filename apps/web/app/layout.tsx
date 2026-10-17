import type { Metadata } from 'next';
import { Figtree, Gabarito } from 'next/font/google';
import './globals.css';

const display = Gabarito({ subsets: ['latin'], variable: '--font-gabarito', display: 'swap' });
const sans = Figtree({ subsets: ['latin'], variable: '--font-figtree', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'SmileCare Dental Clinic', template: '%s · SmileCare' },
  description: 'Gentle dentistry in Riverside, six days a week. Ask Sunny about treatments, prices and hours, or request an appointment.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
