import re

with open('frontend/src/Auth.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add confirmPassword state
content = content.replace(
    "const [password, setPassword] = useState('');",
    "const [password, setPassword] = useState('');\n  const [confirmPassword, setConfirmPassword] = useState('');"
)

# Add password confirmation check in handleSubmit
content = content.replace(
    "if (isRegistering) {",
    "if (isRegistering) {\n        if (password !== confirmPassword) {\n          setError('Las contraseñas no coinciden');\n          setLoading(false);\n          return;\n        }"
)

# Add Confirm Password Input UI if isRegistering
confirm_input = '''</div>

            {isRegistering && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2 ml-1">Confirmar Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-600" />
                  <input 
                    type="password" 
                    required={isRegistering}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={w-full bg-slate-100/50 border border-slate-300 rounded-2xl py-3 pl-11 pr-4 text-slate-800 focus:outline-none focus:ring-1 transition-all placeholder:text-slate-500 }
                    placeholder="Repite tu contraseña"
                  />
                </div>
              </div>
            )}

            <button '''

# In Auth.jsx, the password input ends with </div> \n </div> \n <button type="submit"
content = re.sub(
    r'</div>\s*</div>\s*<button \s*type="submit"',
    confirm_input + 'type="submit"',
    content
)

with open('frontend/src/Auth.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
