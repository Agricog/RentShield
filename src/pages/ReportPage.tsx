import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Mic,
  X,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import type { DefectType, AIAnalysis, TranscriptionResult, UploadUrlResponse } from '../types';
import { DEFECT_TYPE_LABELS } from '../types';
import { stripExif, validateImageFile } from '../lib/files';
import { api } from '../lib/api';

type Step = 'type' | 'photos' | 'voice' | 'review';

interface ReportState {
  defectType: DefectType | null;
  photos: PhotoEntry[];
  voiceTranscription: TranscriptionResult | null;
  landlordEmail: string;
}

interface PhotoEntry {
  id: string;
  file: File;
  preview: string;
  analysis: AIAnalysis | null;
  uploading: boolean;
  r2Key: string | null;
}

const MAX_PHOTOS = 5;

export function ReportPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('type');
  const [state, setState] = useState<ReportState>({
    defectType: null,
    photos: [],
    voiceTranscription: null,
    landlordEmail: '',
  });

  const updatePhotos = useCallback(
    (updater: (prev: PhotoEntry[]) => PhotoEntry[]) => {
      setState((s) => ({ ...s, photos: updater(s.photos) }));
    },
    []
  );

  const canAdvance = (): boolean => {
    switch (step) {
      case 'type':
        return state.defectType !== null;
      case 'photos':
        return state.photos.length > 0 && state.photos.every((p) => !p.uploading);
      case 'voice':
        return true;
      case 'review':
        return state.landlordEmail.includes('@') && state.landlordEmail.includes('.');
      default:
        return false;
    }
  };

  const steps: Step[] = ['type', 'photos', 'voice', 'review'];
  const currentIndex = steps.indexOf(step);

  const next = () => {
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]!);
    }
  };

  const back = () => {
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]!);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="pb-4">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        <button onClick={back} className="p-1 -ml-1 text-slate hover:text-navy transition-colors" aria-label="Go back">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 flex gap-1.5">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= currentIndex ? 'bg-shield' : 'bg-border'
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-slate font-mono ml-2">
          {currentIndex + 1}/{steps.length}
        </span>
      </div>

      {/* Step content */}
      {step === 'type' && (
        <DefectTypeStep
          selected={state.defectType}
          onSelect={(t) => setState((s) => ({ ...s, defectType: t }))}
        />
      )}
      {step === 'photos' && (
        <PhotoStep
          photos={state.photos}
          updatePhotos={updatePhotos}
        />
      )}
      {step === 'voice' && (
        <VoiceStep
          transcription={state.voiceTranscription}
          onTranscription={(t) => setState((s) => ({ ...s, voiceTranscription: t }))}
        />
      )}
      {step === 'review' && (
        <ReviewStep
          state={state}
          onEmailChange={(email) => setState((s) => ({ ...s, landlordEmail: email }))}
        />
      )}

      {/* Next button */}
      <div className="mt-8">
        {step === 'review' ? (
          <button
            disabled={!canAdvance()}
            className="w-full bg-shield hover:bg-shield-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl text-sm transition-colors"
          >
            Pay £4.99 & Send Letter
          </button>
        ) : (
          <button
            onClick={next}
            disabled={!canAdvance()}
            className="w-full bg-navy hover:bg-navy-light disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Step 1: Defect Type ───────────────────────────────────

function DefectTypeStep({
  selected,
  onSelect,
}: {
  selected: DefectType | null;
  onSelect: (type: DefectType) => void;
}) {
  const types: DefectType[] = ['damp', 'mould', 'leak', 'heating', 'electrics', 'other'];

  return (
    <div>
      <h2 className="text-lg font-bold text-navy mb-1">What's the problem?</h2>
      <p className="text-sm text-slate mb-5">Select the type of defect in your property.</p>
      <div className="grid grid-cols-2 gap-3">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => onSelect(t)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              selected === t
                ? 'border-shield bg-shield-light'
                : 'border-border bg-white hover:border-slate-light'
            }`}
          >
            <span className="text-sm font-semibold text-navy">{DEFECT_TYPE_LABELS[t]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Step 2: Photos ────────────────────────────────────────

function PhotoStep({
  photos,
  updatePhotos,
}: {
  photos: PhotoEntry[];
  updatePhotos: (updater: (prev: PhotoEntry[]) => PhotoEntry[]) => void;
}) {
  // Ref tracks current photo count to prevent race conditions
  // during rapid multi-file selection
  const photoCountRef = useRef(photos.length);
  photoCountRef.current = photos.length;

  const handleCapture = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      for (const rawFile of Array.from(files)) {
        // Check limit using ref to avoid stale closure
        if (photoCountRef.current >= MAX_PHOTOS) break;

        const validation = validateImageFile(rawFile);
        if (!validation.valid) {
          alert(validation.error);
          continue;
        }

        // Strip EXIF — remove GPS before upload
        const cleanFile = await stripExif(rawFile);
        const preview = URL.createObjectURL(cleanFile);
        const entryId = crypto.randomUUID();

        const entry: PhotoEntry = {
          id: entryId,
          file: cleanFile,
          preview,
          analysis: null,
          uploading: true,
          r2Key: null,
        };

        // Functional update — never reads stale state
        updatePhotos((prev) => {
          if (prev.length >= MAX_PHOTOS) return prev;
          return [...prev, entry];
        });
        photoCountRef.current++;

        // Upload and analyse in background
        processPhoto(entryId, cleanFile, updatePhotos);
      }

      // Reset input so same file can be selected again
      e.target.value = '';
    },
    [updatePhotos]
  );

  const removePhoto = useCallback(
    (id: string) => {
      updatePhotos((prev) => {
        const removed = prev.find((p) => p.id === id);
        if (removed) URL.revokeObjectURL(removed.preview);
        return prev.filter((p) => p.id !== id);
      });
      photoCountRef.current = Math.max(0, photoCountRef.current - 1);
    },
    [updatePhotos]
  );

  return (
    <div>
      <h2 className="text-lg font-bold text-navy mb-1">Photo the problem</h2>
      <p className="text-sm text-slate mb-5">
        Take up to {MAX_PHOTOS} photos. GPS data is automatically removed for your privacy.
      </p>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {photos.map((p, i) => (
          <div key={p.id} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100">
            <img src={p.preview} alt={`Evidence photo ${i + 1}`} className="w-full h-full object-cover" />
            {p.uploading && (
              <div className="absolute inset-0 bg-navy/60 flex items-center justify-center">
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              </div>
            )}
            {p.analysis && (
              <div className="absolute bottom-0 inset-x-0 bg-navy/80 px-2 py-1">
                <p className="text-[10px] text-white font-medium truncate">
                  {p.analysis.hhsrsCategory}
                </p>
                <p className="text-[10px] text-shield-mid">
                  Severity {p.analysis.severity}/5
                </p>
              </div>
            )}
            <button
              onClick={() => removePhoto(p.id)}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-navy/70 text-white flex items-center justify-center hover:bg-navy"
              aria-label={`Remove photo ${i + 1}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {photos.length < MAX_PHOTOS && (
          <label className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-shield cursor-pointer flex flex-col items-center justify-center gap-1 transition-colors">
            <Camera className="h-6 w-6 text-slate" />
            <span className="text-[10px] text-slate font-medium">Add photo</span>
            <input
              type="file"
              accept="image/jpeg,image/png"
              capture="environment"
              multiple
              onChange={handleCapture}
              className="sr-only"
            />
          </label>
        )}
      </div>

      <p className="text-xs text-slate-light">
        {photos.length}/{MAX_PHOTOS} photos · JPEG/PNG only · Max 10MB each
      </p>
    </div>
  );
}

/**
 * Handles upload to R2 and Claude Vision analysis for a single photo.
 * Uses functional state updates so it never references stale data.
 */
async function processPhoto(
  entryId: string,
  file: File,
  updatePhotos: (updater: (prev: PhotoEntry[]) => PhotoEntry[]) => void
) {
  try {
    // Get signed upload URL
    const urlRes = await api.post<UploadUrlResponse>('/api/upload-url', {
      contentType: file.type,
    });

    if (!urlRes.success || !urlRes.data) {
      updatePhotos((prev) =>
        prev.map((p) => (p.id === entryId ? { ...p, uploading: false } : p))
      );
      return;
    }

    // Upload to R2
    const uploaded = await api.uploadToR2(urlRes.data.uploadUrl, file);
    if (!uploaded) {
      updatePhotos((prev) =>
        prev.map((p) => (p.id === entryId ? { ...p, uploading: false } : p))
      );
      return;
    }

    // Trigger AI analysis
    const analysisRes = await api.post<AIAnalysis>('/api/analyse-photo', {
      r2Key: urlRes.data.r2Key,
    });

    // Update entry with results — functional update, no stale state
    updatePhotos((prev) =>
      prev.map((p) =>
        p.id === entryId
          ? {
              ...p,
              uploading: false,
              r2Key: urlRes.data!.r2Key,
              analysis: analysisRes.data ?? null,
            }
          : p
      )
    );
  } catch (err) {
    console.error('Photo processing failed:', err);
    updatePhotos((prev) =>
      prev.map((p) => (p.id === entryId ? { ...p, uploading: false } : p))
    );
  }
}

// ── Step 3: Voice ─────────────────────────────────────────

function VoiceStep({
  transcription,
  onTranscription,
}: {
  transcription: TranscriptionResult | null;
  onTranscription: (t: TranscriptionResult | null) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);

  const toggleRecording = async () => {
    if (recording) {
      setRecording(false);
      setProcessing(true);

      // Placeholder — real implementation connects to Speechmatics WebSocket
      // via CF Worker, streams audio, receives transcript
      setTimeout(() => {
        setProcessing(false);
        onTranscription({
          text: '',
          language: 'en',
          translatedText: null,
          confidence: 0,
          provider: 'speechmatics',
        });
      }, 1500);
    } else {
      setRecording(true);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-navy mb-1">Describe the problem</h2>
      <p className="text-sm text-slate mb-6">
        Speak in any language. We'll transcribe and translate automatically.
      </p>

      <div className="flex flex-col items-center gap-4 py-6">
        <button
          onClick={toggleRecording}
          disabled={processing}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
            recording
              ? 'bg-danger animate-pulse'
              : processing
              ? 'bg-slate-200'
              : 'bg-shield hover:bg-shield-dark'
          }`}
          aria-label={recording ? 'Stop recording' : 'Start recording'}
        >
          {processing ? (
            <Loader2 className="h-8 w-8 text-slate animate-spin" />
          ) : (
            <Mic className="h-8 w-8 text-white" />
          )}
        </button>

        <p className="text-sm text-slate">
          {recording ? 'Recording... tap to stop' : processing ? 'Processing...' : 'Tap to record'}
        </p>
      </div>

      {transcription && (
        <div className="bg-white border border-border rounded-xl p-4 mt-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-shield" />
            <span className="text-xs font-semibold text-shield uppercase tracking-wide">
              Transcribed
            </span>
            <span className="text-xs text-slate font-mono ml-auto">
              {transcription.language.toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-navy leading-relaxed">{transcription.text || 'No speech detected'}</p>
          {transcription.translatedText && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-slate font-semibold mb-1">English translation:</p>
              <p className="text-sm text-navy">{transcription.translatedText}</p>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-slate-light text-center mt-6">
        Voice recordings are deleted within 1 hour of processing. Never stored long-term.
      </p>
    </div>
  );
}

// ── Step 4: Review ────────────────────────────────────────

function ReviewStep({
  state,
  onEmailChange,
}: {
  state: ReportState;
  onEmailChange: (email: string) => void;
}) {
  return (
    <div>
      <h2 className="text-lg font-bold text-navy mb-1">Review & send</h2>
      <p className="text-sm text-slate mb-5">
        Check the details below. Your legal letter will be generated and sent after payment.
      </p>

      {/* Summary */}
      <div className="bg-white border border-border rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <span className="text-sm font-semibold text-navy">
            {state.defectType ? DEFECT_TYPE_LABELS[state.defectType] : 'No type selected'}
          </span>
        </div>
        <p className="text-xs text-slate">
          {state.photos.length} photo{state.photos.length !== 1 ? 's' : ''} attached
          {state.voiceTranscription ? ' · Voice note included' : ''}
        </p>
        {state.photos[0]?.analysis && (
          <p className="text-xs text-slate mt-1">
            AI assessment: {state.photos[0].analysis.hhsrsCategory} — Severity{' '}
            {state.photos[0].analysis.severity}/5
          </p>
        )}
      </div>

      {/* Landlord email */}
      <div className="mb-4">
        <label htmlFor="landlord-email" className="block text-sm font-semibold text-navy mb-1.5">
          Landlord's email address
        </label>
        <input
          id="landlord-email"
          type="email"
          value={state.landlordEmail}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="landlord@example.com"
          className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm text-navy placeholder:text-slate-light focus:outline-none focus:ring-2 focus:ring-shield focus:border-shield"
          autoComplete="email"
        />
        <p className="text-xs text-slate-light mt-1.5">
          Used only to send the letter. Never shared or marketed to.
        </p>
      </div>

      {/* Legal notice */}
      <div className="bg-surface border border-border rounded-xl p-4 text-xs text-slate leading-relaxed">
        <p className="font-semibold text-navy mb-1">What happens next:</p>
        <p>
          After payment, a legal letter citing s.11 Landlord and Tenant Act 1985, the Housing Health
          and Safety Rating System (HHSRS), and the Homes (Fitness for Human Habitation) Act 2018
          will be sent to your landlord with your evidence attached. They have 14 days to respond. If
          they don't, we'll prepare an environmental health complaint for your local council.
        </p>
        <p className="mt-2 text-slate-light">
          This is not legal advice. RentShield generates correspondence based on UK housing law. For
          specific legal guidance, consult a solicitor or Citizens Advice.
        </p>
      </div>
    </div>
  );
}
