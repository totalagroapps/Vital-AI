import os
import re

file_path = 'frontend/src/views/DoctorOnboarding.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

bad_stepper = """        {/* Stepper */}
        <div className="hidden md:flex items-center flex-1 max-w-3xl mx-auto px-12">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center gap-2 relative z-10 w-24">
                <div className={w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors shadow-sm
                  \\
                }>
                  {currentStep > step.id ? <Check size={16} strokeWidth={3} /> : step.id}
                </div>
                <span className={\text-[10px] font-bold text-center leading-tight
                  \\
                }>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={\flex-1 h-0.5 -mt-6 transition-colors
                  \\
                } />
              )}
            </React.Fragment>
          ))}
        </div>"""

good_stepper = """        {/* Stepper */}
        <div className="hidden md:flex items-center flex-1 max-w-3xl mx-auto px-12">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center gap-2 relative z-10 w-24">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors shadow-sm
                  ${currentStep > step.id ? 'bg-brand-purple text-white' : 
                    currentStep === step.id ? 'bg-brand-purple text-white ring-4 ring-brand-purple/20' : 
                    'bg-white border-2 border-gray-200 text-gray-400'}
                `}>
                  {currentStep > step.id ? <Check size={16} strokeWidth={3} /> : step.id}
                </div>
                <span className={`text-[10px] font-bold text-center leading-tight
                  ${currentStep >= step.id ? 'text-brand-purple' : 'text-gray-400'}
                `}>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 -mt-6 transition-colors
                  ${currentStep > step.id ? 'bg-brand-purple' : 'bg-gray-200'}
                `} />
              )}
            </React.Fragment>
          ))}
        </div>"""

# Replace via regex because of the weird control characters (\t for \text, \f for \flex)
content = re.sub(r'{\s*/\*\s*Stepper\s*\*/}(.*?)(<div className="flex flex-col items-end">)', good_stepper + "\n\n        \\2", content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Replaced stepper")
