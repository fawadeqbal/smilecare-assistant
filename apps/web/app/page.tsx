import Link from 'next/link';
import Script from 'next/script';
import { ArcDecoration, SmileMark, SmileUnderline, SunnyAvatar, Wordmark } from '@/components/brand';
import { AskChip, AskSunnyBox, BookButton, OpenSunnyButton } from '@/components/clinic/ask-assistant';
import { OpenStatusPill } from '@/components/clinic/opening-hours';
import {
  ArrowRightIcon,
  BookIcon,
  CalendarIcon,
  ChatIcon,
  CheckIcon,
  ClockIcon,
  HeartIcon,
  PhoneIcon,
  ShieldIcon,
  SparkleIcon,
  ToothRowIcon,
} from '@/components/icons';
import { clinic, insurers, team, treatments } from '@/lib/clinic';

const WIDGET_SRC = process.env.NEXT_PUBLIC_WIDGET_SRC ?? 'http://localhost:4000/widget.js';
const WIDGET_KEY = process.env.NEXT_PUBLIC_WIDGET_KEY ?? 'pk_demo_smilecare';

const container = 'mx-auto max-w-[1240px] px-[clamp(16px,4vw,40px)]';
const eyebrow = 'text-[13px] font-bold tracking-[0.12em] text-coral-700 uppercase';
const h2 = 'font-display text-[clamp(34px,4.4vw,52px)] leading-[1.05] font-bold tracking-[-0.03em] text-balance';
const primaryCta =
  'inline-flex h-14 items-center gap-2.5 rounded-full bg-ocean-600 px-7 text-[17px] font-bold text-white shadow-glow transition-colors hover:bg-ocean-700 disabled:opacity-70';
const secondaryCta =
  'inline-flex h-14 items-center gap-2.5 rounded-full border-[1.5px] border-line-strong bg-white px-6 text-[17px] font-bold text-ink transition-colors hover:border-ocean-300 disabled:opacity-70';

