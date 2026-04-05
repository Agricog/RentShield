import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Clock,
  Download,
  Camera,
  Mail,
  AlertTriangle,
  CheckCircle,
  Shield,
  Loader2,
  ImageOff,
} from 'lucide-react';
import { api } from '../lib/api';
import { useEvidencePhotos } from '../hooks/useEvidencePhotos';
import type { Case, Evidence, Letter, EvidencePackResponse } from '../types';

interface CaseDetail {
  case_: Case;
  evidence: Evidence[];
  letters: Letter[];
}

export function CaseDetailPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [data, setData] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    async function load() {
      if (!caseId) return;
      const res = await api.get<CaseDetail>(`/api/cases/${caseId}`);
      if (res.success && res.data) {
        setData(res.data);
      }
      setLoading(false);
    }
    load();
  }, [caseId]);

  const handleDownloadPack = async () => {
    if (!caseId || downloading) return;
    setDownloading(true);
    try {
      const res = await api.post<EvidencePackResponse>('/api/evidence-pack', { caseId });
      if (res.success && res.data?.downloadUrl) {
        window.open(res.data.downloadUrl, '_blank');
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleResolve = async () => {
    if (!caseId || resolving) return;
    setResolving(true);
    try {
      const res = await api.post<{ id: string; status: string }>(`/api/cases/${caseId}/resolve`, {});
      if (res.success) {
        setData((prev) =>
          prev ? { ...prev, case_: { ...prev.case_, status: 'resolved' } } : prev
        );
      }
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 border-2 border-shield border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-slate">{t('case_detail.not_found')}</p>
        <button onClick={() => navigate('/dashboard')} className="text-shield text-sm font-medium mt-2">
          {t('case_detail.back_dashboard')}
        </button>
      </div>
    );
  }

  const { case_: c, evidence, letters } = data;

  const daysLeft = c.deadlineAt
    ? Math.max(0, Math.ceil((new Date(c.deadlineAt).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/dashboard')} className="p-1 -ml-1 text-slate hover:text-navy" aria-label={t('report.back')}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-navy truncate">
            {t(`defect.${c.defectType}`)}
          </h1>
          <p className="text-xs text-slate font-mono">{c.id.slice(0, 8)}</p>
        </div>
      </div>

      {/* Status card */}
      <div className="bg-white border border-border rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <StatusIndicator status={c.status} />
          <span className="text-xs text-slate">
            {t('dashboard.severity', { level: c.defectSeverity })}
          </span>
        </div>
        {c.hhsrsCategory && (
          <p className="text-xs text-slate mb-2">
            <span className="font-semibold">{t('case_detail.hhsrs')}</span> {c.hhsrsCategory}
          </p>
        )}
        {daysLeft !== null && c.status === 'sent' && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
            <Clock className="h-4 w-4 text-warning" />
            <span className="text-sm font-medium text-navy">
              {daysLeft > 0
                ? t('case_detail.days_until_deadline', { count: daysLeft })
                : t('case_detail.deadline_passed')}
            </span>
          </div>
        )}
        {c.status === 'escalated' && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
            <AlertTriangle className="h-4 w-4 text-danger" />
            <span className="text-sm font-medium text-danger">
              {t('case_detail.council_complaint_ready')}
            </span>
          </div>
        )}
      </div>

      {/* Evidence photos — real images via signed URLs */}
      {evidence.length > 0 && <EvidenceGallery evidence={evidence} />}

      {/* Letters */}
      {letters.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-navy mb-2 flex items-center gap-1.5">
            <Mail className="h-4 w-4 text-slate" />
            {t('case_detail.letters_sent')}
          </h3>
          <div className="flex flex-col gap-2">
            {letters.map((l) => (
              <div key={l.id} className="bg-white border border-border rounded-lg p-3 flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-navy">
                    {t(`letter_type.${l.letterType}`)}
                  </p>
                  <p className="text-xs text-slate">
                    {new Date(l.sentAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <button className="p-2 text-shield hover:text-shield-dark" aria-label={t('common.download')}>
                  <Download className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 mt-6">
        {c.status !== 'resolved' && (
          <button
            onClick={() => navigate('/report')}
            className="w-full bg-white border border-border hover:border-shield text-navy font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Camera className="h-4 w-4" />
            {t('case_detail.add_evidence')}
          </button>
        )}
        <button
          onClick={handleDownloadPack}
          disabled={downloading}
          className="w-full bg-white border border-border hover:border-shield text-navy font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
        >
          {downloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {t('case_detail.download_pack')}
        </button>
        {c.status === 'sent' && (
          <button
            onClick={handleResolve}
            disabled={resolving}
            className="w-full bg-shield-light text-shield-dark font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
          >
            {resolving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            {t('case_detail.mark_resolved')}
          </button>
        )}
      </div>
    </div>
  );
}

function EvidenceGallery({ evidence }: { evidence: Evidence[] }) {
  const { t } = useTranslation();
  const { photos } = useEvidencePhotos(evidence);

  if (photos.length === 0) return null;

  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-navy mb-2 flex items-center gap-1.5">
        <Camera className="h-4 w-4 text-slate" />
        {t('case_detail.evidence_photos')}
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((p, i) => (
          <div key={p.evidence.id} className="aspect-square rounded-lg bg-slate-100 overflow-hidden relative">
            {p.loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-5 w-5 text-slate-light animate-spin" />
              </div>
            )}
            {p.error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <ImageOff className="h-5 w-5 text-slate-light" />
              </div>
            )}
            {p.url && (
              <img
                src={p.url}
                alt={`Evidence ${i + 1}`}
                className="w-full h-full object-cover"
              />
            )}
            {p.evidence.aiAnalysis && !p.loading && (
              <div className="absolute bottom-0 inset-x-0 bg-navy/80 px-2 py-1">
                <p className="text-[10px] text-white font-medium truncate">
                  {p.evidence.aiAnalysis.hhsrsCategory}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusIndicator({ status }: { status: Case['status'] }) {
  const { t } = useTranslation();

  const config = {
    draft: { label: t('status.draft'), color: 'text-slate', bg: 'bg-slate-100' },
    sent: { label: t('status.letter_sent'), color: 'text-info', bg: 'bg-info-light' },
    escalated: { label: t('status.escalated'), color: 'text-danger', bg: 'bg-danger-light' },
    resolved: { label: t('status.resolved'), color: 'text-shield-dark', bg: 'bg-shield-light' },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${c.bg} ${c.color}`}>
      {status === 'resolved' ? <Shield className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
      {c.label}
    </span>
  );
}
