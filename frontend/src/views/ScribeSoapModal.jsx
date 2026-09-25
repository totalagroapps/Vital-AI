import React, { useState, useEffect, useRef } from "react";
import {
  X,
  FileText,
  Mic,
  MicOff,
  Sparkles,
  Copy,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Heart,
  Stethoscope,
  Baby,
  Activity,
  Compass,
  ArrowRight,
  Clock,
  Pill,
  HelpCircle,
  Calendar,
  Share2
} from "lucide-react";
import { printHtmlContent, escapeHtml } from "../utils/printPdf";
import { useLanguage } from "../contexts/LanguageContext";

// Plantillas clínicas: textos como claves i18n
const TEMPLATES = [
  { id: "general", nameKey: "scribe_tpl_general", specialtyKey: "scribe_tpl_general_desc", icon: Stethoscope },
  { id: "cardiology", nameKey: "scribe_tpl_cardiology", specialtyKey: "scribe_tpl_cardiology_desc", icon: Heart },
  { id: "pediatrics", nameKey: "scribe_tpl_pediatrics", specialtyKey: "scribe_tpl_pediatrics_desc", icon: Baby },
  { id: "geriatrics", nameKey: "scribe_tpl_geriatrics", specialtyKey: "scribe_tpl_geriatrics_desc", icon: Activity },
  { id: "digestive", nameKey: "scribe_tpl_digestive", specialtyKey: "scribe_tpl_digestive_desc", icon: Compass },
];

