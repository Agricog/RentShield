import { useNavigate, Link } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { Helmet } from 'react-helmet-async';
import { FileText, ArrowRight, Scale, CheckCircle, ChevronDown, Shield, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://repairletter.co.uk/#organization',
      name: 'RepairLetter',
      url: 'https://repairletter.co.uk',
      logo: 'https://repairletter.co.uk/logo.png',
      description: 'AI-powered repair letter generator for UK tenants.',
      foundingDate: '2026',
      founder: { '@type': 'Organization', name: 'Autaimate' },
      contactPoint: { '@type': 'ContactPoint', email: 'hello@repairletter.co.uk', contactType: 'customer service' },
    },
    {
      '@type': 'WebPage',
      '@id': 'https://repairletter.co.uk/section-11-landlord-tenant-act#webpage',
      url: 'https://repairletter.co.uk/section-11-landlord-tenant-act',
      name: 'Section 11 Landlord and Tenant Act 1985 Explained | RepairLetter',
      description: 'Section 11 of the Landlord and Tenant Act 1985 explained for UK tenants. What it covers, how to trigger the obligation, and what to do when your landlord breaches it.',
      isPartOf: { '@id': 'https://repairletter.co.uk/#organization' },
      speakable: { '@type': 'SpeakableSpecification', cssSelector: ['#quick-answer', 'h1'] },
      inLanguage: 'en-GB',
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://repairletter.co.uk/' },
          { '@type': 'ListItem', position: 2, name: 'Section 11 Landlord and Tenant Act 1985', item: 'https://repairletter.co.uk/section-11-landlord-tenant-act' },
        ],
      },
    },
    {
      '@type': 'SoftwareApplication',
      name: 'RepairLetter',
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web, iOS, Android',
      offers: { '@type': 'Offer', price: '4.99', priceCurrency: 'GBP' },
    },
    {
      '@type': 'HowTo',
      name: 'How to Use Section 11 LTA 1985 to Get Your Landlord to Repair',
      description: 'Practical guide to enforcing your landlord\'s s.11 repairing covenant.',
      totalTime: 'PT1M',
      step: [
        { '@type': 'HowToStep', position: 1, name: 'Identify the defect', text: 'Confirm it falls within s.11 — structure, exterior, or core installations.' },
        { '@type': 'HowToStep', position: 2, name: 'Give written notice', text: 'Send a formal repair letter citing s.11 LTA 1985. The obligation arises on notice.' },
        { '@type': 'HowToStep', position: 3, name: 'Allow reasonable time', text: '14 to 28 days for non-emergency repairs.' },
        { '@type': 'HowToStep', position: 4, name: 'Escalate if ignored', text: 'Environmental health, First-tier Tribunal, or county court.' },
      ],
    },
    {
      '@type': 'Article',
      headline: 'Section 11 Landlord and Tenant Act 1985: Complete Guide for Tenants',
      author: { '@type': 'Organization', name: 'RepairLetter' },
      publisher: { '@id': 'https://repairletter.co.uk/#organization' },
      datePublished: '2026-04-10',
      dateModified: '2026-04-10',
      description: 'Complete plain-English explanation of s.11 LTA 1985 — what it covers, the notice requirement, landlord defences, and how to enforce your rights.',
      mainEntityOfPage: 'https://repairletter.co.uk/section-11-landlord-tenant-act',
    },
    {
      '@type': 'DefinedTermSet',
      name: 'Section 11 LTA 1985 Legal Terms',
      definedTerm: [
        { '@type': 'DefinedTerm', name: 'Implied Covenant', description: 'A legal obligation that exists automatically in a contract regardless of whether it is written in. Section 11 creates an implied repairing covenant in all residential tenancies.' },
        { '@type': 'DefinedTerm', name: 'Notice', description: 'Under s.11, the landlord\'s obligation to repair only arises once they have been informed of the defect. Written notice is the legally safest form.' },
        { '@type': 'DefinedTerm', name: 'Reasonable Time', description: 'The period within which a landlord must complete repairs after receiving notice. Determined by the urgency and nature of the defect.' },
      ],
    },
  ],
};