const treatmentIcons = { check: CheckIcon, sparkle: SparkleIcon, shield: ShieldIcon, teeth: ToothRowIcon };
const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.address.join(', '))}`;

/** Demo clinic website with the Sunny widget installed exactly as a client would install it. */
export default function ClinicHome() {
  return (
    <div className="overflow-hidden">
      <Nav />
      <main>
        <Hero />
        <Reasons />
        <Treatments />
        <Insurance />
        <Team />
        <MeetSunny />
        <Visit />
        <ClosingCta />
      </main>
      <Footer />
      <Script src={WIDGET_SRC} data-widget-key={WIDGET_KEY} strategy="afterInteractive" />
    </div>
  );
}

function Nav() {
  return (
    <header className={`${container} flex items-center justify-between gap-6 py-5`}>
      <Link href="/" className="flex items-center gap-2.5 text-ink no-underline">
        <SmileMark size={38} />
        <Wordmark className="text-2xl" />
      </Link>
      <nav aria-label="Main" className="hidden gap-[30px] text-[15px] font-semibold lg:flex">
        <a href="#treatments" className="text-ink no-underline hover:text-ocean-600">Treatments</a>
        <a href="#insurance" className="text-ink no-underline hover:text-ocean-600">Insurance</a>
        <a href="#team" className="text-ink no-underline hover:text-ocean-600">Dentists</a>
        <a href="#visit" className="text-ink no-underline hover:text-ocean-600">Visit us</a>
      </nav>
      <div className="flex items-center gap-[18px]">
        <a href="tel:+15550142290" className="hidden items-center gap-2 text-[15px] font-bold text-ink no-underline md:flex">
          <PhoneIcon size={18} className="text-ocean-600" />
          {clinic.phone}
        </a>
        <BookButton className="h-[46px] rounded-full bg-ocean-600 px-[22px] text-[15px] font-bold text-white shadow-[0_8px_20px_-8px_rgba(10,102,240,0.6)] transition-colors hover:bg-ocean-700 disabled:opacity-70">
          Book a visit
        </BookButton>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className={`${container} grid items-center gap-14 pt-8 pb-[88px] lg:grid-cols-2`}>
      <div className="flex flex-col gap-7">
        <OpenStatusPill suffix="Riverside" />
        <h1 className="font-display text-[clamp(44px,6.4vw,80px)] leading-none font-extrabold tracking-[-0.035em] text-balance">
          Gentle dentistry that leaves you <SmileUnderline className="text-ocean-600">smiling</SmileUnderline>.
        </h1>
        <p className="max-w-[540px] text-xl leading-[1.55] text-ink-700">
          Checkups, whitening, implants and aligners from a team that takes its time. Upfront prices, most PPO plans, and six days a
          week in Riverside.
        </p>
        <div className="flex flex-wrap gap-3">
          <BookButton className={primaryCta}>
            Book a visit
            <ArrowRightIcon size={18} strokeWidth={2.2} />
          </BookButton>
          <OpenSunnyButton className={secondaryCta}>
            <ChatIcon size={20} className="text-ocean-600" />
            Ask Sunny a question
          </OpenSunnyButton>
        </div>
        <ul className="flex flex-wrap gap-x-6 gap-y-2.5 text-[15px] text-ink-700">
          {['New patient exam $149', 'Free aligner consultation', 'Delta, Cigna, MetLife and more'].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <CheckIcon size={18} strokeWidth={2.4} className="text-success" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative py-6 pl-6">
        <div className="relative flex h-[clamp(380px,45vw,560px)] items-end justify-center overflow-hidden rounded-[40px] bg-ocean-100">
          <svg aria-hidden="true" className="absolute top-1/2 left-1/2 w-[92%] max-w-[520px] -translate-x-1/2 -translate-y-1/2" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="92" fill="#B5D2FF" />
            <path d="M48 104 Q100 160 152 104" stroke="#FFFFFF" strokeWidth="12" fill="none" strokeLinecap="round" />
            <circle cx="150" cy="60" r="9" fill="#FF8A65" />
          </svg>
        </div>
        <div className="absolute top-16 left-0 flex w-[min(300px,80%)] items-start gap-3 rounded-[22px] bg-white p-4 shadow-overlay">
          <SunnyAvatar size={36} />
          <div className="flex flex-col gap-0.5">
            <span className="text-[15px] font-bold">Sunny · replies instantly</span>
            <span className="text-sm leading-[1.45] text-ink-700">Ask me about prices, hours or insurance, day or night.</span>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 flex items-center gap-3.5 rounded-[22px] bg-white px-5 py-[18px] shadow-overlay sm:-right-2">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-coral-50 text-coral-600">
            <CalendarIcon size={24} />
          </span>
          <div className="flex flex-col">
            <span className="font-display text-lg font-bold">Open Saturdays</span>
            <span className="text-sm text-ink-500">10 am – 4 pm, no time off work</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Reasons() {
  const reasons = [
    { icon: ClockIcon, title: 'Six days a week', body: 'Mon–Fri 9 am – 7 pm and Saturdays 10 am – 4 pm.', coral: false },
    { icon: BookIcon, title: 'Prices up front', body: 'Every price is on this page, and you get a written estimate before any treatment.', coral: false },
    { icon: ShieldIcon, title: 'Most PPO plans', body: 'In network with five major insurers, and 0% monthly payments over $500.', coral: false },
    { icon: HeartIcon, title: 'Nervous? We get it', body: 'Longer appointments, noise-cancelling headphones and laughing gas.', coral: true },
  ];
  return (
    <section className="bg-cloud">
      <div className={`${container} grid gap-8 py-14 sm:grid-cols-2 lg:grid-cols-4`}>
        {reasons.map(({ icon: Icon, title, body, coral }) => (
          <div key={title} className="flex flex-col gap-3">
            <span className={`flex size-[52px] items-center justify-center rounded-2xl bg-white ${coral ? 'text-coral-600' : 'text-ocean-600'}`}>
              <Icon size={24} />
            </span>
            <h3 className="font-display text-xl font-bold">{title}</h3>
            <p className="text-[15px] text-ink-500">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Treatments() {
  return (
    <section id="treatments" className={`${container} flex flex-col gap-12 py-28`}>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex max-w-[640px] flex-col gap-3">
          <span className={eyebrow}>Treatments and prices</span>
          <h2 className={h2}>Clear prices, no surprises.</h2>
          <p className="text-lg text-ink-500">Self-pay prices in US dollars. With insurance you will usually pay less.</p>
        </div>
        <OpenSunnyButton className="font-bold text-ocean-600 underline decoration-2 underline-offset-[5px] hover:text-ocean-700 disabled:opacity-70">
          Not sure what you need? Ask Sunny
        </OpenSunnyButton>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {treatments.map((t) => {
          const Icon = treatmentIcons[t.icon];
          return (
            <article key={t.group} className="flex flex-col gap-[18px] rounded-3xl border border-line bg-white p-7 shadow-rest">
              <span
                className={`flex size-[52px] items-center justify-center rounded-2xl ${
                  t.tone === 'coral' ? 'bg-coral-50 text-coral-600' : 'bg-ocean-50 text-ocean-600'
                }`}
              >
                <Icon size={26} />
              </span>
              <h3 className="font-display text-2xl font-semibold tracking-[-0.015em]">{t.group}</h3>
              <ul className="flex flex-col gap-3 text-[15px]">
                {t.items.map((i) => (
                  <li key={i.name} className="flex items-baseline justify-between gap-4 border-b border-dashed border-line pb-3">
                    <span>{i.name}</span>
                    <strong className="whitespace-nowrap tabular-nums">{i.price}</strong>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Insurance() {
  return (
    <section id="insurance" className={`${container} pb-28`}>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="flex flex-col gap-5 rounded-[32px] bg-ocean-50 p-[clamp(28px,4vw,48px)]">
          <h2 className="font-display text-4xl leading-[1.1] font-bold tracking-[-0.025em]">We take your insurance</h2>
          <p className="text-ink-700">In network with the plans below. We can bill most other PPO plans out of network.</p>
          <ul className="flex flex-wrap gap-2.5">
            {insurers.map((name) => (
              <li key={name} className="rounded-full bg-white px-[18px] py-2.5 text-[15px] font-bold">
                {name}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative flex flex-col gap-[18px] overflow-hidden rounded-[32px] bg-coral-50 p-[clamp(28px,4vw,48px)]">
          <ArcDecoration className="-right-12 -bottom-16 size-[260px]" stroke="#FFE2D6" width={24} />
          <span className="relative self-start rounded-full bg-coral-400 px-3 py-1 text-[13px] font-bold text-ink">No insurance?</span>
          <h2 className="relative font-display text-4xl leading-[1.1] font-bold tracking-[-0.025em]">Membership from $219 a year</h2>
          <p className="relative max-w-[440px] text-ink-700">
            Two checkups, two cleanings and X-rays included, plus 15% off other treatment. Anything over $500 can be split into 0%
            monthly payments.
          </p>
          <AskChip
            question="What's included in the membership plan?"
            className="relative self-start font-bold text-coral-700 underline decoration-2 underline-offset-[5px] disabled:opacity-70"
          >
            Ask Sunny what is included
          </AskChip>
        </div>
      </div>
    </section>
  );
}

function Team() {
  return (
    <section id="team" className="bg-cloud">
      <div className={`${container} flex flex-col gap-12 py-28`}>
        <div className="flex max-w-[640px] flex-col gap-3">
          <span className={eyebrow}>Your dentists</span>
          <h2 className={h2}>A team that takes its time.</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {team.map((d) => (
            <article key={d.name} className="flex flex-col gap-4 rounded-[28px] bg-white px-3.5 pt-3.5 pb-6">
              <div className={`relative flex h-[clamp(200px,22vw,300px)] items-center justify-center overflow-hidden rounded-[20px] ${d.tile}`}>
                <ArcDecoration className="-right-10 -bottom-16 size-[220px] opacity-60" stroke="#FFFFFF" width={18} />
                <span className={`relative font-display text-6xl font-extrabold tracking-[-0.03em] ${d.ink}`} aria-hidden="true">
                  {d.initials}
                </span>
              </div>
              <div className="flex flex-col gap-1 px-2.5">
                <h3 className="font-display text-2xl font-bold tracking-[-0.015em]">{d.name}</h3>
                <span className="text-ink-500">{d.role}</span>
                <span className="mt-2 self-start rounded-full bg-ocean-50 px-3 py-1 text-[13px] font-bold text-ocean-700">
                  {d.years} years in practice
                </span>
              </div>
            </article>
          ))}
        </div>
        <p className="max-w-xl text-ink-700">
          Nervous about the dentist? Tell Sunny when you book. We offer longer appointments, noise-cancelling headphones and laughing
          gas.
        </p>
      </div>
    </section>
  );
}

function MeetSunny() {
  const points = [
    ['Prices, hours and insurance', 'answered right away'],
    ['Request an appointment', 'in a short chat'],
    ['A real person', 'picks up whenever you need one'],
  ];
  return (
    <section id="sunny" className={`${container} grid items-center gap-14 py-28 lg:grid-cols-2`}>
      <div className="flex flex-col gap-[22px]">
        <span className={eyebrow}>Meet Sunny</span>
        <h2 className={h2}>Questions at midnight? Sunny is awake.</h2>
        <p className="text-lg text-ink-700">
          Our assistant answers from the clinic&apos;s own price list and policies, so you get real answers, not guesses. Sunny speaks
          English, Spanish and Urdu.
        </p>
        <ul className="flex flex-col gap-3.5">
          {points.map(([strong, rest]) => (
            <li key={strong} className="flex items-start gap-3">
              <span className="flex size-7 flex-none items-center justify-center rounded-full bg-success-bg text-success">
                <CheckIcon size={16} strokeWidth={3} />
              </span>
              <span>
                <strong>{strong}</strong> {rest}
              </span>
            </li>
          ))}
        </ul>
        <AskSunnyBox id="ask-sunny" />
      </div>

      <div className="flex flex-col gap-3.5 rounded-[36px] bg-ocean-50 p-[clamp(20px,3vw,36px)]" aria-label="Example conversation with Sunny">
        <div className="flex items-end gap-2.5">
          <SunnyAvatar size={32} />
          <p className="max-w-[380px] rounded-[20px_20px_20px_6px] bg-white px-4 py-3">Hi, I&apos;m Sunny from SmileCare. What can I help you with?</p>
        </div>
        <div className="flex justify-end">
          <p className="max-w-[320px] rounded-[20px_20px_6px_20px] bg-ocean-600 px-4 py-3 text-white">Do you take Delta Dental?</p>
        </div>
        <div className="flex items-end gap-2.5">
          <SunnyAvatar size={32} />
          <p className="max-w-[380px] rounded-[20px_20px_20px_6px] bg-white px-4 py-3">
            Yes! We&apos;re in network with Delta Dental PPO. Would you like to request an appointment?
          </p>
        </div>
        <div className="flex flex-wrap gap-2 pl-[42px]">
          <AskChip
            question="I'd like to book a cleaning"
            className="h-11 rounded-full border-[1.5px] border-ocean-200 bg-white px-3.5 text-sm font-semibold text-ocean-700 hover:bg-ocean-100 disabled:opacity-70"
          >
            Yes, book a cleaning
          </AskChip>
          <AskChip
            question="Is there parking?"
            className="h-11 rounded-full border-[1.5px] border-ocean-200 bg-white px-3.5 text-sm font-semibold text-ocean-700 hover:bg-ocean-100 disabled:opacity-70"
          >
            Is there parking?
          </AskChip>
        </div>
      </div>
    </section>
  );
}

function Visit() {
  return (
    <section id="visit" className={`${container} grid gap-6 pb-28 lg:grid-cols-2`}>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={`Open ${clinic.address.join(', ')} in Google Maps`}
        className="relative flex min-h-[clamp(280px,32vw,420px)] items-center justify-center overflow-hidden rounded-[32px] bg-ocean-100"
      >
        <svg aria-hidden="true" className="absolute inset-0 size-full" viewBox="0 0 400 300" preserveAspectRatio="none">
          <path d="M0 200 C80 180 140 240 220 210 S360 150 400 170" stroke="#FFFFFF" strokeWidth="14" fill="none" />
          <path d="M120 0 L170 300" stroke="#FFFFFF" strokeWidth="10" />
          <path d="M300 0 L260 300" stroke="#B5D2FF" strokeWidth="8" />
        </svg>
        <span className="relative flex size-16 -rotate-45 items-center justify-center rounded-[50%_50%_50%_0] bg-ocean-600 shadow-glow">
          <span className="size-[22px] rounded-full bg-white" />
        </span>
        <span className="absolute bottom-5 rounded-full bg-white/90 px-3 py-1.5 text-[13px] font-bold text-ocean-700">Open in Google Maps</span>
      </a>
      <div className="flex flex-col gap-6 rounded-[32px] border border-line p-[clamp(28px,4vw,44px)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-4xl leading-[1.1] font-bold tracking-[-0.025em]">Visit us</h2>
          <OpenStatusPill short />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <dl className="flex flex-col gap-2 text-[15px]">
            <div className="flex justify-between gap-3">
              <dt>Mon – Fri</dt>
              <dd className="font-bold tabular-nums">9:00 – 19:00</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Saturday</dt>
              <dd className="font-bold tabular-nums">10:00 – 16:00</dd>
            </div>
            <div className="flex justify-between gap-3 text-ink-500">
              <dt>Sunday</dt>
              <dd>Closed</dd>
            </div>
          </dl>
          <address className="flex flex-col gap-1 text-[15px] not-italic">
            <strong>{clinic.address[0]}</strong>
            <span className="text-ink-500">{clinic.address[1]}</span>
            <span className="text-ink-500">Free validated parking on B1–B2. Step-free access.</span>
          </address>
        </div>
        <div className="mt-auto flex flex-wrap gap-3">
          <a href="tel:+15550142290" className="inline-flex h-[50px] items-center gap-2 rounded-full bg-ocean-50 px-[22px] font-bold text-ocean-700 no-underline hover:bg-ocean-100">
            <PhoneIcon size={18} />
            {clinic.phone}
          </a>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-[50px] items-center rounded-full border-[1.5px] border-line-strong bg-white px-[22px] font-bold text-ink no-underline hover:border-ocean-300"
          >
            Get directions
          </a>
        </div>
      </div>
    </section>
  );
}

function ClosingCta() {
  return (
    <section id="book" className={`${container} pb-24`}>
      <div className="relative flex flex-wrap items-center justify-between gap-8 overflow-hidden rounded-[40px] bg-ocean-600 p-[clamp(40px,6vw,80px)] text-white">
        <svg aria-hidden="true" className="pointer-events-none absolute -right-16 -bottom-36 size-[520px]" viewBox="0 0 200 200">
          <path d="M30 70 Q100 170 170 70" stroke="#2F7BFF" strokeWidth="20" fill="none" strokeLinecap="round" />
          <circle cx="170" cy="36" r="10" fill="#FF8A65" />
        </svg>
        <div className="relative flex max-w-[620px] flex-col gap-3">
          <h2 className="font-display text-[clamp(36px,5vw,60px)] leading-[1.02] font-extrabold tracking-[-0.035em]">Ready when you are.</h2>
          <p className="text-[19px] text-ocean-100">Request a time in under a minute. We&apos;ll call to confirm.</p>
        </div>
        <div className="relative flex flex-wrap gap-3">
          <BookButton className="h-14 rounded-full bg-white px-7 text-[17px] font-bold text-ocean-700 transition-colors hover:bg-ocean-50 disabled:opacity-80">
            Book a visit
          </BookButton>
          <a
            href="tel:+15550142290"
            className="inline-flex h-14 items-center rounded-full border-[1.5px] border-white/50 px-6 text-[17px] font-bold text-white no-underline hover:border-white"
          >
            Call {clinic.phone}
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line">
      <div className={`${container} flex flex-wrap items-center justify-between gap-4 py-8 text-sm text-ink-500`}>
        <span className="flex items-center gap-2.5">
          <SmileMark size={26} />
          {clinic.name} is a fictional clinic used to demo the SmileCare Assistant.
        </span>
        <Link href="/admin" className="font-bold text-ink hover:text-ocean-600">
          Staff dashboard
        </Link>
      </div>
    </footer>
  );
}