export default function ScribeSoapModal({ isOpen, onClose, token, initialMode = "doctor", patientData = null }) {
  const { t, language, locale } = useLanguage();
  const [activeTab, setActiveTab] = useState(initialMode === "patient" ? "patient_prep" : "soap_scribe");
  const [selectedTemplate, setSelectedTemplate] = useState("general");
  
  // Doctor Scribe State
  const [consultationText, setConsultationText] = useState("");
  const [patientName, setPatientName] = useState(patientData?.full_name || "");
  const [patientAge, setPatientAge] = useState(patientData?.age || "");
  const [patientGender, setPatientGender] = useState(patientData?.gender || "");
  const [vitalBp, setVitalBp] = useState("");
  const [vitalHr, setVitalHr] = useState("");
  const [vitalTemp, setVitalTemp] = useState("");
  const [vitalSpo2, setVitalSpo2] = useState("");

  const [isRecording, setIsRecording] = useState(false);
  const [loadingSoap, setLoadingSoap] = useState(false);
  const [soapResult, setSoapResult] = useState(null);
  const [soapViewSubtab, setSoapViewSubtab] = useState("soap"); // "soap" or "patient_sheet"
  const [copiedKey, setCopiedKey] = useState(null);

  // Patient Prep State
  const [mainConcerns, setMainConcerns] = useState("");
  const [durationEvolution, setDurationEvolution] = useState("");
  const [questionsForDoctor, setQuestionsForDoctor] = useState("");
  const [currentMeds, setCurrentMeds] = useState("");
  const [loadingPrep, setLoadingPrep] = useState(false);
  const [prepResult, setPrepResult] = useState(null);

  const recognitionRef = useRef(null);

  useEffect(() => {
    if (patientData) {
      if (patientData.full_name) setPatientName(patientData.full_name);
      if (patientData.age) setPatientAge(patientData.age);
      if (patientData.gender) setPatientGender(patientData.gender);
    }
  }, [patientData]);

  // Speech Recognition setup (Web Speech API)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = locale || language;

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setConsultationText((prev) => (prev ? prev + " " + transcript : transcript));
      };

      recognition.onerror = (e) => {
        console.error("Speech recognition error:", e);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, [locale, language]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert(t('scribesoapmodal_el_reconocimiento_de_voz_no_esta'));
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleGenerateSoap = async () => {
    if (!consultationText.trim()) {
      alert(t('scribesoapmodal_por_favor_introduce_las_notas_o'));
      return;
    }
    setLoadingSoap(true);
    try {
      const payload = {
        consultation_text: consultationText,
        template_id: selectedTemplate,
        patient_name: patientName || undefined,
        patient_age: patientAge ? parseInt(patientAge, 10) : undefined,
        patient_gender: patientGender || undefined,
        language: locale || language,
        vital_signs: {
          bp: vitalBp || undefined,
          hr: vitalHr || undefined,
          temp: vitalTemp || undefined,
          spo2: vitalSpo2 || undefined,
        },
      };

      const res = await fetch("/api/scribe/generate_soap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(t('scribesoapmodal_error_al_generar_la_nota_clinica'));
      const data = await res.json();
      setSoapResult(data);
      setSoapViewSubtab("soap");
    } catch (err) {
      console.error(err);
      alert(t('scribesoapmodal_ocurrio_un_error_al_procesar_con'));
    } finally {
      setLoadingSoap(false);
    }
  };

  const handlePrepareConsultation = async () => {
    if (!mainConcerns.trim()) {
      alert(t('scribesoapmodal_por_favor_describe_que_sintomas_o'));
      return;
    }
    setLoadingPrep(true);
    try {
      const res = await fetch("/api/scribe/prepare_consultation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          main_concerns: mainConcerns,
          duration_evolution: durationEvolution,
          questions_for_doctor: questionsForDoctor,
          current_meds: currentMeds,
          language: locale || language,
        }),
      });

      if (!res.ok) throw new Error(t('scribesoapmodal_error_preparando_la_consulta'));
      const data = await res.json();
      setPrepResult(data);
    } catch (err) {
      console.error(err);
      alert(t('scribesoapmodal_no_se_pudo_preparar_la_consulta'));
    } finally {
      setLoadingPrep(false);
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // El contenido generado por la IA se escapa antes de insertarlo en la plantilla de impresión
  const esc = escapeHtml;
  const templateLabel = (id, fallback) => {
    const tmpl = TEMPLATES.find((x) => x.id === id);
    return tmpl ? t(tmpl.nameKey) : fallback;
  };

  const handlePrintSoap = () => {
    if (!soapResult) return;
    const { soap_note, suggested_icd10, template_name } = soapResult;
    const specialty = templateLabel(selectedTemplate, template_name);
    const content = `
      <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b;">
        <div style="border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px;">
          <h1 style="color: #0369a1; margin: 0; font-size: 22px;">${esc(t('scribe_print_soap_title'))}</h1>
          <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">${esc(t('scribe_print_soap_meta', { specialty, date: new Date().toLocaleDateString(locale) }))}</p>
        </div>
        ${patientName ? `<p><strong>${esc(t('scribe_print_patient'))}</strong> ${esc(patientName)} ${patientAge ? esc(t('scribe_print_age', { age: patientAge })) : ''}</p>` : ''}

        <div style="margin-bottom: 16px;">
          <h3 style="color: #0f172a; margin-bottom: 6px; font-size: 15px; border-left: 4px solid #0284c7; padding-left: 8px;">${esc(t('scribe_print_s'))}</h3>
          <p style="white-space: pre-wrap; font-size: 13px; line-height: 1.5;">${esc(soap_note.subjective)}</p>
        </div>

        <div style="margin-bottom: 16px;">
          <h3 style="color: #0f172a; margin-bottom: 6px; font-size: 15px; border-left: 4px solid #0284c7; padding-left: 8px;">${esc(t('scribe_print_o'))}</h3>
          <p style="white-space: pre-wrap; font-size: 13px; line-height: 1.5;">${esc(soap_note.objective)}</p>
        </div>

        <div style="margin-bottom: 16px;">
          <h3 style="color: #0f172a; margin-bottom: 6px; font-size: 15px; border-left: 4px solid #0284c7; padding-left: 8px;">${esc(t('scribe_print_a'))}</h3>
          <p style="white-space: pre-wrap; font-size: 13px; line-height: 1.5;">${esc(soap_note.assessment)}</p>
          ${suggested_icd10 && suggested_icd10.length > 0 ? `
            <p style="font-size: 12px; color: #475569; margin-top: 6px;"><strong>${esc(t('scribe_print_icd10'))}</strong> ${suggested_icd10.map(i => `${esc(i.code)} (${esc(i.description)})`).join(', ')}</p>
          ` : ''}
        </div>

        <div style="margin-bottom: 16px;">
          <h3 style="color: #0f172a; margin-bottom: 6px; font-size: 15px; border-left: 4px solid #0284c7; padding-left: 8px;">${esc(t('scribe_print_p'))}</h3>
          <p style="white-space: pre-wrap; font-size: 13px; line-height: 1.5;">${esc(soap_note.plan)}</p>
        </div>

        <div style="margin-top: 30px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 8px;">
          ${esc(t('scribe_print_soap_footer'))}
        </div>
      </div>
    `;
    printHtmlContent(t('scribe_print_soap_title'), content);
  };

  const handlePrintPatientSheet = () => {
    if (!soapResult?.patient_clear_sheet) return;
    const { patient_clear_sheet, template_name } = soapResult;
    const specialty = templateLabel(selectedTemplate, template_name);
    const content = `
      <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b;">
        <div style="border-bottom: 3px solid #10b981; padding-bottom: 12px; margin-bottom: 20px;">
          <h1 style="color: #047857; margin: 0; font-size: 24px;">📋 ${esc(t('scribe_print_sheet_title'))}</h1>
          <p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px;">${esc(t('scribe_print_sheet_subtitle', { specialty }))}</p>
        </div>

        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px; margin-bottom: 20px;">
          <h3 style="color: #166534; margin: 0 0 6px 0; font-size: 16px;">${esc(t('scribe_print_whats_wrong'))}</h3>
          <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #1e293b;">${esc(patient_clear_sheet.simple_diagnosis)}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #0f172a; font-size: 16px; margin-bottom: 8px;">💊 ${esc(t('scribe_print_which_meds'))}</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="background-color: #f8fafc; border-bottom: 2px solid #cbd5e1; text-align: left;">
                <th style="padding: 8px;">${esc(t('scribe_print_col_medication'))}</th>
                <th style="padding: 8px;">${esc(t('scribe_print_col_dose'))}</th>
                <th style="padding: 8px;">${esc(t('scribe_print_col_when'))}</th>
                <th style="padding: 8px;">${esc(t('scribe_print_col_purpose'))}</th>
              </tr>
            </thead>
            <tbody>
              ${patient_clear_sheet.medication_schedule.map(m => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 8px; font-weight: bold; color: #0284c7;">${esc(m.medication)}</td>
                  <td style="padding: 8px;">${esc(m.dose)}</td>
                  <td style="padding: 8px; color: #059669; font-weight: 500;">${esc(m.timing)}</td>
                  <td style="padding: 8px; color: #475569;">${esc(m.purpose)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 14px; margin-bottom: 20px;">
          <h3 style="color: #991b1b; margin: 0 0 8px 0; font-size: 15px;">🚨 ${esc(t('scribe_print_red_flags'))}</h3>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.6; color: #7f1d1d;">
            ${patient_clear_sheet.red_flags.map(r => `<li>${esc(r)}</li>`).join('')}
          </ul>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #0f172a; font-size: 15px; margin-bottom: 8px;">🌿 ${esc(t('scribe_print_daily_tips'))}</h3>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.6; color: #334155;">
            ${patient_clear_sheet.lifestyle_recommendations.map(l => `<li>${esc(l)}</li>`).join('')}
          </ul>
        </div>

        <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px; margin-bottom: 20px;">
          <h4 style="color: #1e40af; margin: 0 0 4px 0; font-size: 14px;">📅 ${esc(t('scribe_print_next_followup'))}</h4>
          <p style="margin: 0; font-size: 13px; color: #1e3a8a;">${esc(patient_clear_sheet.next_followup)}</p>
        </div>

        <div style="font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px;">
          ${esc(t('scribe_print_sheet_footer'))}
        </div>
      </div>
    `;
    printHtmlContent(t('scribe_print_sheet_title'), content);
  };

  const handlePrintPrepSheet = () => {
    if (!prepResult) return;
    const content = `
      <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b;">
        <div style="border-bottom: 3px solid #6366f1; padding-bottom: 12px; margin-bottom: 20px;">
          <h1 style="color: #4338ca; margin: 0; font-size: 24px;">📝 ${esc(t('scribe_print_prep_title'))}</h1>
          <p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px;">${esc(t('scribe_print_prep_subtitle'))}</p>
        </div>

        <div style="background-color: #eef2ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 14px; margin-bottom: 18px;">
          <h3 style="color: #3730a3; margin: 0 0 6px 0; font-size: 15px;">⏱️ ${esc(t('scribe_print_prep_pitch'))}</h3>
          <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #1e1b4b; font-style: italic;">"${esc(prepResult.elevator_pitch)}"</p>
        </div>

        <div style="margin-bottom: 18px;">
          <h3 style="color: #0f172a; font-size: 15px; margin-bottom: 8px;">❓ ${esc(t('scribe_print_prep_questions'))}</h3>
          <ol style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.6; color: #334155;">
            ${prepResult.priority_questions.map(q => `<li><strong>${esc(q)}</strong></li>`).join('')}
          </ol>
        </div>

        <div style="margin-bottom: 18px;">
          <h3 style="color: #0f172a; font-size: 15px; margin-bottom: 8px;">💊 ${esc(t('scribe_print_prep_meds'))}</h3>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.6; color: #334155;">
            ${prepResult.meds_checklist.map(m => `<li>${esc(m)}</li>`).join('')}
          </ul>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
          <h4 style="color: #334155; margin: 0 0 6px 0; font-size: 13px;">💡 ${esc(t('scribe_print_prep_tips'))}</h4>
          <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #64748b; line-height: 1.5;">
            ${prepResult.tips_for_visit.map(tip => `<li>${esc(tip)}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;
    printHtmlContent(t('scribe_print_prep_title'), content);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[92dvh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-sky-50 via-indigo-50/40 to-white dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                  {t('scribesoapmodal_mivor_scribe_copiloto')}
                </h2>
                <span className="text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300">
                  {t('scribesoapmodal_soap_hoja_clara')}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('scribesoapmodal_documentacion_medica_automatizada_por_vo')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab("soap_scribe")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "soap_scribe"
                    ? "bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                {t('scribesoapmodal_medico_soap')}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("patient_prep")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "patient_prep"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                {t('scribesoapmodal_paciente_preparador')}
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={t('patient_close')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 space-y-6">
          {activeTab === "soap_scribe" ? (
            /* TAB 1: DOCTOR SOAP SCRIBE */
            <div className="space-y-6">
              {/* Template Selector Chips */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  {t('scribesoapmodal_1_seleccionar_plantilla_clinica_especial')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {TEMPLATES.map((tmpl) => {
                    const Icon = tmpl.icon;
                    const isSelected = selectedTemplate === tmpl.id;
                    return (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => setSelectedTemplate(tmpl.id)}
                        className={`flex flex-col items-center p-3 rounded-2xl border text-center transition-all ${
                          isSelected
                            ? "bg-sky-50 dark:bg-sky-950/40 border-sky-400 dark:border-sky-500 text-sky-700 dark:text-sky-300 shadow-sm ring-1 ring-sky-400"
                            : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center mb-1.5 ${
                            isSelected
                              ? "bg-sky-500 text-white"
                              : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold leading-tight">{t(tmpl.nameKey)}</span>
                        <span className="text-[10px] text-slate-400 leading-tight mt-0.5">{t(tmpl.specialtyKey)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Patient Context (Optional quick inputs) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs">
                <div>
                  <label className="text-slate-500 dark:text-slate-400 block mb-1">{t('default_patient_name')}</label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder={t('scribesoapmodal_nombre_o_id')}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-500 dark:text-slate-400 block mb-1">{t('scribesoapmodal_edad_genero')}</label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      value={patientAge}
                      onChange={(e) => setPatientAge(e.target.value)}
                      placeholder={t('scribesoapmodal_anos')}
                      className="w-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-white"
                    />
                    <select
                      value={patientGender}
                      onChange={(e) => setPatientGender(e.target.value)}
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-1.5 text-xs text-slate-800 dark:text-white"
                    >
                      <option value="">{t('gender')}</option>
                      <option value="Hombre">M</option>
                      <option value="Mujer">F</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-slate-500 dark:text-slate-400 block mb-1">{t('scribesoapmodal_presion_pulso')}</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={vitalBp}
                      onChange={(e) => setVitalBp(e.target.value)}
                      placeholder="120/80"
                      className="w-1/2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-white"
                    />
                    <input
                      type="text"
                      value={vitalHr}
                      onChange={(e) => setVitalHr(e.target.value)}
                      placeholder={t('scribe_placeholder_hr')}
                      className="w-1/2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-slate-500 dark:text-slate-400 block mb-1">{t('scribesoapmodal_temp_sato2')}</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={vitalTemp}
                      onChange={(e) => setVitalTemp(e.target.value)}
                      placeholder="36.5°C"
                      className="w-1/2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-white"
                    />
                    <input
                      type="text"
                      value={vitalSpo2}
                      onChange={(e) => setVitalSpo2(e.target.value)}
                      placeholder="98%"
                      className="w-1/2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Dictation / Notes Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    {t('scribesoapmodal_2_dictado_de_voz_o_notas')}
                    {isRecording && (
                      <span className="flex items-center gap-1 text-red-500 font-bold animate-pulse text-[11px] lowercase">
                        <span className="w-2 h-2 rounded-full bg-red-500" /> {t('scribe_recording')}
                      </span>
                    )}
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setConsultationText(
                          t('scribesoapmodal_varon_de_62_anos_que_acude')
                        )
                      }
                      className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline"
                    >
                      {t('scribesoapmodal_ejemplo_clinico')}
                    </button>
                    <button
                      type="button"
                      onClick={toggleRecording}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition shadow-sm ${
                        isRecording
                          ? "bg-red-500 text-white animate-pulse"
                          : "bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 hover:bg-sky-100"
                      }`}
                    >
                      {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                      {isRecording ? t('scribesoapmodal_detener') : t('scribesoapmodal_dictar')}
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    rows={4}
                    value={consultationText}
                    onChange={(e) => setConsultationText(e.target.value)}
                    placeholder={t('scribesoapmodal_dicta_con_el_microfono_o_escribe')}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGenerateSoap}
                  disabled={loadingSoap}
                  className="w-full mt-3 py-3 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-bold text-sm shadow-md hover:from-sky-500 hover:to-indigo-500 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loadingSoap ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t('scribesoapmodal_estructurando_nota_soap_hoja_de_cuidados')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-sky-200" />
                      {t('scribesoapmodal_estructurar_nota_soap_y_hoja_clara')}
                    </>
                  )}
                </button>
              </div>

              {/* SOAP RESULT VIEW */}
              {soapResult && (
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-3xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 space-y-4">
                  {/* Subtab Toggle between SOAP and Patient Sheet */}
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/80 pb-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSoapViewSubtab("soap")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          soapViewSubtab === "soap"
                            ? "bg-sky-600 text-white shadow-sm"
                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {t('scribesoapmodal_nota_soap_formal')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSoapViewSubtab("patient_sheet")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          soapViewSubtab === "patient_sheet"
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        <Heart className="w-3.5 h-3.5" />
                        {t('scribesoapmodal_hoja_clara_para_el_paciente')}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const textToCopy =
                            soapViewSubtab === "soap"
                              ? `S: ${soapResult.soap_note.subjective}\nO: ${soapResult.soap_note.objective}\nA: ${soapResult.soap_note.assessment}\nP: ${soapResult.soap_note.plan}`
                              : t('scribe_copy_sheet', {
                                  diagnosis: soapResult.patient_clear_sheet.simple_diagnosis,
                                  meds: soapResult.patient_clear_sheet.medication_schedule.map((m) => `${m.medication} (${m.timing})`).join(", "),
                                });
                          copyToClipboard(textToCopy, "soap_text");
                        }}
                        className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 text-xs font-medium flex items-center gap-1"
                        title={t('scribesoapmodal_copiar_texto')}
                      >
                        {copiedKey === "soap_text" ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={soapViewSubtab === "soap" ? handlePrintSoap : handlePrintPatientSheet}
                        className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 shadow-sm"
                      >
                        <Printer className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                        {t('print_pdf')}
                      </button>
                    </div>
                  </div>

                  {soapViewSubtab === "soap" ? (
                    /* SOAP Formal Note View */
                    <div className="space-y-3.5 text-xs text-slate-700 dark:text-slate-200">
                      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <span className="font-extrabold text-sky-600 dark:text-sky-400 uppercase tracking-wide block mb-1">
                          {t('scribesoapmodal_s_subjetivo_anamnesis_motivo')}
                        </span>
                        <p className="whitespace-pre-wrap leading-relaxed">{soapResult.soap_note.subjective}</p>
                      </div>

                      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <span className="font-extrabold text-sky-600 dark:text-sky-400 uppercase tracking-wide block mb-1">
                          {t('scribesoapmodal_o_objetivo_exploracion_constantes')}
                        </span>
                        <p className="whitespace-pre-wrap leading-relaxed">{soapResult.soap_note.objective}</p>
                      </div>

                      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <span className="font-extrabold text-sky-600 dark:text-sky-400 uppercase tracking-wide block mb-1">
                          {t('scribesoapmodal_a_apreciacion_juicio_diagnostico')}
                        </span>
                        <p className="whitespace-pre-wrap leading-relaxed">{soapResult.soap_note.assessment}</p>
                        {soapResult.suggested_icd10?.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5">
                            {soapResult.suggested_icd10.map((icd, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-mono text-[11px] border border-sky-200 dark:border-sky-800"
                              >
                                {icd.code}: {icd.description}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <span className="font-extrabold text-sky-600 dark:text-sky-400 uppercase tracking-wide block mb-1">
                          {t('scribesoapmodal_p_plan_terapeutico_recomendaciones')}
                        </span>
                        <p className="whitespace-pre-wrap leading-relaxed">{soapResult.soap_note.plan}</p>
                      </div>
                    </div>
                  ) : (
                    /* Patient Clear Sheet View */
                    <div className="space-y-4 text-xs">
                      {/* Simple Diagnosis */}
                      <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                        <h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-sm mb-1 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          {t('scribesoapmodal_que_me_ocurre_en_palabras_sencillas')}
                        </h4>
                        <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                          {soapResult.patient_clear_sheet.simple_diagnosis}
                        </p>
                      </div>

                      {/* Medication Schedule Table */}
                      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-2.5 flex items-center gap-1.5">
                          <Pill className="w-4 h-4 text-sky-600" />
                          {t('scribesoapmodal_como_tomar_mis_medicamentos')}
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 uppercase">
                                <th className="pb-1.5">{t('doctordashboard_farmaco')}</th>
                                <th className="pb-1.5">{t('dosage')}</th>
                                <th className="pb-1.5">{t('scribesoapmodal_momento')}</th>
                                <th className="pb-1.5">{t('scribesoapmodal_para_que_sirve')}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                              {soapResult.patient_clear_sheet.medication_schedule.map((med, idx) => (
                                <tr key={idx}>
                                  <td className="py-2 font-bold text-sky-600 dark:text-sky-400">{med.medication}</td>
                                  <td className="py-2">{med.dose}</td>
                                  <td className="py-2 font-medium text-emerald-600 dark:text-emerald-400">
                                    {med.timing}
                                  </td>
                                  <td className="py-2 text-slate-500 dark:text-slate-400">{med.purpose}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Red Flags Alert */}
                      <div className="bg-rose-50 dark:bg-rose-950/40 p-4 rounded-2xl border border-rose-200 dark:border-rose-800">
                        <h4 className="font-bold text-rose-800 dark:text-rose-300 text-sm mb-2 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          {t('scribesoapmodal_signos_de_alarma_cuando_acudir_a')}
                        </h4>
                        <ul className="space-y-1 list-disc list-inside text-rose-900 dark:text-rose-200 leading-relaxed">
                          {soapResult.patient_clear_sheet.red_flags.map((flag, idx) => (
                            <li key={idx}>{flag}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Lifestyle & Next Followup */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                          <h5 className="font-bold text-slate-800 dark:text-white mb-1.5">{t('scribesoapmodal_habitos_de_salud')}</h5>
                          <ul className="space-y-1 text-slate-600 dark:text-slate-400 list-disc list-inside">
                            {soapResult.patient_clear_sheet.lifestyle_recommendations.map((rec, idx) => (
                              <li key={idx}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-sky-50 dark:bg-sky-950/40 p-3.5 rounded-2xl border border-sky-200 dark:border-sky-800">
                          <h5 className="font-bold text-sky-800 dark:text-sky-300 mb-1.5 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {t('scribesoapmodal_proxima_cita_control')}
                          </h5>
                          <p className="text-sky-900 dark:text-sky-200">
                            {soapResult.patient_clear_sheet.next_followup}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* TAB 2: PATIENT CONSULTATION PREPARER */
            <div className="space-y-6">
              <div className="bg-indigo-50 dark:bg-indigo-950/40 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-300">
                    {t('scribesoapmodal_aprovecha_al_maximo_tu_cita_medica')}
                  </h3>
                  <p className="text-xs text-indigo-800/80 dark:text-indigo-200/80 mt-0.5 leading-relaxed">
                    {t('scribesoapmodal_los_medicos_disponen_en_promedio_de')}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('scribesoapmodal_1_que_molestias_o_sintomas_tienes')} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={mainConcerns}
                    onChange={(e) => setMainConcerns(e.target.value)}
                    placeholder={t('scribesoapmodal_ej_tengo_dolor_de_cabeza_en')}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {t('scribesoapmodal_2_desde_cuando_te_ocurre_y')}
                    </label>
                    <input
                      type="text"
                      value={durationEvolution}
                      onChange={(e) => setDurationEvolution(e.target.value)}
                      placeholder={t('scribesoapmodal_ej_hace_unas_3_semanas_ha')}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {t('scribesoapmodal_3_que_medicinas_tomas_actualmente')}
                    </label>
                    <input
                      type="text"
                      value={currentMeds}
                      onChange={(e) => setCurrentMeds(e.target.value)}
                      placeholder={t('scribesoapmodal_ej_enalapril_20mg_atorvastatina_20mg')}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('scribesoapmodal_4_hay_alguna_pregunta_o_temor')}
                  </label>
                  <input
                    type="text"
                    value={questionsForDoctor}
                    onChange={(e) => setQuestionsForDoctor(e.target.value)}
                    placeholder={t('scribesoapmodal_ej_puede_ser_por_la_nueva')}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white"
                  />
                </div>

                <button
                  type="button"
                  onClick={handlePrepareConsultation}
                  disabled={loadingPrep}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 text-white font-bold text-sm shadow-md hover:from-indigo-500 hover:to-sky-500 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loadingPrep ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t('scribesoapmodal_organizando_tu_guia_de_consulta')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-indigo-200" />
                      {t('scribesoapmodal_generar_mi_guia_de_consulta_1')}
                    </>
                  )}
                </button>
              </div>

              {/* Prep Result View */}
              {prepResult && (
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-3xl border border-indigo-200 dark:border-indigo-800/60 p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                    <h4 className="font-bold text-indigo-900 dark:text-indigo-300 text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      {t('scribesoapmodal_tu_resumen_de_consulta_listo')}
                    </h4>
                    <button
                      type="button"
                      onClick={handlePrintPrepSheet}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      {t('scribesoapmodal_imprimir_guardar_guia')}
                    </button>
                  </div>

                  {/* 2-minute elevator pitch */}
                  <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-indigo-100 dark:border-indigo-950">
                    <span className="text-[11px] font-extrabold uppercase tracking-wide text-indigo-600 dark:text-indigo-400 block mb-1">
                      {t('scribesoapmodal_tu_discurso_inicial_de_2_minutos')}
                    </span>
                    <p className="text-xs text-slate-800 dark:text-slate-200 italic leading-relaxed">
                      "{prepResult.elevator_pitch}"
                    </p>
                  </div>

                  {/* Priority questions */}
                  <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] font-extrabold uppercase tracking-wide text-sky-600 dark:text-sky-400 block mb-2">
                      {t('scribesoapmodal_preguntas_clave_para_el_doctor')}
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 list-decimal list-inside">
                      {prepResult.priority_questions.map((q, idx) => (
                        <li key={idx} className="font-medium">
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Meds & Tips */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <span className="font-bold text-slate-800 dark:text-white block mb-1.5">
                        {t('scribesoapmodal_checklist_de_tratamiento')}
                      </span>
                      <ul className="space-y-1 text-slate-600 dark:text-slate-400 list-disc list-inside">
                        {prepResult.meds_checklist.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <span className="font-bold text-slate-800 dark:text-white block mb-1.5">
                        {t('scribesoapmodal_consejos_clave')}
                      </span>
                      <ul className="space-y-1 text-slate-600 dark:text-slate-400 list-disc list-inside">
                        {prepResult.tips_for_visit.map((tip, idx) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {t('scribesoapmodal_mivor_scribe_cdss_v2_0_validacion')}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
          >
            {t('patient_close')}
          </button>
        </div>
      </div>
    </div>
  );
}
