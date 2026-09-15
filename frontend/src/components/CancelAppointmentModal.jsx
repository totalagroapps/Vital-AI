import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// only patients see (and must accept) the no-refund checkbox
const CancelAppointmentModal = ({ isOpen, onClose, onConfirm, isDoctor = false, submitting = false }) => {
  const { t } = useLanguage();
  const [reason, setReason] = useState('');
  const [accepted, setAccepted] = useState(false);

  if (!isOpen) return null;

  const canConfirm = isDoctor || accepted;

  const handleClose = () => {
    if (submitting) return;
    setReason('');
    setAccepted(false);
    onClose();
  };

  const handleConfirm = () => {
    if (!canConfirm || submitting) return;
    onConfirm(reason.trim() || null);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold text-brand-dark">{t('appts_cancel_modal_title')}</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <label className="block text-xs font-bold text-gray-500 mb-1.5">
          {t('appts_cancel_modal_reason_label')}
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t('appts_cancel_modal_reason_placeholder')}
          rows={3}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3.5 text-sm text-brand-dark focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all resize-none"
        />

        {!isDoctor && (
          <label className="flex items-start gap-2 mt-4 cursor-pointer">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 shrink-0 accent-brand-blue"
            />
            <span className="text-xs text-gray-600 leading-snug">
              {t('appts_cancel_modal_refund_notice')}
            </span>
          </label>
        )}

        <div className="flex gap-2 mt-5">
          <button
            onClick={handleClose}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 disabled:opacity-50"
          >
            {t('appts_cancel_modal_back')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || submitting}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {t('appts_cancel_modal_confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelAppointmentModal;
