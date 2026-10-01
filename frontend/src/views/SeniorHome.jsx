import React, { useState } from 'react';
import { Pill, HeartPulse, Users, CalendarDays, Phone, Brain, PhoneCall, Mic, ChevronRight, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { detectCountry, emergencyNumber } from '../utils/locale';
import CognitiveGamesModal from './CognitiveGamesModal';
import doctoraImg from '../assets/senior-doctora.webp';

// Inicio de MIVOR en modo adulto mayor (lo abre el kiosko con mivor://mayor).
// Una pantalla sin desplazamiento: saludo con la doctora, micrófono, frases de ejemplo y 8 tarjetas grandes.

const phoneOf = (contact) => {
  const match = (contact || '').match(/(\+?\d[\d\s\-()]{6,}\d)/);
  return match ? match[0].replace(/[\s\-()]/g, '') : null;
};

const WhatsAppIcon = ({ size = 30 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3 2.4 1 2.9.8 3.4.7.5-.1 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z" />
  </svg>
);

const TILES = [
  { id: 'meds', icon: Pill, title: 'senior_meds_title', sub: 'senior_meds_sub', bg: 'bg-[#D9F5EA]', ink: 'text-[#0F7A55]', chip: 'bg-[#B9EAD6]' },
  { id: 'vitals', icon: HeartPulse, title: 'senior_vitals_title', sub: 'senior_vitals_sub', bg: 'bg-[#DCEBFD]', ink: 'text-[#1D5FD8]', chip: 'bg-[#C3DBFB]' },
  { id: 'family', icon: Users, title: 'senior_family_title', sub: 'senior_family_sub', bg: 'bg-[#FDE2E2]', ink: 'text-[#E04B4B]', chip: 'bg-[#F9C9C9]' },
  { id: 'appts', icon: CalendarDays, title: 'senior_appts_title', sub: 'senior_appts_sub', bg: 'bg-[#ECE6FB]', ink: 'text-[#6A45D8]', chip: 'bg-[#DCD2F7]' },
  { id: 'call', icon: Phone, title: 'senior_call_title', sub: 'senior_call_sub', bg: 'bg-[#E3EEFD]', ink: 'text-white', circle: 'bg-[#1D6BF0]', chip: 'bg-[#C9DCFB]', chevron: 'text-[#1D6BF0]' },
  { id: 'whatsapp', icon: WhatsAppIcon, title: 'senior_whatsapp_title', sub: 'senior_whatsapp_sub', bg: 'bg-[#DDF5E7]', ink: 'text-white', circle: 'bg-[#25B65A]', chip: 'bg-[#C1EBD2]', chevron: 'text-[#1E9E4D]' },
  { id: 'games', icon: Brain, title: 'senior_games_title', sub: 'senior_games_sub', bg: 'bg-[#FDF1D6]', ink: 'text-[#E99A0B]', chip: 'bg-[#FAE2AE]' },
  { id: 'help', icon: PhoneCall, title: 'senior_help_title', sub: 'senior_help_sub', bg: 'bg-[#FBD9D9]', ink: 'text-white', circle: 'bg-[#E5293F]', chip: 'bg-[#F6BDBD]', chevron: 'text-[#E5293F]' },
];

const SeniorHome = ({ onNavigate, userProfile, onExitSeniorMode, apiUrl, authHeaders }) => {
  const { t } = useLanguage();
  const [showGames, setShowGames] = useState(false);
  const [notice, setNotice] = useState(null);
  const [showHelp, setShowHelp] = useState(false);

  const hour = new Date().getHours();
  const hello = hour < 13 && hour >= 6 ? t('senior_hello_morning') : hour < 20 && hour >= 13 ? t('senior_hello_afternoon') : t('senior_hello_evening');
  // Si el perfil solo tiene el nombre de usuario (un correo, "cristianlv11"), se saluda sin nombre
  const firstWord = (userProfile?.full_name || '').trim().split(' ')[0];
  const firstName = /[@\d]/.test(firstWord) ? '' : firstWord;
  const familyPhone = phoneOf(userProfile?.emergency_contact);
  const sos = emergencyNumber(detectCountry());

  const open = (url) => { window.location.href = url; };

  const callFamily = () => {
    if (familyPhone) open(`tel:${familyPhone}`);
    else setNotice(t('senior_no_family'));
  };

  const act = (id) => {
    switch (id) {
      case 'meds': return onNavigate('treatments');
      case 'vitals': return setNotice(t('senior_coming_soon'));
      case 'family': return callFamily();
      case 'appts': return onNavigate('citas');
      case 'call': return open(familyPhone ? `tel:${familyPhone}` : 'tel:');
      case 'whatsapp': return open(familyPhone ? `https://wa.me/${familyPhone.replace('+', '')}` : 'https://wa.me/');
      case 'games': return setShowGames(true);
      case 'help': return setShowHelp(true);
      default: return null;
    }
  };

  const phrases = [
    { key: 'senior_phrase_meds', action: () => act('meds') },
    { key: 'senior_phrase_appt', action: () => act('appts') },
    { key: 'senior_phrase_family', action: () => act('family') },
    { key: 'senior_phrase_help', action: () => act('help') },
  ];

  return (
    <div className="h-[100dvh] overflow-hidden flex flex-col bg-gradient-to-b from-[#EAF4FF] via-[#E1EEFD] to-[#D3E6FB] px-3 pt-[max(12px,env(safe-area-inset-top))] pb-[max(10px,env(safe-area-inset-bottom))] gap-2.5 text-[#0D2B5E]">
      {/* Saludo, doctora, micrófono y frases de ejemplo */}
      <section className="shrink-0 rounded-[28px] bg-white/70 border border-white shadow-sm backdrop-blur px-3 pt-3 pb-3 flex gap-2">
        <img src={doctoraImg} alt="" className="w-[36%] max-w-[180px] self-stretch rounded-[22px] object-cover object-top" />
        <div className="flex-1 min-w-0 flex flex-col">
          <h1 className="font-extrabold leading-[1.05] text-[clamp(22px,6.6vw,32px)] tracking-tight">
            {hello}{firstName ? `, ${firstName}` : ''} <span aria-hidden="true">👋</span>
          </h1>
          <p className="text-[clamp(13px,3.8vw,17px)] text-[#3A4E6E] mt-1 leading-snug">{t('senior_help_today')}</p>
          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={() => onNavigate('general_chat')}
              className="shrink-0 flex flex-col items-center gap-1 active:scale-95"
              aria-label={t('senior_tap_to_talk')}
            >
              <span className="grid place-items-center w-[clamp(64px,18vw,84px)] aspect-square rounded-full bg-gradient-to-br from-[#25B9FF] to-[#0A4FD6] text-white shadow-[0_0_0_8px_rgba(37,140,255,0.15),0_6px_18px_rgba(10,80,214,0.35)]">
                <Mic className="w-1/2 h-1/2" strokeWidth={2.4} />
              </span>
              <span className="text-[12px] font-bold leading-tight text-center">{t('senior_tap_to_talk')}</span>
            </button>
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              {phrases.map((p) => (
                <button key={p.key} type="button" onClick={p.action}
                  className="text-left text-[clamp(11px,3.1vw,14px)] font-semibold leading-tight rounded-xl bg-[#EEF5FF] px-2.5 py-1.5 active:scale-[0.98]">
                  {t(p.key)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Ocho tarjetas grandes */}
      <section className="flex-1 min-h-0 grid grid-cols-2 grid-rows-4 gap-2.5">
        {TILES.map(({ id, icon: Icon, title, sub, bg, ink, circle, chip, chevron }) => (
          <button key={id} type="button" onClick={() => act(id)}
            className={`${bg} relative min-h-0 rounded-[24px] p-2 flex items-center gap-1.5 text-left shadow-sm active:scale-[0.98] overflow-hidden`}>
            <span className={`shrink-0 grid place-items-center w-[clamp(40px,11.5vw,58px)] aspect-square rounded-full ${circle || 'bg-white'} ${ink} shadow-sm`}>
              <Icon size={24} strokeWidth={2.4} />
            </span>
            <span className="min-w-0 flex-1 pr-6">
              <span className="block font-extrabold leading-[1.05] text-[clamp(13px,3.6vw,19px)] [hyphens:auto]">{t(title)}</span>
              <span className="mt-0.5 text-[clamp(11px,2.9vw,14px)] leading-tight text-[#3A4E6E] line-clamp-2">{t(sub)}</span>
            </span>
            <span className={`absolute top-2 right-2 grid place-items-center w-6 h-6 rounded-full ${chip} ${chevron || ink}`}>
              <ChevronRight size={16} strokeWidth={3} />
            </span>
          </button>
        ))}
      </section>

      <button type="button" onClick={onExitSeniorMode} className="shrink-0 self-center text-[12px] font-semibold text-[#3A4E6E] underline underline-offset-2 py-1">
        {t('senior_full_app')}
      </button>

      {notice && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4" onClick={() => setNotice(null)}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 text-center" onClick={(e) => e.stopPropagation()}>
            <p className="text-[19px] font-semibold leading-snug">{notice}</p>
            <button type="button" onClick={() => setNotice(null)} className="mt-4 w-full rounded-2xl bg-[#1D6BF0] text-white text-[18px] font-bold py-3">
              {t('senior_ok')}
            </button>
          </div>
        </div>
      )}

      {showHelp && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowHelp(false)}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h2 className="text-[24px] font-extrabold">{t('senior_help_title')}</h2>
              <button type="button" onClick={() => setShowHelp(false)} aria-label={t('senior_close')} className="p-1"><X size={26} /></button>
            </div>
            <button type="button" onClick={() => open(`tel:${sos}`)}
              className="mt-4 w-full rounded-2xl bg-[#E5293F] text-white text-[20px] font-extrabold py-4 flex items-center justify-center gap-2">
              <PhoneCall size={24} /> {t('senior_call_emergency', { number: sos })}
            </button>
            {familyPhone && (
              <button type="button" onClick={() => open(`tel:${familyPhone}`)}
                className="mt-3 w-full rounded-2xl bg-[#1D6BF0] text-white text-[19px] font-bold py-4 flex items-center justify-center gap-2">
                <Users size={22} /> {t('senior_call_family')}
              </button>
            )}
          </div>
        </div>
      )}

      <CognitiveGamesModal isOpen={showGames} onClose={() => setShowGames(false)} apiUrl={apiUrl} authHeaders={authHeaders} />
    </div>
  );
};

export default SeniorHome;
