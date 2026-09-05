import React from 'react';
import './MarkdownText.css';

/**
 * Parsea texto simple con sintaxis Markdown:
 * - `código inline` -> <code>
 * - **negrita** o __negrita__ -> <strong>
 * - *cursiva* o _cursiva_ -> <em>
 */
function parseInlineMarkdown(text) {
  if (!text || typeof text !== 'string') return [];

  // Match inline code (`...`), bold (**...** o __...__), italic (*...* o _..._)
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|(?<!\*)\*[^*]+\*(?!\*)|__[^_]+__|(?<!_)_[^_]+_(?!_))/g;
  const parts = text.split(tokenRegex);

  return parts.filter(Boolean).map((part) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return { type: 'code', content: part.slice(1, -1) };
    }
    if (
      (part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
      (part.startsWith('__') && part.endsWith('__') && part.length >= 4)
    ) {
      return { type: 'bold', content: part.slice(2, -2) };
    }
    if (
      (part.startsWith('*') && part.endsWith('*') && part.length >= 2) ||
      (part.startsWith('_') && part.endsWith('_') && part.length >= 2)
    ) {
      return { type: 'italic', content: part.slice(1, -1) };
    }
    return { type: 'text', content: part };
  });
}

export default function MarkdownText({ text, className = '' }) {
  if (!text) return null;

  const lines = String(text).split('\n');

  return (
    <span className={`markdown-text-container ${className}`}>
      {lines.map((line, lIdx) => {
        // Detectar si la línea es un ítem de viñeta
        const isBullet = /^\s*[\*\-]\s+/.test(line);
        const cleanLine = isBullet ? line.replace(/^\s*[\*\-]\s+/, '') : line;

        const tokens = parseInlineMarkdown(cleanLine);
        const renderedTokens = tokens.map((tok, tIdx) => {
          if (tok.type === 'bold') {
            return (
              <strong key={tIdx} className="md-bold">
                {tok.content}
              </strong>
            );
          }
          if (tok.type === 'italic') {
            return (
              <em key={tIdx} className="md-italic">
                {tok.content}
              </em>
            );
          }
          if (tok.type === 'code') {
            return (
              <code key={tIdx} className="md-inline-code">
                {tok.content}
              </code>
            );
          }
          return <React.Fragment key={tIdx}>{tok.content}</React.Fragment>;
        });

        if (isBullet) {
          return (
            <span key={lIdx} className="md-bullet-line">
              <span className="md-bullet-dot">•</span>
              <span className="md-bullet-text">{renderedTokens}</span>
              {lIdx < lines.length - 1 && <br />}
            </span>
          );
        }

        return (
          <React.Fragment key={lIdx}>
            {renderedTokens}
            {lIdx < lines.length - 1 && <br />}
          </React.Fragment>
        );
      })}
    </span>
  );
}
