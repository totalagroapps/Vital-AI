import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, Check, Copy, Lightbulb, Loader2, Mic, MicOff, Pencil, Plus, RotateCcw, Save, Search, Sparkles, Trash2, X, UploadCloud,
} from 'lucide-react';
import { NOTE_TEMPLATE_CATALOG, TEMPLATE_SPECIALTIES } from '../data/noteTemplateCatalog';
import { defaultValues, emptyFields, parseTemplate, renderReport, selectedOption } from '../utils/noteTemplate';
import { useLanguage } from '../contexts/LanguageContext';

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  }
}

const normalizeShortcut = (value) => (value || '').trim().toLowerCase().replace(/^\/+/, '').replace(/\s+/g, '-');

// Plantillas de informe estilo MedAlly: predeterminadas (catálogo) y propias del médico (en su cuenta).
// Se elige una, se carga el texto y solo se completan unos pocos campos, a mano o con el dictado + IA.
export default function NoteTemplatesPanel({
  apiUrl, authHeaders, consultationText, setConsultationText, isRecording, toggleRecording, patientContext,
}) {
  const { t, locale, language } = useLanguage();
  const [myTemplates, setMyTemplates] = useState([]);
  const [query, setQuery] = useState('');
  const [specialty, setSpecialty] = useState('all');
  const [active, setActive] = useState(null); // { source: 'catalog' | 'mine', id, name, shortcut, body }
  const [values, setValues] = useState({});
  const [filling, setFilling] = useState(false);
  const [fillInfo, setFillInfo] = useState('');
  const [copied, setCopied] = useState(false);

  const audioInputRef = useRef(null);
  const [uploadingAudio, setUploadingAudio] = useState(false);

  const handleAudioUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingAudio(true);
    setFillInfo(t('notetpl_uploading_audio', 'Transcribiendo audio...'));
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', locale || language);

    try {
      const res = await fetch(`${apiUrl}/api/scribe/transcribe_audio`, {
        method: 'POST',
        headers: authHeaders,
        body: formData,
      });
      if (!res.ok) throw new Error('Audio upload failed');
      
      const data = await res.json();
      setConsultationText(prev => (prev ? prev + '\n' + data.text : data.text));
      setFillInfo(t('notetpl_audio_success', 'Audio transcrito correctamente.'));
    } catch (err) {
      console.error(err);
      setFillInfo(t('notetpl_audio_error', 'Error al transcribir el audio.'));
    } finally {
      setUploadingAudio(false);
      e.target.value = '';
    }
  };

  const [editor, setEditor] = useState(null); // { id?, name, shortcut, body }

  const loadMine = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/scribe/my-templates`, { headers: authHeaders });
      if (res.ok) setMyTemplates(await res.json());
    } catch (e) {
      console.error('Error loading note templates:', e);
    }
  };

  useEffect(() => { loadMine(); }, []);

  const segments = useMemo(() => (active ? parseTemplate(active.body) : []), [active]);
  const missing = useMemo(() => emptyFields(segments, values), [segments, values]);

  const openTemplate = (tpl, source) => {
    setActive({ ...tpl, source });
    setValues(defaultValues(parseTemplate(tpl.body)));
    setFillInfo('');
    setCopied(false);
  };

  const q = query.trim().toLowerCase();
  const qShortcut = normalizeShortcut(q);
  const matches = (tpl) => !q
    || tpl.name.toLowerCase().includes(q.replace(/^\/+/, ''))
    || (tpl.shortcut && qShortcut && tpl.shortcut.includes(qShortcut));
  const mineFiltered = myTemplates.filter(matches);
  const catalogFiltered = NOTE_TEMPLATE_CATALOG.filter((tpl) => (specialty === 'all' || tpl.specialty === specialty) && matches(tpl));

  // Atajo: escribir /hta + Enter abre la plantilla con ese atajo
  const handleSearchKey = (e) => {
    if (e.key !== 'Enter') return;
    const shortcut = normalizeShortcut(query);
    const mine = myTemplates.find((tpl) => tpl.shortcut === shortcut);
    const catalog = NOTE_TEMPLATE_CATALOG.find((tpl) => tpl.shortcut === shortcut);
    if (mine) openTemplate(mine, 'mine');
    else if (catalog) openTemplate(catalog, 'catalog');
    else if (mineFiltered.length + catalogFiltered.length === 1) {
      if (mineFiltered[0]) openTemplate(mineFiltered[0], 'mine');
      else openTemplate(catalogFiltered[0], 'catalog');
    }
  };

  const setValue = (id, value) => setValues((prev) => ({ ...prev, [id]: value }));

  const fillWithAi = async () => {
    if (!consultationText.trim()) {
      setFillInfo(t('notetpl_need_dictation', 'Dicta o escribe primero las notas de la consulta.'));
      return;
    }
    setFilling(true);
    setFillInfo('');
    try {
      const res = await fetch(`${apiUrl}/api/scribe/fill_template`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_body: active.body,
          consultation_text: consultationText,
          ...patientContext,
          language: locale || language,
        }),
      });
      if (!res.ok) throw new Error(`fill_template ${res.status}`);
      const data = await res.json();
      setValues((prev) => ({ ...prev, ...data.values }));
      setFillInfo(data.ai_available
        ? t('notetpl_ai_filled', { count: Object.keys(data.values || {}).length })
        : t('notetpl_ai_unavailable', 'La IA no está disponible ahora: completa los campos a mano.'));
    } catch (e) {
      console.error(e);
      setFillInfo(t('notetpl_ai_error', 'No se pudo rellenar con IA. Inténtalo de nuevo.'));
    } finally {
      setFilling(false);
    }
  };

  const copyReport = async () => {
    const ok = await copyText(renderReport(segments, values));
    setCopied(ok);
    if (ok) setTimeout(() => setCopied(false), 2500);
  };

  const saveTemplate = async (tpl) => {
    const isNew = !tpl.id;
    const res = await fetch(`${apiUrl}/api/scribe/my-templates${isNew ? '' : `/${tpl.id}`}`, {
      method: isNew ? 'POST' : 'PUT',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: tpl.name, shortcut: tpl.shortcut || null, body: tpl.body }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(typeof data.detail === 'string' ? data.detail : t('notetpl_save_error', 'No se pudo guardar la plantilla.'));
    await loadMine();
    setEditor(null);
    openTemplate(data, 'mine');
  };

  const deleteTemplate = async (tpl) => {
    if (!window.confirm(t('notetpl_confirm_delete', '¿Borrar esta plantilla?'))) return;
    const res = await fetch(`${apiUrl}/api/scribe/my-templates/${tpl.id}`, { method: 'DELETE', headers: authHeaders });
    if (!res.ok) throw new Error(t('notetpl_delete_error', 'No se pudo borrar la plantilla.'));
    await loadMine();
    setEditor(null);
    setActive(null);
  };

  const card = (tpl, source) => (
    <button
      key={`${source}-${tpl.id}`}
      type="button"
      onClick={() => openTemplate(tpl, source)}
      className="text-left p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-sky-400 hover:shadow-sm transition"
    >
      <span className="block text-sm font-bold text-slate-800 dark:text-white leading-tight">{tpl.name}</span>
      <span className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
        {tpl.shortcut && <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-sky-700 dark:text-sky-300">/{tpl.shortcut}</code>}
        {source === 'catalog' && t(`notetpl_spec_${tpl.specialty}`, TEMPLATE_SPECIALTIES.find((s) => s.id === tpl.specialty)?.label)}
      </span>
    </button>
  );

  const editorModal = editor && (
    <TemplateEditor editor={editor} onClose={() => setEditor(null)} onSave={saveTemplate} onDelete={deleteTemplate} />
  );

  // ---------- Selector de plantillas ----------
  if (!active) {
    return (
      <div className="space-y-5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearchKey}
            placeholder={t('notetpl_search_placeholder', 'Buscar plantilla o escribe su atajo (ej. /hta) y pulsa Enter')}
            className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50"
          />
        </div>

        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('notetpl_mine', 'Mis plantillas')}</h3>
            <button
              type="button"
              onClick={() => setEditor({ name: '', shortcut: '', body: '' })}
              className="flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700"
            >
              <Plus className="w-3.5 h-3.5" /> {t('notetpl_new', 'Nueva plantilla')}
            </button>
          </div>
          {mineFiltered.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{mineFiltered.map((tpl) => card(tpl, 'mine'))}</div>
          ) : (
            <p className="text-xs text-slate-400">
              {q
                ? t('notetpl_no_matches', 'Ninguna coincide con la búsqueda.')
                : t('notetpl_mine_empty', 'Aún no tienes plantillas propias. Crea una o guarda una predeterminada como tuya para adaptarla.')}
            </p>
          )}
        </section>

        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{t('notetpl_defaults', 'Plantillas predeterminadas')}</h3>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {[{ id: 'all', label: 'Todas' }, ...TEMPLATE_SPECIALTIES].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSpecialty(s.id)}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition ${
                  specialty === s.id
                    ? 'bg-sky-600 border-sky-600 text-white'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-sky-300'
                }`}
              >
                {t(`notetpl_spec_${s.id}`, s.label)}
              </button>
            ))}
          </div>
          {catalogFiltered.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{catalogFiltered.map((tpl) => card(tpl, 'catalog'))}</div>
          ) : (
            <p className="text-xs text-slate-400">{t('notetpl_no_matches', 'Ninguna coincide con la búsqueda.')}</p>
          )}
        </section>

        {editorModal}
      </div>
    );
  }

  // ---------- Rellenar la plantilla elegida ----------
  const inputBase = 'inline-block align-baseline mx-0.5 px-1.5 py-0.5 rounded-md border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/40';
  const fieldInput = (field) => {
    const value = values[field.id] || '';
    return (
      <input
        key={field.id}
        type="text"
        value={value}
        onChange={(e) => setValue(field.id, e.target.value)}
        placeholder={field.label}
        size={Math.max(6, Math.min(40, (value || field.label).length + 2))}
        className={`${inputBase} ${value.trim()
          ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-100'
          : 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 text-slate-800 dark:text-white placeholder:text-amber-500'}`}
      />
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={() => setActive(null)} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white">
          <ArrowLeft className="w-4 h-4" /> {t('notetpl_back', 'Plantillas')}
        </button>
        <div className="flex items-center gap-2">
          {active.source === 'mine' ? (
            <button type="button" onClick={() => setEditor({ ...active })} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
              <Pencil className="w-3.5 h-3.5" /> {t('notetpl_edit', 'Editar')}
            </button>
          ) : (
            <button type="button" onClick={() => setEditor({ name: active.name, shortcut: '', body: active.body })} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
              <Save className="w-3.5 h-3.5" /> {t('notetpl_save_as_mine', 'Guardar como mía')}
            </button>
          )}
          <button type="button" onClick={() => setValues(defaultValues(segments))} title={t('notetpl_reset', 'Restablecer')} className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-base font-black text-slate-800 dark:text-white">
          {active.name} {active.shortcut && <code className="ml-1 text-xs font-bold text-sky-600">/{active.shortcut}</code>}
        </h3>
        <p className="text-xs text-slate-500">{t('notetpl_fill_hint', 'Cambia solo lo que difiere de lo normal y completa los campos en amarillo. Tab salta al siguiente.')}</p>
      </div>

      {/* Dictado opcional para que la IA rellene la plantilla */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t('notetpl_dictation', 'Dictado (opcional)')}</span>
          <button
            type="button"
            onClick={toggleRecording}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition ${
              isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 hover:bg-sky-50'
            }`}
          >
            {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            {isRecording ? t('scribesoapmodal_detener') : t('scribesoapmodal_dictar')}
          </button>
        </div>
        <textarea
          rows={2}
          value={consultationText}
          onChange={(e) => setConsultationText(e.target.value)}
          placeholder={t('notetpl_dictation_placeholder', 'Dicta la consulta y pulsa «Rellenar con IA» para completar la plantilla automáticamente.')}
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50"
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-500">{fillInfo}</span>
          <button
            type="button"
            onClick={fillWithAi}
            disabled={filling}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white text-xs font-bold disabled:opacity-60"
          >
            {filling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {t('notetpl_fill_ai', 'Rellenar con IA')}
          </button>
        </div>
      </div>

      {/* Informe interactivo */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 text-sm leading-8 text-slate-800 dark:text-slate-100 whitespace-pre-wrap">
        {segments.map((s, i) => {
          if (s.type === 'text') return <span key={i}>{s.text}</span>;
          if (s.type === 'hint') {
            return (
              <span key={i} title={t('notetpl_hint_not_copied', 'Ayuda: no se copia al informe')} className="inline-flex items-center gap-1 mx-1 px-2 rounded-full bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 text-[11px] leading-5 italic align-middle">
                <Lightbulb className="w-3 h-3 shrink-0" /> {s.text}
              </span>
            );
          }
          if (s.type === 'field') return fieldInput(s);
          const option = selectedOption(s, values);
          return (
            <span key={i}>
              <select
                value={values[s.id] ?? '0'}
                onChange={(e) => setValue(s.id, e.target.value)}
                className={`${inputBase} bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 cursor-pointer`}
              >
                {s.options.map((o, idx) => (
                  <option key={idx} value={String(idx)}>{o.label.replace(/\[[^\]]+\]/g, '…')}</option>
                ))}
              </select>
              {option.parts.filter((p) => p.type === 'field').map(fieldInput)}
            </span>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`text-xs font-bold ${missing.length ? 'text-amber-600' : 'text-emerald-600'}`}>
          {missing.length
            ? `${t('notetpl_missing', 'Campos sin completar')}: ${missing.length}`
            : t('notetpl_complete', 'Todos los campos completos')}
        </span>
        <button
          type="button"
          onClick={copyReport}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold hover:opacity-90"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? t('notetpl_copied', '¡Copiado!') : t('notetpl_copy', 'Copiar informe')}
        </button>
      </div>

      {editorModal}
    </div>
  );
}

function TemplateEditor({ editor, onClose, onSave, onDelete }) {
  const { t } = useLanguage();
  const [name, setName] = useState(editor.name || '');
  const [shortcut, setShortcut] = useState(editor.shortcut || '');
  const [body, setBody] = useState(editor.body || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const bodyRef = useRef(null);

  const fieldCount = useMemo(
    () => parseTemplate(body).filter((s) => s.type === 'field' || s.type === 'choice').length,
    [body],
  );

  // Inserta la sintaxis en el cursor; el texto seleccionado pasa a ser el contenido
  const insert = (before, after, placeholder) => {
    const el = bodyRef.current;
    const start = el?.selectionStart ?? body.length;
    const end = el?.selectionEnd ?? body.length;
    const inner = body.slice(start, end) || placeholder;
    setBody(body.slice(0, start) + before + inner + after + body.slice(end));
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + inner.length);
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave({ id: editor.id, name: name.trim(), shortcut: normalizeShortcut(shortcut), body });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setError('');
    try {
      await onDelete(editor);
    } catch (err) {
      setError(err.message);
    }
  };

  const inputClass = 'w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50';

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-3" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl max-h-[92dvh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-800 dark:text-white">
            {editor.id ? t('notetpl_edit_title', 'Editar plantilla') : t('notetpl_new_title', 'Nueva plantilla')}
          </h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <label className="col-span-2 text-xs font-bold text-slate-500">
            {t('notetpl_name', 'Nombre')}
            <input required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} placeholder="Control de diabetes" className={`${inputClass} mt-1`} />
          </label>
          <label className="text-xs font-bold text-slate-500">
            {t('notetpl_shortcut', 'Atajo')}
            <input maxLength={30} value={shortcut} onChange={(e) => setShortcut(e.target.value)} placeholder="/dm" className={`${inputClass} mt-1`} />
          </label>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            <button type="button" onClick={() => insert('{', '|opción 2}', 'opción 1')} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">{'{'}{t('notetpl_ins_choice', 'Multi-opción')}{'}'}</button>
            <button type="button" onClick={() => insert('[', ']', t('notetpl_field_placeholder', 'dato'))} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">[{t('notetpl_ins_field', 'Campo')}]</button>
            <button type="button" onClick={() => insert('((', '))', t('notetpl_hint_placeholder', 'recordatorio'))} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200">(({t('notetpl_ins_hint', 'Ayuda oculta')}))</button>
            <span className="text-[11px] text-slate-400 ml-auto">{t('notetpl_field_count', 'Campos')}: {fieldCount}</span>
          </div>
          <textarea
            ref={bodyRef}
            required
            rows={14}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className={`${inputClass} font-mono text-[13px] leading-6`}
          />
          <p className="mt-1.5 text-[11px] text-slate-500 leading-5">
            {t('notetpl_syntax_help', '{normal|alterado} elige una opción (la primera sale por defecto) · {|texto} texto opcional · [TA] campo a completar, también dentro de una opción: {no|sí, [cuál]} · ((texto)) ayuda que no se copia')}
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center justify-between gap-2 pt-1">
          {editor.id ? (
            <button type="button" onClick={remove} className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-600">
              <Trash2 className="w-3.5 h-3.5" /> {t('notetpl_delete', 'Borrar')}
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">{t('cancel')}</button>
            <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {t('notetpl_save', 'Guardar')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
