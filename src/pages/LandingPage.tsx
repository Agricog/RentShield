import { useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { Shield, Camera, Mic, Mail, Clock, ArrowRight } from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-navy text-white flex flex-col">
      {/* Hero */}
      <div className="px-6 pt-12 pb-10 flex-1 flex flex-col">
        <div className="flex items-center gap-2.5 mb-8">
          <Shield className="h-7 w-7 text-shield-mid" />
          <span className="text-xl font-bold tracking-tight">
            Rent<span className="text-shield-mid">Shield</span>
          </span>
        </div>

        <h1 className="text-3xl font-bold leading-tight mb-4 max-w-sm">
          Your landlord won't fix it?
          <br />
          <span className="text-shield-mid">We'll make it legal.</span>
        </h1>

        <p className="text-white/55 text-sm leading-relaxed mb-8 max-w-sm">
          Photo the problem. Speak about it. A legal letter citing UK housing law
          is sent to your landlord in 60 seconds. Any language. Any tenant.
        </p>

        {/* Steps */}
        <div className="flex flex-col gap-4 mb-10">
          <Step
            icon={<Camera className="h-4 w-4" />}
            label="Photo the defect"
            detail="AI identifies the issue and severity"
          />
          <Step
            icon={<Mic className="h-4 w-4" />}
            label="Describe it in any language"
            detail="Voice-to-text in 40+ languages"
          />
          <Step
            icon={<Mail className="h-4 w-4" />}
            label="Legal letter sent instantly"
            detail="Citing s.11 LTA 1985, HHSRS, Homes Act 2018"
          />
          <Step
            icon={<Clock className="h-4 w-4" />}
            label="14-day deadline tracked"
            detail="Auto-escalation to environmental health if ignored"
          />
        </div>

        {/* CTA */}
        <div className="mt-auto">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="w-full bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-6 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                Report a problem — £4.99 per letter
                <ArrowRight className="h-4 w-4" />
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-6 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              Go to dashboard
              <ArrowRight className="h-4 w-4" />
            </button>
          </SignedIn>

          <p className="text-white/30 text-xs text-center mt-4">
            Your evidence is yours. Download anytime. Free forever.
          </p>
        </div>
      </div>

      {/* Trust bar */}
      <div className="bg-navy-mid px-6 py-4 flex items-center justify-center gap-6 text-[10px] text-white/35 uppercase tracking-widest">
        <span>UK GDPR</span>
        <span className="text-white/15">·</span>
        <span>Encrypted</span>
        <span className="text-white/15">·</span>
        <span>No tracking</span>
        <span className="text-white/15">·</span>
        <span>ICO registered</span>
      </div>
    </div>
  );
}

function Step({
  icon,
  label,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-shield/15 border border-shield/25 flex items-center justify-center text-shield-mid">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-white/90">{label}</p>
        <p className="text-xs text-white/40">{detail}</p>
      </div>
    </div>
  );
}