const FAQ_DATA = [
  { q: 'What is Section 11 of the Landlord and Tenant Act 1985?', a: 'Section 11 of the Landlord and Tenant Act 1985 creates an implied repairing covenant in all residential tenancies in England and Wales. It requires landlords to keep in repair the structure and exterior of the dwelling, and to keep in repair and proper working order the installations for water, gas, electricity, sanitation, space heating, and hot water. The obligation is implied — it exists whether or not it is written in the tenancy agreement, and cannot be contracted out of.' },
  { q: 'Does Section 11 apply to all tenancies?', a: 'Section 11 applies to all residential tenancies in England and Wales granted on or after 24 October 1961, where the term is less than seven years. In practice, this covers almost all private residential tenancies. It does not apply to commercial leases or licences to occupy.' },
  { q: 'What does "structure and exterior" mean under s.11?', a: 'Structure and exterior covers the main elements of the building: roof and roof structure; external walls including render and plasterwork facing outward; foundations; floors (excluding interior decorative surfaces); windows and external doors including frames and glass; external staircases and fire escapes; drains, gutters, and external pipes; chimneys. Internal walls, ceilings, and floors are generally not covered unless they affect the structural integrity.' },
  { q: 'What installations must a landlord keep in working order under s.11?', a: 'Section 11(1)(b) and (c) cover: installations for the supply of water, gas, and electricity (pipes, meters, wiring); installations for sanitation (WC, basin, bath, shower and their connecting pipes); installations for space heating (boiler, radiators, central heating system); installations for hot water (hot water cylinder, immersion heater). The obligation is to keep these in repair and proper working order — meaning they must actually function, not merely exist.' },
  { q: 'When does the landlord\'s s.11 obligation arise?', a: 'The obligation arises on notice. Your landlord has no duty to repair a defect they do not know about. Once you give written notice of a defect, the obligation to repair within a reasonable time begins. This is why a formal repair letter is legally essential — a verbal mention or text message may not constitute sufficient notice.' },
  { q: 'Can a landlord exclude s.11 in the tenancy agreement?', a: 'No. Section 11 cannot be excluded or modified by agreement. Any clause in a tenancy agreement that purports to place the s.11 repairing obligations on the tenant, or to limit the landlord\'s liability for disrepair, is unenforceable. Courts will simply ignore such clauses and apply s.11 as if they did not exist.' },
  { q: 'What is the standard of repair required under s.11?', a: 'The standard of repair is that of a reasonably-minded landlord in the property market — not the highest possible standard, but one that makes the property fit for purpose. The age, character, and locality of the property are taken into account. A Victorian terrace is not required to be brought up to new-build standards, but it must be maintained to a standard appropriate for habitation given its age and character.' },
  { q: 'Does s.11 cover damage caused by the tenant?', a: 'The s.11 obligation does not require the landlord to repair damage deliberately caused by the tenant, or damage arising from the tenant\'s negligent misuse of the property. However, normal wear and tear — including gradual deterioration of structure and installations over time — is the landlord\'s responsibility. The landlord cannot argue that a boiler failure is the tenant\'s fault simply because of the age of the appliance.' },
  { q: 'What remedies do I have if my landlord breaches s.11?', a: 'If your landlord breaches s.11, you can: complain to environmental health (they can serve an Improvement Notice); apply to the First-tier Tribunal for a rent repayment order; issue county court proceedings for damages and an order requiring repair; in some circumstances, arrange repairs and deduct the cost from rent (seek legal advice first). RepairLetter\'s evidence pack — timestamped, integrity-verified — supports all of these routes.' },
  { q: 'How does s.11 interact with the Homes Act 2018?', a: 'Section 9A of the Landlord and Tenant Act 1985, inserted by the Homes (Fitness for Human Habitation) Act 2018, runs alongside s.11. While s.11 deals with specific structural and installation items, s.9A requires the property to be fit for human habitation throughout the tenancy. The two obligations overlap and reinforce each other. RepairLetter cites both in every letter it generates.' },
  { q: 'Is s.11 different from the HHSRS?', a: 'Yes — they operate separately. Section 11 is a contractual obligation between landlord and tenant, enforceable through the courts. The HHSRS is a statutory hazard assessment framework used by local authorities. A property can breach s.11 without triggering a Category 1 HHSRS hazard, and vice versa. In practice, serious disrepair often breaches both.' },
];

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_DATA.map(faq => ({
    '@type': 'Question',
    name: faq.q,
    acceptedAnswer: { '@type': 'Answer', text: faq.a },
  })),
};

