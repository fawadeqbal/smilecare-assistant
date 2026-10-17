/**
 * Static content for the demo clinic website. It mirrors the seeded knowledge base
 * (apps/api/src/infrastructure/database/seed-data) so the page and the assistant agree.
 */
export const clinic = {
  name: 'SmileCare Dental Clinic',
  phone: '(555) 014-2290',
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

export const treatments: Array<{ group: string; items: Array<{ name: string; price: string; note?: string }> }> = [
  {
    group: 'Checkups and cleaning',
    items: [
      { name: 'New patient exam with X-rays', price: '$149' },
      { name: 'Routine checkup', price: '$79' },
      { name: 'Professional cleaning', price: '$119' },
      { name: "Children's checkup and cleaning", price: '$89' },
    ],
  },
  {
    group: 'Cosmetic',
    items: [
      { name: 'In-office whitening, one visit', price: '$449' },
      { name: 'Take-home whitening kit', price: '$249' },
      { name: 'Porcelain veneer', price: 'from $950' },
      { name: 'Cosmetic bonding', price: 'from $280' },
    ],
  },
  {
    group: 'Restorative',
    items: [
      { name: 'Tooth-colored filling', price: '$150–260' },
      { name: 'Root canal, molar', price: '$1,150' },
      { name: 'Porcelain crown', price: '$1,200' },
      { name: 'Dental implant', price: 'from $3,400' },
    ],
  },
  {
    group: 'Orthodontics',
    items: [
      { name: 'Braces or aligner consultation', price: 'Free' },
      { name: 'Clear aligners', price: 'from $3,900' },
      { name: 'Metal braces', price: 'from $3,600' },
    ],
  },
];

export const insurers = ['Delta Dental PPO', 'Cigna Dental', 'MetLife', 'Aetna Dental', 'Guardian'];

export const team = [
  { name: 'Dr. Amina Rahman', role: 'General and cosmetic dentistry', years: 14 },
  { name: 'Dr. Daniel Okafor', role: 'Root canals and implants', years: 11 },
  { name: 'Dr. Sofia Marquez', role: 'Orthodontics and clear aligners', years: 9 },
];
