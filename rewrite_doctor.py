import os

file_path = 'frontend/src/DoctorDashboard.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    original_content = f.read()

# We only want to replace the return statement to update the UI
# Let's find the 'return ('
return_idx = original_content.find('  return (')

if return_idx == -1:
    print("Could not find return statement")
    exit(1)

logic_part = original_content[:return_idx]

# Now we define the new UI
new_ui = '''  return (
    <div className="flex w-full h-[100dvh] bg-base text-content-primary overflow-hidden font-sans relative">
      {/* Fondo decorativo opcional */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-brand-teal/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-brand-purple/20 rounded-full blur-[120px]"></div>
      </div>

      {/* HEADER / SIDEBAR NAV (Leftmost) */}
      <div className="w-20 bg-white/80 backdrop-blur-md border-r border-gray-100 shadow-sm flex flex-col items-center py-6 z-10 shrink-0">
        <div className="w-12 h-12 bg-gradient-to-br from-brand-teal to-brand-blue rounded-xl flex items-center justify-center shadow-soft mb-8">
          <Activity className="text-white w-6 h-6" />
        </div>
        
        <div className="flex-1 w-full flex flex-col items-center gap-4">
          <button className="w-12 h-12 bg-brand-teal/10 text-brand-teal rounded-xl flex items-center justify-center transition-all">
            <Users className="w-6 h-6" />
          </button>
          <button className="w-12 h-12 text-gray-400 hover:bg-gray-50 hover:text-gray-600 rounded-xl flex items-center justify-center transition-all">
            <FolderOpen className="w-6 h-6" />
          </button>
        </div>

        <button onClick={onLogout} className="w-12 h-12 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-xl flex items-center justify-center transition-all mt-auto title='Cerrar Sesión'">
          <LogOut className="w-6 h-6" />
        </button>
      </div>
      
      {/* COLUMN 1: Patients List */}
      <div className="w-80 bg-white/60 backdrop-blur-xl border-r border-gray-100 flex flex-col z-10 shrink-0">
        <div className="p-6 pb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t("patients_base")}</h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar paciente..." 
              className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 hide-scrollbar">
          {isLoadingPatients ? (
            <div className="flex flex-col gap-3">
               {[1,2,3,4].map(i => (
                 <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse"></div>
               ))}
            </div>
          ) : patients.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">{t("no_patients")}</div>
          ) : (
            patients.map(p => (
              <button
                key={p.user_id}
                onClick={() => setSelectedPatient(p)}
                className={w-full text-left p-3 rounded-xl transition-all duration-200 flex items-center gap-3  + 
                  (selectedPatient?.user_id === p.user_id 
                    ? 'bg-brand-teal shadow-md text-white' 
                    : 'bg-white border border-gray-100 hover:border-brand-teal/30 hover:shadow-sm text-gray-700')}
              >
                <div className={w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0  + 
                  (selectedPatient?.user_id === p.user_id ? 'bg-white/20 text-white' : 'bg-brand-teal/10 text-brand-teal')}>
                  {p.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden flex-1">
                  <div className="font-semibold text-sm truncate">{p.full_name}</div>
                  <div className={	ext-[11px] truncate  + (selectedPatient?.user_id === p.user_id ? 'text-teal-100' : 'text-gray-400')}>
                    ID: {p.user_id.split('-')[0]}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* COLUMN 2: Patient Details Center */}
      <div className="flex-1 flex flex-col min-w-0 z-10 relative">
        {isLoadingDetail ? (
          <div className="flex-1 flex flex-col items-center justify-center text-brand-teal">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p className="text-sm font-medium">Cargando expediente médico...</p>
          </div>
        ) : selectedPatient ? (
          patientDetail ? (
            <div className="flex-1 overflow-y-auto hide-scrollbar p-8">
              
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{patientDetail.profile.full_name || selectedPatient.full_name}</h1>
                  <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1"><Calendar className="w-4 h-4"/> {patientDetail.profile.date_of_birth || 'Sin fecha de nac.'}</span>
                    &bull;
                    <span>{patientDetail.profile.gender || 'No especificado'}</span>
                  </p>
                </div>
                <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-sm font-medium text-gray-700 shadow-sm transition-all hover:shadow">
                  <Printer className="w-4 h-4 text-brand-teal" />
                  Imprimir / PDF
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Vitales Card */}
                <div className="glass-card rounded-[24px] p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Heart className="w-24 h-24 text-brand-teal" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 relative z-10">
                    <Heart className="w-5 h-5 text-brand-teal" />
                    Signos Vitales y Biometría
                  </h3>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6 relative z-10">
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Grupo Sanguíneo</p>
                      <p className="font-bold text-gray-800 text-lg">{patientDetail.profile.blood_type || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Altura / Peso</p>
                      <p className="font-bold text-gray-800 text-lg">
                        {patientDetail.profile.height ? ${patientDetail.profile.height} cm : '--'} / {patientDetail.profile.weight ? ${patientDetail.profile.weight} kg : '--'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Historial Card */}
                <div className="glass-card rounded-[24px] p-6 relative overflow-hidden">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 relative z-10">
                    <ShieldCheck className="w-5 h-5 text-brand-teal" />
                    Antecedentes Clínicos
                  </h3>
                  <div className="space-y-4 relative z-10">
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Alergias</p>
                      <p className="text-sm text-gray-800 bg-red-50 text-red-700 px-3 py-1.5 rounded-lg inline-block font-medium">
                        {patientDetail.profile.allergies || 'Ninguna registrada'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Enfermedades Crónicas</p>
                      <p className="text-sm text-gray-800 bg-gray-50 px-3 py-1.5 rounded-lg inline-block border border-gray-100">
                        {patientDetail.profile.chronic_conditions || 'Ninguna registrada'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Medicamentos Actuales</p>
                      <p className="text-sm text-gray-800 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg inline-block font-medium">
                        {patientDetail.profile.current_medications || 'Ninguna registrada'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Triage and Docs Tabs Area */}
              <div className="space-y-8">
                
                {/* Triages */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-brand-orange" />
                    Historial de Triajes Asistidos
                  </h3>
                  <div className="space-y-4">
                    {patientDetail.triages.length === 0 ? (
                      <div className="bg-gray-50 border border-gray-100 border-dashed rounded-2xl p-8 text-center text-sm text-gray-500">
                        No hay triajes registrados para este paciente.
                      </div>
                    ) : (
                      patientDetail.triages.map(t => (
                        <div key={t.id} className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow rounded-2xl p-5">
                          <div className="flex justify-between items-start mb-3 border-b border-gray-50 pb-3">
                            <span className="text-xs font-semibold text-gray-500">{new Date(t.created_at).toLocaleString()}</span>
                            <span className={	ext-[10px] px-3 py-1 rounded-full uppercase font-bold tracking-wide }>
                              {t.status.replace('closed_', '') || 'En curso'}
                            </span>
                          </div>
                          <div className="prose prose-sm max-w-none prose-p:leading-relaxed text-gray-700 prose-strong:text-gray-900">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{t.final_report || 'Triaje incompleto.'}</ReactMarkdown>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-brand-teal" />
                    Documentos y Estudios Adjuntos
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {patientDocuments.length === 0 ? (
                      <div className="col-span-full bg-gray-50 border border-gray-100 border-dashed rounded-2xl p-8 text-center text-sm text-gray-500">
                        No hay documentos ni estudios adjuntos.
                      </div>
                    ) : (
                      patientDocuments.map(doc => (
                        <div key={doc.id} className="flex justify-between items-center bg-white border border-gray-100 shadow-sm hover:shadow hover:border-brand-teal/30 rounded-2xl p-4 transition-all group">
                          <div className="min-w-0 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-teal-50 text-brand-teal flex items-center justify-center shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="overflow-hidden">
                              <h4 className="text-sm font-bold text-gray-900 truncate" title={doc.original_filename}>{doc.original_filename}</h4>
                              <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                                <span className="uppercase tracking-wider font-semibold text-brand-teal">{doc.document_type.replace('_', ' ')}</span>
                                <span>&bull;</span>
                                <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <a href={doc.download_url} target="_blank" rel="noreferrer" className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-brand-teal hover:text-white text-gray-400 rounded-lg transition-colors shrink-0">
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-red-500 font-medium">
              Error al cargar expediente.
            </div>
          )
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-white/40">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <User className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-lg font-medium text-gray-600">{t("select_patient")}</p>
            <p className="text-sm mt-2">Seleccione un paciente de la lista para ver su expediente.</p>
          </div>
        )}
      </div>

      {/* COLUMN 3: Copilot AI Right Panel */}
      <div className="w-96 bg-white border-l border-gray-100 shadow-xl flex flex-col z-20 shrink-0 relative">
        <div className="p-4 border-b border-gray-100 bg-brand-dark relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-teal/20 rounded-full blur-2xl pointer-events-none"></div>
          <h2 className="font-bold text-white flex items-center gap-2 relative z-10 text-sm">
            <Sparkles className="w-4 h-4 text-brand-teal" />
            Copiloto Clínico IA
          </h2>
          <p className="text-[10px] text-gray-400 mt-1 relative z-10">Análisis y soporte para el expediente activo</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
          {!selectedPatient ? (
            <div className="h-full flex flex-col items-center justify-center opacity-50">
              <Bot className="w-12 h-12 text-gray-400 mb-4" />
              <div className="text-center text-sm font-medium text-gray-600">Esperando expediente...</div>
            </div>
          ) : (
            copilotMessages.map((msg, i) => (
              <div key={i} className={lex }>
                <div className={max-w-[90%] rounded-2xl p-4 shadow-sm }>
                  <div className={prose prose-sm max-w-none prose-p:leading-relaxed }>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))
          )}
          {isCopilotThinking && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm p-4 shadow-sm flex items-center gap-2 text-brand-teal">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs font-medium">Analizando historial...</span>
              </div>
            </div>
          )}
          <div ref={copilotEndRef} />
        </div>

        <div className="p-4 bg-white border-t border-gray-100 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
          <form onSubmit={handleCopilotSend} className="relative flex items-end">
            <textarea
              value={copilotInput}
              onChange={(e) => setCopilotInput(e.target.value)}
              disabled={!selectedPatient || isCopilotThinking}
              placeholder="Pregunte sobre el historial de este paciente..."
              className="w-full bg-gray-100 border-none rounded-2xl py-3 pl-4 pr-12 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-teal disabled:opacity-50 resize-none min-h-[48px] max-h-[120px]"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleCopilotSend(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={!copilotInput.trim() || !selectedPatient || isCopilotThinking}
              className="absolute right-2 bottom-2 w-8 h-8 bg-brand-teal flex items-center justify-center rounded-xl text-white disabled:opacity-50 transition-transform active:scale-95 shadow-md hover:bg-teal-600"
            >
              <Send className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}'''

final_content = logic_part + new_ui

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(final_content)

print("DoctorDashboard updated successfully!")
