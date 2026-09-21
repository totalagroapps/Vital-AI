// Exporta el diccionario en inglés al backend, que lo usa como texto fuente para traducir la
// interfaz a idiomas sin traducción manual (POST /api/i18n/<idioma>).
// Uso: npm run i18n:export   (ejecutar cada vez que se añadan o cambien textos en src/i18n/en.js)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const { en } = await import(pathToFileURL(path.join(here, '../src/i18n/en.js')).href);
const out = {};
for (const [k, v] of Object.entries(en)) if (typeof v === 'string') out[k] = v;
const target = path.join(here, '../../backend/data/ui_source_en.json');
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, JSON.stringify(out, null, 0), 'utf8');
console.log(`Exportadas ${Object.keys(out).length} cadenas a ${path.relative(process.cwd(), target)}`);
