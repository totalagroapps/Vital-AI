import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, 
  X, 
  Flame, 
  Trophy, 
  Check, 
  RotateCcw, 
  Play, 
  Sparkles, 
  ChevronRight, 
  ArrowLeft,
  Timer,
  Zap,
  Star,
  Award
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function CognitiveGamesModal({ 
  isOpen, 
  onClose, 
  apiUrl, 
  authHeaders 
}) {
  const { t } = useLanguage();
  const [selectedGame, setSelectedGame] = useState(null); // null | 'memory' | 'math' | 'pairs'
  const [stats, setStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Cargar estadísticas
  useEffect(() => {
    if (isOpen) {
      fetchStats();
      setSelectedGame(null);
    }
  }, [isOpen]);

  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const res = await fetch(`${apiUrl}/api/games/history`, {
        headers: authHeaders || {}
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.warn("Error cargando historial de juegos:", e);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const saveGameSession = async (gameType, score, accuracy, duration, difficulty = 'normal', details = {}) => {
    try {
      await fetch(`${apiUrl}/api/games/record_session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(authHeaders || {}) },
        body: JSON.stringify({
          game_type: gameType,
          score: Math.round(score),
          accuracy_percentage: Math.round(accuracy),
          duration_seconds: Number(duration.toFixed(1)),
          difficulty_level: difficulty,
          details
        })
      });
      fetchStats();
    } catch (e) {
      console.error("Error guardando sesión de juego:", e);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92dvh] flex flex-col overflow-hidden border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CABECERA */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-violet-50/70 via-white to-pink-50/70 shrink-0">
          <div className="flex items-center gap-3">
            {selectedGame ? (
              <button 
                onClick={() => setSelectedGame(null)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition mr-1"
                aria-label={t('cognitivegamesmoda_volver_a_lista_de_juegos')}
              >
                <ArrowLeft size={20} />
              </button>
            ) : null}

            <div className="w-11 h-11 rounded-2xl bg-violet-600 flex items-center justify-center text-white shadow-md shadow-violet-600/20">
              <Brain size={24} strokeWidth={2.4} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">{t('patienthome_mente_activa')}</h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800">
                  {t('cognitivegamesmoda_gimnasio_cognitivo')}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {t('cognitivegamesmoda_ejercicios_diarios_breves_de_memoria_cal')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {stats && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-700 text-xs font-bold shadow-xs">
                <Flame size={15} className="text-amber-500 fill-amber-500" />
                <span>{t(stats.streak_days === 1 ? 'games_streak_one' : 'games_streak_many', { count: stats.streak_days })}</span>
              </div>
            )}
            <button 
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              aria-label={t('medicalsearchmodal_cerrar_modal')}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedGame ? (
            /* HUB DE SELECCIÓN DE JUEGO */
            <div className="space-y-6">
              {/* MENSAJE DE BIENESTAR COGNITIVO */}
              {(stats?.cognitive_wellness_code || stats?.cognitive_wellness_message) && (
                <div className="bg-gradient-to-r from-violet-500 to-indigo-600 rounded-2xl p-4 text-white shadow-sm flex items-center gap-3">
                  <Sparkles size={24} className="shrink-0 text-violet-200" />
                  <p className="text-xs md:text-sm font-medium leading-relaxed">
                    {stats.cognitive_wellness_code
                      ? t(`games_wellness_${stats.cognitive_wellness_code}`, { count: stats.streak_days })
                      : stats.cognitive_wellness_message}
                  </p>
                </div>
              )}

              {/* SELECCIÓN DE 3 JUEGOS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* JUEGO 1: MEMORIA DE DÍGITOS */}
                <div 
                  onClick={() => setSelectedGame('memory')}
                  className="bg-slate-50 hover:bg-violet-50/60 border-2 border-slate-100 hover:border-violet-300 rounded-2xl p-5 cursor-pointer transition group flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-black text-xl mb-3 group-hover:scale-105 transition">
                      1 2 3
                    </div>
                    <h3 className="font-bold text-slate-800 text-base mb-1">{t('cognitivegamesmoda_memoria_de_digitos')}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mb-3">
                      {t('cognitivegamesmoda_memoriza_la_secuencia_numerica_que_apare')}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 text-xs font-semibold text-violet-700">
                    <span>
                      {t('cognitivegamesmoda_record')} {t('games_points_short', { count: stats?.games_breakdown?.memory_digits?.best_score || 0 })}
                    </span>
                    <span className="flex items-center gap-1 group-hover:translate-x-1 transition">
                      {t('cognitivegamesmoda_jugar')} <ChevronRight size={14} />
                    </span>
                  </div>
                </div>

                {/* JUEGO 2: CÁLCULO RÁPIDO */}
                <div 
                  onClick={() => setSelectedGame('math')}
                  className="bg-slate-50 hover:bg-emerald-50/60 border-2 border-slate-100 hover:border-emerald-300 rounded-2xl p-5 cursor-pointer transition group flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xl mb-3 group-hover:scale-105 transition">
                      + − ×
                    </div>
                    <h3 className="font-bold text-slate-800 text-base mb-1">{t('cognitivegamesmoda_calculo_rapido')}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mb-3">
                      {t('cognitivegamesmoda_resuelve_operaciones_matematicas_sencill')}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 text-xs font-semibold text-emerald-700">
                    <span>
                      {t('cognitivegamesmoda_record')} {t('games_points_short', { count: stats?.games_breakdown?.speed_math?.best_score || 0 })}
                    </span>
                    <span className="flex items-center gap-1 group-hover:translate-x-1 transition">
                      {t('cognitivegamesmoda_jugar')} <ChevronRight size={14} />
                    </span>
                  </div>
                </div>

                {/* JUEGO 3: EMPAREJAMIENTO VISUAL */}
                <div 
                  onClick={() => setSelectedGame('pairs')}
                  className="bg-slate-50 hover:bg-sky-50/60 border-2 border-slate-100 hover:border-sky-300 rounded-2xl p-5 cursor-pointer transition group flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-black text-xl mb-3 group-hover:scale-105 transition">
                      🧩 🍎
                    </div>
                    <h3 className="font-bold text-slate-800 text-base mb-1">{t('cognitivegamesmoda_emparejamiento')}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mb-3">
                      {t('cognitivegamesmoda_encuentra_todas_las_parejas_de_iconos')}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 text-xs font-semibold text-sky-700">
                    <span>
                      {t('cognitivegamesmoda_record')} {t('games_points_short', { count: stats?.games_breakdown?.pattern_match?.best_score || 0 })}
                    </span>
                    <span className="flex items-center gap-1 group-hover:translate-x-1 transition">
                      {t('cognitivegamesmoda_jugar')} <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              </div>

              {/* HISTORIAL RECIENTE */}
              {stats?.recent_sessions && stats.recent_sessions.length > 0 && (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    {t('cognitivegamesmoda_tus_ultimas_sesiones_de_entrenamiento')}
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {stats.recent_sessions.slice(0, 5).map((s) => (
                      <div key={s.id} className="bg-white px-3.5 py-2 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Trophy size={14} className="text-amber-500" />
                          <span className="font-bold text-slate-700">
                            {s.game_type === 'memory_digits' ? t('cognitivegamesmoda_memoria_de_digitos') :
                             s.game_type === 'speed_math' ? t('cognitivegamesmoda_calculo_rapido') : t('cognitivegamesmoda_emparejamiento_visual')}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-slate-500">
                          <span className="font-semibold text-slate-900">{t('games_points_short', { count: s.score })}</span>
                          <span>{s.accuracy_percentage}{t('cognitivegamesmoda_acierto')}</span>
                          <span className="text-[11px] text-slate-400">{s.created_at}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ZONA DE JUEGO ACTIVO */
            <div className="h-full">
              {selectedGame === 'memory' && (
                <MemoryDigitsGame onFinish={(score, acc, dur) => saveGameSession('memory_digits', score, acc, dur)} onBack={() => setSelectedGame(null)} />
              )}
              {selectedGame === 'math' && (
                <SpeedMathGame onFinish={(score, acc, dur) => saveGameSession('speed_math', score, acc, dur)} onBack={() => setSelectedGame(null)} />
              )}
              {selectedGame === 'pairs' && (
                <PatternMatchGame onFinish={(score, acc, dur) => saveGameSession('pattern_match', score, acc, dur)} onBack={() => setSelectedGame(null)} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-JUEGO 1: MEMORIA DE DÍGITOS
// ============================================================================
function MemoryDigitsGame({ onFinish, onBack }) {
  const { t } = useLanguage();
  const [level, setLevel] = useState(1);
  const [sequence, setSequence] = useState([]);
  const [displayDigit, setDisplayDigit] = useState(null);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [gameState, setGameState] = useState('ready'); // 'ready' | 'showing' | 'input' | 'won' | 'lost'
  const [score, setScore] = useState(0);
  const startTimeRef = useRef(Date.now());

  const startLevel = (currentLevel) => {
    const length = 2 + currentLevel; // Nivel 1: 3 dígitos, Nivel 2: 4 dígitos...
    const newSeq = Array.from({ length }, () => Math.floor(Math.random() * 10));
    setSequence(newSeq);
    setUserInput('');
    setGameState('showing');
    setIsShowingSequence(true);

    let idx = 0;
    setDisplayDigit(newSeq[0]);

    const interval = setInterval(() => {
      idx++;
      if (idx < newSeq.length) {
        setDisplayDigit(newSeq[idx]);
      } else {
        clearInterval(interval);
        setDisplayDigit(null);
        setIsShowingSequence(false);
        setGameState('input');
      }
    }, 1100);
  };

  const handleStartGame = () => {
    startTimeRef.current = Date.now();
    setLevel(1);
    setScore(0);
    startLevel(1);
  };

  const handleDigitPress = (num) => {
    if (gameState !== 'input') return;
    const nextInput = userInput + num;
    setUserInput(nextInput);

    if (nextInput.length === sequence.length) {
      if (nextInput === sequence.join('')) {
        // Acierto
        const nextScore = score + (level * 100);
        setScore(nextScore);
        if (level >= 6) {
          // Juego completado
          setGameState('won');
          const dur = (Date.now() - startTimeRef.current) / 1000;
          onFinish(nextScore, 100, dur);
        } else {
          setLevel(prev => prev + 1);
          setTimeout(() => startLevel(level + 1), 700);
        }
      } else {
        // Fallo
        setGameState('lost');
        const dur = (Date.now() - startTimeRef.current) / 1000;
        const accuracy = Math.round((level / 6) * 100);
        onFinish(score, accuracy, dur);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 max-w-md mx-auto space-y-6">
      <div className="flex items-center justify-between w-full text-xs font-bold text-slate-500 uppercase tracking-wider">
        <span>{t('cognitivegamesmoda_nivel')} {level} / 6</span>
        <span>{t('cognitivegamesmoda_puntuacion')} {t('games_points_short', { count: score })}</span>
      </div>

      {gameState === 'ready' && (
        <div className="text-center space-y-4 py-8">
          <div className="w-16 h-16 bg-violet-100 text-violet-700 rounded-3xl mx-auto flex items-center justify-center font-black text-2xl">
            123
          </div>
          <h3 className="text-lg font-bold text-slate-800">{t('cognitivegamesmoda_listo_para_memorizar')}</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            {t('cognitivegamesmoda_apareceran_numeros_de_uno_en_uno')}
          </p>
          <button
            onClick={handleStartGame}
            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-md transition text-sm"
          >
            {t('cognitivegamesmoda_comenzar_partida')}
          </button>
        </div>
      )}

      {gameState === 'showing' && (
        <div className="h-44 flex flex-col items-center justify-center">
          <span className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-2 animate-pulse">{t('cognitivegamesmoda_memoriza')}</span>
          <div className="text-7xl font-black text-violet-700 animate-scale-in">
            {displayDigit}
          </div>
        </div>
      )}

      {gameState === 'input' && (
        <div className="space-y-4 w-full">
          <div className="text-center">
            <span className="text-xs font-semibold text-slate-500">{t('games_enter_sequence', { count: sequence.length })}</span>
            <div className="h-12 flex items-center justify-center gap-2 mt-2">
              {Array.from({ length: sequence.length }).map((_, i) => (
                <div 
                  key={i} 
                  className={`w-9 h-11 rounded-xl border-2 flex items-center justify-center font-black text-lg ${
                    userInput[i] ? 'border-violet-600 bg-violet-50 text-violet-800' : 'border-slate-200 bg-slate-50 text-transparent'
                  }`}
                >
                  {userInput[i] || '•'}
                </div>
              ))}
            </div>
          </div>

          {/* TECLADO TÁCTIL GRANDE */}
          <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto pt-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                onClick={() => handleDigitPress(String(n))}
                className="h-12 bg-slate-100 hover:bg-violet-100 active:bg-violet-200 text-slate-800 hover:text-violet-800 font-bold text-xl rounded-xl transition shadow-xs"
              >
                {n}
              </button>
            ))}
            <div />
            <button
              onClick={() => handleDigitPress('0')}
              className="h-12 bg-slate-100 hover:bg-violet-100 active:bg-violet-200 text-slate-800 hover:text-violet-800 font-bold text-xl rounded-xl transition shadow-xs"
            >
              0
            </button>
            <button
              onClick={() => setUserInput(prev => prev.slice(0, -1))}
              className="h-12 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition"
            >
              {t('cognitivegamesmoda_borrar')}
            </button>
          </div>
        </div>
      )}

      {(gameState === 'won' || gameState === 'lost') && (
        <div className="text-center space-y-4 py-8 animate-fade-in">
          <div className={`w-16 h-16 rounded-3xl mx-auto flex items-center justify-center font-black text-2xl ${
            gameState === 'won' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {gameState === 'won' ? <Award size={32} /> : <Brain size={32} />}
          </div>
          <h3 className="text-xl font-black text-slate-800">
            {gameState === 'won' ? t('cognitivegamesmoda_magnifica_memoria') : t('cognitivegamesmoda_buen_entrenamiento')}
          </h3>
          <p className="text-xs text-slate-500">
            {t('cognitivegamesmoda_puntuacion_final')} <strong className="text-slate-900">{t('games_points', { count: score })}</strong> {t('games_reached_level', { level })}
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={handleStartGame}
              className="px-5 py-2.5 bg-violet-600 text-white font-bold rounded-xl text-xs shadow-md"
            >
              {t('cognitivegamesmoda_jugar_de_nuevo')}
            </button>
            <button
              onClick={onBack}
              className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200"
            >
              {t('cognitivegamesmoda_volver_al_menu')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SUB-JUEGO 2: CÁLCULO RÁPIDO (SPEED MATH)
// ============================================================================
function SpeedMathGame({ onFinish, onBack }) {
  const { t } = useLanguage();
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [currentProblem, setCurrentProblem] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const timerRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  const generateProblem = () => {
    const ops = ['+', '-', '×'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a, b, answer;

    if (op === '+') {
      a = Math.floor(Math.random() * 30) + 5;
      b = Math.floor(Math.random() * 30) + 5;
      answer = a + b;
    } else if (op === '-') {
      a = Math.floor(Math.random() * 40) + 15;
      b = Math.floor(Math.random() * a);
      answer = a - b;
    } else {
      a = Math.floor(Math.random() * 9) + 2;
      b = Math.floor(Math.random() * 9) + 2;
      answer = a * b;
    }

    // Opciones
    const options = new Set([answer]);
    while (options.size < 4) {
      const delta = (Math.floor(Math.random() * 7) + 1) * (Math.random() > 0.5 ? 1 : -1);
      const fake = answer + delta;
      if (fake >= 0) options.add(fake);
    }

    return {
      text: `${a} ${op} ${b} = ?`,
      correct: answer,
      choices: Array.from(options).sort(() => Math.random() - 0.5)
    };
  };

  const startGame = () => {
    setIsPlaying(true);
    setIsGameOver(false);
    setTimeLeft(30);
    setScore(0);
    setTotalQuestions(0);
    setCorrectAnswers(0);
    startTimeRef.current = Date.now();
    setCurrentProblem(generateProblem());

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const endGame = () => {
    setIsPlaying(false);
    setIsGameOver(true);
  };

  const handleChoice = (choice) => {
    if (!isPlaying) return;
    setTotalQuestions(prev => prev + 1);
    if (choice === currentProblem.correct) {
      setScore(prev => prev + 150);
      setCorrectAnswers(prev => prev + 1);
    }
    setCurrentProblem(generateProblem());
  };

  useEffect(() => {
    if (isGameOver) {
      const acc = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
      onFinish(score, acc, 30);
    }
  }, [isGameOver]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-4 max-w-md mx-auto space-y-6">
      {!isPlaying && !isGameOver && (
        <div className="text-center space-y-4 py-8">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-3xl mx-auto flex items-center justify-center font-black text-2xl">
            +−×
          </div>
          <h3 className="text-lg font-bold text-slate-800">{t('cognitivegamesmoda_calculo_rapido_30_segundos')}</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            {t('cognitivegamesmoda_resuelve_el_mayor_numero_de_operaciones')}
          </p>
          <button
            onClick={startGame}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition text-sm"
          >
            {t('cognitivegamesmoda_comenzar_reto')}
          </button>
        </div>
      )}

      {isPlaying && currentProblem && (
        <div className="w-full space-y-6">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              <Timer size={14} /> {t('games_seconds_left', { count: timeLeft })}
            </span>
            <span className="text-slate-800 font-extrabold">{t('games_points_short', { count: score })}</span>
          </div>

          <div className="h-28 bg-slate-50 rounded-2xl border-2 border-slate-100 flex items-center justify-center">
            <span className="text-3xl md:text-4xl font-black text-slate-800 tracking-wider">
              {currentProblem.text}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {currentProblem.choices.map((c, i) => (
              <button
                key={i}
                onClick={() => handleChoice(c)}
                className="py-4 bg-white hover:bg-emerald-50 active:bg-emerald-100 border-2 border-slate-200 hover:border-emerald-500 text-slate-800 hover:text-emerald-800 font-black text-2xl rounded-2xl transition shadow-xs"
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {isGameOver && (
        <div className="text-center space-y-4 py-8 animate-fade-in">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-3xl mx-auto flex items-center justify-center font-black text-2xl">
            <Trophy size={32} />
          </div>
          <h3 className="text-xl font-black text-slate-800">{t('cognitivegamesmoda_tiempo_cumplido')}</h3>
          <p className="text-xs text-slate-500">
            {t('cognitivegamesmoda_lograste')} <strong className="text-slate-900">{t('games_points', { count: score })}</strong> {t('games_correct_of', { correct: correctAnswers, total: totalQuestions })}
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={startGame}
              className="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-md"
            >
              {t('cognitivegamesmoda_intentar_de_nuevo')}
            </button>
            <button
              onClick={onBack}
              className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200"
            >
              {t('cognitivegamesmoda_volver_al_menu')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SUB-JUEGO 3: EMPAREJAMIENTO VISUAL (PATTERN MATCH)
// ============================================================================
const ICONS = ['🍎', '💧', '🏃', '🧠', '☀️', '🌿'];

function PatternMatchGame({ onFinish, onBack }) {
  const { t } = useLanguage();
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const startTimeRef = useRef(Date.now());

  const initGame = () => {
    const deck = [...ICONS, ...ICONS]
      .sort(() => Math.random() - 0.5)
      .map((icon, idx) => ({ id: idx, icon }));
    setCards(deck);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setIsWon(false);
    startTimeRef.current = Date.now();
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleCardClick = (idx) => {
    if (flipped.length === 2 || flipped.includes(idx) || matched.includes(idx)) return;

    const newFlipped = [...flipped, idx];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1);
      const [first, second] = newFlipped;
      if (cards[first].icon === cards[second].icon) {
        setMatched(prev => {
          const nextMatched = [...prev, first, second];
          if (nextMatched.length === cards.length) {
            setIsWon(true);
            const duration = (Date.now() - startTimeRef.current) / 1000;
            const score = Math.max(100, 1000 - (moves * 30) - Math.round(duration * 10));
            onFinish(score, 100, duration);
          }
          return nextMatched;
        });
        setFlipped([]);
      } else {
        setTimeout(() => setFlipped([]), 850);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 max-w-md mx-auto space-y-5">
      <div className="flex items-center justify-between w-full text-xs font-bold text-slate-500">
        <span>{t('cognitivegamesmoda_movimientos')} {moves}</span>
        <span>{t('cognitivegamesmoda_parejas')} {matched.length / 2} / {ICONS.length}</span>
      </div>

      {!isWon ? (
        <div className="grid grid-cols-4 gap-3 w-full">
          {cards.map((card, idx) => {
            const isCardFlipped = flipped.includes(idx) || matched.includes(idx);
            return (
              <button
                key={card.id}
                onClick={() => handleCardClick(idx)}
                className={`h-20 rounded-2xl font-black text-3xl flex items-center justify-center transition-all duration-300 shadow-xs border-2 ${
                  isCardFlipped
                    ? 'bg-sky-50 border-sky-400 rotate-y-180 scale-95'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-transparent'
                }`}
              >
                {isCardFlipped ? card.icon : '❓'}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-center space-y-4 py-8 animate-fade-in">
          <div className="w-16 h-16 bg-sky-100 text-sky-700 rounded-3xl mx-auto flex items-center justify-center font-black text-2xl">
            <Trophy size={32} />
          </div>
          <h3 className="text-xl font-black text-slate-800">{t('cognitivegamesmoda_todas_las_parejas_encontradas')}</h3>
          <p className="text-xs text-slate-500">
            {t('cognitivegamesmoda_completado_en')} <strong className="text-slate-900">{t('games_moves', { count: moves })}</strong>
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={initGame}
              className="px-5 py-2.5 bg-sky-600 text-white font-bold rounded-xl text-xs shadow-md"
            >
              {t('cognitivegamesmoda_jugar_otra_vez')}
            </button>
            <button
              onClick={onBack}
              className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200"
            >
              {t('cognitivegamesmoda_volver_al_menu')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
