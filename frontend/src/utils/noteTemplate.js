// Plantillas de informe estilo MedAlly para MIVOR Scribe.
// Sintaxis (debe coincidir con backend/services/note_templates.py):
//   {opción A|opción B}  multi-opción: se elige una y las demás desaparecen ({|texto} = texto opcional)
//   [etiqueta]           campo a rellenar; también puede ir dentro de una opción: {no|sí, [cuál]}
//   ((texto))            ayuda para el médico: no se copia al informe
// Ids: cada multi-opción y cada campo recibe un número por orden de aparición desde 1; los campos de
// dentro de una opción se numeran justo después de su multi-opción. El valor de una multi-opción es el
// índice (como texto) de la opción elegida; el de un campo, su texto.

const TOKEN_RE = /\(\(([\s\S]*?)\)\)|\{([^{}]*\|[^{}]*)\}|\[([^[\]\n]+)\]/g;
const FIELD_RE = /\[([^[\]\n]+)\]/g;

// Divide un texto en trozos de texto y campos [etiqueta] (para las opciones)
function splitFields(text, nextId) {
  const parts = [];
  let last = 0;
  let id = nextId;
  for (const m of text.matchAll(FIELD_RE)) {
    if (m.index > last) parts.push({ type: 'text', text: text.slice(last, m.index) });
    parts.push({ type: 'field', id: String(id++), label: m[1].trim() });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ type: 'text', text: text.slice(last) });
  return { parts, nextId: id };
}

export function parseTemplate(body = '') {
  const segments = [];
  let last = 0;
  let nextId = 1;
  for (const match of body.matchAll(TOKEN_RE)) {
    if (match.index > last) segments.push({ type: 'text', text: body.slice(last, match.index) });
    const [, hint, choice, label] = match;
    if (hint !== undefined) {
      segments.push({ type: 'hint', text: hint.trim() });
    } else if (choice !== undefined) {
      const id = String(nextId++);
      const options = choice.split('|').map((raw) => {
        const split = splitFields(raw, nextId);
        nextId = split.nextId;
        return { raw, label: raw.trim() || '(nada)', parts: split.parts };
      });
      segments.push({ type: 'choice', id, options });
    } else {
      segments.push({ type: 'field', id: String(nextId++), label: label.trim() });
    }
    last = match.index + match[0].length;
  }
  if (last < body.length) segments.push({ type: 'text', text: body.slice(last) });
  return segments;
}

// Valores iniciales: cada multi-opción empieza en su primera opción (el hallazgo «normal»),
// así el médico solo cambia lo que difiere.
export function defaultValues(segments) {
  const values = {};
  segments.forEach((s) => { if (s.type === 'choice') values[s.id] = '0'; });
  return values;
}

export function selectedOption(segment, values) {
  const index = Number(values[segment.id] ?? 0);
  return segment.options[index] || segment.options[0];
}

// Campos visibles (los de la opción elegida incluidos) que siguen vacíos
export function emptyFields(segments, values) {
  const empty = [];
  segments.forEach((s) => {
    if (s.type === 'field' && !(values[s.id] || '').trim()) empty.push(s);
    if (s.type === 'choice') {
      selectedOption(s, values).parts.forEach((p) => {
        if (p.type === 'field' && !(values[p.id] || '').trim()) empty.push(p);
      });
    }
  });
  return empty;
}

const fieldText = (field, values) => (values[field.id] || '').trim() || '___';

// Texto final para pegar en la historia clínica: sin ayudas, con las opciones elegidas.
export function renderReport(segments, values) {
  const text = segments.map((s) => {
    if (s.type === 'text') return s.text;
    if (s.type === 'hint') return '';
    if (s.type === 'field') return fieldText(s, values);
    return selectedOption(s, values).parts
      .map((p) => (p.type === 'text' ? p.text : fieldText(p, values)))
      .join('');
  }).join('');
  return text
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+([.,;:])/g, '$1')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
