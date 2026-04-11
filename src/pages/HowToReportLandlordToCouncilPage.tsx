import { useNavigate, Link } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { Helmet } from 'react-helmet-async';
import { FileText, ArrowRight, Scale, CheckCircle, ChevronDown, Shield, AlertTriangle, Clock } from 'lucide-react';
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
      '@id': 'https://repairletter.co.uk/how-to-report-landlord-to-council#webpage',
      url: 'https://repairletter.co.uk/how-to-report-landlord-to-council',
      name: 'How to Report Your Landlord to the Council UK | RepairLetter',
      description: 'How to report your landlord to the council in the UK. Step-by-step guide to making an environmental health complaint under HHSRS. Free guide — auto-generate your complaint after 14 days.',
      isPartOf: { '@id': 'https://repairletter.co.uk/#organization' },
      speakable: { '@type': 'SpeakableSpecification', cssSelector: ['#quick-answer', 'h1'] },
      inLanguage: 'en-GB',
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://repairletter.co.uk/' },
          { '@type': 'ListItem', position: 2, name: 'How to Report Landlord to Council', item: 'https://repairletter.co.uk/how-to-report-landlord-to-council' },
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
      name: 'How to Report Your Landlord to the Council',
      description: 'Step-by-step guide to making an environmental health complaint against your landlord in the UK.',
      totalTime: 'PT1D',
      step: [
        { '@type': 'HowToStep', position: 1, name: 'Send a formal repair letter first', text: 'Always send a written repair letter before involving the council. This demonstrates you gave your landlord a reasonable opportunity to act.' },
        { '@type': 'HowToStep', position: 2, name: 'Wait 14 days', text: 'Allow your landlord a reasonable time to respond. For non-emergency repairs, 14 days is the standard.' },
        { '@type': 'HowToStep', position: 3, name: 'Find your local council', text: 'Go to gov.uk/find-local-council to find your local authority. Contact their environmental health or housing department.' },
        { '@type': 'HowToStep', position: 4, name: 'Submit your complaint', text: 'Provide your address, details of the defect, copies of your repair letters, and photographs. RepairLetter auto-generates your complaint document.' },
        { '@type': 'HowToStep', position: 5, name: 'Council inspection', text: 'An environmental health officer will inspect under HHSRS. If they find a Category 1 hazard, they have a duty to take enforcement action.' },
      ],
    },
    {
      '@type': 'Article',
      headline: 'How to Report Your Landlord to the Council: UK Guide 2026',
      author: { '@type': 'Organization', name: 'RepairLetter' },
      publisher: { '@id': 'https://repairletter.co.uk/#organization' },
      datePublished: '2026-04-10',
      dateModified: '2026-04-10',
      description: 'Complete guide to reporting your landlord to the council for housing repairs. Covers environmental health complaints, HHSRS inspections, improvement notices, and what happens next.',
      mainEntityOfPage: 'https://repairletter.co.uk/how-to-report-landlord-to-council',
    },
    {
      '@type': 'DefinedTermSet',
      name: 'Environmental Health Complaint Terminology',
      definedTerm: [
        { '@type': 'DefinedTerm', name: 'Environmental Health Officer', description: 'A local authority officer with powers to inspect residential properties under the Housing Act 2004 and take enforcement action against landlords.' },
        { '@type': 'DefinedTerm', name: 'Improvement Notice', description: 'A formal notice served by a local authority requiring a landlord to carry out specified repairs within a stated timeframe.' },
        { '@type': 'DefinedTerm', name: 'Prohibition Order', description: 'A local authority order prohibiting use of part or all of a property where hazards pose an unacceptable risk to occupants.' },
      ],
    },
  ],
};

