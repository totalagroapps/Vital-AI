import React, { useState, useEffect } from 'react';
import { Apple, ShoppingCart, RefreshCw, ChevronLeft, Heart, Info, Coffee, Utensils, UtensilsCrossed, Cookie } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function NutritionDashboard({ apiUrl, onNavigateHome }) {
  const { t } = useLanguage();
  const [dietPlan, setDietPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('plan'); // 'plan' or 'shopping'

  const fetchOrGenerateDiet = async (forceRegenerate = false) => {
    try {
      const savedProfile = localStorage.getItem('mivor_patient_profile');
      let profileId = null;
      if (savedProfile) {
        profileId = JSON.parse(savedProfile).id;
      }

      // Check cache first
      const cacheKey = `mivor_diet_${profileId || 'default'}`;
      if (!forceRegenerate) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          setDietPlan(JSON.parse(cached));
          return;
        }
      }

      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/api/patient/nutrition/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ profile_id: profileId })
      });

      if (!res.ok) throw new Error('Failed to generate diet');
      const data = await res.json();
      setDietPlan(data);
      localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (err) {
      console.error(err);
      alert("No se pudo generar la dieta en este momento. Inténtalo más tarde.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrGenerateDiet();
  }, []);

  const getMealIcon = (mealType) => {
    switch(mealType) {
      case 'breakfast': return <Coffee size={18} className="text-amber-500" />;
      case 'lunch': return <Utensils size={18} className="text-emerald-500" />;
      case 'dinner': return <UtensilsCrossed size={18} className="text-indigo-500" />;
      case 'snack': return <Cookie size={18} className="text-rose-500" />;
      default: return <Apple size={18} />;
    }
  };

  const getMealLabel = (mealType) => {
    switch(mealType) {
      case 'breakfast': return 'Desayuno';
      case 'lunch': return 'Almuerzo';
      case 'dinner': return 'Cena';
      case 'snack': return 'Snack';
      default: return mealType;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-6">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onNavigateHome} className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-mivor-navy">Mi Nutrición IA</h1>
            <p className="text-sm text-slate-500">Dieta adaptada a tu salud</p>
          </div>
        </div>
        <button 
          onClick={() => fetchOrGenerateDiet(true)} 
          disabled={loading}
          className="p-2 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-4 mt-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <Apple size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-700">Diseñando tu menú...</h3>
            <p className="text-slate-500 mt-2 max-w-sm">Nuestra IA clínica está analizando tus condiciones crónicas y alergias para crear un plan nutricional seguro y delicioso.</p>
          </div>
        ) : dietPlan ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            
            {/* Context Card */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-md">
              <div className="flex items-start gap-4">
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm shrink-0">
                  <Heart size={28} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold mb-1">Por qué esta dieta es ideal para ti</h2>
                  <p className="text-emerald-50 text-sm leading-relaxed">{dietPlan.patient_context}</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-slate-200/50 rounded-2xl w-full max-w-sm mx-auto">
              <button 
                onClick={() => setActiveTab('plan')}
                className={`flex-1 py-2.5 px-4 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${activeTab === 'plan' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Utensils size={18} />
                Menú Semanal
              </button>
              <button 
                onClick={() => setActiveTab('shopping')}
                className={`flex-1 py-2.5 px-4 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${activeTab === 'shopping' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <ShoppingCart size={18} />
                Compras
              </button>
            </div>

            {activeTab === 'plan' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dietPlan.weekly_plan?.map((dayPlan, idx) => (
                  <div key={idx} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="font-extrabold text-lg text-slate-800 border-b border-slate-100 pb-3 mb-4">{dayPlan.day}</h3>
                    <div className="space-y-4">
                      {['breakfast', 'lunch', 'snack', 'dinner'].map((mealType) => (
                        <div key={mealType} className="flex gap-3 items-start">
                          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                            {getMealIcon(mealType)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">{getMealLabel(mealType)}</p>
                            <p className="text-sm text-slate-700 leading-snug">{dayPlan.meals[mealType]}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'shopping' && (
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                  <div className="bg-teal-100 text-teal-600 p-2.5 rounded-xl">
                    <ShoppingCart size={24} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xl text-slate-800">Lista del Supermercado</h3>
                    <p className="text-sm text-slate-500">Ingredientes para tu semana</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {dietPlan.shopping_list?.map((cat, idx) => (
                    <div key={idx}>
                      <h4 className="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wider text-teal-600">{cat.category}</h4>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {cat.items.map((item, i) => (
                          <li key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100">
                            <div className="w-5 h-5 rounded border-2 border-teal-200 bg-white"></div>
                            <span className="text-sm text-slate-700 font-medium">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        ) : null}
      </div>
    </div>
  );
}
