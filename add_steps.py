import os
import re

file_path = 'frontend/src/views/DoctorOnboarding.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

step3_4_5 = '''
        {/* Step 3: Verificación Profesional */}
        {currentStep === 3 && (
            <div className="flex flex-col max-w-4xl mx-auto pt-4 h-full">
              <div className="flex items-center mb-6">
                <button onClick={handleBack} className="text-brand-purple flex items-center gap-2 font-bold text-sm hover:text-purple-700">
                  <ArrowLeft size={16} /> Volver
                </button>
              </div>

              <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm mb-12">
                <h3 className="font-bold text-brand-dark text-lg mb-1">Verificación profesional</h3>
                <p className="text-xs text-gray-500 mb-8">Sube tus documentos para validar tu identidad y credenciales. Es 100% seguro.</p>
                
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div className="border border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 cursor-pointer transition-colors group">
                    <div className="w-12 h-12 rounded-full bg-purple-50 text-brand-purple flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <UserSquare2 size={24}/>
                    </div>
                    <h4 className="font-bold text-sm text-brand-dark mb-2">Documento de identidad</h4>
                    <p className="text-xs text-gray-500 mb-4 px-4">DNI, pasaporte o documento oficial válido.</p>
                    <button className="border border-brand-purple text-brand-purple bg-white px-6 py-2 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-purple-50 transition-colors">
                      <UploadCloud size={14}/> Subir archivo
                    </button>
                    <p className="text-[10px] text-gray-400 mt-4">JPG, PNG o PDF. Máx. 10MB</p>
                  </div>

                  <div className="border border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 cursor-pointer transition-colors group">
                    <div className="w-12 h-12 rounded-full bg-purple-50 text-brand-purple flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <FileText size={24}/>
                    </div>
                    <h4 className="font-bold text-sm text-brand-dark mb-2">Certificado de colegiación</h4>
                    <p className="text-xs text-gray-500 mb-4 px-4">Certificado vigente de tu colegio médico.</p>
                    <button className="border border-brand-purple text-brand-purple bg-white px-6 py-2 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-purple-50 transition-colors">
                      <UploadCloud size={14}/> Subir archivo
                    </button>
                    <p className="text-[10px] text-gray-400 mt-4">JPG, PNG o PDF. Máx. 10MB</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-brand-green mb-8 bg-green-50/50 p-4 rounded-lg">
                   <Lock size={16}/> Tu información está protegida mediante encriptación y será verificada de forma segura por nuestro equipo.
                </div>
                
                <div className="flex items-center justify-end pt-4 border-t border-gray-100">
                   <button onClick={handleNext} className="bg-brand-purple text-white px-10 py-3 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-purple-700 transition-colors">
                     Verificar y continuar <ArrowRight size={16} />
                   </button>
                </div>
              </div>
            </div>
        )}

        {/* Step 4: Perfil Opcional */}
        {currentStep === 4 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
            {/* Left Col - Form */}
            <div className="col-span-1 lg:col-span-8 flex flex-col pt-4">
              <div className="flex items-center mb-6">
                <button onClick={handleBack} className="text-brand-purple flex items-center gap-2 font-bold text-sm hover:text-purple-700">
                  <ArrowLeft size={16} /> Volver
                </button>
              </div>

              <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm mb-12">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-purple-100 text-brand-purple p-1.5 rounded-full"><Brain size={14}/></div>
                  <span className="text-xs font-bold text-brand-purple uppercase tracking-wider">Opcional</span>
                </div>
                <h3 className="font-bold text-brand-dark text-2xl mb-2">Completa tu perfil profesional</h3>
                <p className="text-sm text-gray-500 mb-6">Ayuda a tus pacientes a conocerte mejor. Añade información adicional si deseas ofrecer una experiencia más cercana y personalizada.</p>
                
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex gap-4 items-start mb-8">
                  <div className="text-brand-blue"><Info size={20}/></div>
                  <div>
                    <h4 className="font-bold text-sm text-brand-dark">Este paso es opcional y no afecta a la aprobación de tu cuenta.</h4>
                    <p className="text-xs text-gray-600">Puedes omitirlo y completarlo más adelante desde los ajustes de tu perfil.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Item 1 */}
                  <div className="flex items-center justify-between py-4 border-b border-gray-100">
                    <div className="flex gap-4 items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-brand-purple"><User size={20}/></div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-brand-dark">Foto profesional</h4>
                          <span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-bold">OPCIONAL</span>
                        </div>
                        <p className="text-xs text-gray-500">Añade una foto para que los pacientes puedan reconocerte.</p>
                      </div>
                    </div>
                    <button className="border border-gray-200 bg-white text-brand-purple px-5 py-2 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-gray-50">
                      <UploadCloud size={14}/> Subir foto
                    </button>
                  </div>

                  {/* Item 2 */}
                  <div className="flex items-center justify-between py-4 border-b border-gray-100">
                    <div className="flex gap-4 items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-brand-purple"><ImageIcon size={20}/></div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-brand-dark">Imágenes de tu clínica</h4>
                          <span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-bold">OPCIONAL</span>
                        </div>
                        <p className="text-xs text-gray-500">Comparte imágenes de tu consulta o equipo profesional.</p>
                      </div>
                    </div>
                    <button className="border border-gray-200 bg-white text-brand-purple px-5 py-2 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-gray-50">
                      <UploadCloud size={14}/> Añadir imágenes
                    </button>
                  </div>

                  {/* Item 3 */}
                  <div className="flex items-center justify-between py-4 border-b border-gray-100">
                    <div className="flex gap-4 items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-brand-purple"><Video size={20}/></div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-brand-dark">Vídeo de presentación</h4>
                          <span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-bold">OPCIONAL</span>
                        </div>
                        <p className="text-xs text-gray-500">Sube un breve vídeo contándoles a tus pacientes sobre ti.</p>
                      </div>
                    </div>
                    <button className="border border-gray-200 bg-white text-brand-purple px-5 py-2 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-gray-50">
                      <UploadCloud size={14}/> Subir vídeo
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-10">
                   <button onClick={handleNext} className="text-gray-500 font-bold text-sm hover:text-gray-700">
                     Omitir por ahora
                   </button>
                   <button onClick={handleNext} className="bg-brand-purple text-white px-8 py-3 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-purple-700 transition-colors">
                     Continuar y finalizar inscripción <ArrowRight size={16} />
                   </button>
                </div>
              </div>
            </div>

            {/* Right Col - Graphic */}
            <div className="hidden lg:flex lg:col-span-4 flex-col pt-4">
               <div className="bg-[#f8f9fc] rounded-3xl overflow-hidden shadow-sm h-full flex flex-col p-8">
                 <img src="https://i.pravatar.cc/300?u=a042581f4e29026024d" className="w-full h-48 object-cover rounded-xl mb-6 shadow-md border-4 border-white" />
                 
                 <h3 className="text-xl font-bold text-brand-dark mb-4 leading-tight">Tu perfil, tu mejor carta de presentación</h3>
                 <p className="text-sm text-gray-600 mb-8 leading-relaxed">Conecta con más pacientes y genera más confianza mostrando quién eres y dónde trabajas.</p>
                 
                 <div className="space-y-6 flex-1">
                   <div className="flex items-start gap-3">
                     <div className="w-8 h-8 rounded-full bg-white text-brand-purple flex items-center justify-center flex-shrink-0 shadow-sm"><User size={16}/></div>
                     <div>
                       <p className="text-xs font-bold text-gray-800">Muestra tu foto profesional</p>
                       <p className="text-[11px] text-gray-500 mt-0.5">Haz que los pacientes te reconozcan.</p>
                     </div>
                   </div>
                   <div className="flex items-start gap-3">
                     <div className="w-8 h-8 rounded-full bg-white text-brand-purple flex items-center justify-center flex-shrink-0 shadow-sm"><ImageIcon size={16}/></div>
                     <div>
                       <p className="text-xs font-bold text-gray-800">Comparte imágenes de tu consulta</p>
                       <p className="text-[11px] text-gray-500 mt-0.5">Muéstrales tu espacio y tu equipo.</p>
                     </div>
                   </div>
                 </div>

                 <div className="bg-white/60 rounded-xl p-4 flex gap-3 items-start mt-6">
                   <Info size={16} className="text-brand-purple mt-0.5 flex-shrink-0"/>
                   <p className="text-[10px] text-gray-600">Esta información es opcional y podrás completarla cuando quieras desde "Mi perfil".</p>
                 </div>
               </div>
            </div>
            </div>
        )}

        {/* Step 5: Success */}
        {currentStep === 5 && (
            <div className="flex flex-col items-center justify-center max-w-3xl mx-auto pt-16 h-full text-center">
              
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center relative z-10 shadow-inner">
                   <div className="w-16 h-16 bg-brand-green rounded-full flex items-center justify-center shadow-lg">
                     <Check size={32} strokeWidth={3} className="text-white" />
                   </div>
                </div>
                {/* Decorative dots */}
                <div className="absolute top-0 right-[-20px] w-2 h-2 bg-brand-purple rounded-full"></div>
                <div className="absolute bottom-4 left-[-10px] w-3 h-3 bg-brand-blue rounded-full"></div>
              </div>

              <h1 className="text-4xl font-black text-brand-dark mb-4">¡Cuenta creada con éxito!</h1>
              <p className="text-lg text-gray-600 mb-12">Hemos recibido tu información correctamente.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-12">
                <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm text-left">
                  <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center text-brand-purple mb-4">
                    <UserSquare2 size={20} />
                  </div>
                  <h4 className="font-bold text-sm text-brand-dark mb-2">Verificación en proceso</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">Nuestro equipo revisará tus documentos en un plazo de 24 a 48 horas hábiles.</p>
                </div>

                <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm text-left">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mb-4">
                    <Globe size={20} />
                  </div>
                  <h4 className="font-bold text-sm text-brand-dark mb-2">Te notificaremos por email</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">Te enviaremos un correo cuando tu cuenta sea verificada y puedas acceder.</p>
                </div>

                <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm text-left">
                  <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-brand-green mb-4">
                    <Lock size={20} />
                  </div>
                  <h4 className="font-bold text-sm text-brand-dark mb-2">Tu información está segura</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">Protegemos tus datos bajo los más altos estándares de seguridad y privacidad.</p>
                </div>
              </div>

              <button onClick={() => window.location.href='/'} className="bg-brand-purple text-white px-16 py-4 rounded-xl font-bold text-lg flex items-center gap-3 hover:bg-purple-700 transition-colors shadow-lg hover:shadow-purple-500/30 mb-6">
                Ir al inicio <ArrowRight size={20} />
              </button>
              
              <button onClick={() => window.location.href='/'} className="flex items-center gap-2 text-brand-purple font-bold text-sm hover:text-purple-700">
                <User size={16} /> Completar mi perfil más tarde
              </button>

            </div>
        )}'''

content = content.replace('      </main>\n    </div>\n  );\n};\n\nexport default DoctorOnboarding;', step3_4_5 + '\n      </main>\n    </div>\n  );\n};\n\nexport default DoctorOnboarding;')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Added Steps 3, 4, 5")
