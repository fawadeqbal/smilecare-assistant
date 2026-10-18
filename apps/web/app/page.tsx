import Link from 'next/link';
import Script from 'next/script';
import { Accent, SmileMark, SunnyAvatar, TOOTH_PATH, Wordmark } from '@/components/brand';
import { AskChip, OpenSunnyButton } from '@/components/clinic/ask-assistant';
import { BookingCard } from '@/components/clinic/booking-card';
import { Faq } from '@/components/clinic/faq';
import { OpenStatusPill, OpenTodayGlass } from '@/components/clinic/opening-hours';
import { TreatmentTabs } from '@/components/clinic/treatment-tabs';
import { ArrowRightIcon, CalendarIcon, CheckIcon, ClockIcon, PinIcon, ShieldIcon, UserIcon } from '@/components/icons';
import { clinic, insurers, mapsUrl, team } from '@/lib/clinic';
import { DEMO_WIDGET_KEY } from '@/lib/snippet';

const WIDGET_SRC = process.env.NEXT_PUBLIC_WIDGET_SRC ?? 'http://localhost:4000/widget.js';

const container = 'mx-auto max-w-[1240px] px-[clamp(16px,4vw,40px)]';
const eyebrow = 'text-[13px] font-bold tracking-[0.14em] text-azure-600 uppercase';
const h2 = 'text-[clamp(38px,4.8vw,60px)] leading-none font-bold tracking-[-0.045em] text-balance';
const azureCta =
  'flex h-14 items-center gap-2.5 rounded-full bg-azure-600 px-[26px] text-[17px] font-semibold text-white no-underline shadow-glow transition-[background-color,transform] hover:-translate-y-px hover:bg-azure-700 hover:text-white';
const whiteCta =
  'flex h-14 items-center gap-2.5 rounded-full bg-white px-[26px] text-[17px] font-semibold text-ink no-underline transition-transform hover:-translate-y-px hover:text-ink disabled:opacity-70';
const glassCta =
  'flex h-14 items-center gap-2.5 rounded-full border border-white/20 bg-white/[0.06] px-[22px] text-[17px] font-semibold text-white no-underline transition-colors hover:bg-white/10 disabled:opacity-70';
const glassTile = 'flex flex-col rounded-[18px] border border-white/12 bg-white/[0.06] px-4 py-3.5';

/** Demo clinic website with the Sunny widget installed exactly as a client would install it. */
export default function ClinicHome() {
  return (
    <div className="relative overflow-hidden">
      <NightHero />
      <main>
        <Treatments />
        <Why />
        <Team />
        <MeetSunny />
        <FaqAndVisit />
        <ClosingCta />
      </main>
      <Footer />
      <Script src={WIDGET_SRC} data-widget-key={DEMO_WIDGET_KEY} strategy="afterInteractive" />
    </div>
  );
}

