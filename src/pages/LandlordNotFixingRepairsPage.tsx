import { useNavigate, Link } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { Helmet } from 'react-helmet-async';
import {
  FileText,
  ArrowRight,
  Scale,
  AlertTriangle,
  ChevronDown,
  Shield,
  CheckCircle,
} from 'lucide-react';
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
      '@id': 'https://repairletter.co.uk/landlord-not-fixing-repairs#webpage',
      url: 'https://repairletter.co.uk/landlord-not-fixing-repairs',
      name: 'Landlord Not Fixing Repairs? Your Rights UK 2026 | RepairLetter',
      description: 'What to do if your landlord is not fixing repairs in the UK. Step-by-step legal escalation guide from repair letter to environmental health to tribunal. Free guide.',
      isPartOf: { '@id': 'https://repairletter.co.uk/#organization' },
      speakable: { '@type': 'SpeakableSpecification', cssSelector: ['#quick-answer', 'h1'] },
      inLanguage: 'en-GB',
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://repairletter.co.uk/' },
          { '@type': 'ListItem', position: 2, name: 'Landlord Not Fixing Repairs', item: 'https://repairletter.co.uk/landlord-not-fixing-repairs' },
        ],
      },
    },
    {
      '@type': 'SoftwareApplication',
      name: 'RepairLetter',
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web, iOS, Android',
      offers: { '@type': 'Offer', price: '4.99', priceCurrency: 'GBP' },
      description: 'Send a legal repair letter to your landlord in 60 seconds with photo evidence and UK law citations.',
    },
    {
      '@type': 'HowTo',
      name: 'What to Do When Your Landlord Is Not Fixing Repairs',
      description: 'Step-by-step guide to escalating a repair dispute with your UK landlord.',
      totalTime: 'PT14D',
      step: [
        { '@type': 'HowToStep', position: 1, name: 'Send a formal repair letter', text: 'Send a written notice citing s.11 LTA 1985. This is the legal trigger for your landlord\'s obligation to act.' },
        { '@type': 'HowToStep', position: 2, name: 'Wait 14 days', text: 'Your landlord has a reasonable time to respond. 14 days is standard for non-emergency repairs.' },
        { '@type': 'HowToStep', position: 3, name: 'Report to environmental health', text: 'If no response, complain to your local council. They can inspect and serve an improvement notice.' },
        { '@type': 'HowToStep', position: 4, name: 'Apply to tribunal or court', text: 'Apply to the First-tier Tribunal for a rent repayment order, or issue county court proceedings.' },
      ],
    },
    {
      '@type': 'Article',
      headline: 'Landlord Not Fixing Repairs: What Are Your Rights in the UK?',
      author: { '@type': 'Organization', name: 'RepairLetter' },
      publisher: { '@id': 'https://repairletter.co.uk/#organization' },
      datePublished: '2026-04-10',
      dateModified: '2026-04-10',
      description: 'Complete guide to what UK tenants can do when their landlord refuses or fails to carry out repairs. Covers formal letters, environmental health, rent repayment orders and court action.',
      mainEntityOfPage: 'https://repairletter.co.uk/landlord-not-fixing-repairs',
    },
    {
      '@type': 'DefinedTermSet',
      name: 'UK Repair Escalation Terminology',
      definedTerm: [
        { '@type': 'DefinedTerm', name: 'Improvement Notice', description: 'A formal notice served by a local authority on a landlord under the Housing Act 2004 requiring specified repairs within a stated timeframe.' },
        { '@type': 'DefinedTerm', name: 'Rent Repayment Order', description: 'An order from the First-tier Tribunal requiring a landlord to repay up to 12 months of rent where they have breached housing legislation.' },
        { '@type': 'DefinedTerm', name: 'Section 21', description: 'The no-fault eviction notice abolished under the Renters\' Rights Act 2025 from 1 May 2026.' },
      ],
    },
  ],
};

