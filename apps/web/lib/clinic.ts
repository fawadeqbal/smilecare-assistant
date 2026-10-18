/**
 * Static content for the demo clinic website. It mirrors the seeded knowledge base
 * (apps/api/src/infrastructure/database/seed-data) so the page and the assistant agree.
 */
export const clinic = {
  name: 'SmileCare Dental Clinic',
  phone: '(555) 014-2290',
  phoneHref: 'tel:+15550142290',
  email: 'hello@smilecare-dental.example',
  address: ['Suite 210, Maple Grove Medical Centre', '48 Maple Grove Avenue, Riverside'],
  timezone: 'America/New_York',
  // 0 = Sunday. Times are 24h, local to the clinic.
  hours: [
    { day: 'Sunday', open: null, close: null },
    { day: 'Monday', open: '09:00', close: '19:00' },
    { day: 'Tuesday', open: '09:00', close: '19:00' },
    { day: 'Wednesday', open: '09:00', close: '19:00' },
    { day: 'Thursday', open: '09:00', close: '19:00' },
    { day: 'Friday', open: '09:00', close: '19:00' },
    { day: 'Saturday', open: '10:00', close: '16:00' },
  ] as Array<{ day: string; open: string | null; close: string | null }>,
};

export const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.address.join(', '))}`;

/** What the hero booking card offers. `need` values are sent as the booking's service. */
export const bookingNeeds = ['Checkup and cleaning', 'Whitening', 'Aligners', 'Tooth pain', 'Something else'] as const;
export const bookingTimes = [
  { label: 'Mornings', hours: 'Mon–Fri', value: 'Weekday morning' },
  { label: 'Afternoons', hours: 'Mon–Fri', value: 'Weekday afternoon' },
  { label: 'Saturday', hours: '10 am – 4 pm', value: 'Saturday' },
] as const;

export type TreatmentTheme = 'azure-soft' | 'aqua-soft' | 'night' | 'azure';

export interface TreatmentGroup {
  label: string;
  /** Used in "Book …" */
  short: string;
  /** Need pre-selected on the booking card when "Book …" is pressed. */
  need: (typeof bookingNeeds)[number];
  theme: TreatmentTheme;
  icon: 'check' | 'sparkle' | 'shield' | 'teeth';
  blurb: string;
  question: string;
  items: Array<{ name: string; price: string; note: string }>;
}

export const treatments: TreatmentGroup[] = [
  {
    label: 'Checkups',
    short: 'a checkup',
    need: 'Checkup and cleaning',
    theme: 'azure-soft',
    icon: 'check',
    blurb: 'Exam, X-rays and a gentle professional clean. The easiest way to keep small problems small.',
    question: 'What happens at a new patient exam?',
    items: [
      { name: 'New patient exam with X-rays', price: '$149', note: 'Your first visit' },
      { name: 'Routine checkup', price: '$79', note: 'Every six months' },
      { name: 'Professional cleaning', price: '$119', note: 'Polish and plaque removal' },
      { name: "Children's checkup and cleaning", price: '$89', note: 'Kids welcome' },
    ],
  },
  {
    label: 'Cosmetic',
    short: 'whitening',
    need: 'Whitening',
    theme: 'aqua-soft',
    icon: 'sparkle',
    blurb: 'Brighter, more even smiles, in one visit or at home on your own schedule.',
    question: 'How much is teeth whitening?',
    items: [
      { name: 'In-office whitening', price: '$449', note: 'One visit' },
      { name: 'Take-home whitening kit', price: '$249', note: 'At your own pace' },
      { name: 'Porcelain veneer', price: 'from $950', note: 'Per tooth' },
      { name: 'Cosmetic bonding', price: 'from $280', note: 'Chips and gaps' },
    ],
  },
  {
    label: 'Restorative',
    short: 'a visit',
    need: 'Something else',
    theme: 'night',
    icon: 'shield',
    blurb: 'Fix pain and damage with natural-looking materials, explained clearly before we start.',
    question: 'How much does a root canal cost?',
    items: [
      { name: 'Tooth-colored filling', price: '$150–260', note: 'Matches your teeth' },
      { name: 'Root canal, molar', price: '$1,150', note: 'Pain relief that lasts' },
      { name: 'Porcelain crown', price: '$1,200', note: 'Natural look' },
      { name: 'Dental implant', price: 'from $3,400', note: 'Replaces a missing tooth' },
    ],
  },
  {
    label: 'Orthodontics',
    short: 'a consultation',
    need: 'Aligners',
    theme: 'azure',
    icon: 'teeth',
    blurb: 'Straighter teeth with clear aligners or braces. Your first consultation is free.',
    question: 'Are clear aligners right for me?',
    items: [
      { name: 'Braces or aligner consultation', price: 'Free', note: 'No obligation' },
      { name: 'Clear aligners', price: 'from $3,900', note: 'Nearly invisible' },
      { name: 'Metal braces', price: 'from $3,600', note: 'Proven and affordable' },
    ],
  },
];

export const insurers = ['Delta Dental PPO', 'Cigna Dental', 'MetLife', 'Aetna Dental', 'Guardian'];

export const team = [
  { name: 'Dr. Amina Rahman', initials: 'AR', role: 'General and cosmetic dentistry', years: 14, tile: 'bg-azure-50', ring: '#BCC8FF', ink: 'text-azure-700' },
  { name: 'Dr. Daniel Okafor', initials: 'DO', role: 'Root canals and implants', years: 11, tile: 'bg-aqua-50', ring: '#93EBDB', ink: 'text-aqua-700' },
  { name: 'Dr. Sofia Marquez', initials: 'SM', role: 'Orthodontics and clear aligners', years: 9, tile: 'bg-pearl', ring: '#CDD2E1', ink: 'text-night-600' },
];

export const faqs: Array<{ q: string; a: string }> = [
  {
    q: 'Do you take my insurance?',
    a: "We're in network with Delta Dental PPO, Cigna Dental, MetLife, Aetna Dental and Guardian, and can bill most other PPO plans out of network. No insurance? Membership starts at $219 a year.",
  },
  { q: 'Are you open on weekends?', a: "Yes, Saturdays from 10 am to 4 pm. On weekdays we're open 9 am to 7 pm. We're closed on Sundays." },
  {
    q: "I'm nervous about the dentist. Can you help?",
    a: 'Tell us when you book. We offer longer appointments, noise-cancelling headphones and laughing gas.',
  },
  { q: 'How much is teeth whitening?', a: 'In-office whitening is $449 for one visit. A take-home kit is $249.' },
  { q: 'Can I pay in installments?', a: 'Yes. Any treatment over $500 can be split into 0% monthly payments, subject to approval.' },
  {
    q: 'Where do I park?',
    a: 'Free validated parking on levels B1–B2 of Maple Grove Medical Centre. The building has an elevator and is wheelchair accessible.',
  },
];