const FAQ_DATA = [
  { q: 'Can I report my landlord to the council for not doing repairs?', a: 'Yes. Your local council\'s environmental health department has powers under the Housing Act 2004 to inspect residential properties and take enforcement action against landlords who fail to maintain them. You should first send a formal repair letter and give your landlord a reasonable time to respond — typically 14 days. If they ignore you, you can then contact environmental health.' },
  { q: 'What happens when I report my landlord to environmental health?', a: 'An environmental health officer will inspect your property under the Housing Health and Safety Rating System (HHSRS). They will assess any hazards they find and classify them as Category 1 or Category 2. If they find a Category 1 hazard — the most serious — they have a statutory duty to take enforcement action, which may include serving an Improvement Notice on your landlord.' },
  { q: 'Do I need to send a repair letter before reporting to the council?', a: 'It is strongly recommended. Sending a repair letter first demonstrates to the council that you gave your landlord a reasonable opportunity to act. It also strengthens any subsequent legal proceedings. RepairLetter\'s auto-escalation generates your environmental health complaint document automatically after 14 days if your landlord hasn\'t responded.' },
  { q: 'Will my landlord know I reported them to the council?', a: 'Yes — if the council inspects and takes action, your landlord will be informed. The council cannot act against your landlord without notifying them. However, from 1 May 2026, Section 21 no-fault evictions are abolished, so your landlord cannot evict you simply for complaining to the council.' },
  { q: 'What powers does the council have against my landlord?', a: 'After an HHSRS inspection, the council can: serve an Improvement Notice requiring specific repairs within a set timeframe; serve a Prohibition Order preventing use of part or all of the property; carry out emergency remedial works and recover the cost from the landlord; prosecute for failure to comply; impose civil penalties of up to £30,000; include the landlord on the Rogue Landlord Database.' },
  { q: 'How long does it take for the council to act?', a: 'Councils vary in their response times. After receiving a complaint, an inspection is typically arranged within 4 to 8 weeks, though emergency situations should be prioritised. If the council identifies a Category 1 hazard, they are legally obliged to take action — though the specific steps and timescales depend on the hazard and the local authority.' },
  { q: 'What is a Category 1 hazard?', a: 'Category 1 hazards are the most serious HHSRS classifications — those where the risk of harm is so significant that local authorities have a duty to take action. Common Category 1 hazards in private rentals include: severe damp and mould; no heating (excess cold); dangerous electrics; structural collapse risk; fire hazards; and fall hazards. RepairLetter\'s AI identifies which HHSRS category your defect falls into.' },
  { q: 'Can the council make my landlord pay for repairs?', a: 'Yes. If a council carries out emergency remedial action themselves because a landlord has not complied with an Improvement Notice, they can recover the cost from the landlord. Landlords who ignore Improvement Notices also face criminal prosecution and civil penalties up to £30,000.' },
  { q: 'What evidence should I bring to an environmental health complaint?', a: 'Bring: photographs of the defect (dated where possible); copies of all repair letters sent to your landlord; any responses or correspondence from your landlord; records of any verbal conversations (dates and content); medical records if the defect has affected your health. RepairLetter creates a complete evidence pack with SHA-256 integrity verification.' },
  { q: 'Can I report my landlord anonymously?', a: 'Some councils accept anonymous complaints for initial investigation, but an anonymous complaint is less likely to result in a formal inspection because the officer cannot contact you to arrange access. For the complaint to be most effective, you will usually need to provide your name and address and agree to allow an inspection.' },
  { q: 'What if the council does nothing after my complaint?', a: 'If the council fails to take action on a Category 1 hazard, you can: request a written explanation of why no action was taken; make a formal complaint under the council\'s complaints procedure; contact the Local Government and Social Care Ombudsman; seek advice from Citizens Advice or a housing solicitor about judicial review.' },
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

const COUNCIL_POWERS = [
  { power: 'Improvement Notice', desc: 'Requires the landlord to carry out specified works within a stated timeframe. Failure to comply is a criminal offence.', severity: 'Standard' },
  { power: 'Prohibition Order', desc: 'Prevents use of all or part of the property where hazards are too severe to make repair cost-effective.', severity: 'Serious' },
  { power: 'Emergency Remedial Action', desc: 'The council carries out works itself and recovers the cost from the landlord. Used where there is immediate risk to health or safety.', severity: 'Emergency' },
  { power: 'Civil Penalty', desc: 'Up to £30,000 penalty for failure to comply with an Improvement Notice or Prohibition Order.', severity: 'Enforcement' },
  { power: 'Prosecution', desc: 'Criminal prosecution for failure to comply with notices. Can result in unlimited fines.', severity: 'Enforcement' },
  { power: 'Rogue Landlord Database', desc: 'Landlords convicted of housing offences or subject to civil penalties can be added to the national rogue landlord database, restricting their ability to manage rental properties.', severity: 'Record' },
];

export function HowToReportLandlordToCouncilPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-navy">
      <Helmet>
        <title>How to Report Your Landlord to the Council UK | RepairLetter</title>
        <meta name="description" content="How to report your landlord to the council in the UK. Step-by-step environmental health complaint guide. Auto-generate your complaint with RepairLetter after 14 days." />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <link rel="canonical" href="https://repairletter.co.uk/how-to-report-landlord-to-council" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://repairletter.co.uk/how-to-report-landlord-to-council" />
        <meta property="og:title" content="How to Report Your Landlord to the Council UK | RepairLetter" />
        <meta property="og:description" content="Step-by-step guide to reporting your landlord to environmental health. HHSRS inspections, improvement notices, and council powers explained." />
        <meta property="og:image" content="https://repairletter.co.uk/og-repair-letter.jpg" />
        <meta property="og:locale" content="en_GB" />
        <meta property="og:site_name" content="RepairLetter" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="How to Report Your Landlord to the Council UK" />
        <meta name="twitter:description" content="Report your landlord to environmental health — HHSRS inspections, improvement notices, council powers." />
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
        <p id="quick-answer" className="text-white/40 text-xs uppercase tracking-widest mb-3 font-semibold">Environmental Health — Step-by-Step Guide</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4 max-w-xl">
          How to Report Your Landlord
          <br />
          <span className="text-shield-mid">to the Council</span>
        </h1>
        <p className="text-white/55 text-sm sm:text-base leading-relaxed mb-8 max-w-lg">
          If your landlord ignores a formal repair letter, the next step is your local council's environmental health department. They have powers under the Housing Act 2004 to inspect your property, classify hazards, and legally compel your landlord to act — with penalties up to £30,000 for non-compliance.
        </p>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="w-full sm:w-auto bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-8 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
              Start with a repair letter — £4.99 <ArrowRight className="h-4 w-4" />
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
        <span>HHSRS Inspections</span><span className="text-white/15">·</span>
        <span>Improvement Notices</span><span className="text-white/15">·</span>
        <span>Up to £30,000 Penalties</span><span className="text-white/15">·</span>
        <span>Auto-escalation after 14 days</span>
      </div>

      <div className="bg-surface">
        <div className="max-w-3xl mx-auto px-6 py-16">

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">Step-by-Step: How to Report Your Landlord to the Council</h2>
            <div className="flex flex-col gap-4">
              {[
                { step: '1', title: 'Send a formal repair letter first', time: 'Before reporting', desc: 'Always give your landlord written notice and a reasonable time to act before involving the council. This demonstrates good faith and strengthens your complaint. RepairLetter generates your legal letter in 60 seconds with photo evidence.', important: false },
                { step: '2', title: 'Wait 14 days (or less for emergencies)', time: 'Days 1–14', desc: 'For non-emergency repairs, 14 days is the standard. For no heating, flooding, or electrical hazards, the wait is 24–48 hours. Document everything during this period.', important: false },
                { step: '3', title: 'Find your local council', time: 'Day 15', desc: 'Go to gov.uk/find-local-council and enter your postcode. You need the environmental health or housing department of the council for the area where your rental is located — not necessarily where you are registered.', important: true },
                { step: '4', title: 'Submit your complaint', time: 'Day 15', desc: 'Contact the environmental health department by phone, email, or their online portal. Provide your address, a description of the defect, and copies of your repair letters and photos. The more specific and documented your complaint, the more likely it is to result in a prompt inspection.', important: false },
                { step: '5', title: 'Council inspection', time: 'Within 4–8 weeks', desc: 'An environmental health officer will arrange to inspect your property. They will assess hazards under the HHSRS. You should point out all defects — not just the one in your original letter.', important: false },
                { step: '6', title: 'Enforcement action', time: 'After inspection', desc: 'If the officer identifies a Category 1 hazard, they have a statutory duty to take action. This typically means serving an Improvement Notice on your landlord with a deadline for repairs. Your landlord is legally obliged to comply.', important: false },
              ].map((item) => (
                <div key={item.step} className={`bg-white border rounded-xl p-5 ${item.important ? 'border-shield/30' : 'border-border'}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-shield text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{item.step}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                        <h3 className="text-sm font-bold text-navy">{item.title}</h3>
                        <span className="text-[10px] uppercase tracking-widest bg-navy text-white/60 px-2 py-0.5 rounded-full">{item.time}</span>
                      </div>
                      <p className="text-xs text-slate leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-16">
            <div className="bg-white border border-border rounded-2xl p-6 sm:p-8">
              <div className="flex items-start gap-3 mb-6">
                <Scale className="h-6 w-6 text-shield flex-shrink-0 mt-0.5" />
                <h2 className="text-2xl font-bold text-navy">What Powers Does the Council Have?</h2>
              </div>
              <div className="flex flex-col gap-3">
                {COUNCIL_POWERS.map((item, i) => (
                  <div key={i} className="border border-border rounded-xl p-4 flex gap-3">
                    <CheckCircle className="h-4 w-4 text-shield flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-sm font-bold text-navy">{item.power}</h3>
                        <span className="text-[10px] bg-shield/10 text-shield px-2 py-0.5 rounded-full font-medium">{item.severity}</span>
                      </div>
                      <p className="text-xs text-slate leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-4">RepairLetter's Auto-Escalation</h2>
            <div className="bg-white border border-border rounded-xl p-6 flex gap-4">
              <Clock className="h-6 w-6 text-shield flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-navy mb-2">Automatic complaint generation after 14 days</h3>
                <p className="text-sm text-slate leading-relaxed mb-3">
                  When you send a repair letter with RepairLetter, the system tracks the 14-day deadline. If your landlord has not responded, RepairLetter automatically generates a pre-drafted environmental health complaint document for your local council — referencing the Housing Act 2004, the specific HHSRS hazard category, and your evidence pack.
                </p>
                <p className="text-sm text-slate leading-relaxed">
                  You review the complaint before submitting. All you need to do is find your local council and send it. RepairLetter's evidence pack — timestamped photos, integrity-verified letters, delivery confirmation — is attached automatically.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">What to Include in Your Environmental Health Complaint</h2>
            <div className="flex flex-col gap-3">
              {[
                { item: 'Your full name and rental address', note: 'Environmental health officers need to be able to contact you and arrange access for inspection.' },
                { item: 'Your landlord\'s name and contact details', note: 'If you don\'t have a direct address, your letting agent\'s details will suffice.' },
                { item: 'Description of each defect', note: 'Be specific: location in the property, when it started, how it has progressed, how it affects your daily life.' },
                { item: 'Copies of all repair letters', note: 'Your formal repair letters are the most important documents — they show you gave your landlord notice and a reasonable time to act.' },
                { item: 'Photographs', note: 'Dated photographs of every defect. Include wide shots for context and close-ups for detail.' },
                { item: 'Health impact details', note: 'If you or family members have been affected, mention it and note any GP or hospital records.' },
                { item: 'Landlord\'s response (or lack of it)', note: 'Include any responses from your landlord, or note that no response was received despite the deadline passing.' },
              ].map((item, i) => (
                <div key={i} className="bg-white border border-border rounded-xl p-4 flex gap-3">
                  <CheckCircle className="h-4 w-4 text-shield flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-navy mb-0.5">{item.item}</p>
                    <p className="text-xs text-slate">{item.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-16">
            <div className="bg-white border border-border border-l-4 border-l-shield rounded-xl p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-navy mb-2">Your landlord cannot evict you for this</h3>
                  <p className="text-sm text-slate leading-relaxed">
                    From 1 May 2026, Section 21 no-fault evictions are abolished under the Renters' Rights Act 2025. Your landlord cannot serve a no-fault eviction notice in response to a complaint to environmental health. Retaliatory eviction is illegal. If your landlord attempts to evict you after you have made a complaint, this is itself a breach of the law and strengthens your position in any subsequent proceedings.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">Related Guides</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { to: '/letter-to-landlord-about-repairs', title: 'Write a Repair Letter First', desc: 'The essential first step before involving the council.' },
                { to: '/landlord-not-fixing-repairs', title: 'Landlord Not Fixing Repairs', desc: 'Full escalation guide from letter to tribunal.' },
                { to: '/environmental-health-complaint-landlord', title: 'Environmental Health Complaint', desc: 'Detailed guidance on the complaint process itself.' },
                { to: '/landlord-repair-obligations-uk', title: 'Landlord Repair Obligations', desc: 'Understand exactly what your landlord is legally required to fix.' },
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
              <span className="text-xs text-shield-mid font-medium">Auto-escalation to environmental health after 14 days</span>
            </div>
            <h2 className="text-2xl font-bold text-navy mb-3">Start With the Formal Letter</h2>
            <p className="text-sm text-slate mb-6 max-w-md mx-auto">
              The council complaint is most effective when backed by a formal repair letter. RepairLetter generates the letter, tracks the deadline, and auto-generates your environmental health complaint if your landlord doesn't respond.
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
