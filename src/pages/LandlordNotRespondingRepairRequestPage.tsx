import { useNavigate, Link } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { Helmet } from 'react-helmet-async';
import { FileText, ArrowRight, CheckCircle, ChevronDown, Clock, Mail } from 'lucide-react';
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
      '@id': 'https://repairletter.co.uk/landlord-not-responding-repair-request#webpage',
      url: 'https://repairletter.co.uk/landlord-not-responding-repair-request',
      name: 'Landlord Not Responding to Repair Request UK | RepairLetter',
      description: 'Landlord not responding to your repair request? A formal legal letter starts the clock. If ignored, auto-escalation to environmental health after 14 days. £4.99.',
      isPartOf: { '@id': 'https://repairletter.co.uk/#organization' },
      speakable: { '@type': 'SpeakableSpecification', cssSelector: ['#quick-answer', 'h1'] },
      inLanguage: 'en-GB',
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://repairletter.co.uk/' },
          { '@type': 'ListItem', position: 2, name: 'Landlord Not Responding to Repair Request', item: 'https://repairletter.co.uk/landlord-not-responding-repair-request' },
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
      name: 'What to Do When Your Landlord Is Not Responding to Your Repair Request',
      description: 'Step-by-step escalation guide for tenants whose landlords are not responding.',
      totalTime: 'PT14D',
      step: [
        { '@type': 'HowToStep', position: 1, name: 'Upgrade from informal to formal notice', text: 'A text or WhatsApp is not sufficient. Send a formal repair letter by email with PDF attachment.' },
        { '@type': 'HowToStep', position: 2, name: 'Keep evidence of delivery', text: 'Email with read receipt, or recorded delivery post. Document the date your landlord received your notice.' },
        { '@type': 'HowToStep', position: 3, name: 'Follow up after the deadline', text: 'If no response after 14 days, send a second letter confirming your intention to escalate.' },
        { '@type': 'HowToStep', position: 4, name: 'Report to environmental health', text: 'After 14 days with no response, contact your local council. Your evidence pack is ready.' },
      ],
    },
    {
      '@type': 'Article',
      headline: 'Landlord Not Responding to Repair Request: What to Do in the UK',
      author: { '@type': 'Organization', name: 'RepairLetter' },
      publisher: { '@id': 'https://repairletter.co.uk/#organization' },
      datePublished: '2026-04-10',
      dateModified: '2026-04-10',
      description: 'Complete guide to escalating when your UK landlord is not responding to a repair request — from informal to formal notice, evidence building, and environmental health.',
      mainEntityOfPage: 'https://repairletter.co.uk/landlord-not-responding-repair-request',
    },
    {
      '@type': 'DefinedTermSet',
      name: 'Repair Request Response Terminology',
      definedTerm: [
        { '@type': 'DefinedTerm', name: 'Formal Notice', description: 'A written notice giving a landlord legal notification of a defect and a deadline for repair. Triggers the landlord\'s obligation to act under s.11 LTA 1985.' },
        { '@type': 'DefinedTerm', name: 'Reasonable Time', description: 'The period within which a landlord must respond and repair after receiving formal notice. Ranges from 24 hours for emergencies to 28 days for standard repairs.' },
      ],
    },
  ],
};

