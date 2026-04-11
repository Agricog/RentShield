import { useNavigate, Link } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { Helmet } from 'react-helmet-async';
import {
  FileText,
  ArrowRight,
  Scale,
  ChevronDown,
  CheckCircle,
  AlertTriangle,
  Clock,
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
      '@id': 'https://repairletter.co.uk/letter-to-landlord-about-repairs#webpage',
      url: 'https://repairletter.co.uk/letter-to-landlord-about-repairs',
      name: 'Letter to Landlord About Repairs UK 2026 | RepairLetter',
      description: 'How to write a letter to your landlord about repairs in the UK. Legal template citing s.11 LTA 1985, HHSRS and the Homes Act 2018. Send in 60 seconds for £4.99.',
      isPartOf: { '@id': 'https://repairletter.co.uk/#organization' },
      speakable: { '@type': 'SpeakableSpecification', cssSelector: ['#quick-answer', 'h1'] },
      inLanguage: 'en-GB',
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://repairletter.co.uk/' },
          { '@type': 'ListItem', position: 2, name: 'Letter to Landlord About Repairs', item: 'https://repairletter.co.uk/letter-to-landlord-about-repairs' },
        ],
      },
    },
    {
      '@type': 'SoftwareApplication',
      name: 'RepairLetter',
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web, iOS, Android',
      offers: { '@type': 'Offer', price: '4.99', priceCurrency: 'GBP', description: 'Per legal repair letter sent to landlord with evidence' },
      description: 'Generate a legal letter to your landlord about repairs, citing UK housing law, with photo evidence attached.',
    },
    {
      '@type': 'HowTo',
      name: 'How to Write a Letter to Your Landlord About Repairs',
      description: 'Generate and send a legal repair letter to your landlord in 60 seconds using RepairLetter.',
      totalTime: 'PT1M',
      step: [
        { '@type': 'HowToStep', position: 1, name: 'Photo the defect', text: 'Take up to 5 photos of the repair problem. AI analyses the defect against HHSRS hazard categories.' },
        { '@type': 'HowToStep', position: 2, name: 'Describe the problem', text: 'Record a voice note describing the issue in any language.' },
        { '@type': 'HowToStep', position: 3, name: 'Review the letter', text: 'A legal letter citing s.11 LTA 1985, HHSRS and the Homes Act 2018 is generated automatically.' },
        { '@type': 'HowToStep', position: 4, name: 'Pay £4.99 and send', text: 'The letter with evidence is emailed to your landlord. A 14-day deadline is tracked automatically.' },
      ],
    },
    {
      '@type': 'Article',
      headline: 'Letter to Landlord About Repairs: The Complete UK Guide 2026',
      author: { '@type': 'Organization', name: 'RepairLetter' },
      publisher: { '@id': 'https://repairletter.co.uk/#organization' },
      datePublished: '2026-04-10',
      dateModified: '2026-04-10',
      description: 'Everything UK tenants need to know about writing a letter to their landlord about repairs, including what to include, which laws to cite, and what to do if your landlord ignores you.',
      mainEntityOfPage: 'https://repairletter.co.uk/letter-to-landlord-about-repairs',
    },
    {
      '@type': 'DefinedTermSet',
      name: 'UK Tenant Repair Rights Terminology',
      definedTerm: [
        { '@type': 'DefinedTerm', name: 'Section 11', description: 'The implied repairing obligation in s.11 Landlord and Tenant Act 1985 requiring landlords to keep structure, exterior and installations in repair.' },
        { '@type': 'DefinedTerm', name: 'HHSRS', description: 'Housing Health and Safety Rating System — a risk-based evaluation tool under the Housing Act 2004 covering 29 hazard categories.' },
        { '@type': 'DefinedTerm', name: 'Renters Rights Act 2025', description: 'UK legislation coming into force 1 May 2026 abolishing Section 21 no-fault evictions and extending the Decent Homes Standard to private renters.' },
      ],
    },
  ],
};