const FAQ_DATA = [
  { q: 'What are my rights if my landlord won\'t fix repairs?', a: 'Your landlord has a legal obligation under s.11 of the Landlord and Tenant Act 1985 to keep in repair the structure, exterior, and installations of your home. If they fail to act after receiving written notice, you can: (1) complain to your local council\'s environmental health department; (2) apply to the First-tier Tribunal for a rent repayment order of up to 12 months\' rent; (3) issue county court proceedings for breach of contract; or (4) in some circumstances, carry out repairs yourself and deduct the cost from rent.' },
  { q: 'How long does a landlord have to fix repairs after being notified?', a: 'The law requires repairs within a "reasonable time" after notice. Emergency repairs (no heating or hot water, gas leaks, flooding) — 24 to 48 hours. Urgent repairs — 3 to 7 days. Standard repairs — 14 to 28 days. Minor repairs — up to 3 months.' },
  { q: 'Can I withhold rent if my landlord won\'t fix repairs?', a: 'Withholding rent is legally risky and not recommended without specific legal advice. Your landlord can apply to court for possession on the grounds of rent arrears. There are legal routes — such as a rent repayment order — that achieve similar outcomes without the risk. Contact Citizens Advice or a housing solicitor first.' },
  { q: 'What is an environmental health complaint and how does it help?', a: 'You can report unresolved repair problems to your local council\'s environmental health department. An officer will inspect under the HHSRS. If they identify a Category 1 hazard, they have a statutory duty to take enforcement action — including serving an Improvement Notice with fines for non-compliance. RepairLetter automatically generates your complaint document after 14 days of landlord inaction.' },
  { q: 'Can my landlord evict me for complaining about repairs?', a: 'From 1 May 2026, Section 21 no-fault evictions are abolished under the Renters\' Rights Act 2025. Your landlord can only seek possession through Section 8 citing specific legal grounds. Retaliatory eviction for requesting repairs is illegal.' },
  { q: 'What is a rent repayment order?', a: 'A rent repayment order (RRO) is an order from the First-tier Tribunal requiring your landlord to repay up to 12 months of rent. You can apply if your landlord has failed to comply with an improvement notice or where the property has Category 1 or 2 hazards under HHSRS.' },
  { q: 'What evidence do I need if my landlord won\'t fix repairs?', a: 'You need: dated photographs, copies of all letters and messages sent, delivery confirmations, records of verbal conversations (dates, times), and any reports from tradespeople. RepairLetter creates this evidence pack automatically — photos are SHA-256 hashed, letters timestamped, and the chain of communication documented.' },
  { q: 'Can I repair and deduct the cost from rent?', a: '"Repair and deduct" is a legal remedy in some circumstances but carries significant risk if not done correctly. You must first give formal notice and a reasonable time to act. The repairs must be within s.11 obligations. Notify your landlord before deducting. Seek advice from Citizens Advice or a housing solicitor first.' },
  { q: 'What if my landlord says the repair is not their responsibility?', a: 'Under s.11 LTA 1985, the landlord\'s obligation covers structure, exterior, and installations for water, gas, electricity, sanitation, space heating, and hot water. This cannot be contracted out of. A formal repair letter creates a record of your disagreement. An environmental health inspection will provide an independent assessment.' },
  { q: 'How does the Renters\' Rights Act 2025 help tenants with repairs?', a: 'Section 21 no-fault evictions are abolished. The Decent Homes Standard extends to private rentals. Awaab\'s Law requires landlords to address damp and mould within strict timescales. A new Landlord Ombudsman provides non-court dispute resolution. All landlords must register on a national database.' },
  { q: 'What happens if my landlord ignores an improvement notice?', a: 'Failure to comply with an improvement notice is a criminal offence under the Housing Act 2004. The council can prosecute, impose a civil penalty of up to £30,000, or carry out the works and recover the cost from the landlord.' },
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

const ESCALATION_STEPS = [
  { step: '1', title: 'Send a formal repair letter', timeframe: 'Day 0', desc: 'A written notice citing s.11 LTA 1985 is the legal trigger for your landlord\'s repair obligation. Without it, they have no legal duty to act — regardless of how many times you have asked verbally.', action: 'RepairLetter generates this for £4.99 with photo evidence attached.', urgent: false },
  { step: '2', title: 'Chase if no response within the deadline', timeframe: 'Day 14', desc: 'If your landlord has not responded or arranged the repair within your stated deadline, send a second letter referencing the first and confirming your intention to escalate.', action: 'Your RepairLetter dashboard shows delivery status and allows you to monitor response.', urgent: false },
  { step: '3', title: 'Report to environmental health', timeframe: 'Day 15+', desc: 'Contact your local council\'s environmental health department. They will inspect under the HHSRS. If they find a Category 1 hazard, they are legally obliged to take enforcement action against your landlord.', action: 'RepairLetter auto-generates your environmental health complaint document after 14 days of non-response.', urgent: false },
  { step: '4', title: 'Apply to the First-tier Tribunal', timeframe: 'Ongoing', desc: 'If the council has served an improvement notice and your landlord has ignored it, or you want to pursue a rent repayment order, apply to the First-tier Tribunal (Property Chamber). This is a free or low-cost route.', action: 'Your RepairLetter evidence pack — timestamped, integrity-verified — supports your application.', urgent: false },
  { step: '5', title: 'County court proceedings', timeframe: 'Last resort', desc: 'If other routes have failed, you can issue county court proceedings against your landlord for breach of the repairing covenant. You may be able to claim damages for inconvenience, health impact, and the cost of alternative accommodation.', action: 'Seek advice from Citizens Advice, Shelter, or a housing solicitor before this step.', urgent: true },
];

export function LandlordNotFixingRepairsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-navy">
      <Helmet>
        <title>Landlord Not Fixing Repairs? Your Rights UK 2026 | RepairLetter</title>
        <meta name="description" content="Landlord not fixing repairs in the UK? Step-by-step guide: formal letter, environmental health complaint, rent repayment order, tribunal. Legal letter in 60 seconds — £4.99." />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <link rel="canonical" href="https://repairletter.co.uk/landlord-not-fixing-repairs" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://repairletter.co.uk/landlord-not-fixing-repairs" />
        <meta property="og:title" content="Landlord Not Fixing Repairs? Your Rights UK 2026 | RepairLetter" />
        <meta property="og:description" content="Landlord not fixing repairs? Step-by-step legal escalation guide for UK tenants. Formal letter to tribunal." />
        <meta property="og:image" content="https://repairletter.co.uk/og-repair-letter.jpg" />
        <meta property="og:locale" content="en_GB" />
        <meta property="og:site_name" content="RepairLetter" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Landlord Not Fixing Repairs? Your Rights UK 2026" />
        <meta name="twitter:description" content="Landlord ignoring your repair requests? UK tenant rights guide — legal letter to tribunal escalation." />
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
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <p id="quick-answer" className="text-amber-400 text-xs uppercase tracking-widest font-semibold">Know Your Rights — UK 2026</p>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4 max-w-xl">
          Landlord Not Fixing Repairs?
          <br />
          <span className="text-shield-mid">Here Is What You Can Do.</span>
        </h1>
        <p className="text-white/55 text-sm sm:text-base leading-relaxed mb-8 max-w-lg">
          A landlord who ignores your repair requests is breaking the law. Under s.11 of the Landlord and Tenant Act 1985, once you give written notice, they are legally obliged to act within a reasonable time. This guide takes you from formal letter to environmental health to tribunal — step by step.
        </p>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="w-full sm:w-auto bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-8 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
              Send a legal repair letter — £4.99 <ArrowRight className="h-4 w-4" />
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
        <span>Section 21 Abolished</span><span className="text-white/15">·</span>
        <span>Environmental Health</span><span className="text-white/15">·</span>
        <span>Rent Repayment Orders</span><span className="text-white/15">·</span>
        <span>Tribunal Route</span>
      </div>

      <div className="bg-surface">
        <div className="max-w-3xl mx-auto px-6 py-16">

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">Why Landlords Ignore Repair Requests — And Why It Matters</h2>
            <p className="text-sm text-slate leading-relaxed mb-4">
              Some landlords ignore repair requests because they believe tenants will not follow through. Others genuinely dispute that a defect is their responsibility. Whatever the reason, the legal position is clear: once you have given written notice of a defect, your landlord has a legal obligation to act within a reasonable time. That obligation exists regardless of what your tenancy agreement says.
            </p>
            <p className="text-sm text-slate leading-relaxed mb-4">
              The reason your written repair letter matters so much is that verbal requests do not start the legal clock. A landlord who receives a WhatsApp message saying "the boiler is broken again" can argue they did not receive formal notice. A landlord who receives a PDF letter citing s.11 of the Landlord and Tenant Act 1985, with photographs timestamped and embedded, with a 14-day deadline, cannot make that argument.
            </p>
            <p className="text-sm text-slate leading-relaxed">
              From 1 May 2026, Section 21 no-fault evictions are abolished under the Renters' Rights Act 2025. This removes the biggest reason tenants historically avoided pursuing repairs: the fear of retaliatory eviction. That threat no longer exists. You can now demand repairs with confidence.
            </p>
          </section>

          <section className="mb-16">
            <div className="bg-white border border-border rounded-2xl p-6 sm:p-8">
              <div className="flex items-start gap-3 mb-6">
                <Scale className="h-6 w-6 text-shield flex-shrink-0 mt-0.5" />
                <h2 className="text-2xl font-bold text-navy">The Escalation Ladder — Step by Step</h2>
              </div>
              <div className="flex flex-col gap-4">
                {ESCALATION_STEPS.map((item) => (
                  <div key={item.step} className={`rounded-xl p-5 border ${item.urgent ? 'border-amber-200 bg-amber-50' : 'border-border'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-lg text-white text-xs font-bold flex items-center justify-center flex-shrink-0 ${item.urgent ? 'bg-amber-500' : 'bg-shield'}`}>
                        {item.step}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                          <h3 className="text-sm font-bold text-navy">{item.title}</h3>
                          <span className="text-[10px] uppercase tracking-widest text-white/70 bg-navy px-2 py-0.5 rounded-full">{item.timeframe}</span>
                        </div>
                        <p className="text-xs text-slate leading-relaxed mb-2">{item.desc}</p>
                        <p className="text-xs text-shield font-medium">{item.action}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">Emergency Repairs — When to Act Immediately</h2>
            <p className="text-sm text-slate leading-relaxed mb-6">
              Some defects require immediate landlord action. If your landlord does not respond within 24–48 hours for any of the following, contact environmental health immediately — do not wait 14 days.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                'Complete loss of heating in cold weather, especially with children or vulnerable occupants',
                'Complete loss of hot water',
                'Gas leak — also call National Gas Emergency Service on 0800 111 999',
                'Flooding or serious water leak causing immediate damage',
                'Electrical hazard — sparking, burning smell, exposed wiring',
                'Structural collapse or imminent risk of structural failure',
                'No working toilet',
                'Severe roof leak during wet weather',
              ].map((item, i) => (
                <div key={i} className="bg-white border border-border rounded-xl p-4 flex gap-3">
                  <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">Building Your Evidence Pack</h2>
            <p className="text-sm text-slate leading-relaxed mb-6">
              Every route — environmental health, tribunal, court — depends on evidence. The stronger your evidence, the stronger your position. RepairLetter builds this automatically, but here is what you should be collecting regardless.
            </p>
            <div className="flex flex-col gap-3">
              {[
                { title: 'Dated photographs', desc: 'Take photos from the start and regularly thereafter. Photos showing the defect worsening over time are particularly compelling.' },
                { title: 'All written communications', desc: 'Keep every email, letter, text, and WhatsApp message between you and your landlord about the repair.' },
                { title: 'Formal repair letters', desc: 'Your formal repair letters — with delivery confirmation — are the most important documents. They establish that legal notice was given.' },
                { title: 'Landlord responses', desc: 'Any response — promises to fix, denials, or silence — is evidence. A promise that was not followed through is particularly useful.' },
                { title: 'Health impact records', desc: 'If the defect has affected your health (respiratory problems from damp, illness from no heating), keep medical records and GP notes.' },
                { title: 'Quotes for repair', desc: 'Quotes from tradespeople demonstrate the cost of your landlord\'s inaction and support any compensation claim.' },
              ].map((item, i) => (
                <div key={i} className="bg-white border border-border rounded-xl p-4 flex gap-3">
                  <CheckCircle className="h-4 w-4 text-shield flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-navy mb-1">{item.title}</h3>
                    <p className="text-xs text-slate leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">Related Tenant Rights Guides</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { to: '/letter-to-landlord-about-repairs', title: 'Write a Repair Letter', desc: 'What to include in a formal repair letter and which UK laws to cite.' },
                { to: '/environmental-health-complaint-landlord', title: 'Environmental Health Complaint', desc: 'How to report your landlord to the council and what happens next.' },
                { to: '/renters-rights-act-2025', title: 'Renters\' Rights Act 2025', desc: 'How the new law strengthens your position from 1 May 2026.' },
                { to: '/section-11-landlord-tenant-act', title: 'Section 11 LTA 1985', desc: 'Your landlord\'s core repairing obligation in full detail.' },
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
              <span className="text-xs text-shield-mid font-medium">Section 21 Abolished from 1 May 2026</span>
            </div>
            <h2 className="text-2xl font-bold text-navy mb-3">Start With a Formal Repair Letter</h2>
            <p className="text-sm text-slate mb-6 max-w-md mx-auto">
              The formal repair letter is Step 1 in every escalation route. Without it, your landlord has no legal obligation. With it, you have rights, evidence, and the law on your side.
            </p>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-8 rounded-xl text-sm transition-colors inline-flex items-center gap-2">
                  Send your repair letter — £4.99 <ArrowRight className="h-4 w-4" />
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
