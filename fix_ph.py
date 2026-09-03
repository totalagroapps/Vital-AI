import os

file_path = 'frontend/src/views/PatientHome.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# The first instance of onNavigate('general_chat') is the Entiende tus sintomas button.
# The second one is the search bar wrapper.
# Let's be precise.
content = content.replace(
    '''<button onClick={() => onNavigate('general_chat')} className="bg-white rounded-2xl md:rounded-3xl p-4 
text-left text-content-primary border border-gray-100 shadow-sm relative overflow-hidden group hover:-translate-y-1.5 
hover:shadow-card-hover transition-all duration-300 ease-out flex flex-col h-full">
            <div className="mb-1.5">
              <div className="w-6 h-6 rounded-full border border-brand-purple/20 flex items-center justify-center text-brand-purple mb-3 bg-brand-purple/5">
                <Stethoscope size={12} />
              </div>
            </div>
            <h4 className="font-bold text-[11px] md:text-base leading-tight mb-1 pr-2" style={{ color: "#1E293B" }}>Entiende tus s&#237;ntomas</h4>''',
    '''<button onClick={() => onNavigate('triage')} className="bg-white rounded-2xl md:rounded-3xl p-4 text-left text-content-primary border border-gray-100 shadow-sm relative overflow-hidden group hover:-translate-y-1.5 hover:shadow-card-hover transition-all duration-300 ease-out flex flex-col h-full">
            <div className="mb-1.5">
              <div className="w-6 h-6 rounded-full border border-brand-purple/20 flex items-center justify-center text-brand-purple mb-3 bg-brand-purple/5">
                <Stethoscope size={12} />
              </div>
            </div>
            <h4 className="font-bold text-[11px] md:text-base leading-tight mb-1 pr-2" style={{ color: "#1E293B" }}>Entiende tus s&#237;ntomas</h4>'''
)
# Note: due to string formatting it might be easier to just regex or replace all and then fix the search bar.