const FAQ_DATA = [
  { q: 'What should I include in a letter to my landlord about repairs?', a: 'Your letter should include: your name and rental address, the specific defect or repair needed, when you first noticed it, how it affects your use of the property, the statutory basis for the repair (s.11 Landlord and Tenant Act 1985), a reasonable deadline for completion (14–28 days depending on urgency), and a statement that you will escalate to the council\'s environmental health department if ignored. RepairLetter generates all of this automatically from your photos and voice description.' },
  { q: 'Does a repair letter to my landlord need to be sent by post?', a: 'No. A repair letter can be sent by email and is legally valid. Email has the advantage of creating an automatic timestamp and delivery record. RepairLetter sends a branded PDF letter to your landlord\'s email and retains a delivery confirmation. This is accepted as valid notice under s.11 of the Landlord and Tenant Act 1985.' },
  { q: 'What happens if my landlord ignores my letter about repairs?', a: 'If your landlord does not respond within the deadline stated in your letter (typically 14–28 days), you have several options: complain to your local council\'s environmental health department, who can inspect and serve an improvement notice; apply to the First-tier Tribunal for a rent repayment order; or take action in the county court. RepairLetter automatically generates an environmental health complaint document after 14 days if your landlord has not responded.' },
  { q: 'Can my landlord evict me for writing a repair letter?', a: 'From 1 May 2026, Section 21 no-fault evictions are abolished under the Renters\' Rights Act 2025. Your landlord cannot legally evict you simply for requesting repairs. Before that date, there are protections against retaliatory eviction under the Deregulation Act 2015 if you have served a formal repair letter. RepairLetter creates a timestamped evidence trail that demonstrates you acted in good faith.' },
  { q: 'What is the landlord\'s legal obligation to repair?', a: 'Under s.11 of the Landlord and Tenant Act 1985, your landlord must keep in repair the structure and exterior of your home (roof, walls, windows, drains), and keep in repair and proper working order the installations for water, gas, electricity, sanitation, space heating, and hot water. This obligation arises once you have given notice of the defect — which is why a written repair letter is essential.' },
  { q: 'How long does my landlord have to fix repairs after receiving my letter?', a: 'The law requires repairs to be completed within a "reasonable time" after notice is given. What is reasonable depends on the urgency: no heating or hot water — 24 to 48 hours; severe structural or safety issues — 1 to 7 days; general repairs affecting habitability — 14 to 28 days; minor repairs — up to 3 months. RepairLetter sets a 14-day deadline in your letter by default, which is appropriate for most non-emergency repairs.' },
  { q: 'Do I need a solicitor to write a repair letter to my landlord?', a: 'No. A repair letter citing the correct legislation is within the reach of any tenant, and sending one does not require legal representation. RepairLetter generates a professionally drafted letter citing s.11 LTA 1985, the HHSRS hazard category specific to your defect, and the Homes (Fitness for Human Habitation) Act 2018. If your landlord continues to ignore you and you need to pursue legal action, you may then wish to contact Citizens Advice, Shelter, or a solicitor.' },
  { q: 'Should I keep a copy of my repair letter?', a: 'Yes — always. Your copy of the repair letter, plus delivery confirmation, is evidence that you gave your landlord legal notice. RepairLetter stores a timestamped copy of every letter you send in your dashboard, with SHA-256 integrity hashes proving the document has not been modified. You can download your evidence pack at any time.' },
  { q: 'Can I write a repair letter in a language other than English?', a: 'The letter itself must be in English because it cites UK law. However, RepairLetter accepts voice descriptions in over 50 languages — Polish, Romanian, Bengali, Urdu, Arabic, and many more — and translates your description automatically. You also receive a copy of the letter translated into your own language so you can verify exactly what was sent.' },
  { q: 'What if my landlord says the repair is my fault?', a: 'The landlord\'s obligation under s.11 exists regardless of who caused normal wear and tear. If your landlord disputes liability, the letter creates a formal record that you notified them. Environmental health officers can inspect independently and issue improvement notices without your landlord\'s agreement. RepairLetter\'s HHSRS analysis provides an objective classification of the defect that supports your position.' },
  { q: 'Is RepairLetter a substitute for legal advice?', a: 'No. RepairLetter generates correspondence based on UK housing legislation but is not a law firm and does not provide legal advice. The letters cite accurate statutory references but have not been reviewed by a solicitor for your specific circumstances. For legal advice, contact Citizens Advice, Shelter, or a qualified housing solicitor.' },
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

export function LetterToLandlordAboutRepairsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-navy">
      <Helmet>
        <title>Letter to Landlord About Repairs UK 2026 | RepairLetter</title>
        <meta name="description" content="How to write a legal letter to your landlord about repairs in the UK. Cites s.11 LTA 1985, HHSRS and Homes Act 2018. Photo evidence attached. Send in 60 seconds — £4.99." />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <link rel="canonical" href="https://repairletter.co.uk/letter-to-landlord-about-repairs" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://repairletter.co.uk/letter-to-landlord-about-repairs" />
        <meta property="og:title" content="Letter to Landlord About Repairs UK 2026 | RepairLetter" />
        <meta property="og:description" content="How to write a legal letter to your landlord about repairs in the UK. Cites s.11 LTA 1985, HHSRS and Homes Act 2018. Photo evidence attached." />
        <meta property="og:image" content="https://repairletter.co.uk/og-repair-letter.jpg" />
        <meta property="og:locale" content="en_GB" />
        <meta property="og:site_name" content="RepairLetter" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Letter to Landlord About Repairs UK 2026 | RepairLetter" />
        <meta name="twitter:description" content="Legal letter to landlord about repairs — citing UK housing law, with photo evidence. £4.99." />
        <meta name="twitter:image" content="https://repairletter.co.uk/og-repair-letter.jpg" />
        <meta name="author" content="RepairLetter — Autaimate" />
        <script type="application/ld+json">{JSON.stringify(STRUCTURED_DATA)}</script>
        <script type="application/ld+json">{JSON.stringify(FAQ_SCHEMA)}</script>
      </Helmet>

      {/* Header */}
      <header className="px-6 pt-10 pb-12 max-w-3xl mx-auto">
        <div className="flex items-center gap-2.5 mb-10">
          <Link to="/" className="flex items-center gap-2.5">
            <FileText className="h-7 w-7 text-shield-mid" />
            <span className="text-xl font-bold text-white tracking-tight">
              Repair<span className="text-shield-mid">Letter</span>
            </span>
          </Link>
        </div>

        <nav className="mb-6">
          <Link to="/" className="text-white/40 hover:text-white/70 text-xs transition-colors">
            ← Back to RepairLetter
          </Link>
        </nav>

        <p id="quick-answer" className="text-white/40 text-xs uppercase tracking-widest mb-3 font-semibold">
          UK Tenant Repair Rights — Complete Guide 2026
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4 max-w-xl">
          Letter to Landlord About Repairs
          <br />
          <span className="text-shield-mid">What to Write, What Law to Cite</span>
        </h1>
        <p className="text-white/55 text-sm sm:text-base leading-relaxed mb-8 max-w-lg">
          A repair letter to your landlord creates the legal record that triggers your rights under s.11 of the
          Landlord and Tenant Act 1985. Without written notice, your landlord has no legal obligation to act.
          RepairLetter generates the correct letter in 60 seconds — with photo evidence and three UK statutes cited.
        </p>

        <SignedOut>
          <SignInButton mode="modal">
            <button className="w-full sm:w-auto bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-8 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
              Send a repair letter — £4.99
              <ArrowRight className="h-4 w-4" />
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-8 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            Go to dashboard
            <ArrowRight className="h-4 w-4" />
          </button>
        </SignedIn>
      </header>

      {/* Trust bar */}
      <div className="bg-navy-mid px-6 py-4 flex items-center justify-center gap-6 text-[10px] text-white/35 uppercase tracking-widest">
        <span>s.11 LTA 1985</span><span className="text-white/15">·</span>
        <span>HHSRS</span><span className="text-white/15">·</span>
        <span>Homes Act 2018</span><span className="text-white/15">·</span>
        <span>50+ Languages</span><span className="text-white/15">·</span>
        <span>£4.99 per letter</span>
      </div>

      {/* Main content */}
      <div className="bg-surface">
        <div className="max-w-3xl mx-auto px-6 py-16">

          {/* What a repair letter is */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">What Is a Repair Letter to a Landlord?</h2>
            <p className="text-sm text-slate leading-relaxed mb-4">
              A repair letter to your landlord is a formal written notice demanding that they fix a defect in your
              rental property. Its legal significance is precise: under s.11 of the Landlord and Tenant Act 1985,
              your landlord's obligation to repair only arises once they have been given notice of the defect. A
              verbal conversation, a WhatsApp message, or a text is not the same as a formal written notice — and
              may not be sufficient to establish that legal notice has been given.
            </p>
            <p className="text-sm text-slate leading-relaxed mb-4">
              A properly drafted repair letter does three things. First, it gives your landlord formal notice of the
              defect, which is the trigger for their legal obligation to act. Second, it creates a timestamped
              document that you can use as evidence if you later need to escalate to the council or take legal
              action. Third, it puts your landlord on notice of the specific legislation that applies, which signals
              that you know your rights and are prepared to enforce them.
            </p>
            <p className="text-sm text-slate leading-relaxed">
              Many tenants write informal messages and assume their landlord knows they have a repair obligation.
              But "you know that damp patch in the bedroom?" is legally very different from a formal notice citing
              s.11 LTA 1985 and requesting repair within a specified timeframe. The difference can determine
              whether you win or lose at a tribunal.
            </p>
          </section>

          {/* What to include */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">What to Include in a Repair Letter to Your Landlord</h2>
            <p className="text-sm text-slate leading-relaxed mb-6">
              A legally effective repair letter must contain certain elements. Missing any of them weakens your
              position. RepairLetter generates all of these automatically from your photos and voice description.
            </p>
            <div className="flex flex-col gap-4">
              {[
                { title: 'Your name and the rental address', desc: 'Identifies the property and tenant making the request. Ensures there is no ambiguity about which tenancy agreement applies.' },
                { title: 'Date of the letter', desc: 'Creates a timestamped record of when notice was given. This is the date from which your landlord\'s "reasonable time" to repair begins to run.' },
                { title: 'Specific description of the defect', desc: 'Vague descriptions ("the heating isn\'t working properly") are less effective than precise ones ("the boiler has failed completely, there has been no heating or hot water since 7 April 2026"). Be specific about what has failed, when it started, and how it affects your use of the property.' },
                { title: 'Statutory basis', desc: 'Cite s.11 of the Landlord and Tenant Act 1985, the HHSRS hazard category under the Housing Act 2004, and s.9A of the LTA 1985 as inserted by the Homes (Fitness for Human Habitation) Act 2018. Citing all three statutes signals legal knowledge and increases the likelihood of a prompt response.' },
                { title: 'A deadline for repair', desc: 'State a specific date by which you expect the repair to be completed or at least an appointment to be scheduled. 14 days is standard for non-emergency repairs; 24–48 hours for loss of heating or hot water in cold weather.' },
                { title: 'Escalation warning', desc: 'State clearly that if the repair is not carried out within the deadline, you will report the matter to the local council\'s environmental health department and may take further legal action including an application for a rent repayment order.' },
                { title: 'Photo evidence', desc: 'Attach photographs of the defect to your letter. RepairLetter embeds your photos in the PDF, each with a timestamp and HHSRS hazard classification. Photos make your complaint specific and verifiable.' },
              ].map((item, i) => (
                <div key={i} className="bg-white border border-border rounded-xl p-5 flex gap-3">
                  <CheckCircle className="h-5 w-5 text-shield flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-navy mb-1">{item.title}</h3>
                    <p className="text-xs text-slate leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Legal basis */}
          <section className="mb-16">
            <div className="bg-white border border-border rounded-2xl p-6 sm:p-8">
              <div className="flex items-start gap-3 mb-4">
                <Scale className="h-6 w-6 text-shield flex-shrink-0 mt-0.5" />
                <h2 className="text-2xl font-bold text-navy">The Law Behind Your Repair Letter</h2>
              </div>
              <p className="text-sm text-slate leading-relaxed mb-4">
                Every repair letter generated by RepairLetter cites three UK statutes. Understanding why each one
                matters helps you appreciate the strength of your position.
              </p>
              <div className="flex flex-col gap-4">
                <div className="border border-border border-l-4 border-l-shield rounded-xl p-4">
                  <h3 className="text-sm font-bold text-navy mb-2">Section 11 — Landlord and Tenant Act 1985</h3>
                  <p className="text-xs text-slate leading-relaxed">
                    The cornerstone of tenant repair rights. Your landlord must keep in repair the structure and
                    exterior of your home, and the installations for water, gas, electricity, sanitation, space
                    heating, and hot water. This obligation cannot be contracted out of — it applies regardless of
                    what your tenancy agreement says. The obligation arises on notice, which is why your written
                    letter is legally essential.
                  </p>
                </div>
                <div className="border border-border border-l-4 border-l-shield rounded-xl p-4">
                  <h3 className="text-sm font-bold text-navy mb-2">HHSRS — Housing Act 2004</h3>
                  <p className="text-xs text-slate leading-relaxed">
                    The Housing Health and Safety Rating System defines 29 hazard categories used by local
                    authorities to assess residential properties. When RepairLetter classifies your defect — whether
                    it is excess cold, damp and mould growth, electrical hazards, or structural collapse — it
                    connects your problem to a specific category that your council has a statutory duty to act on
                    if it constitutes a Category 1 hazard.
                  </p>
                </div>
                <div className="border border-border border-l-4 border-l-shield rounded-xl p-4">
                  <h3 className="text-sm font-bold text-navy mb-2">Section 9A — Homes (Fitness for Human Habitation) Act 2018</h3>
                  <p className="text-xs text-slate leading-relaxed">
                    Since 2019, all residential tenancies must be fit for human habitation at the outset and
                    throughout. If damp, mould, structural problems, or inadequate facilities make your home unfit,
                    you have a direct legal route to the courts without needing to involve the local authority first.
                    This Act sits alongside s.11 and gives you an additional cause of action.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* After sending */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">After You Send the Letter: What Happens Next</h2>
            <div className="flex flex-col gap-4">
              {[
                { icon: <Clock className="h-5 w-5 text-shield" />, title: 'Day 0 — Letter sent', desc: 'Your landlord receives the PDF letter by email with your photos embedded. A 14-day countdown begins. You receive a confirmation and a copy for your records.' },
                { icon: <CheckCircle className="h-5 w-5 text-shield" />, title: 'Days 1–14 — Waiting period', desc: 'Your landlord is legally obliged to respond and arrange repair within the stated deadline. Track delivery and any response in your RepairLetter dashboard.' },
                { icon: <AlertTriangle className="h-5 w-5 text-amber-500" />, title: 'Day 15 — No response', desc: 'If your landlord has not responded, RepairLetter automatically generates an environmental health complaint document for your local council. You review it before submitting.' },
                { icon: <Scale className="h-5 w-5 text-shield" />, title: 'Escalation options', desc: 'If the council doesn\'t act or you want to pursue compensation, you can apply to the First-tier Tribunal for a rent repayment order, or issue proceedings in the county court. Your RepairLetter evidence pack — timestamped, integrity-verified — supports all of these routes.' },
              ].map((item, i) => (
                <div key={i} className="bg-white border border-border rounded-xl p-5 flex gap-3">
                  <div className="flex-shrink-0 mt-0.5">{item.icon}</div>
                  <div>
                    <h3 className="text-sm font-bold text-navy mb-1">{item.title}</h3>
                    <p className="text-xs text-slate leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Related pages */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">Related Tenant Rights Guides</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { to: '/landlord-not-fixing-repairs', title: 'Landlord Not Fixing Repairs', desc: 'What to do when your landlord refuses to act after receiving your letter.' },
                { to: '/damp-and-mould-landlord-letter', title: 'Damp and Mould Landlord Letter', desc: 'Specific guidance for the most common housing defect in UK private rentals.' },
                { to: '/environmental-health-complaint-landlord', title: 'Environmental Health Complaint', desc: 'How to escalate to your local council if your landlord ignores you.' },
                { to: '/section-11-landlord-tenant-act', title: 'Section 11 LTA 1985 Explained', desc: 'Full breakdown of the primary legislation behind your landlord\'s repair obligation.' },
              ].map((link, i) => (
                <Link key={i} to={link.to} className="bg-white border border-border rounded-xl p-4 hover:border-shield/40 transition-colors">
                  <h3 className="text-sm font-bold text-navy mb-1">{link.title}</h3>
                  <p className="text-xs text-slate leading-relaxed">{link.desc}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* FAQs */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">Frequently Asked Questions</h2>
            <div className="flex flex-col gap-3">
              {FAQ_DATA.map((faq, i) => (
                <FaqItem key={i} question={faq.q} answer={faq.a} />
              ))}
            </div>
          </section>

          {/* Bottom CTA */}
          <section className="text-center py-8">
            <h2 className="text-2xl font-bold text-navy mb-3">Ready to Send Your Repair Letter?</h2>
            <p className="text-sm text-slate mb-6 max-w-md mx-auto">
              Photo the problem. Describe it in any language. Legal letter sent to your landlord in 60 seconds with three UK statutes cited and photo evidence attached.
            </p>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-8 rounded-xl text-sm transition-colors inline-flex items-center gap-2">
                  Send a repair letter — £4.99
                  <ArrowRight className="h-4 w-4" />
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-8 rounded-xl text-sm transition-colors inline-flex items-center gap-2"
              >
                Go to dashboard
                <ArrowRight className="h-4 w-4" />
              </button>
            </SignedIn>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-navy border-t border-white/5 px-6 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-shield-mid" />
            <span className="text-base font-bold text-white tracking-tight">
              Repair<span className="text-shield-mid">Letter</span>
            </span>
          </div>
          <p className="text-xs text-white/30 leading-relaxed mb-4 max-w-md">
            RepairLetter generates correspondence based on UK housing legislation. It does not constitute legal advice.
            For specific legal guidance, contact Citizens Advice, Shelter, or a qualified solicitor.
          </p>
          <div className="flex flex-wrap gap-4 text-xs">
            <Link to="/" className="text-white/40 hover:text-white/70 transition-colors">Home</Link>
            <Link to="/privacy" className="text-white/40 hover:text-white/70 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-white/40 hover:text-white/70 transition-colors">Terms of Service</Link>
          </div>
          <p className="text-[10px] text-white/15 mt-6">
            © {new Date().getFullYear()} RepairLetter · Autaimate · ICO Registered · UK GDPR Compliant
          </p>
        </div>
      </footer>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        aria-expanded={open}
      >
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
