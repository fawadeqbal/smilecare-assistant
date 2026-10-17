import type { Metadata } from 'next';
import { Bricolage_Grotesque, Public_Sans } from 'next/font/google';
import './globals.css';

const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage', display: 'swap' });
const sans = Public_Sans({ subsets: ['latin'], variable: '--font-public-sans', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'SmileCare Dental Clinic', template: '%s · SmileCare' },
  description: 'Gentle, modern dentistry in Riverside. Ask our assistant about treatments, prices and hours, or request an appointment.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
