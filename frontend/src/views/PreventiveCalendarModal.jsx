import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Stethoscope, 
  Sparkles, 
  Activity, 
  Info, 
  Syringe, 
  ChevronRight,
  Zap
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function PreventiveCalendarModal({ 
  isOpen, 
  onClose, 
  apiUrl, 
  authHeaders, 
  patientId = null 
}) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' | 'captyva'
  const [calendarData, setCalendarData] = useState(null);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);

  // --- FORMULARIO CAPTYVA (VIGILANCIA DIGESTIVA) ---
  const [captyvaForm, setCaptyvaForm] = useState({
    num_adenomas: 1,
    max_size_mm: 8,
    has_high_grade_dysplasia: false,
    has_serrated_ge_10mm: false,
    piecemeal_resection_ge_20mm: false,
    histology_type: 'tubular',
    exam_date: new Date().toISOString().split('T')[0]
  });
  const [captyvaResult, setCaptyvaResult] = useState(null);
  const [isEvaluatingCaptyva, setIsEvaluatingCaptyva] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCalendar();
    }
  }, [isOpen]);

  const fetchCalendar = async () => {
    setIsLoadingCalendar(true);
    try {
      const q = patientId ? `?patient_id=${encodeURIComponent(patientId)}` : '';
      const res = await fetch(`${apiUrl}/api/surveillance/calendar${q}`, {
        headers: authHeaders || {}
      });
      if (res.ok) {
        const data = await res.json();
        setCalendarData(data);
      }
    } catch (e) {
      console.warn("Error cargando calendario preventivo:", e);
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  const handleEvaluateCaptyva = async () => {
    setIsEvaluatingCaptyva(true);
    try {
      const res = await fetch(`${apiUrl}/api/surveillance/digestive/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(authHeaders || {}) },
        body: JSON.stringify({
          num_adenomas: Number(captyvaForm.num_adenomas),
          max_size_mm: Number(captyvaForm.max_size_mm),
          has_high_grade_dysplasia: Boolean(captyvaForm.has_high_grade_dysplasia),
          has_serrated_ge_10mm: Boolean(captyvaForm.has_serrated_ge_10mm),
          piecemeal_resection_ge_20mm: Boolean(captyvaForm.piecemeal_resection_ge_20mm),
          histology_type: captyvaForm.histology_type,
          exam_date: captyvaForm.exam_date
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCaptyvaResult(data);
      }
    } catch (e) {
      console.error("Error evaluando vigilancia digestiva:", e);
    } finally {
      setIsEvaluatingCaptyva(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92dvh] flex flex-col overflow-hidden border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CABECERA */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-sky-50/70 via-white to-teal-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-600 flex items-center justify-center text-white shadow-md shadow-sky-600/20">
              <Calendar size={22} strokeWidth={2.4} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Calendario Preventivo & MIVOR Prevención</h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                  Cribados & Vigilancia
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Vigilancia oncológica digestiva ESGE y controles de salud recomendados por edad y sexo
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* NAVEGACIÓN POR PESTAÑAS */}
        <div className="flex border-b border-slate-100 px-6 bg-slate-50/70 shrink-0">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition ${
              activeTab === 'calendar'
                ? 'border-sky-600 text-sky-700 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity size={16} className={activeTab === 'calendar' ? 'text-sky-600' : 'text-slate-400'} />
            <span>Calendario Preventivo Integral</span>
          </button>

          <button
            onClick={() => setActiveTab('captyva')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition ${
              activeTab === 'captyva'
                ? 'border-sky-600 text-sky-700 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Stethoscope size={16} className={activeTab === 'captyva' ? 'text-sky-600' : 'text-slate-400'} />
            <span>Vigilancia Digestiva MIVOR Prevención (Colonoscopia)</span>
          </button>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ======================================================== */}
          {/* TAB 1: CALENDARIO PREVENTIVO                             */}
          {/* ======================================================== */}
          {activeTab === 'calendar' && (
            <div className="space-y-6">
              {calendarData && (
                <div className="bg-sky-50/70 border border-sky-100 rounded-2xl p-4 flex items-center justify-between text-xs text-sky-900">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-sky-600 shrink-0" />
                    <span>
                      Perfil evaluado: <strong>{calendarData.patient_gender}</strong>, <strong>{calendarData.patient_age} años</strong>
                    </span>
                  </div>
                  <span className="font-semibold text-sky-700">Pautas actualizadas de Medicina Preventiva</span>
                </div>
              )}

              {/* CRIBADOS ONCOLÓGICOS Y DE SALUD */}
              <div>
                <h3 className="font-bold text-slate-800 text-base mb-3 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-sky-600" />
                  <span>Revisiones y Cribados Recomendados</span>
                </h3>

                <div className="space-y-3">
                  {calendarData?.screenings?.map((item) => (
                    <div key={item.id} className="bg-white border-2 border-slate-100 hover:border-sky-200 rounded-2xl p-4 transition shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                          <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                            item.status_badge === 'green' ? 'bg-emerald-100 text-emerald-800' :
                            item.status_badge === 'amber' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
                          }`}>
                            {item.status === 'al_dia' ? 'Al día' : item.status === 'pendiente' ? 'Pendiente' : 'Recomendado'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                          <span>Frecuencia: <strong className="text-slate-600">{item.recommended_frequency}</strong></span>
                          <span>•</span>
                          <span>Edad: <strong className="text-slate-600">{item.target_age_group}</strong></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* VACUNACIÓN ADULTO MAYOR */}
              {calendarData?.vaccines && calendarData.vaccines.length > 0 && (
                <div>
                  <h3 className="font-bold text-slate-800 text-base mb-3 flex items-center gap-2">
                    <Syringe size={18} className="text-teal-600" />
                    <span>Inmunización y Vacunación Sénior</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {calendarData.vaccines.map((v) => (
                      <div key={v.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-800 text-xs">{v.title}</h4>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            v.status_badge === 'green' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'
                          }`}>
                            {v.status === 'al_dia' ? 'Al día' : 'Campaña recomendada'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">{v.description}</p>
                        <p className="text-[11px] text-teal-700 font-semibold pt-1">Pauta: {v.recommended_frequency}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* RECOMENDACIONES GENERALES */}
              {calendarData?.general_recommendations && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Notas importantes para tu salud preventiva:
                  </h4>
                  <ul className="space-y-1.5">
                    {calendarData.general_recommendations.map((r, i) => (
                      <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                        <CheckCircle2 size={13} className="text-sky-600 shrink-0 mt-0.5" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: VIGILANCIA DIGESTIVA CAPTYVA                      */}
          {/* ======================================================== */}
          {activeTab === 'captyva' && (
            <div className="space-y-6">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-base">
                    Parámetros de la Colonoscopia / Informe de Anatomía Patológica
                  </h3>
                  <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200/60">
                    Guías Oficiales ESGE 2020
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Número total de pólipos
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={captyvaForm.num_adenomas}
                      onChange={(e) => setCaptyvaForm({ ...captyvaForm, num_adenomas: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl font-semibold"
                    />
                    <span className="text-[11px] text-slate-400">0 si fue normal/limpia</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Tamaño del pólipo mayor (mm)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={captyvaForm.max_size_mm}
                      onChange={(e) => setCaptyvaForm({ ...captyvaForm, max_size_mm: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl font-semibold"
                    />
                    <span className="text-[11px] text-slate-400">≥ 10 mm se clasifica de alto riesgo</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Fecha de la exploración
                    </label>
                    <input
                      type="date"
                      value={captyvaForm.exam_date}
                      onChange={(e) => setCaptyvaForm({ ...captyvaForm, exam_date: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl font-semibold"
                    />
                  </div>

                  <div className="md:col-span-3 space-y-2 pt-2 border-t border-slate-200/60">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={captyvaForm.has_high_grade_dysplasia}
                        onChange={(e) => setCaptyvaForm({ ...captyvaForm, has_high_grade_dysplasia: e.target.checked })}
                        className="w-4 h-4 text-sky-600 rounded"
                      />
                      <span className="text-xs font-semibold text-slate-700">Displasia de alto grado confirmada en el informe de biopsia</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={captyvaForm.has_serrated_ge_10mm}
                        onChange={(e) => setCaptyvaForm({ ...captyvaForm, has_serrated_ge_10mm: e.target.checked })}
                        className="w-4 h-4 text-sky-600 rounded"
                      />
                      <span className="text-xs font-semibold text-slate-700">Pólipo serrado sésil ≥ 10 mm o con displasia</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={captyvaForm.piecemeal_resection_ge_20mm}
                        onChange={(e) => setCaptyvaForm({ ...captyvaForm, piecemeal_resection_ge_20mm: e.target.checked })}
                        className="w-4 h-4 text-sky-600 rounded"
                      />
                      <span className="text-xs font-semibold text-slate-700">Resección en fragmentos (piecemeal) de adenoma grande ≥ 20 mm</span>
                    </label>
                  </div>

                  <div className="md:col-span-3 flex justify-end pt-2 border-t border-slate-200/60">
                    <button
                      onClick={handleEvaluateCaptyva}
                      disabled={isEvaluatingCaptyva}
                      className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-md transition flex items-center gap-2 text-sm disabled:opacity-50"
                    >
                      <Zap size={16} />
                      <span>{isEvaluatingCaptyva ? 'Evaluando...' : 'Evaluar Intervalo de Vigilancia MIVOR Prevención'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* RESULTADOS CAPTYVA */}
              {captyvaResult && (
                <div className="bg-white rounded-2xl border-2 border-slate-100 p-6 shadow-sm space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {captyvaResult.guideline_source}
                      </span>
                      <h3 className="text-xl font-bold text-slate-800">
                        Nivel de Riesgo: <span className={
                          captyvaResult.risk_badge === 'green' ? 'text-emerald-600' :
                          captyvaResult.risk_badge === 'orange' ? 'text-orange-600' : 'text-rose-600'
                        }>{captyvaResult.risk_tier}</span>
                      </h3>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 font-bold block uppercase">Intervalo Recomendado</span>
                      <span className="text-2xl font-black text-sky-700">{captyvaResult.interval_text}</span>
                    </div>
                  </div>

                  {captyvaResult.next_recommended_date && (
                    <div className="p-3 bg-sky-50 rounded-xl text-xs text-sky-900 border border-sky-100 flex items-center gap-2">
                      <Clock size={16} className="text-sky-600 shrink-0" />
                      <span>Fecha estimada de próxima colonoscopia: <strong>{captyvaResult.next_recommended_date}</strong></span>
                    </div>
                  )}

                  <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-700 leading-relaxed border border-slate-100">
                    <strong className="block mb-1 text-slate-900">Justificación de la Guía Clínica:</strong>
                    {captyvaResult.clinical_justification}
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Plan de acción recomendado:
                    </h4>
                    <ul className="space-y-1.5">
                      {captyvaResult.action_plan.map((act, i) => (
                        <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                          <CheckCircle2 size={13} className="text-sky-600 shrink-0 mt-0.5" />
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {captyvaResult.warning_signs && (
                    <div className="pt-2 border-t border-slate-100">
                      <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <AlertTriangle size={13} />
                        <span>Signos de alarma que requieren consulta anticipada:</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {captyvaResult.warning_signs.join(' • ')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* PIE DE PÁGINA */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <Info size={13} className="text-slate-400" />
            <span>MIVOR MIVOR Prevención orienta sobre los intervalos de guías internacionales sin sustituir la prescripción de tu especialista.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl text-xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
