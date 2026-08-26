import { useState, useEffect } from 'react';
import { Search, Loader2, ExternalLink, BookOpen, AlertCircle, X } from 'lucide-react';

export default function MedicalSearchModal({ isOpen, onClose, userProfile, token, apiUrl }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchResults = async (searchQuery = query) => {
    setLoading(true);
    setError(null);
    try {
      const url = apiUrl + '/api/medical/search';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: searchQuery,
          max_results: 10,
          user_id: 1 // hardcoded or userProfile.id if available
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Ocurrió un error al buscar');
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Cuando el paciente abre el modal, buscamos automáticamente basado en sus enfermedades
    if (isOpen) {
      setQuery('');
      fetchResults('');
    }
  }, [isOpen]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    await fetchResults(query);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center shadow-md">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Tus Notificaciones Médicas</h2>
              <p className="text-xs text-slate-500">Últimos estudios e investigaciones publicadas</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50 custom-scrollbar">
          
          <form onSubmit={handleSearch} className="mb-6 relative w-full group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400 group-focus-within:text-brand transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-12 pr-32 py-3 bg-white border-2 border-slate-200 rounded-xl text-black placeholder-slate-400 focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all shadow-sm text-sm md:text-base"
              placeholder="Buscar estudios específicos..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute inset-y-1.5 right-1.5 bg-brand hover:bg-brand disabled:bg-slate-300 text-white font-medium rounded-lg px-4 md:px-6 transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed text-sm"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : 'Buscar'}
            </button>
          </form>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm mb-6 flex items-start gap-3 w-full">
              <AlertCircle className="text-red-500 mt-0.5 flex-shrink-0" size={18} />
              <div>
                <h3 className="text-red-800 font-semibold text-sm">No se pudo completar la búsqueda</h3>
                <p className="text-red-600 text-xs mt-1">{error}</p>
              </div>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-4 w-full">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-2">
                Resultados Encontrados ({results.length})
              </h3>
              
              <div className="grid gap-4">
                {results.map((doc, idx) => (
                  <div key={idx} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-brand/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="bg-semantic-info-bg text-semantic-info-text text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                        {doc.source_type}
                      </span>
                      {doc.publication_date && (
                        <span className="text-xs text-slate-400 font-medium">{doc.publication_date}</span>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-slate-800 mb-2 leading-snug">{doc.title}</h4>
                    <p className="text-slate-600 text-sm mb-4 line-clamp-3 leading-relaxed">{doc.abstract}</p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                      <p className="text-xs text-slate-500 truncate max-w-[70%] font-medium">
                        {doc.authors && doc.authors.length > 0 ? doc.authors.join(', ') : 'Autores no especificados'}
                      </p>
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-brand hover:text-brand text-xs font-bold transition-colors"
                      >
                        Ver original <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {!loading && !error && results.length === 0 && (
            <div className="text-center text-slate-500 py-12 px-4">
              <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-medium">No se encontraron estudios recientes para tus parámetros.</p>
              <p className="text-xs text-slate-400 mt-1">Intenta realizar una búsqueda manual usando otra palabra clave.</p>
            </div>
          )}
          
          {loading && (
            <div className="text-center text-slate-500 py-16 flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-semantic-info-bg flex items-center justify-center animate-pulse">
                <Loader2 className="animate-spin text-brand" size={24} />
              </div>
              <p className="text-sm font-medium animate-pulse">Buscando las últimas investigaciones para ti...</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
