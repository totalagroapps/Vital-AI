import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  Activity, 
  Clock, 
  Zap, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  ChevronRight, 
  RefreshCw, 
  Play, 
  Square, 
  RotateCcw,
  Sparkles,
  Info,
  Stethoscope,
  FileText
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function ClinicalCalculatorsModal({ 
  isOpen, 
  onClose, 
  apiUrl, 
  authHeaders, 
  patientId = null,
  initialPatientData = null 
}) {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('cardio'); // 'cardio' | 'renal' | 'fragility'
  const [isLoadingAutoFill, setIsLoadingAutoFill] = useState(false);
  const [autoFillSources, setAutoFillSources] = useState([]);

  // --- TAB 1: CARDIO (Riesgo CV MIVOR + LIPIDWISE) ---
  const [cardioForm, setCardioForm] = useState({
    age: 55,
    gender: 'male',
    systolic_bp: 130,
    is_smoker: false,
    total_cholesterol: 200,
    hdl_cholesterol: 50,
    current_ldl: 130,
    has_prior_ascvd: false,
    region: 'moderate'
  });
  const [isCalculatingCardio, setIsCalculatingCardio] = useState(false);
  const [score2Result, setScore2Result] = useState(null);
  const [lipidwiseResult, setLípidos MIVORResult] = useState(null);

  // --- TAB 2: RENAL (Filtrado MIVOR 2021) ---
  const [renalForm, setRenalForm] = useState({
    creatinine: 0.9,
    age: 55,
    gender: 'male'
  });
  const [isCalculatingRenal, setIsCalculatingRenal] = useState(false);
  const [ckdResult, setCkdResult] = useState(null);

  // --- TAB 3: FRAGILITY & MOBILITY (TUG & BARTHEL) ---
  const [tugSeconds, setTugSeconds] = useState(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerDisplay, setTimerDisplay] = useState(0);
  const timerRef = useRef(null);
  const timerStartRef = useRef(0);

  const [barthelForm, setBarthelForm] = useState({
    eating: 10,
    bathing: 5,
    dressing: 10,
    grooming: 5,
    bowels: 10,
    bladder: 10,
    toilet: 10,
    transfers: 15,
    mobility: 15,
    stairs: 10
  });
  const [historyOfFalls, setHistoryOfFalls] = useState(false);
  const [fragilityResult, setFragilityResult] = useState(null);
  const [isCalculatingFragility, setIsCalculatingFragility] = useState(false);

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      if (initialPatientData) {
        applyPatientData(initialPatientData);
      } else {
        handleAutoFill();
      }
    } else {
      stopTugTimer();
    }
  }, [isOpen]);

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const applyPatientData = (data) => {
    if (!data) return;
    if (data.age) {
      setCardioForm(prev => ({ ...prev, age: data.age }));
      setRenalForm(prev => ({ ...prev, age: data.age }));
    }
    if (data.gender) {
      const g = (data.gender.toLowerCase().includes('m') && !data.gender.toLowerCase().includes('fem')) ? 'male' : 'female';
      setCardioForm(prev => ({ ...prev, gender: g }));
      setRenalForm(prev => ({ ...prev, gender: g }));
    }
    if (data.systolic_bp) setCardioForm(prev => ({ ...prev, systolic_bp: data.systolic_bp }));
    if (data.is_smoker !== null && data.is_smoker !== undefined) setCardioForm(prev => ({ ...prev, is_smoker: data.is_smoker }));
    if (data.total_cholesterol) setCardioForm(prev => ({ ...prev, total_cholesterol: data.total_cholesterol }));
    if (data.hdl_cholesterol) setCardioForm(prev => ({ ...prev, hdl_cholesterol: data.hdl_cholesterol }));
    if (data.current_ldl) setCardioForm(prev => ({ ...prev, current_ldl: data.current_ldl }));
    if (data.creatinine) setRenalForm(prev => ({ ...prev, creatinine: data.creatinine }));
    if (data.data_sources) setAutoFillSources(data.data_sources);
  };

  const handleAutoFill = async () => {
    setIsLoadingAutoFill(true);
    try {
      const queryParam = patientId ? `?patient_id=${encodeURIComponent(patientId)}` : '';
      const res = await fetch(`${apiUrl}/api/calculators/auto_fill${queryParam}`, {
        headers: authHeaders || {}
      });
      if (res.ok) {
        const data = await res.json();
        applyPatientData(data);
      }
    } catch (e) {
      console.warn("No se pudo autocompletar desde el expediente:", e);
    } finally {
      setIsLoadingAutoFill(false);
    }
  };

  // --- CALCULAR CARDIO + LIPIDWISE ---
  const handleCalculateCardio = async () => {
    setIsCalculatingCardio(true);
    try {
      // 1. Riesgo CV MIVOR
      const resScore = await fetch(`${apiUrl}/api/calculators/score2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(authHeaders || {}) },
        body: JSON.stringify({
          age: Number(cardioForm.age),
          gender: cardioForm.gender,
          systolic_bp: Number(cardioForm.systolic_bp),
          is_smoker: Boolean(cardioForm.is_smoker),
          total_cholesterol: Number(cardioForm.total_cholesterol),
          hdl_cholesterol: Number(cardioForm.hdl_cholesterol),
          region: cardioForm.region
        })
      });
      if (resScore.ok) {
        const s2Data = await resScore.json();
        setScore2Result(s2Data);

        // 2. Lípidos MIVOR LDL Gap
        const resLipid = await fetch(`${apiUrl}/api/calculators/ldl_gap`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(authHeaders || {}) },
          body: JSON.stringify({
            current_ldl: Number(cardioForm.current_ldl),
            risk_category: s2Data.risk_category,
            has_prior_ascvd: cardioForm.has_prior_ascvd
          })
        });
        if (resLipid.ok) {
          const lData = await resLipid.json();
          setLípidos MIVORResult(lData);
        }
      }
    } catch (err) {
      console.error("Error al calcular riesgo cardiovascular:", err);
    } finally {
      setIsCalculatingCardio(false);
    }
  };

  // --- CALCULAR RENAL ---
  const handleCalculateRenal = async () => {
    setIsCalculatingRenal(true);
    try {
      const res = await fetch(`${apiUrl}/api/calculators/ckd_epi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(authHeaders || {}) },
        body: JSON.stringify({
          creatinine: Number(renalForm.creatinine),
          age: Number(renalForm.age),
          gender: renalForm.gender
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCkdResult(data);
      }
    } catch (err) {
      console.error("Error al calcular Filtrado MIVOR:", err);
    } finally {
      setIsCalculatingRenal(false);
    }
  };

  // --- CRONÓMETRO TIMED UP AND GO (TUG) ---
  const startTugTimer = () => {
    setIsTimerRunning(true);
    timerStartRef.current = Date.now() - (timerDisplay * 1000);
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - timerStartRef.current) / 1000;
      setTimerDisplay(Number(elapsed.toFixed(1)));
    }, 100);
  };

  const stopTugTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsTimerRunning(false);
    if (timerDisplay > 0) {
      setTugSeconds(timerDisplay);
    }
  };

  const resetTugTimer = () => {
    stopTugTimer();
    setTimerDisplay(0);
    setTugSeconds(null);
  };

  // --- CALCULAR FRAGILIDAD ---
  const handleCalculateFragility = async () => {
    setIsCalculatingFragility(true);
    try {
      const currentBarthel = Object.values(barthelForm).reduce((acc, curr) => acc + Number(curr), 0);
      const res = await fetch(`${apiUrl}/api/calculators/fragility_tug`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(authHeaders || {}) },
        body: JSON.stringify({
          tug_seconds: tugSeconds ? Number(tugSeconds) : null,
          barthel_score: currentBarthel,
          history_of_falls: historyOfFalls
        })
      });
      if (res.ok) {
        const data = await res.json();
        setFragilityResult(data);
      }
    } catch (err) {
      console.error("Error al calcular fragilidad:", err);
    } finally {
      setIsCalculatingFragility(false);
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
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50/60 via-white to-sky-50/60">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-600/20">
              <Stethoscope size={22} strokeWidth={2.4} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Calculadoras Clínicas & Longevidad</h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                  MDCalc + Lípidos MIVOR
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Soporte a decisiones clínicas basado en guías europeas e internacionales
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAutoFill}
              disabled={isLoadingAutoFill}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl transition border border-teal-200/60 disabled:opacity-50"
              title="Autocompletar variables con la analítica más reciente"
            >
              <RefreshCw size={13} className={isLoadingAutoFill ? 'animate-spin' : ''} />
              <span>{isLoadingAutoFill ? 'Cargando...' : 'Cargar de mis análisis'}</span>
            </button>

            <button 
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              aria-label="Cerrar modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* NOTA DE AUTOLLENADO SI EXISTE */}
        {autoFillSources.length > 0 && (
          <div className="bg-emerald-50/70 border-b border-emerald-100 px-6 py-1.5 text-xs text-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={13} className="text-emerald-600 shrink-0" />
              <span>Valores prellenados desde: <strong>{autoFillSources.join(', ')}</strong></span>
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">Puedes editarlos libremente</span>
          </div>
        )}

        {/* NAVEGACIÓN POR PESTAÑAS */}
        <div className="flex border-b border-slate-100 px-6 bg-slate-50/70 shrink-0">
          <button
            onClick={() => setActiveTab('cardio')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition ${
              activeTab === 'cardio'
                ? 'border-teal-600 text-teal-700 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Heart size={16} className={activeTab === 'cardio' ? 'text-teal-600' : 'text-slate-400'} />
            <span>Cardiovascular (Riesgo CV MIVOR + Brecha LDL)</span>
          </button>

          <button
            onClick={() => setActiveTab('renal')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition ${
              activeTab === 'renal'
                ? 'border-teal-600 text-teal-700 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity size={16} className={activeTab === 'renal' ? 'text-teal-600' : 'text-slate-400'} />
            <span>Función Renal (Filtrado MIVOR 2021)</span>
          </button>

          <button
            onClick={() => setActiveTab('fragility')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition ${
              activeTab === 'fragility'
                ? 'border-teal-600 text-teal-700 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock size={16} className={activeTab === 'fragility' ? 'text-teal-600' : 'text-slate-400'} />
            <span>Fragilidad & Caídas (TUG + Barthel)</span>
          </button>
        </div>

        {/* CONTENIDO SCROLLABLE INTERNO */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ======================================================== */}
          {/* TAB 1: CARDIOVASCULAR (Riesgo CV MIVOR + LIPIDWISE)               */}
          {/* ======================================================== */}
          {activeTab === 'cardio' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Edad (40-89 años)
                  </label>
                  <input
                    type="number"
                    min="40"
                    max="89"
                    value={cardioForm.age}
                    onChange={(e) => setCardioForm({ ...cardioForm, age: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 font-semibold"
                  />
                  <span className="text-[11px] text-slate-400">
                    {cardioForm.age >= 70 ? 'Aplica Riesgo CV MIVOR-OP (Sénior)' : 'Aplica Riesgo CV MIVOR estándar'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Sexo Biológico
                  </label>
                  <select
                    value={cardioForm.gender}
                    onChange={(e) => setCardioForm({ ...cardioForm, gender: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 font-semibold"
                  >
                    <option value="male">Hombre</option>
                    <option value="female">Mujer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Presión Sistólica (mmHg)
                  </label>
                  <input
                    type="number"
                    min="90"
                    max="220"
                    value={cardioForm.systolic_bp}
                    onChange={(e) => setCardioForm({ ...cardioForm, systolic_bp: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 font-semibold"
                  />
                  <span className="text-[11px] text-slate-400">Ejemplo: 120, 135, 150</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Colesterol Total (mg/dL)
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="450"
                    value={cardioForm.total_cholesterol}
                    onChange={(e) => setCardioForm({ ...cardioForm, total_cholesterol: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Colesterol HDL (mg/dL)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="140"
                    value={cardioForm.hdl_cholesterol}
                    onChange={(e) => setCardioForm({ ...cardioForm, hdl_cholesterol: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    c-LDL Actual (mg/dL)
                  </label>
                  <input
                    type="number"
                    min="20"
                    max="450"
                    value={cardioForm.current_ldl}
                    onChange={(e) => setCardioForm({ ...cardioForm, current_ldl: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 font-semibold"
                  />
                  <span className="text-[11px] text-slate-400">Para cálculo de Brecha Lípidos MIVOR</span>
                </div>

                <div className="md:col-span-3 flex flex-wrap items-center gap-6 pt-2 border-t border-slate-200/70">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={cardioForm.is_smoker}
                      onChange={(e) => setCardioForm({ ...cardioForm, is_smoker: e.target.checked })}
                      className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                    />
                    <span className="text-sm font-medium text-slate-700">Fumador activo</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={cardioForm.has_prior_ascvd}
                      onChange={(e) => setCardioForm({ ...cardioForm, has_prior_ascvd: e.target.checked })}
                      className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                    />
                    <span className="text-sm font-medium text-slate-700">Enfermedad cardiovascular previa conocida (infarto, ictus, stent)</span>
                  </label>

                  <button
                    onClick={handleCalculateCardio}
                    disabled={isCalculatingCardio}
                    className="ml-auto px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md shadow-teal-600/20 transition flex items-center gap-2 text-sm disabled:opacity-50"
                  >
                    <Zap size={16} />
                    <span>{isCalculatingCardio ? 'Calculando...' : 'Calcular Riesgo & Brecha LDL'}</span>
                  </button>
                </div>
              </div>

              {/* RESULTADOS DE CARDIO */}
              {score2Result && lipidwiseResult && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in">
                  {/* TARJETA Riesgo CV MIVOR */}
                  <div className="bg-white rounded-2xl border-2 border-slate-100 p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Heart className="text-rose-500" size={20} />
                        <h3 className="font-bold text-slate-800 text-base">
                          {score2Result.is_score2_op ? 'Riesgo CV MIVOR-OP (Adulto Mayor)' : 'Riesgo CV MIVOR (Europeo ESC)'}
                        </h3>
                      </div>
                      <span className={`px-2.5 py-1 text-xs font-extrabold rounded-full ${
                        score2Result.risk_badge === 'green' ? 'bg-emerald-100 text-emerald-800' :
                        score2Result.risk_badge === 'yellow' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        Riesgo {score2Result.risk_category}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold text-slate-900">
                        {score2Result.risk_percentage}%
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        riesgo estimado de evento fatal o no fatal en 10 años
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl">
                      {score2Result.interpretation}
                    </p>

                    <div>
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Recomendaciones preventivas ESC:
                      </h4>
                      <ul className="space-y-1.5">
                        {score2Result.clinical_guidance.map((g, idx) => (
                          <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                            <CheckCircle2 size={13} className="text-teal-600 shrink-0 mt-0.5" />
                            <span>{g}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* TARJETA LIPIDWISE (BRECHA LDL) */}
                  <div className="bg-white rounded-2xl border-2 border-slate-100 p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="text-teal-600" size={20} />
                        <h3 className="font-bold text-slate-800 text-base">Lípidos MIVOR (Brecha c-LDL)</h3>
                      </div>
                      <span className={`px-2.5 py-1 text-xs font-extrabold rounded-full ${
                        lipidwiseResult.at_target ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {lipidwiseResult.at_target ? 'En Objetivo' : 'Fuera de Meta'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl text-center">
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase">LDL Actual</span>
                        <div className="text-2xl font-black text-slate-800">{lipidwiseResult.current_ldl} <span className="text-xs font-normal">mg/dL</span></div>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-teal-700 uppercase">Meta ESC ({score2Result.risk_category})</span>
                        <div className="text-2xl font-black text-teal-700">&lt; {lipidwiseResult.target_ldl} <span className="text-xs font-normal">mg/dL</span></div>
                      </div>
                    </div>

                    {!lipidwiseResult.at_target ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                          <span>Brecha a reducir: <strong className="text-rose-600">+{lipidwiseResult.ldl_gap} mg/dL</strong></span>
                          <span>Reducción necesaria: <strong className="text-rose-600">{lipidwiseResult.reduction_pct_needed}%</strong></span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-rose-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(lipidwiseResult.reduction_pct_needed, 100)}%` }} 
                          />
                        </div>
                        <div className="text-xs text-slate-600 bg-sky-50/70 p-3 rounded-xl border border-sky-100">
                          <strong className="text-sky-900 block mb-1">Estrategia sugerida: {lipidwiseResult.suggested_intensity}</strong>
                          {lipidwiseResult.clinical_strategy}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        <span>Excelente. Tu c-LDL se encuentra dentro de la diana recomendada para tu perfil de riesgo.</span>
                      </div>
                    )}

                    <p className="text-[11px] text-slate-400 leading-snug italic">
                      {lipidwiseResult.educational_note}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: FUNCIÓN RENAL (Filtrado MIVOR 2021)                      */}
          {/* ======================================================== */}
          {activeTab === 'renal' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Creatinina Sérica (mg/dL)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.2"
                    max="15.0"
                    value={renalForm.creatinine}
                    onChange={(e) => setRenalForm({ ...renalForm, creatinine: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 font-semibold"
                  />
                  <span className="text-[11px] text-slate-400">Normal aprox: 0.6 - 1.2 mg/dL</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Edad (años)
                  </label>
                  <input
                    type="number"
                    min="18"
                    max="115"
                    value={renalForm.age}
                    onChange={(e) => setRenalForm({ ...renalForm, age: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Sexo Biológico
                  </label>
                  <select
                    value={renalForm.gender}
                    onChange={(e) => setRenalForm({ ...renalForm, gender: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 font-semibold"
                  >
                    <option value="male">Hombre</option>
                    <option value="female">Mujer</option>
                  </select>
                </div>

                <div className="md:col-span-3 flex justify-end pt-2 border-t border-slate-200/70">
                  <button
                    onClick={handleCalculateRenal}
                    disabled={isCalculatingRenal}
                    className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md shadow-teal-600/20 transition flex items-center gap-2 text-sm disabled:opacity-50"
                  >
                    <Activity size={16} />
                    <span>{isCalculatingRenal ? 'Calculando...' : 'Calcular Filtrado Glomerular'}</span>
                  </button>
                </div>
              </div>

              {/* RESULTADO RENAL */}
              {ckdResult && (
                <div className="bg-white rounded-2xl border-2 border-slate-100 p-6 shadow-sm space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Ecuación Oficial NKF/ASN Filtrado MIVOR 2021 (Race-Free)
                      </span>
                      <h3 className="text-xl font-bold text-slate-800">Filtrado Glomerular Estimado (eGFR)</h3>
                    </div>
                    <span className={`px-3 py-1 text-sm font-black rounded-full ${
                      ckdResult.badge_color === 'green' ? 'bg-emerald-100 text-emerald-800' :
                      ckdResult.badge_color === 'yellow' ? 'bg-amber-100 text-amber-800' :
                      ckdResult.badge_color === 'orange' ? 'bg-orange-100 text-orange-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      Estadio {ckdResult.stage}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-3">
                    <span className="text-5xl font-black text-slate-900">{ckdResult.egfr}</span>
                    <span className="text-sm font-semibold text-slate-500">mL/min/1.73 m²</span>
                    <span className="text-sm font-bold text-slate-700 ml-2">({ckdResult.stage_label})</span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-100 text-xs text-slate-700 leading-relaxed">
                    <p><strong>Interpretación Clínica:</strong> {ckdResult.clinical_interpretation}</p>
                    <p><strong>Pauta de Seguimiento:</strong> {ckdResult.follow_up_recommendation}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: FRAGILIDAD & CAÍDAS (TUG & BARTHEL)               */}
          {/* ======================================================== */}
          {activeTab === 'fragility' && (
            <div className="space-y-6">
              {/* CRONÓMETRO TIMED UP AND GO */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="text-teal-600" size={20} />
                    <h3 className="font-bold text-slate-800 text-base">Prueba Timed Up and Go (TUG)</h3>
                  </div>
                  <span className="text-xs text-slate-500">Cronómetro interactivo</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Instrucciones:</strong> El paciente se sienta en una silla apoyando la espalda. Al pulsar "Iniciar", se levanta, camina 3 metros a paso cómodo, se da la vuelta, regresa a la silla y se sienta de nuevo. Al sentarse, pulsa "Detener".
                </p>

                <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="text-5xl font-black text-slate-900 font-mono tracking-wider mb-4">
                    {timerDisplay.toFixed(1)} <span className="text-lg font-normal text-slate-400">segundos</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {!isTimerRunning ? (
                      <button
                        onClick={startTugTimer}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition flex items-center gap-2 text-sm"
                      >
                        <Play size={16} />
                        <span>Iniciar Cronómetro</span>
                      </button>
                    ) : (
                      <button
                        onClick={stopTugTimer}
                        className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md transition flex items-center gap-2 text-sm animate-pulse"
                      >
                        <Square size={16} />
                        <span>Detener (Llegada)</span>
                      </button>
                    )}

                    <button
                      onClick={resetTugTimer}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition flex items-center gap-1.5 text-sm"
                    >
                      <RotateCcw size={15} />
                      <span>Reiniciar</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-200/60">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> &lt; 10s: Normal</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> 10 - 20s: Fragilidad leve</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> &gt; 20s: Alto riesgo de caídas</span>
                </div>
              </div>

              {/* SELECCIÓN RÁPIDA ÍNDICE DE BARTHEL */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-base">Escala de Autonomía Funcional (Barthel)</h3>
                  <span className="text-xs font-bold text-teal-700">
                    Puntos: {Object.values(barthelForm).reduce((acc, curr) => acc + Number(curr), 0)} / 100
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Deambulación / Marcha</label>
                    <select
                      value={barthelForm.mobility}
                      onChange={(e) => setBarthelForm({ ...barthelForm, mobility: Number(e.target.value) })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl"
                    >
                      <option value="15">Independiente (camina &gt;50m solo)</option>
                      <option value="10">Necesita ayuda o bastón</option>
                      <option value="5">En silla de ruedas independiente</option>
                      <option value="0">Inmóvil / encamado</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Subir y Bajar Escaleras</label>
                    <select
                      value={barthelForm.stairs}
                      onChange={(e) => setBarthelForm({ ...barthelForm, stairs: Number(e.target.value) })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl"
                    >
                      <option value="10">Independiente sin supervisión</option>
                      <option value="5">Necesita ayuda física o barandilla</option>
                      <option value="0">Incapaz de subir escaleras</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Traslado Sillón - Cama</label>
                    <select
                      value={barthelForm.transfers}
                      onChange={(e) => setBarthelForm({ ...barthelForm, transfers: Number(e.target.value) })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl"
                    >
                      <option value="15">Independiente</option>
                      <option value="10">Mínima ayuda física o supervisión</option>
                      <option value="5">Gran ayuda (1-2 personas)</option>
                      <option value="0">Incapaz / dependiente</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Vestido y Aseo Personal</label>
                    <select
                      value={barthelForm.dressing}
                      onChange={(e) => setBarthelForm({ ...barthelForm, dressing: Number(e.target.value) })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl"
                    >
                      <option value="10">Independiente (se viste y calza solo)</option>
                      <option value="5">Necesita ayuda para botones o cordones</option>
                      <option value="0">Completamente dependiente</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200/60">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={historyOfFalls}
                      onChange={(e) => setHistoryOfFalls(e.target.checked)}
                      className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                    />
                    <span className="text-xs font-semibold text-slate-700">Ha sufrido alguna caída en los últimos 6 meses</span>
                  </label>

                  <button
                    onClick={handleCalculateFragility}
                    disabled={isCalculatingFragility}
                    className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition flex items-center gap-2 text-sm disabled:opacity-50"
                  >
                    <CheckCircle2 size={16} />
                    <span>{isCalculatingFragility ? 'Evaluando...' : 'Evaluar Riesgo Global de Caídas'}</span>
                  </button>
                </div>
              </div>

              {/* RESULTADO FRAGILIDAD */}
              {fragilityResult && (
                <div className="bg-white rounded-2xl border-2 border-slate-100 p-5 shadow-sm space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Evaluación Multidimensional de Movilidad
                      </span>
                      <h3 className="text-lg font-bold text-slate-800">
                        Riesgo Global de Caídas: <span className={
                          fragilityResult.risk_badge === 'green' ? 'text-emerald-600' :
                          fragilityResult.risk_badge === 'yellow' ? 'text-amber-600' : 'text-rose-600'
                        }>{fragilityResult.overall_fall_risk}</span>
                      </h3>
                    </div>
                    <span className={`px-3 py-1 text-xs font-black rounded-full ${
                      fragilityResult.risk_badge === 'green' ? 'bg-emerald-100 text-emerald-800' :
                      fragilityResult.risk_badge === 'yellow' ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {fragilityResult.barthel_dependency || 'Evaluado'}
                    </span>
                  </div>

                  {fragilityResult.tug_interpretation && (
                    <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 border border-slate-100">
                      <strong>Prueba de marcha (TUG):</strong> {fragilityResult.tug_interpretation}
                    </div>
                  )}

                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Acciones recomendadas para la familia y cuidadores:
                    </h4>
                    <ul className="space-y-1.5">
                      {fragilityResult.suggested_actions.map((act, i) => (
                        <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                          <CheckCircle2 size={13} className="text-teal-600 shrink-0 mt-0.5" />
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* PIE DE PÁGINA CON DISCLAIMER CLÍNICO CDSS */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <Info size={13} className="text-slate-400" />
            <span>MIVOR.ai actúa como soporte informativo para facilitar el diálogo clínico médico-paciente.</span>
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