const FAQ_DATA = [
  { q: 'What should I do if my landlord is not responding to my repair request?', a: 'First, assess how you made the request. A text, WhatsApp, or verbal mention may not constitute sufficient legal notice. If you have not already done so, send a formal written repair letter by email — a PDF letter citing s.11 LTA 1985, the specific defect, and a clear deadline. Your landlord\'s legal obligation only arises on notice, and a formal letter creates an undeniable record. If they still do not respond after 14 days, report to environmental health.' },
  { q: 'Does a text message or WhatsApp count as a repair request?', a: 'A text or WhatsApp may constitute notice in some circumstances, but it is much weaker evidence than a formal written letter. Your landlord can claim they missed the message, that it was unclear, or that they did not understand it as a formal request. A formal PDF letter, emailed with delivery confirmation, is legally unambiguous. RepairLetter generates this automatically.' },
  { q: 'How long should I wait for my landlord to respond?', a: 'For emergencies (no heating, flooding, gas leak): 24 to 48 hours. For urgent repairs affecting habitability: 3 to 7 days. For standard non-emergency repairs: 14 to 28 days. If you sent an informal message, the waiting period starts from when you send a formal written letter. RepairLetter tracks the 14-day deadline and alerts you when it expires.' },
  { q: 'What is the difference between a repair request and formal notice?', a: 'A repair request is any communication to your landlord about a defect. Formal notice is a written communication that specifically invokes your legal rights, cites the applicable legislation, and states a deadline. Formal notice triggers your landlord\'s legal obligation under s.11 LTA 1985 and starts the clock on their reasonable time to repair. Only formal notice creates the legal record you need for escalation.' },
  { q: 'Can I contact the council if my landlord has not responded?', a: 'Yes — but you should send a formal repair letter first. The council\'s environmental health department will ask whether you gave your landlord notice and a reasonable time to respond. Having a formal letter with a delivery record strengthens your complaint significantly. RepairLetter auto-generates your environmental health complaint document after 14 days of non-response.' },
  { q: 'What if I cannot contact my landlord at all?', a: 'Your tenancy agreement must contain your landlord\'s name and address or the address of an agent. You can also check the Land Registry for the property owner. If your landlord is genuinely uncontactable, contact your local council\'s environmental health department directly — they have powers to investigate and act independently of landlord cooperation.' },
  { q: 'Should I keep trying to contact my landlord while waiting?', a: 'Yes. Keep records of all attempts: dates of phone calls, voicemails left, emails sent, texts sent, and letters posted. This demonstrates to environmental health and any tribunal that you made every reasonable effort before escalating. But the most important record is the formal written letter — that is what starts the legal clock.' },
  { q: 'What if my landlord acknowledges the repair but keeps delaying?', a: 'Acknowledgement without action is still a breach after a reasonable time has passed. If your landlord has said they will repair but has not done so after the reasonable period stated in your formal letter, report to environmental health. Your evidence pack — the letter, the acknowledgement, the delay — demonstrates a clear pattern of non-compliance.' },
  { q: 'Can I use social media or email evidence in a dispute?', a: 'Yes. Screenshots of WhatsApp conversations, email chains, and text messages are all admissible as evidence in tribunal and court proceedings. The more comprehensive your records, the stronger your position. However, none of this replaces a formal written letter — it supplements it.' },
  { q: 'What if my letting agent is not responding instead of my landlord?', a: 'Your letting agent acts as your landlord\'s representative. Notice to the agent constitutes notice to the landlord. Send your formal repair letter to the agent at their registered business address, with a copy to your landlord if you have their address. If the agent is not responding, escalate directly to the landlord and to environmental health.' },
  { q: 'What evidence do I need if I escalate to the tribunal or court?', a: 'You will need: a copy of your formal repair letter; proof of delivery; records of all other communications; photographs of the defect (dated if possible); evidence of the defect\'s impact on your use of the property; records of any health effects. RepairLetter\'s evidence pack provides all of the letter-related evidence automatically, with SHA-256 integrity verification.' },
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

export function LandlordNotRespondingRepairRequestPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-navy">
      <Helmet>
        <title>Landlord Not Responding to Repair Request UK | RepairLetter</title>
        <meta name="description" content="Landlord not responding to your repair request? Upgrade to a formal legal letter. Auto-escalation to environmental health after 14 days. Legal notice in 60 seconds — £4.99." />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <link rel="canonical" href="https://repairletter.co.uk/landlord-not-responding-repair-request" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://repairletter.co.uk/landlord-not-responding-repair-request" />
        <meta property="og:title" content="Landlord Not Responding to Repair Request UK | RepairLetter" />
        <meta property="og:description" content="Landlord ignoring your repair request? Upgrade to formal legal notice. Auto-escalation after 14 days. £4.99." />
        <meta property="og:image" content="https://repairletter.co.uk/og-repair-letter.jpg" />
        <meta property="og:locale" content="en_GB" />
        <meta property="og:site_name" content="RepairLetter" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Landlord Not Responding to Repair Request UK" />
        <meta name="twitter:description" content="Landlord ignoring repairs? Formal notice + auto-escalation after 14 days." />
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
        <p id="quick-answer" className="text-white/40 text-xs uppercase tracking-widest mb-3 font-semibold">From Informal Request to Legal Notice</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4 max-w-xl">
          Landlord Not Responding?
          <br />
          <span className="text-shield-mid">Upgrade to Formal Notice.</span>
        </h1>
        <p className="text-white/55 text-sm sm:text-base leading-relaxed mb-8 max-w-lg">
          A text, a call, a WhatsApp — these are not sufficient legal notice. Until your landlord receives a formal written letter citing s.11 LTA 1985 and setting a deadline, they have no legal obligation to respond. Once they do, the clock starts — and if they ignore it, the law gives you powerful remedies.
        </p>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="w-full sm:w-auto bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-8 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
              Send a formal repair letter — £4.99 <ArrowRight className="h-4 w-4" />
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
        <span>Formal notice required</span><span className="text-white/15">·</span>
        <span>14-day deadline</span><span className="text-white/15">·</span>
        <span>Auto-escalation built in</span><span className="text-white/15">·</span>
        <span>Delivery tracking</span>
      </div>

      <div className="bg-surface">
        <div className="max-w-3xl mx-auto px-6 py-16">

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-4">Why Informal Requests Don't Work</h2>
            <p className="text-sm text-slate leading-relaxed mb-4">
              Most tenants start with an informal message — a text, a WhatsApp, an email without a clear deadline. The landlord may reply with vague promises or simply say nothing. Weeks pass. The problem gets worse. And the tenant has no legal leverage because they have not yet given formal notice.
            </p>
            <p className="text-sm text-slate leading-relaxed mb-4">
              The key legal principle is this: your landlord's obligation to repair under s.11 LTA 1985 arises on notice. An informal message may constitute notice in some circumstances, but a formal written letter citing the specific legislation, describing the defect precisely, and setting a clear deadline creates a legal record that cannot be disputed.
            </p>
            <p className="text-sm text-slate leading-relaxed">
              The moment your landlord receives your formal letter, the clock starts. If they do not respond within the deadline, you have documented evidence of a breach. Every escalation route — environmental health, tribunal, court — is strengthened by that record.
            </p>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">The Escalation Ladder — Starting From Silence</h2>
            <div className="flex flex-col gap-4">
              {[
                { step: '1', label: 'Where you are now', title: 'Informal requests ignored', desc: 'Texts, calls, WhatsApps with no response. You have not yet given legal notice. Your landlord technically has no obligation yet.', action: 'Move to Step 2 immediately.' },
                { step: '2', label: 'Step 2', title: 'Send a formal repair letter', desc: 'This is the trigger. A written letter citing s.11 LTA 1985, the specific defect, and a 14-day deadline. Your landlord now has a legal obligation and a documented deadline.', action: 'RepairLetter generates this in 60 seconds for £4.99.' },
                { step: '3', label: 'Day 14', title: 'No response — send a follow-up', desc: 'If no response after the deadline, send a second letter confirming the deadline has passed, that the defect remains unresolved, and that you will now escalate to environmental health and reserve all legal rights.', action: 'RepairLetter auto-generates this escalation notice.' },
                { step: '4', label: 'Day 15+', title: 'Report to environmental health', desc: 'Contact your local council\'s environmental health department. Provide your formal letters, photos, and evidence. The council can inspect and serve an Improvement Notice on your landlord.', action: 'RepairLetter auto-generates your environmental health complaint document.' },
                { step: '5', label: 'Ongoing', title: 'Tribunal or court if needed', desc: 'Apply to the First-tier Tribunal for a rent repayment order, or county court for damages and a repair order. Your evidence pack from RepairLetter supports all of these routes.', action: 'Citizens Advice or a housing solicitor can advise on the appropriate route.' },
              ].map((item) => (
                <div key={item.step} className="bg-white border border-border rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-shield text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{item.step}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                        <h3 className="text-sm font-bold text-navy">{item.title}</h3>
                        <span className="text-[10px] uppercase tracking-widest bg-navy text-white/60 px-2 py-0.5 rounded-full">{item.label}</span>
                      </div>
                      <p className="text-xs text-slate leading-relaxed mb-1">{item.desc}</p>
                      <p className="text-xs text-shield font-medium">{item.action}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-16">
            <div className="bg-white border border-border rounded-2xl p-6 sm:p-8">
              <div className="flex items-start gap-3 mb-4">
                <Mail className="h-6 w-6 text-shield flex-shrink-0 mt-0.5" />
                <h2 className="text-2xl font-bold text-navy">What Your Formal Letter Must Include</h2>
              </div>
              <div className="flex flex-col gap-3">
                {[
                  { item: 'Your name and the rental address', note: 'Establishes which property and which tenancy.' },
                  { item: 'The date of the letter', note: 'Establishes when notice was given and when the deadline runs from.' },
                  { item: 'A precise description of the defect', note: 'Location, nature, when first noticed, how it affects use of the property.' },
                  { item: 'Citation of s.11 LTA 1985 at minimum', note: 'Names the specific legal obligation and signals you know your rights.' },
                  { item: 'A clear deadline', note: '14 days for standard repairs; 24–48 hours for emergencies.' },
                  { item: 'An escalation warning', note: 'State that you will report to environmental health and pursue legal remedies if the deadline is not met.' },
                  { item: 'Photographic evidence', note: 'Attached as evidence of the defect at the time of notice.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <CheckCircle className="h-4 w-4 text-shield flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-navy">{item.item}</p>
                      <p className="text-xs text-slate">{item.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">Related Guides</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { to: '/letter-to-landlord-about-repairs', title: 'Write a Repair Letter', desc: 'Everything to include in a formal repair letter and which laws to cite.' },
                { to: '/landlord-not-fixing-repairs', title: 'Landlord Not Fixing Repairs', desc: 'Full escalation guide once formal notice has been given.' },
                { to: '/how-to-report-landlord-to-council', title: 'Report to the Council', desc: 'Step-by-step guide to the environmental health complaint.' },
                { to: '/how-long-landlord-fix-heating', title: 'How Long to Fix Heating', desc: 'Exact timescales by repair type and urgency.' },
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
              <Clock className="h-4 w-4 text-shield-mid" />
              <span className="text-xs text-shield-mid font-medium">Auto-escalation after 14 days of silence</span>
            </div>
            <h2 className="text-2xl font-bold text-navy mb-3">Stop Waiting. Send the Formal Letter.</h2>
            <p className="text-sm text-slate mb-6 max-w-md mx-auto">
              Every day without formal notice is a day your landlord has no legal obligation to act. RepairLetter generates the correct legal letter in 60 seconds and automatically escalates to environmental health after 14 days.
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
