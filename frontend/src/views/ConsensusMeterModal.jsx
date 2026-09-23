import React, { useState } from 'react';
import { 
  Sparkles, 
  Search, 
  X, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  BookOpen, 
  Layers, 
  Loader2, 
  ArrowRight,
  ShieldCheck,
  Info
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function ConsensusMeterModal({ 
  isOpen, 
  onClose, 
  apiUrl, 
  authHeaders 
}) {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [consensusData, setConsensusData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const suggestedQueries = [
    "¿El ayuno intermitente reduce la resistencia a la insulina?",
    "¿Añadir ezetimiba a estatinas reduce eventos cardiovasculares?",
    "¿Aspirina en prevención primaria en personas mayores de 70 años?",
    "¿La dieta mediterránea previene el deterioro cognitivo?"
  ];

  const handleSearch = async (searchQuery) => {
    const q = (searchQuery || query).trim();
    if (!q) return;
    setQuery(q);
    setIsLoading(true);
    setErrorMsg('');
    setConsensusData(null);

    try {
      const res = await fetch(`${apiUrl}/api/consensus/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(authHeaders || {}) },
        body: JSON.stringify({ query: q, max_articles: 6, language: 'es' })
      });

      if (res.ok) {
        const data = await res.json();
        setConsensusData(data);
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.detail || "No se pudo obtener el consenso sobre esta pregunta científica.");
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("Error de conexión al consultar PubMed.");
    } finally {
      setIsLoading(false);
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
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50/70 via-white to-sky-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-600/20">
              <Layers size={22} strokeWidth={2.4} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Consensus MIVOR</h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                  Evidencia PubMed / Cochrane
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Medidor de consenso científico en la literatura biomédica indexada
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

        {/* CONTENIDO SCROLLABLE */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* BUSCADOR */}
          <div className="space-y-3">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSearch(query); }}
              className="flex items-center gap-2 bg-slate-50 border-2 border-slate-200/80 focus-within:border-teal-500 focus-within:bg-white rounded-2xl p-2 transition shadow-2xs"
            >
              <Search size={20} className="text-slate-400 ml-2 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Plantea una duda clínica (ej. ¿El ayuno intermitente reduce la resistencia a la insulina?)"
                className="flex-1 bg-transparent border-none outline-none text-sm text-slate-800 placeholder-slate-400 font-medium px-2"
              />
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50 shrink-0"
              >
                {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                <span>{isLoading ? 'Analizando...' : 'Medir Consenso'}</span>
              </button>
            </form>

            {/* PREGUNTAS SUGERIDAS */}
            {!consensusData && !isLoading && (
              <div className="pt-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  O prueba con una de estas preguntas clínicas frecuentes:
                </span>
                <div className="flex flex-wrap gap-2">
                  {suggestedQueries.map((sq, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSearch(sq)}
                      className="text-xs font-medium text-slate-600 hover:text-teal-800 bg-slate-100 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-xl px-3 py-1.5 transition text-left"
                    >
                      {sq}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* MENSAJE DE ERROR */}
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* SPINNER DE CARGA */}
          {isLoading && (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <Loader2 size={36} className="text-teal-600 animate-spin" />
              <p className="text-sm font-bold text-slate-700">Consultando bases de datos de PubMed & NCBI...</p>
              <p className="text-xs text-slate-400">Analizando ensayos clínicos y calculando grado de acuerdo de la literatura</p>
            </div>
          )}

          {/* RESULTADOS DE CONSENSO */}
          {consensusData && (
            <div className="space-y-6 animate-fade-in">
              {/* TARJETA PRINCIPAL DEL MEDIDOR */}
              <div className="bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Resultado del Análisis de Evidencia
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                      {consensusData.consensus_classification}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-black ${
                      consensusData.evidence_strength_badge === 'green' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      Rigor: {consensusData.evidence_strength}
                    </span>
                  </div>
                </div>

                {/* BARRA VISUAL DE CONSENSO */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                    <span className="text-emerald-700 flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                      A Favor ({consensusData.consensus_percentage_agree}%)
                    </span>
                    <span className="text-amber-700 flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                      Neutro / Mixto ({consensusData.consensus_percentage_neutral}%)
                    </span>
                    <span className="text-rose-700 flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                      En Contra ({consensusData.consensus_percentage_disagree}%)
                    </span>
                  </div>

                  <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
                    <div 
                      className="bg-emerald-500 transition-all duration-700" 
                      style={{ width: `${consensusData.consensus_percentage_agree}%` }} 
                      title={`A favor: ${consensusData.consensus_percentage_agree}%`}
                    />
                    <div 
                      className="bg-amber-400 transition-all duration-700" 
                      style={{ width: `${consensusData.consensus_percentage_neutral}%` }} 
                      title={`Neutro: ${consensusData.consensus_percentage_neutral}%`}
                    />
                    <div 
                      className="bg-rose-500 transition-all duration-700" 
                      style={{ width: `${consensusData.consensus_percentage_disagree}%` }} 
                      title={`En contra: ${consensusData.consensus_percentage_disagree}%`}
                    />
                  </div>
                </div>

                {/* SÍNTESIS DE LA CIENCIA */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200/70 space-y-2 text-xs leading-relaxed text-slate-700">
                  <p className="font-semibold text-slate-900 text-sm">
                    {consensusData.synthesis_summary}
                  </p>
                  <p className="text-slate-500 pt-1 border-t border-slate-100">
                    <strong className="text-slate-700">Implicación clínica:</strong> {consensusData.clinical_implication}
                  </p>
                </div>
              </div>

              {/* LISTA DE ARTÍCULOS EVALUADOS */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span>Estudios Biomédicos Analizados ({consensusData.total_articles_analyzed} publicaciones en PubMed)</span>
                  <span className="text-teal-700 text-[11px] font-semibold">Revisados por pares</span>
                </h4>

                <div className="space-y-3">
                  {consensusData.articles.map((art) => (
                    <div key={art.source_id} className="bg-white border-2 border-slate-100 hover:border-teal-200 rounded-2xl p-4 transition space-y-2 shadow-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full ${
                          art.stance === 'agree' ? 'bg-emerald-100 text-emerald-800' :
                          art.stance === 'disagree' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {art.stance === 'agree' ? 'Favorable / A favor' :
                           art.stance === 'disagree' ? 'Desfavorable' : 'Neutro / Inconcluso'}
                        </span>

                        <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg">
                          {art.study_type}
                        </span>
                      </div>

                      <h5 className="font-bold text-slate-900 text-sm leading-snug">
                        {art.title}
                      </h5>

                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <strong>Hallazgo:</strong> {art.summary_finding}
                      </p>

                      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span>{art.authors} • <em>{art.journal}</em> ({art.year})</span>
                        <a 
                          href={art.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-teal-700 hover:text-teal-900 font-bold ml-auto"
                        >
                          <span>Ver en PubMed (PMID: {art.source_id})</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* PIE DE PÁGINA */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <Info size={13} className="text-slate-400" />
            <span>MIVOR Consensus recopila literatura de PubMed (NLM/NIH). La evidencia debe ser contextualizada por su médico.</span>
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
