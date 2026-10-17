import Link from 'next/link';
import Script from 'next/script';
import { AskAssistant, BookButton } from '@/components/clinic/ask-assistant';
import { OpeningHours } from '@/components/clinic/opening-hours';
import { clinic, insurers, team, treatments } from '@/lib/clinic';

const WIDGET_SRC = process.env.NEXT_PUBLIC_WIDGET_SRC ?? 'http://localhost:4000/widget.js';
const WIDGET_KEY = process.env.NEXT_PUBLIC_WIDGET_KEY ?? 'pk_demo_smilecare';

/** Demo clinic website with the chat widget installed exactly as a client would install it. */
export default function ClinicHome() {
  return (
    <>
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-5 sm:px-8">
        <Link href="/" className="font-display text-2xl font-bold tracking-tight text-pine">
          SmileCare<span className="text-brand">.</span>
        </Link>
        <nav aria-label="Main" className="hidden gap-7 text-[15px] md:flex">
          <a href="#treatments" className="hover:text-brand">Treatments</a>
          <a href="#visit" className="hover:text-brand">Hours and location</a>
          <a href="#insurance" className="hover:text-brand">Insurance</a>
          <a href="#team" className="hover:text-brand">Dentists</a>
        </nav>
        <BookButton className="shrink-0 rounded-xl bg-pine px-4 py-2.5 text-[15px] font-bold text-white transition-colors hover:bg-brand disabled:opacity-60">
          <span className="sm:hidden">Book a visit</span>
          <span className="hidden sm:inline">Request an appointment</span>
        </BookButton>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl gap-12 px-5 pt-10 pb-20 sm:px-8 lg:grid-cols-[1.35fr_1fr] lg:pt-16">
          <div>
            <h1 className="font-display text-[clamp(2.6rem,6.2vw,4.9rem)] leading-[0.98] font-bold tracking-[-0.03em] text-pine">
              Gentle dentistry in Riverside, six days a week.
            </h1>
            <p className="mt-6 max-w-[34rem] text-lg text-slate">
              Checkups, whitening, implants and aligners from a team that takes its time. Questions about prices or insurance?
              Our assistant Sunny answers right away, day or night, and can request an appointment for you.
            </p>
            <div className="mt-9">
              <AskAssistant />
            </div>
          </div>

          <aside id="visit" className="self-start rounded-3xl bg-mint p-7 sm:p-8" aria-label="Opening hours and location">
            <OpeningHours />
            <div className="mt-6 border-t border-pine/10 pt-5 text-[15px]">
              <p className="font-bold">{clinic.address[0]}</p>
              <p className="text-slate">{clinic.address[1]}</p>
              <p className="mt-2 text-slate">Free validated parking on levels B1–B2. Step-free access.</p>
              <p className="mt-4">
                <a href="tel:+15550142290" className="font-bold text-brand underline-offset-4 hover:underline">
                  {clinic.phone}
                </a>
              </p>
            </div>
          </aside>
        </section>

        <section id="treatments" className="border-t border-line bg-white">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
            <div className="max-w-2xl">
              <h2 className="font-display text-4xl font-bold tracking-tight">Treatments and prices</h2>
              <p className="mt-3 text-slate">
                Self-pay prices in US dollars. With insurance you&apos;ll usually pay less, and we give you a written estimate before
                any treatment.
              </p>
            </div>
            <div className="mt-12 grid gap-x-16 gap-y-12 md:grid-cols-2">
              {treatments.map((group) => (
                <div key={group.group}>
                  <h3 className="font-display text-xl font-semibold text-brand">{group.group}</h3>
                  <ul className="mt-4 space-y-3">
                    {group.items.map((item) => (
                      <li key={item.name} className="leader">
                        <span>{item.name}</span>
                        <span className="font-bold tabular-nums">{item.price}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="insurance" className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <h2 className="font-display text-4xl font-bold tracking-tight">Insurance and payment</h2>
              <p className="mt-3 text-slate">
                We&apos;re in network with the plans below and can bill most other PPO plans out of network. Treatment over $500 can
                be split into 0% monthly payments.
              </p>
            </div>
            <ul className="flex flex-wrap content-start gap-3">
              {insurers.map((name) => (
                <li key={name} className="rounded-full border border-line bg-white px-5 py-2.5 font-bold">
                  {name}
                </li>
              ))}
              <li className="rounded-full border border-dashed border-brand/40 px-5 py-2.5 text-brand">
                No insurance? Membership from $219/year
              </li>
            </ul>
          </div>
        </section>

        <section id="team" className="bg-pine text-white">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
            <h2 className="font-display text-4xl font-bold tracking-tight">Your dentists</h2>
            <ul className="mt-10 grid gap-8 sm:grid-cols-3">
              {team.map((d) => (
                <li key={d.name} className="border-t border-white/20 pt-5">
                  <p className="font-display text-2xl font-semibold">{d.name}</p>
                  <p className="mt-1 text-white/75">{d.role}</p>
                  <p className="mt-3 text-sm text-citrus">{d.years} years in practice</p>
                </li>
              ))}
            </ul>
            <p className="mt-12 max-w-xl text-white/80">
              Nervous about the dentist? Tell Sunny when you book. We offer longer appointments, noise-cancelling headphones and
              laughing gas.
            </p>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-10 text-sm text-slate sm:flex-row sm:justify-between sm:px-8">
        <p>
          {clinic.name} is a fictional clinic used to demo the SmileCare Assistant.
        </p>
        <Link href="/admin" className="font-bold text-pine hover:text-brand">
          Staff dashboard
        </Link>
      </footer>

      <Script src={WIDGET_SRC} data-widget-key={WIDGET_KEY} strategy="afterInteractive" />
    </>
  );
}
