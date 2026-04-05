import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Clock, ChevronRight, AlertTriangle, CheckCircle, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import type { Case, CaseStatus } from '../types';

export function DashboardPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await api.get<Case[]>('/api/cases');
      if (res.success && res.data) {
        setCases(res.data);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 border-2 border-shield border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-navy">{t('dashboard.title')}</h1>
        <button
          onClick={() => navigate('/report')}
          className="bg-shield hover:bg-shield-dark text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          {t('dashboard.report_button')}
        </button>
      </div>

      {cases.length === 0 ? (
        <EmptyState onReport={() => navigate('/report')} />
      ) : (
        <div className="flex flex-col gap-3">
          {cases.map((c) => (
            <CaseCard key={c.id} caseData={c} onClick={() => navigate(`/case/${c.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}

function CaseCard({ caseData, onClick }: { caseData: Case; onClick: () => void }) {
  const { t } = useTranslation();

  const daysLeft = caseData.deadlineAt
    ? Math.max(0, Math.ceil((new Date(caseData.deadlineAt).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <button
      onClick={onClick}
      className="w-full bg-white border border-border rounded-xl p-4 text-left hover:border-slate-light transition-colors flex items-center gap-3"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <StatusBadge status={caseData.status} />
          <span className="text-xs text-slate font-mono truncate">
            {caseData.id.slice(0, 8)}
          </span>
        </div>
        <p className="text-sm font-semibold text-navy truncate">
          {t(`defect.${caseData.defectType}`)} — {t('dashboard.severity', { level: caseData.defectSeverity })}
        </p>
        {daysLeft !== null && caseData.status === 'sent' && (
          <p className="text-xs text-slate mt-0.5 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {daysLeft > 0
              ? t('dashboard.days_left', { count: daysLeft })
              : t('dashboard.deadline_passed')}
          </p>
        )}
      </div>
      <ChevronRight className="h-4 w-4 text-slate-light flex-shrink-0" />
    </button>
  );
}

function StatusBadge({ status }: { status: CaseStatus }) {
  const { t } = useTranslation();

  const config: Record<CaseStatus, { label: string; icon: React.ReactNode; className: string }> = {
    draft: {
      label: t('status.draft'),
      icon: null,
      className: 'bg-slate-100 text-slate-600',
    },
    sent: {
      label: t('status.sent'),
      icon: <Send className="h-3 w-3" />,
      className: 'bg-info-light text-info',
    },
    escalated: {
      label: t('status.escalated'),
      icon: <AlertTriangle className="h-3 w-3" />,
      className: 'bg-warning-light text-amber-700',
    },
    resolved: {
      label: t('status.resolved'),
      icon: <CheckCircle className="h-3 w-3" />,
      className: 'bg-shield-light text-shield-dark',
    },
  };

  const c = config[status];
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${c.className}`}
    >
      {c.icon}
      {c.label}
    </span>
  );
}

function EmptyState({ onReport }: { onReport: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="text-center py-16 px-4">
      <div className="w-14 h-14 rounded-2xl bg-shield-light flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="h-7 w-7 text-shield" />
      </div>
      <h2 className="text-lg font-bold text-navy mb-2">{t('dashboard.empty_title')}</h2>
      <p className="text-sm text-slate mb-6 max-w-xs mx-auto">
        {t('dashboard.empty_description')}
      </p>
      <button
        onClick={onReport}
        className="bg-shield hover:bg-shield-dark text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors"
      >
        {t('dashboard.empty_cta')}
      </button>
    </div>
  );
}
