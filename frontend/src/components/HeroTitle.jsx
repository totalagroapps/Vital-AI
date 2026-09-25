import React from 'react';

// Pinta un titular traducido como una sola frase: "\n" es un salto de línea y **texto** la parte
// destacada. Traducir la frase entera (y no trozos sueltos) mantiene la gramática de cada idioma.
export default function HeroTitle({ text, highlightClassName = '', HighlightTag = 'span' }) {
  const parts = String(text || '').split('**');
  const lines = (chunk) => chunk.split('\n').map((line, i, arr) => (
    <React.Fragment key={i}>{line}{i < arr.length - 1 && <br />}</React.Fragment>
  ));
  return parts.map((chunk, i) => (i % 2 === 1
    ? <HighlightTag key={i} className={highlightClassName}>{lines(chunk)}</HighlightTag>
    : <React.Fragment key={i}>{lines(chunk)}</React.Fragment>));
}
