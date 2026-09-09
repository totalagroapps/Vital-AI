import { useState, useEffect } from 'react';
import { 
  Search, 
  Loader2, 
  ExternalLink, 
  Sparkles, 
  AlertCircle, 
  X, 
  Calendar, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2 
} from 'lucide-react';
import { useLanguage } from './contexts/LanguageContext';
import LanguageSelector from './components/LanguageSelector';

const SUGGESTED_TOPICS = [
  { es: 'Inmunoterapia Oncológica', en: 'Cancer Immunotherapy', fr: 'Immunothérapie anticancéreuse', ar: 'العلاج المناعي للأورام' },
  { es: 'Cáncer y Oncología', en: 'Cancer & Oncology', fr: 'Cancer et Oncologie', ar: 'السرطان وعلم الأورام' },
  { es: 'Cardiología Avanzada', en: 'Advanced Cardiology', fr: 'Cardiologie avancée', ar: 'أمراض القلب المتقدمة' },
  { es: 'Diabetes y Metabolismo', en: 'Diabetes & Metabolism', fr: 'Diabète et Métabolisme', ar: 'السكري والتمثيل الغذائي' },
  { es: 'Alzheimer y Neurociencias', en: 'Alzheimer & Neuroscience', fr: 'Alzheimer et Neurosciences', ar: 'الزهايمر وعلم الأعصاب' },
  { es: 'Terapias Celulares y ARN', en: 'Cell & RNA Therapies', fr: 'Thérapies cellulaires et ARN', ar: 'العلاجات الخلوية وحمض RNA' },
  { es: 'Longevidad y Antienvejecimiento', en: 'Longevity & Healthy Aging', fr: 'Longévité et Vieillissement', ar: 'طول العمر ومكافحة الشيخوخة' },
  { es: 'Salud Preventiva', en: 'Preventive Health', fr: 'Santé préventive', ar: 'الوقاية الصحية' },
];

