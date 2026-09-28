import React, { useState, useEffect } from 'react';
import { Check, X, Pill, BellRing } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function MedicationAlertOverlay({ medications, onMarkTaken, onDismiss }) {
  const { t } = useLanguage();
  
  // Find the first active medication that hasn't been taken today
  const pendingMed = medications?.find(m => !m.taken_today && m.is_active);

  if (!pendingMed) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-between p-6 sm:p-8 animate-in slide-in-from-bottom-full duration-500 overflow-hidden mivor-zero-scroll">
      
      {/* Top Banner */}
      <div className="w-full flex items-center justify-center gap-3 pt-4">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center animate-bounce">
          <BellRing size={28} className="stroke-[2.5]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-red-600 uppercase tracking-tight">
          ¡Hora de su pastilla!
        </h1>
      </div>

      {/* Main Content (Zero Scroll, Giant Elements) */}
      <div className="flex-1 w-full flex flex-col items-center justify-center gap-8 my-4">
        
        <div className="w-40 h-40 sm:w-48 sm:h-48 bg-sky-50 border-4 border-sky-100 rounded-full flex items-center justify-center shadow-inner">
          <Pill size={80} className="text-sky-500 stroke-[1.5]" />
        </div>

        <div className="text-center space-y-2 w-full max-w-sm">
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 leading-none break-words">
            {pendingMed.medication_name}
          </h2>
          {pendingMed.dosage && (
            <p className="text-2xl sm:text-3xl font-bold text-slate-500">
              {pendingMed.dosage}
            </p>
          )}
          {pendingMed.time_of_day && (
            <div className="inline-block mt-4 px-6 py-2 bg-slate-100 rounded-full text-xl font-bold text-slate-700">
              {pendingMed.time_of_day}
            </div>
          )}
        </div>
      </div>

      {/* Huge Action Buttons */}
      <div className="w-full max-w-md flex flex-col gap-4 pb-4">
        <button 
          onClick={() => onMarkTaken(pendingMed.id)}
          className="w-full py-6 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-3xl text-2xl font-black flex items-center justify-center gap-3 shadow-[0_8px_30px_rgba(16,185,129,0.3)] transition-transform active:scale-95 cursor-pointer"
        >
          <Check size={36} className="stroke-[3]" />
          ME LA TOMÉ
        </button>
        
        <button 
          onClick={() => onDismiss(pendingMed.id)}
          className="w-full py-5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-3xl text-xl font-bold flex items-center justify-center gap-3 transition-transform active:scale-95 cursor-pointer"
        >
          <X size={28} className="stroke-[3]" />
          RECORDAR LUEGO
        </button>
      </div>
      
    </div>
  );
}