function NightHero() {
  return (
    <div
      className="relative overflow-hidden bg-night-950 text-white"
      style={{
        backgroundImage:
          'radial-gradient(820px circle at 88% 8%, rgba(51,85,255,0.5), transparent 60%), radial-gradient(640px circle at 4% 96%, rgba(47,224,200,0.2), transparent 60%)',
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />
      <Nav />

      <section id="book" className={`${container} relative grid grid-cols-[repeat(auto-fit,minmax(min(500px,100%),1fr))] items-center gap-14 pt-10 pb-[72px]`}>
        <div className="flex animate-rise flex-col gap-7">
          <a
            href="#treatments"
            className="inline-flex items-center gap-2.5 self-start rounded-full border border-white/14 bg-white/[0.06] py-[5px] pr-3.5 pl-[5px] text-sm text-white no-underline hover:text-white"
          >
            <span className="rounded-full bg-aqua-400 px-2.5 py-[3px] text-xs font-bold text-night-900">New patients</span>
            <span className="text-haze-200">Exam with X-rays, $149</span>
            <ArrowRightIcon size={14} strokeWidth={2.4} />
          </a>
          <h1 className="text-[clamp(50px,7vw,92px)] leading-[0.95] font-bold tracking-[-0.05em] text-balance">
            Dentistry that feels <Accent className="text-aqua-400">effortless.</Accent>
          </h1>
          <p className="max-w-[520px] text-xl leading-[1.55] text-haze-200">
            Checkups, whitening, implants and aligners from a team that takes its time. Upfront prices, most PPO plans, and six days a week in
            Riverside.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="#request" className={azureCta}>
              Book a visit
              <ArrowRightIcon size={18} strokeWidth={2.2} />
            </a>
            <OpenSunnyButton className={glassCta}>
              <span className="size-[9px] animate-pulse-dot rounded-full bg-aqua-400" />
              Chat with Sunny
            </OpenSunnyButton>
          </div>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-haze">
            {['Upfront prices', 'Written estimates', 'Evenings and Saturdays'].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <CheckIcon size={16} strokeWidth={2.6} className="text-aqua-400" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div id="request" className="relative flex animate-rise-late scroll-mt-6 justify-end py-10">
          <div className="glass-float absolute top-0 left-0 z-[2] flex animate-drift items-center gap-2.5 rounded-[18px] py-2.5 pr-3.5 pl-2.5 max-[560px]:hidden">
            <SunnyAvatar size={34} />
            <span className="text-sm leading-[1.3]">
              <strong>Sunny is online</strong>
              <br />
              <span className="text-haze-200">Ask about prices, day or night</span>
            </span>
          </div>
          <OpenTodayGlass className="absolute -right-1.5 bottom-0 z-[2] animate-drift-slow max-[560px]:hidden" />
          <BookingCard />
        </div>
      </section>

      <div className={`${container} relative pb-14`}>
        <dl className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] border-t border-white/12">
          {[
            { big: '6', unit: 'days', label: 'Open every week, Mon to Sat' },
            { big: '$149', unit: '', label: 'New patient exam with X-rays' },
            { big: '5', unit: 'plans', label: 'Major insurers in network' },
            { big: '0%', unit: '', label: 'Payment plans over $500' },
          ].map((f) => (
            <div key={f.label} className="flex flex-col-reverse gap-1 pt-[26px] pr-6">
              <dt className="text-[15px] text-haze">{f.label}</dt>
              <dd className="text-[44px] leading-none font-bold tracking-[-0.04em]">
                {f.big}
                {f.unit && <Accent className="text-[40px] text-aqua-400"> {f.unit}</Accent>}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="relative flex items-center gap-7 overflow-hidden border-t border-white/8 py-5">
        <span className="flex-none pl-[clamp(16px,4vw,40px)] text-[13px] font-semibold tracking-[0.12em] text-haze uppercase">In network with</span>
        <div
          aria-hidden="true"
          className="min-w-0 flex-1 overflow-hidden"
          style={{ maskImage: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)' }}
        >
          <div className="flex w-max animate-marquee gap-16 text-[22px] font-bold tracking-[-0.02em] whitespace-nowrap text-haze-200">
            {[...insurers, ...insurers, ...insurers, ...insurers].map((m, i) => (
              <span key={i}>{m}</span>
            ))}
          </div>
        </div>
        <span className="sr-only">{insurers.join(', ')}</span>
      </div>
    </div>
  );
}

function Nav() {
  return (
    <header className={`${container} relative flex items-center justify-between gap-6 py-[22px]`}>
      <Link href="/" className="flex items-center gap-2.5 text-white no-underline hover:text-white">
        <SmileMark size={38} />
        <Wordmark className="text-[23px]" />
      </Link>
      <nav
        aria-label="Main"
        className="hidden gap-0.5 rounded-full border border-white/12 bg-white/[0.06] p-[5px] text-[15px] font-medium min-[980px]:flex"
      >
        {[
          ['#treatments', 'Treatments'],
          ['#why', 'Prices and insurance'],
          ['#team', 'Dentists'],
          ['#faq', 'FAQ'],
        ].map(([href, label]) => (
          <a key={href} href={href} className="rounded-full px-4 py-2 text-haze-200 no-underline transition-colors hover:bg-white/10 hover:text-white">
            {label}
          </a>
        ))}
      </nav>
      <div className="flex items-center gap-[18px]">
        <a href={clinic.phoneHref} className="hidden text-[15px] font-semibold text-white no-underline hover:text-white min-[980px]:block">
          {clinic.phone}
        </a>
        <a
          href="#request"
          className="flex h-11 items-center rounded-full bg-white px-5 text-[15px] font-semibold text-ink no-underline transition-transform hover:-translate-y-px hover:text-ink"
        >
          Book a visit
        </a>
      </div>
    </header>
  );
}

function Treatments() {
  return (
    <section id="treatments" className={`${container} flex flex-col gap-10 pt-[120px] pb-[104px]`}>
      <TreatmentTabs
        heading={
          <div className="flex max-w-[620px] flex-col gap-3">
            <span className={eyebrow}>Treatments and prices</span>
            <h2 className={h2}>
              Clear prices. <Accent>No surprises.</Accent>
            </h2>
            <p className="text-lg text-ink-500">Self-pay prices in US dollars. With insurance you&apos;ll usually pay less, and you get a written estimate first.</p>
          </div>
        }
      />
    </section>
  );
}

function Why() {
  const card = 'lift flex flex-col rounded-[32px] p-[30px]';
  return (
    <section id="why" className="bg-pearl">
      <div className={`${container} flex flex-col gap-10 py-28`}>
        <div className="flex max-w-[680px] flex-col gap-3">
          <span className={eyebrow}>Why patients pick SmileCare</span>
          <h2 className={h2}>
            Dental care that fits <Accent>your life.</Accent>
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-5 min-[980px]:grid-cols-6 [&>*]:min-w-0">
          <div
            className="lift relative flex flex-col gap-6 overflow-hidden rounded-[32px] bg-night-950 p-[clamp(26px,3.5vw,40px)] text-white min-[980px]:col-span-4"
            style={{ backgroundImage: 'radial-gradient(420px circle at 100% 0%, rgba(51,85,255,0.55), transparent 70%)' }}
          >
            <div className="flex flex-col gap-1.5">
              <h3 className="text-[clamp(30px,3.4vw,44px)] leading-[1.02] font-bold tracking-[-0.04em]">
                Open <Accent className="text-aqua-400">six days</Accent> a week
              </h3>
              <span className="text-[17px] text-haze-200">Early evenings and Saturdays, so you don&apos;t need time off work.</span>
            </div>
            <dl className="grid grid-cols-[repeat(auto-fit,minmax(min(150px,100%),1fr))] gap-2.5">
              {[
                ['Mon – Fri', '9 am – 7 pm'],
                ['Saturday', '10 am – 4 pm'],
                ['Sunday', 'Closed'],
              ].map(([d, h]) => (
                <div key={d} className={glassTile}>
                  <dt className="text-sm text-haze">{d}</dt>
                  <dd className="text-[22px] font-bold tracking-[-0.02em] tabular-nums">{h}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className={`${card} gap-2.5 bg-white min-[980px]:col-span-2`}>
            <span className="self-start rounded-full bg-aqua-50 px-2.5 py-1 text-xs font-bold text-aqua-700">New patients</span>
            <span className="mt-auto text-[60px] leading-none font-bold tracking-[-0.05em]">$149</span>
            <span className="text-lg font-semibold">Exam with X-rays</span>
            <span className="text-[15px] text-ink-500">And a written estimate before any treatment.</span>
          </div>

          <div className={`${card} gap-4 bg-white min-[980px]:col-span-3`}>
            <div className="flex items-center gap-3">
              <span className="flex size-[52px] flex-none items-center justify-center rounded-2xl bg-azure-50 text-azure-600">
                <ShieldIcon size={24} />
              </span>
              <h3 className="text-[26px] leading-[1.15] font-bold tracking-[-0.03em]">We take your insurance</h3>
            </div>
            <ul className="flex flex-wrap gap-2">
              {insurers.map((i) => (
                <li key={i} className="rounded-full bg-pearl px-4 py-2 text-[15px] font-semibold">
                  {i}
                </li>
              ))}
            </ul>
            <span className="text-[15px] text-ink-500">Most other PPO plans can be billed out of network.</span>
          </div>

          <div className={`${card} relative gap-3 overflow-hidden bg-azure-600 text-white min-[980px]:col-span-3`}>
            <svg aria-hidden="true" className="absolute -right-[30px] -bottom-10 size-[220px] opacity-[0.18]" viewBox="0 0 24 24">
              <path d={TOOTH_PATH} fill="#FFFFFF" />
            </svg>
            <span className="relative self-start rounded-full bg-aqua-400 px-2.5 py-1 text-xs font-bold text-night-900">No insurance?</span>
            <h3 className="relative text-4xl leading-[1.05] font-bold tracking-[-0.04em]">
              Membership from <Accent>$219</Accent> a year
            </h3>
            <span className="relative text-[15px] text-azure-100">Plus 0% monthly payments on any treatment over $500.</span>
            <AskChip
              question="What's included in the membership plan?"
              className="relative mt-1 self-start font-semibold text-white underline underline-offset-[5px] disabled:opacity-70"
            >
              Ask Sunny what&apos;s included
            </AskChip>
          </div>

          <div className={`${card} gap-3.5 bg-aqua-50 min-[980px]:col-span-2`}>
            <h3 className="text-[26px] font-bold tracking-[-0.03em]">
              Nervous? <Accent>We get it.</Accent>
            </h3>
            <ul className="flex flex-col gap-2.5 text-[15px] text-night-700">
              {['Longer, unhurried appointments', 'Noise-cancelling headphones', 'Laughing gas if you want it'].map((t) => (
                <li key={t} className="flex items-center gap-2.5">
                  <CheckIcon size={18} strokeWidth={2.6} className="text-aqua-600" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className={`${card} gap-2.5 bg-white min-[980px]:col-span-2`}>
            <h3 className="text-[26px] font-bold tracking-[-0.03em]">Kids welcome</h3>
            <span className="text-[15px] text-ink-500">Children&apos;s checkup and cleaning in one friendly visit.</span>
            <span className="mt-auto text-[40px] font-bold tracking-[-0.04em]">$89</span>
          </div>

          <div className={`${card} gap-2.5 bg-white min-[980px]:col-span-2`}>
            <h3 className="text-[26px] font-bold tracking-[-0.03em]">Easy to get to</h3>
            <span className="text-[15px] text-ink-500">Free validated parking on levels B1–B2, with step-free access to Suite 210.</span>
            <span className="mt-auto flex gap-2 pt-2">
              {['Free parking', 'Step-free'].map((t) => (
                <span key={t} className="rounded-full bg-azure-50 px-2.5 py-1 text-[13px] font-bold text-azure-700">
                  {t}
                </span>
              ))}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Team() {
  const years = team.reduce((n, d) => n + d.years, 0);
  return (
    <section id="team" className={`${container} flex flex-col gap-11 py-28`}>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="flex max-w-[620px] flex-col gap-3">
          <span className={eyebrow}>Your dentists</span>
          <h2 className={h2}>
            A team that <Accent>takes its time.</Accent>
          </h2>
        </div>
        <span className="text-[17px] text-ink-700">
          <strong className="text-[32px] tracking-[-0.03em] text-ink">{years}</strong> years of combined experience
        </span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-6">
        {team.map((d) => (
          <article key={d.name} className="lift flex flex-col gap-[18px] rounded-[32px] border border-line bg-white px-3 pt-3 pb-6">
            <div className={`relative box-border flex h-[340px] items-end justify-end overflow-hidden rounded-3xl p-4 ${d.tile}`}>
              <svg aria-hidden="true" className="absolute top-[44%] left-1/2 size-[200px] -translate-x-1/2 -translate-y-1/2 opacity-50" viewBox="0 0 24 24">
                <path d={TOOTH_PATH} fill={d.ring} />
              </svg>
              <span
                aria-hidden="true"
                className={`absolute top-[44%] left-1/2 flex size-[104px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[34px] font-bold tracking-[-0.03em] shadow-rest ${d.ink}`}
              >
                {d.initials}
              </span>
              <span className="relative rounded-full bg-night-900 px-3 py-1.5 text-[13px] font-semibold text-white">{d.years} yrs in practice</span>
            </div>
            <div className="flex flex-col gap-1 px-3">
              <h3 className="text-[26px] font-bold tracking-[-0.03em]">{d.name}</h3>
              <span className="text-ink-500">{d.role}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function MeetSunny() {
  const userBubble = 'max-w-[300px] rounded-[20px_20px_6px_20px] bg-night-900 px-[15px] py-[11px] text-white';
  const botBubble = 'max-w-[340px] rounded-[20px_20px_20px_6px] bg-pearl px-[15px] py-[11px]';
  return (
    <section id="sunny" className="px-[clamp(16px,4vw,40px)]">
      <div
        className="relative mx-auto box-border grid max-w-[1240px] grid-cols-[repeat(auto-fit,minmax(min(420px,100%),1fr))] items-center gap-12 overflow-hidden rounded-[44px] bg-night-950 p-[clamp(32px,5vw,72px)] text-white"
        style={{
          backgroundImage:
            'radial-gradient(600px circle at 0% 100%, rgba(47,224,200,0.22), transparent 60%), radial-gradient(600px circle at 100% 0%, rgba(51,85,255,0.5), transparent 60%)',
        }}
      >
        <div className="relative flex flex-col gap-[22px]">
          <span className="inline-flex items-center gap-2 self-start rounded-full border border-white/14 bg-white/[0.06] py-[5px] pr-3.5 pl-[5px] text-sm font-semibold">
            <SunnyAvatar size={26} />
            Meet Sunny, our assistant
          </span>
          <h2 className={h2}>
            Questions at midnight? <Accent className="text-aqua-400">Sunny&apos;s awake.</Accent>
          </h2>
          <p className="max-w-[480px] text-lg text-haze-200">
            Sunny answers from our own price list and policies, so you get real answers, not guesses. And a real person picks up whenever you need
            one.
          </p>
          <ul className="grid max-w-[520px] grid-cols-[repeat(auto-fit,minmax(min(150px,100%),1fr))] gap-2.5">
            {[
              { icon: ClockIcon, label: 'Answers 24/7' },
              { icon: CalendarIcon, label: 'Books visits' },
              { icon: UserIcon, label: 'Hands to a human' },
            ].map(({ icon: Icon, label }) => (
              <li key={label} className={`${glassTile} gap-1.5`}>
                <Icon size={22} className="text-aqua-400" />
                <strong className="text-[15px]">{label}</strong>
              </li>
            ))}
          </ul>
          <OpenSunnyButton className={`${whiteCta} self-start`}>
            Chat with Sunny
            <ArrowRightIcon size={18} strokeWidth={2.2} />
          </OpenSunnyButton>
        </div>

        <figure
          aria-label="Example conversation with Sunny"
          className="relative flex flex-col gap-3 rounded-[32px] bg-white p-[22px] text-ink shadow-[0_40px_100px_-24px_rgba(0,0,0,0.6),0_0_80px_-24px_rgba(51,85,255,0.7)]"
        >
          <div className="flex items-center gap-2.5 border-b border-line pb-3">
            <SunnyAvatar size={38} />
            <div className="flex flex-col leading-[1.3]">
              <strong>Sunny</strong>
              <span className="text-[13px] text-success-ink">● Online now</span>
            </div>
          </div>
          <div className="flex justify-end">
            <div className={userBubble}>Do you take Delta Dental?</div>
          </div>
          <div className="flex items-end gap-2">
            <SunnyAvatar size={28} />
            <div className={botBubble}>Yes, we&apos;re in network with Delta Dental PPO. Want me to request a checkup for you?</div>
          </div>
          <div className="flex justify-end">
            <div className={userBubble}>Yes please, a Saturday if possible</div>
          </div>
          <div className="flex items-end gap-2">
            <SunnyAvatar size={28} />
            <div className={botBubble}>Great! Saturdays are 10 am – 4 pm. What&apos;s your name and the best number to call?</div>
          </div>
          <div className="flex flex-wrap gap-2 pl-9">
            {['Is there parking?', 'Talk to a person'].map((q) => (
              <AskChip
                key={q}
                question={q === 'Talk to a person' ? 'Can I talk to a person?' : q}
                className="rounded-full border-[1.5px] border-azure-200 px-3 py-[7px] text-[13px] font-semibold text-azure-700 transition-colors hover:bg-azure-50 disabled:opacity-70"
              >
                {q}
              </AskChip>
            ))}
          </div>
        </figure>
      </div>
    </section>
  );
}

function FaqAndVisit() {
  const iconTile = 'flex size-11 flex-none items-center justify-center rounded-[14px] bg-azure-50 text-azure-600';
  return (
    <section id="faq" className="mt-28 bg-pearl">
      <div className={`${container} grid grid-cols-[repeat(auto-fit,minmax(min(460px,100%),1fr))] items-start gap-10 py-28`}>
        <div className="flex flex-col gap-7">
          <div className="flex flex-col gap-3">
            <span className={eyebrow}>Good to know</span>
            <h2 className={h2}>
              Questions, <Accent>answered.</Accent>
            </h2>
          </div>
          <Faq />
          <span className="text-[15px] text-ink-700">
            Still wondering?{' '}
            <OpenSunnyButton className="font-semibold text-azure-600 hover:text-azure-700 disabled:opacity-70">Ask Sunny</OpenSunnyButton> or call{' '}
            <a href={clinic.phoneHref} className="font-semibold text-azure-600 hover:text-azure-700">
              {clinic.phone}
            </a>
            .
          </span>
        </div>

        <div className="flex flex-col overflow-hidden rounded-[36px] bg-white">
          <div className="relative flex h-[280px] items-center justify-center overflow-hidden bg-[#E6EBFA]" aria-hidden="true">
            <svg className="absolute inset-0 size-full" viewBox="0 0 400 280" preserveAspectRatio="none">
              <path d="M0 190 C80 170 140 230 220 200 S360 140 400 160" stroke="#FFFFFF" strokeWidth="14" fill="none" />
              <path d="M120 0 L170 280" stroke="#FFFFFF" strokeWidth="10" />
              <path d="M300 0 L260 280" stroke="#D3DAF2" strokeWidth="8" />
              <path d="M0 70 L400 100" stroke="#D3DAF2" strokeWidth="6" />
            </svg>
            <span className="relative flex size-[60px] animate-drift-slow items-center justify-center rounded-[50%_50%_50%_0] bg-azure-600 shadow-[0_12px_28px_-8px_rgba(51,85,255,0.7)] [rotate:-45deg]">
              <span className="size-[22px] rounded-full bg-white" />
            </span>
          </div>
          <div className="flex flex-col gap-5 p-[clamp(24px,3vw,34px)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[32px] leading-[1.1] font-bold tracking-[-0.04em]">Visit us</h2>
              <OpenStatusPill short />
            </div>
            <div className="flex items-start gap-3.5">
              <span className={iconTile}>
                <PinIcon size={22} />
              </span>
              <address className="flex flex-col text-[15px] not-italic">
                <strong>{clinic.address[0]}</strong>
                <span className="text-ink-500">{clinic.address[1]}</span>
              </address>
            </div>
            <div className="flex items-start gap-3.5">
              <span className={iconTile}>
                <ClockIcon size={22} />
              </span>
              <dl className="flex flex-1 flex-col gap-0.5 text-[15px]">
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
            </div>
            <div className="flex flex-wrap gap-2.5">
              <a
                href={clinic.phoneHref}
                className="flex h-[50px] items-center gap-2 rounded-full bg-night-900 px-5 font-semibold text-white no-underline hover:bg-night-800 hover:text-white"
              >
                {clinic.phone}
              </a>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="flex h-[50px] items-center rounded-full border-[1.5px] border-line-strong bg-white px-5 font-semibold text-ink no-underline hover:border-night-900 hover:text-ink"
              >
                Get directions
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ClosingCta() {
  return (
    <section className={`${container} py-24`}>
      <div
        className="relative flex flex-col items-center gap-[22px] overflow-hidden rounded-[44px] bg-night-950 px-[clamp(28px,6vw,80px)] py-[clamp(44px,7vw,96px)] text-center text-white"
        style={{
          backgroundImage:
            'radial-gradient(600px circle at 90% 120%, rgba(47,224,200,0.35), transparent 60%), radial-gradient(700px circle at 0% -20%, rgba(51,85,255,0.6), transparent 60%)',
        }}
      >
        <svg aria-hidden="true" className="absolute top-1/2 left-1/2 size-[520px] -translate-x-1/2 -translate-y-1/2 opacity-[0.06]" viewBox="0 0 24 24">
          <path d={TOOTH_PATH} fill="#FFFFFF" />
        </svg>
        <h2 className="relative max-w-[900px] text-[clamp(42px,6.4vw,84px)] leading-[0.95] font-bold tracking-[-0.05em] text-balance">
          Your next <Accent className="text-aqua-400">smile</Accent> starts here.
        </h2>
        <p className="relative text-[19px] text-haze-200">Request a time in under a minute. We&apos;ll call to confirm.</p>
        <div className="relative mt-2 flex flex-wrap justify-center gap-3">
          <a href="#request" className={`${whiteCta} h-[58px] px-[30px]`}>
            Book a visit
            <ArrowRightIcon size={18} strokeWidth={2.2} />
          </a>
          <a href={clinic.phoneHref} className={`${glassCta} h-[58px] border-white/22 px-6`}>
            Call {clinic.phone}
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const link = 'text-haze-200 no-underline hover:text-white';
  return (
    <footer className="bg-night-950 text-haze-200">
      <div className={`${container} flex flex-col gap-12 pt-[72px] pb-7`}>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-8">
          <div className="flex flex-col gap-3.5">
            <span className="flex items-center gap-2.5 text-white">
              <SmileMark size={34} />
              <Wordmark className="text-[22px]" />
            </span>
            <span className="max-w-[260px] text-[15px]">Gentle, modern dentistry in Riverside, six days a week.</span>
          </div>
          <div className="flex flex-col gap-2 text-[15px]">
            <strong className="text-white">Visit</strong>
            <span>{clinic.address[0]}</span>
            <span>{clinic.address[1]}</span>
          </div>
          <div className="flex flex-col gap-2 text-[15px]">
            <strong className="text-white">Contact</strong>
            <a href={clinic.phoneHref} className={link}>
              {clinic.phone}
            </a>
            <a href={`mailto:${clinic.email}`} className={link}>
              {clinic.email}
            </a>
          </div>
          <div className="flex flex-col gap-2 text-[15px]">
            <strong className="text-white">Explore</strong>
            <a href="#treatments" className={link}>
              Treatments and prices
            </a>
            <a href="#why" className={link}>
              Insurance and membership
            </a>
            <a href="#team" className={link}>
              Our dentists
            </a>
          </div>
        </div>
        <div aria-hidden="true" className="text-[clamp(64px,14vw,200px)] leading-[0.8] font-bold tracking-[-0.06em] text-[#141B36] select-none">
          SmileCare
        </div>
        <div className="flex flex-wrap justify-between gap-3 border-t border-night-800 pt-[22px] text-[13px] text-[#9AA2BD]">
          <span>SmileCare Dental Clinic is a fictional clinic used to demo the SmileCare Assistant.</span>
          <Link href="/admin" className="font-semibold text-white no-underline hover:text-white">
            Staff dashboard
          </Link>
        </div>
      </div>
    </footer>
  );
}