export default function MedicalSearchModal({ isOpen, onClose, userProfile, token, apiUrl }) {
  const { t, language } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSource, setSelectedSource] = useState('all');
  const [expandedCards, setExpandedCards] = useState({});

  const toggleExpand = (idx) => {
    setExpandedCards(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const fetchResults = async (searchQuery = query) => {
    const q = (searchQuery || '').trim();
    if (!q) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const url = `${apiUrl}/api/medical/search`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          query: q,
          max_results: 15,
          user_id: userProfile?.id || 1
        }),
      });

      if (!response.ok) {
        let errMsg = 'Ocurrió un error al buscar';
        try {
          const errData = await response.json();
          errMsg = errData.detail || errMsg;
        } catch (e) {}
        throw new Error(errMsg);
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      setError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const condition = userProfile?.chronic_conditions?.split(',')?.[0]?.trim();
      const defaultQuery = language === 'en' ? 'preventive health' : language === 'fr' ? 'santé préventive' : language === 'ar' ? 'الوقاية الصحية' : 'salud preventiva';
      const initialQuery = condition && condition.toLowerCase() !== 'ninguna' && condition.toLowerCase() !== 'none' ? condition : defaultQuery;
      setQuery(initialQuery);
      fetchResults(initialQuery);
    }
  }, [isOpen, language]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    await fetchResults(query);
  };

  const handleTopicClick = (topicName) => {
    setQuery(topicName);
    fetchResults(topicName);
  };

  if (!isOpen) return null;

  // Compute counts per source
  const pubmedCount = results.filter(r => (r.source_type || '').toLowerCase() === 'pubmed').length;
  const clinicalTrialsCount = results.filter(r => (r.source_type || '').toLowerCase().includes('clinical')).length;
  const cochraneCount = results.filter(r => (r.source_type || '').toLowerCase().includes('cochrane')).length;

  // Filtered results
  const filteredResults = results.filter(doc => {
    if (selectedSource === 'all') return true;
    const src = (doc.source_type || '').toLowerCase();
    if (selectedSource === 'pubmed') return src === 'pubmed';
    if (selectedSource === 'clinical_trials') return src.includes('clinical');
    if (selectedSource === 'cochrane') return src.includes('cochrane');
    return true;
  });

  const getSourceBadge = (sourceType) => {
    const src = (sourceType || '').toLowerCase();
    if (src === 'pubmed') {
      return (
        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          PubMed
        </span>
      );
    }
    if (src.includes('clinical')) {
      return (
        <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
          ClinicalTrials.gov
        </span>
      );
    }
    if (src.includes('cochrane')) {
      return (
        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Cochrane Library
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
        {sourceType || 'Estudio'}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4">
      <div className="bg-white text-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200" style={{ color: "#0f172a" }}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-brand text-white flex items-center justify-center shadow-md shadow-brand/20 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                  {t('latest_medical_advances') || 'Últimos Avances Médicos'}
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full uppercase">
                  <CheckCircle2 size={11} className="text-teal-600" /> RAG Multi-fuente
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                {t('latest_medical_advances_desc') || 'Busca los últimos avances médicos sobre cualquier enfermedad o tratamiento.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <button 
              onClick={onClose} 
              aria-label="Cerrar modal"
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50 custom-scrollbar space-y-4">
          
          {/* Search Box */}
          <form onSubmit={handleSearch} className="relative w-full group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-500 group-focus-within:text-brand transition-colors" />
            </div>
            <input
              type="text"
              style={{ color: "#0f172a", backgroundColor: "#ffffff" }}
              className="block w-full pl-12 pr-36 py-3.5 bg-white border-2 border-slate-300 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all shadow-sm text-sm md:text-base font-semibold"
              placeholder={t('search_studies_placeholder') || 'Buscar por enfermedad, tratamiento o patología (ej: Cáncer, Diabetes, Inmunoterapia)...'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute inset-y-0 right-28 pr-2 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                aria-label="Limpiar búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute inset-y-1.5 right-1.5 bg-brand hover:opacity-90 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold rounded-xl px-4 md:px-6 transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed text-xs md:text-sm"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : (t('search_action') || 'Buscar')}
            </button>
          </form>

          {/* Quick Discovery Pills */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t('suggested_topics') || 'Avances sugeridos:'}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_TOPICS.map((topic, i) => {
                const label = topic[language] || topic.es;
                const isSelected = query.toLowerCase() === label.toLowerCase();
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleTopicClick(label)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all border ${
                      isSelected
                        ? 'bg-brand text-white border-brand shadow-sm scale-102'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-brand/40 hover:bg-teal-50/50 hover:text-brand'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Source Tabs */}
          {results.length > 0 && (
            <div className="flex items-center gap-2 pt-2 border-t border-slate-200/70 overflow-x-auto pb-1">
              <span className="text-xs font-bold text-slate-500 shrink-0 mr-1 flex items-center gap-1">
                <Layers size={13} /> {t('sources_label') || 'Fuentes:'}
              </span>
              <button
                type="button"
                onClick={() => setSelectedSource('all')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${
                  selectedSource === 'all'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {t('all_sources') || 'Todas'} ({results.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedSource('pubmed')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${
                  selectedSource === 'pubmed'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                PubMed ({pubmedCount})
              </button>
              <button
                type="button"
                onClick={() => setSelectedSource('clinical_trials')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${
                  selectedSource === 'clinical_trials'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-purple-50 hover:text-purple-700'
                }`}
              >
                ClinicalTrials.gov ({clinicalTrialsCount})
              </button>
              <button
                type="button"
                onClick={() => setSelectedSource('cochrane')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${
                  selectedSource === 'cochrane'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
                }`}
              >
                Cochrane ({cochraneCount})
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm flex items-start gap-3 w-full">
              <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={18} />
              <div>
                <h3 className="text-red-800 font-semibold text-sm">{t('search_error_title') || 'No se pudo completar la búsqueda'}</h3>
                <p className="text-red-600 text-xs mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Results List */}
          {filteredResults.length > 0 && (
            <div className="space-y-3 w-full">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  {t('results_found') || 'Avances Médicos Encontrados'} ({filteredResults.length})
                </h3>
                {query && (
                  <span className="text-xs text-slate-400 font-medium">
                    Búsqueda: <strong className="text-slate-700">"{query}"</strong>
                  </span>
                )}
              </div>
              
              <div className="grid gap-3.5">
                {filteredResults.map((doc, idx) => {
                  const isExpanded = !!expandedCards[idx];
                  return (
                    <div 
                      key={idx} 
                      className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm transition-all hover:shadow-md hover:border-brand/40 w-full"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        {getSourceBadge(doc.source_type)}
                        {doc.publication_date && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-semibold">
                            <Calendar size={12} /> {doc.publication_date}
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-bold text-slate-900 mb-2 leading-snug break-words">
                        {doc.title}
                      </h4>

                      <p className={`text-slate-600 text-xs md:text-sm leading-relaxed break-words ${
                        isExpanded ? '' : 'line-clamp-3'
                      }`}>
                        {doc.abstract || 'Sin resumen disponible.'}
                      </p>

                      {doc.abstract && doc.abstract.length > 220 && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(idx)}
                          className="mt-1.5 text-xs font-bold text-brand hover:underline flex items-center gap-1 inline-block"
                        >
                          {isExpanded ? (
                            <>Mostrar menos <ChevronUp size={13} /></>
                          ) : (
                            <>Leer resumen completo <ChevronDown size={13} /></>
                          )}
                        </button>
                      )}

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 gap-3">
                        <p className="text-[11px] text-slate-500 truncate max-w-[65%] font-medium" title={doc.authors?.join(', ')}>
                          {doc.authors && doc.authors.length > 0 
                            ? doc.authors.join(', ') 
                            : (t('authors_not_specified') || 'Autores no especificados')}
                        </p>
                        {doc.url && (
                          <a 
                            href={doc.url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-brand hover:opacity-80 transition-colors shrink-0 bg-teal-50 hover:bg-teal-100/70 text-teal-800 px-3 py-1.5 rounded-lg border border-teal-200"
                          >
                            {t('view_original') || 'Ver estudio'} <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Empty State */}
          {!loading && !error && filteredResults.length === 0 && results.length > 0 && (
            <div className="text-center text-slate-500 py-12 px-4 bg-white rounded-2xl border border-slate-200">
              <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No hay avances en la fuente seleccionada.</p>
              <button 
                type="button"
                onClick={() => setSelectedSource('all')}
                className="mt-3 text-xs font-bold text-brand hover:underline"
              >
                Ver todos los resultados ({results.length})
              </button>
            </div>
          )}

          {!loading && !error && results.length === 0 && (
            <div className="text-center text-slate-500 py-12 px-4 bg-white rounded-2xl border border-slate-200">
              <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-800">
                {t('no_recent_studies') || 'Busca cualquier enfermedad o tratamiento médico'}
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                {t('try_manual_search') || 'Escribe una patología o haz clic en alguno de los avances sugeridos para consultar en PubMed, ClinicalTrials y Cochrane.'}
              </p>
            </div>
          )}
          
          {/* Loading state */}
          {loading && (
            <div className="text-center text-slate-500 py-16 flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center shadow-sm">
                <Loader2 className="animate-spin text-brand" size={26} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 animate-pulse">
                  {t('searching_latest_research') || 'Buscando los últimos avances médicos en PubMed, ClinicalTrials y Cochrane...'}
                </p>
                <p className="text-xs text-slate-400 mt-1">Conectando con literatura científica internacional</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