export function Section11LandlordTenantActPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-navy">
      <Helmet>
        <title>Section 11 Landlord and Tenant Act 1985 Explained | RepairLetter</title>
        <meta name="description" content="Section 11 of the Landlord and Tenant Act 1985 explained for UK tenants. What it covers, how notice triggers the obligation, and how to enforce your repair rights. Free guide." />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <link rel="canonical" href="https://repairletter.co.uk/section-11-landlord-tenant-act" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://repairletter.co.uk/section-11-landlord-tenant-act" />
        <meta property="og:title" content="Section 11 Landlord and Tenant Act 1985 Explained | RepairLetter" />
        <meta property="og:description" content="Plain-English guide to s.11 LTA 1985 — the implied repairing covenant that covers structure, exterior and all core installations in your rental." />
        <meta property="og:image" content="https://repairletter.co.uk/og-repair-letter.jpg" />
        <meta property="og:locale" content="en_GB" />
        <meta property="og:site_name" content="RepairLetter" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Section 11 Landlord and Tenant Act 1985 Explained" />
        <meta name="twitter:description" content="Plain-English guide to s.11 LTA 1985 — what your landlord must fix and how to enforce it." />
        <meta name="twitter:image" content="https://repairletter.co.uk/og-repair-letter.jpg" />
        <meta name="author" content="RepairLetter — Autaimate" />
        <script type="application/ld+json">{JSON.stringify(STRUCTURED_DATA)}</script>
        <script type="application/ld+json">{JSON.stringify(FAQ_SCHEMA)}</script>
      </Helmet>

      <header className="px-6 pt-10 pb-12 max-w-3xl mx-auto">
        <div className="flex items-center gap-2.5 mb-10">
          <Link to="/" className="flex items-center gap-2.5">
            <FileText className="h-7 w-7 text-shield-mid" />
            <span className="text-xl font-bold text-white tracking-tight">Repair<span className="text-shield-mid">Letter</span></span>
          </Link>
        </div>
        <nav className="mb-6">
          <Link to="/" className="text-white/40 hover:text-white/70 text-xs transition-colors">← Back to RepairLetter</Link>
        </nav>
        <p id="quick-answer" className="text-white/40 text-xs uppercase tracking-widest mb-3 font-semibold">UK Housing Law — Plain English Reference</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4 max-w-xl">
          Section 11 — Landlord and
          <br />
          <span className="text-shield-mid">Tenant Act 1985 Explained</span>
        </h1>
        <p className="text-white/55 text-sm sm:text-base leading-relaxed mb-8 max-w-lg">
          Section 11 of the Landlord and Tenant Act 1985 is the legal foundation of every tenant's right to repairs. It creates an obligation your landlord cannot escape — regardless of what your tenancy agreement says, regardless of who caused the problem, regardless of how long you have lived there.
        </p>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="w-full sm:w-auto bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-8 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
              Cite s.11 in your repair letter — £4.99 <ArrowRight className="h-4 w-4" />
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <button onClick={() => navigate('/dashboard')} className="w-full sm:w-auto bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-8 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
            Go to dashboard <ArrowRight className="h-4 w-4" />
          </button>
        </SignedIn>
      </header>

      <div className="bg-navy-mid px-6 py-4 flex items-center justify-center gap-6 text-[10px] text-white/35 uppercase tracking-widest flex-wrap">
        <span>Implied Covenant</span><span className="text-white/15">·</span>
        <span>Cannot Be Excluded</span><span className="text-white/15">·</span>
        <span>Arises on Notice</span><span className="text-white/15">·</span>
        <span>All Residential Tenancies</span>
      </div>

      <div className="bg-surface">
        <div className="max-w-3xl mx-auto px-6 py-16">

          <section className="mb-16">
            <div className="bg-white border border-border rounded-2xl p-6 sm:p-8">
              <div className="flex items-start gap-3 mb-4">
                <Scale className="h-6 w-6 text-shield flex-shrink-0 mt-0.5" />
                <h2 className="text-2xl font-bold text-navy">The Full Text of Section 11</h2>
              </div>
              <div className="bg-navy/5 border border-navy/10 rounded-xl p-5 mb-4">
                <p className="text-sm text-navy font-medium leading-relaxed mb-3">
                  Section 11(1) of the Landlord and Tenant Act 1985 provides:
                </p>
                <p className="text-sm text-slate leading-relaxed italic mb-2">
                  "In a lease to which this section applies... there is implied a covenant by the lessor —
                </p>
                <p className="text-sm text-slate leading-relaxed italic mb-2 pl-4">
                  (a) to keep in repair the structure and exterior of the dwelling-house (including drains, gutters and external pipes);
                </p>
                <p className="text-sm text-slate leading-relaxed italic mb-2 pl-4">
                  (b) to keep in repair and proper working order the installations in the dwelling-house for the supply of water, gas and electricity and for sanitation (including basins, sinks, baths and sanitary conveniences, but not other fixtures, fittings and appliances for making use of the supply of water, gas or electricity); and
                </p>
                <p className="text-sm text-slate leading-relaxed italic pl-4">
                  (c) to keep in repair and proper working order the installations in the dwelling-house for space heating and heating water."
                </p>
              </div>
              <p className="text-sm text-slate leading-relaxed">
                In plain English: your landlord must maintain the fabric of your home and keep every core system — water, gas, electricity, heating, sanitation — in working order. This is not optional and cannot be transferred to you by contract.
              </p>
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">What Section 11 Covers — Detailed Breakdown</h2>
            <div className="flex flex-col gap-4">
              {[
                {
                  heading: 'Structure and Exterior — s.11(1)(a)',
                  items: [
                    'Roof — tiles, felt, structure, flashings',
                    'External walls — brickwork, render, pointing',
                    'Foundations',
                    'Windows — frames, glass, seals',
                    'External doors — frames, locks, seals',
                    'Floors — subfloor structure (not surface coverings)',
                    'Drains, gutters, downpipes',
                    'Chimneys and chimney stacks',
                    'External staircases',
                  ],
                },
                {
                  heading: 'Water, Gas and Electricity Installations — s.11(1)(b)',
                  items: [
                    'Cold water supply pipes and storage tanks',
                    'Hot water pipes',
                    'Gas supply pipes up to and including the meter',
                    'Electrical wiring, fuse boards, and consumer units',
                    'Sockets and light fittings (fixed)',
                    'Toilets, cisterns, basins, baths, showers',
                    'Soil pipes and waste connections',
                  ],
                },
                {
                  heading: 'Space Heating and Hot Water — s.11(1)(c)',
                  items: [
                    'Boiler — gas, oil, or electric',
                    'Radiators and pipework',
                    'Central heating controls and thermostats',
                    'Hot water cylinder and immersion heater',
                    'Storage heaters',
                    'Underfloor heating systems',
                  ],
                },
              ].map((group, i) => (
                <div key={i} className="bg-white border border-border rounded-xl p-5">
                  <h3 className="text-sm font-bold text-navy mb-3">{group.heading}</h3>
                  <ul className="grid sm:grid-cols-2 gap-2">
                    {group.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2">
                        <CheckCircle className="h-3.5 w-3.5 text-shield flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-slate">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">The Notice Requirement — The Most Important Principle</h2>
            <p className="text-sm text-slate leading-relaxed mb-4">
              The single most important practical aspect of s.11 is the notice requirement. Your landlord's obligation to repair does not arise until they have been informed of the defect. Until that point, they have no legal duty to act — even if the defect is obvious.
            </p>
            <p className="text-sm text-slate leading-relaxed mb-4">
              This principle comes from the case of <span className="font-medium text-navy">O'Brien v Robinson [1973]</span>, where the House of Lords confirmed that a landlord is not in breach of the implied repairing covenant until they have notice of the disrepair. The same principle applies under s.11.
            </p>
            <p className="text-sm text-slate leading-relaxed mb-4">
              What counts as sufficient notice? The safest form is a formal written letter — delivered to your landlord's address of service (usually their address given in the tenancy agreement) — that describes the defect specifically and requests repair. A text message or WhatsApp may constitute notice but is harder to prove. An email creates a better record. A formal PDF letter with delivery confirmation — as generated by RepairLetter — is the gold standard.
            </p>
            <div className="bg-white border border-border border-l-4 border-l-shield rounded-xl p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-navy mb-1">The clock starts when they receive notice</h3>
                  <p className="text-xs text-slate leading-relaxed">From the moment your landlord receives your written repair letter, the reasonable time to repair begins. Without the letter, there is no clock, no deadline, and no breach — no matter how long the defect has been present.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">Section 11 Cannot Be Excluded</h2>
            <p className="text-sm text-slate leading-relaxed mb-4">
              Section 12 of the Landlord and Tenant Act 1985 makes clear that s.11 cannot be excluded or limited by the tenancy agreement. Any clause that attempts to do so is void and unenforceable.
            </p>
            <p className="text-sm text-slate leading-relaxed mb-4">
              Common examples of unenforceable clauses include: "The tenant is responsible for all repairs under £150"; "The tenant must maintain all appliances provided"; "The landlord accepts no liability for breakdown of heating equipment." Courts simply treat these clauses as if they do not exist.
            </p>
            <p className="text-sm text-slate leading-relaxed">
              This means that even if your tenancy agreement contains such a clause, and even if you signed it, your landlord remains legally responsible under s.11 for everything the section covers.
            </p>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">Related Guides</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { to: '/letter-to-landlord-about-repairs', title: 'Write a Repair Letter', desc: 'Give your landlord formal s.11 notice — the trigger for their legal obligation.' },
                { to: '/landlord-repair-obligations-uk', title: 'Full Repair Obligations Guide', desc: 'Everything your landlord is legally required to fix under UK law.' },
                { to: '/landlord-not-fixing-repairs', title: 'Landlord Not Fixing Repairs', desc: 'What to do if your landlord ignores their s.11 obligations.' },
                { to: '/environmental-health-complaint-landlord', title: 'Environmental Health Complaint', desc: 'How HHSRS and s.11 work together when the council gets involved.' },
              ].map((link, i) => (
                <Link key={i} to={link.to} className="bg-white border border-border rounded-xl p-4 hover:border-shield/40 transition-colors">
                  <h3 className="text-sm font-bold text-navy mb-1">{link.title}</h3>
                  <p className="text-xs text-slate leading-relaxed">{link.desc}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">Frequently Asked Questions</h2>
            <div className="flex flex-col gap-3">
              {FAQ_DATA.map((faq, i) => (<FaqItem key={i} question={faq.q} answer={faq.a} />))}
            </div>
          </section>

          <section className="text-center py-8">
            <div className="inline-flex items-center gap-2 bg-shield/10 border border-shield/20 rounded-full px-4 py-2 mb-4">
              <Shield className="h-4 w-4 text-shield-mid" />
              <span className="text-xs text-shield-mid font-medium">s.11 LTA 1985 cited in every RepairLetter</span>
            </div>
            <h2 className="text-2xl font-bold text-navy mb-3">Put Section 11 to Work</h2>
            <p className="text-sm text-slate mb-6 max-w-md mx-auto">
              Knowing s.11 exists is not enough — you need to give your landlord formal notice. RepairLetter generates the correct legal letter in 60 seconds, citing s.11, HHSRS, and the Homes Act 2018.
            </p>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-8 rounded-xl text-sm transition-colors inline-flex items-center gap-2">
                  Send a repair letter — £4.99 <ArrowRight className="h-4 w-4" />
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <button onClick={() => navigate('/dashboard')} className="bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-8 rounded-xl text-sm transition-colors inline-flex items-center gap-2">
                Go to dashboard <ArrowRight className="h-4 w-4" />
              </button>
            </SignedIn>
          </section>
        </div>
      </div>

      <footer className="bg-navy border-t border-white/5 px-6 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-shield-mid" />
            <span className="text-base font-bold text-white tracking-tight">Repair<span className="text-shield-mid">Letter</span></span>
          </div>
          <p className="text-xs text-white/30 leading-relaxed mb-4 max-w-md">
            RepairLetter generates correspondence based on UK housing legislation. It does not constitute legal advice. For specific legal guidance, contact Citizens Advice, Shelter, or a qualified solicitor.
          </p>
          <div className="flex flex-wrap gap-4 text-xs">
            <Link to="/" className="text-white/40 hover:text-white/70 transition-colors">Home</Link>
            <Link to="/privacy" className="text-white/40 hover:text-white/70 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-white/40 hover:text-white/70 transition-colors">Terms of Service</Link>
          </div>
          <p className="text-[10px] text-white/15 mt-6">© {new Date().getFullYear()} RepairLetter · Autaimate · ICO Registered · UK GDPR Compliant</p>
        </div>
      </footer>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 text-left" aria-expanded={open}>
        <span className="text-sm font-semibold text-navy pr-4">{question}</span>
        <ChevronDown className={`h-4 w-4 text-slate flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-sm text-slate leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}
