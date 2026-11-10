import React from 'react';

interface RichTextRendererProps {
  content?: string;
  className?: string;
  style?: React.CSSProperties;
  maxWords?: number;
}

export function countWords(text: string): number {
  if (!text) return 0;
  const matches = text.trim().match(/\S+/g);
  return matches ? matches.length : 0;
}

interface Block {
  type: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'ul' | 'ol' | 'quote' | 'hr';
  text?: string;
  items?: string[];
  lines?: string[];
}

function parseMarkdownBlocks(rawText: string): Block[] {
  if (!rawText) return [];
  const lines = rawText.split('\n');
  const blocks: Block[] = [];
  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;
  let currentQuote: { type: 'quote'; lines: string[] } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      if (currentList) {
        blocks.push(currentList);
        currentList = null;
      }
      if (currentQuote) {
        blocks.push(currentQuote);
        currentQuote = null;
      }
      continue;
    }

    if (line === '---' || line === '***') {
      if (currentList) {
        blocks.push(currentList);
        currentList = null;
      }
      if (currentQuote) {
        blocks.push(currentQuote);
        currentQuote = null;
      }
      blocks.push({ type: 'hr' });
      continue;
    }

    // Headings
    const hMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (hMatch) {
      if (currentList) {
        blocks.push(currentList);
        currentList = null;
      }
      if (currentQuote) {
        blocks.push(currentQuote);
        currentQuote = null;
      }
      const level = hMatch[1].length as 1 | 2 | 3 | 4;
      blocks.push({
        type: level === 1 ? 'h1' : level === 2 ? 'h2' : level === 3 ? 'h3' : 'h4',
        text: hMatch[2]
      });
      continue;
    }

    // Blockquote
    if (line.startsWith('>')) {
      if (currentList) {
        blocks.push(currentList);
        currentList = null;
      }
      const quoteText = line.replace(/^>\s*/, '');
      if (!currentQuote) currentQuote = { type: 'quote', lines: [] };
      currentQuote.lines.push(quoteText);
      continue;
    } else if (currentQuote) {
      blocks.push(currentQuote);
      currentQuote = null;
    }

    // Unordered List
    const ulMatch = line.match(/^[-*•]\s+(.+)$/);
    if (ulMatch) {
      if (currentList && currentList.type !== 'ul') {
        blocks.push(currentList);
        currentList = null;
      }
      if (!currentList) currentList = { type: 'ul', items: [] };
      currentList.items.push(ulMatch[1]);
      continue;
    }

    // Ordered List
    const olMatch = line.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      if (currentList && currentList.type !== 'ol') {
        blocks.push(currentList);
        currentList = null;
      }
      if (!currentList) currentList = { type: 'ol', items: [] };
      currentList.items.push(olMatch[1]);
      continue;
    }

    if (currentList) {
      blocks.push(currentList);
      currentList = null;
    }

    blocks.push({ type: 'p', text: line });
  }

  if (currentList) blocks.push(currentList);
  if (currentQuote) blocks.push(currentQuote);

  return blocks;
}

function renderInline(text: string): React.ReactNode[] {
  // Regex pattern for bold (**), italic (*), code (`), link ([text](url)), badges ([Badge: text])
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\)|\bhttps?:\/\/[^\s]+)/g);

  return parts.map((part, idx) => {
    if (!part) return null;

    // Bold
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={idx} style={{ fontWeight: 650, color: 'var(--ink)' }}>
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Italic
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={idx} style={{ fontStyle: 'italic' }}>
          {part.slice(1, -1)}
        </em>
      );
    }

    // Inline Code / Tag
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={idx}
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--line)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'var(--mono)',
            color: 'var(--red-text)'
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Markdown Link
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      return (
        <a
          key={idx}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--red-text)', textDecoration: 'underline', fontWeight: 500 }}
        >
          {linkMatch[1]}
        </a>
      );
    }

    // Bare URL
    if (part.startsWith('http://') || part.startsWith('https://')) {
      return (
        <a
          key={idx}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--red-text)', textDecoration: 'underline' }}
        >
          {part}
        </a>
      );
    }

    return <span key={idx}>{part}</span>;
  });
}

export const RichTextRenderer: React.FC<RichTextRendererProps> = ({
  content,
  className = '',
  style = {},
  maxWords
}) => {
  if (!content || !content.trim()) {
    return <p className="muted sm">No description provided for this position.</p>;
  }

  let textToRender = content;
  if (maxWords && countWords(content) > maxWords) {
    const words = content.trim().split(/\s+/).slice(0, maxWords);
    textToRender = words.join(' ') + '...';
  }

  const blocks = parseMarkdownBlocks(textToRender);

  return (
    <div
      className={`rich-text-content ${className}`}
      style={{
        lineHeight: 1.65,
        color: 'var(--ink)',
        fontSize: '14px',
        wordBreak: 'break-word',
        ...style
      }}
    >
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'h1':
            return (
              <h1
                key={index}
                style={{
                  fontSize: '22px',
                  fontWeight: 700,
                  margin: '20px 0 10px',
                  color: 'var(--ink)',
                  borderBottom: '1px solid var(--line)',
                  paddingBottom: '6px'
                }}
              >
                {renderInline(block.text || '')}
              </h1>
            );
          case 'h2':
            return (
              <h2
                key={index}
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  margin: '18px 0 8px',
                  color: 'var(--ink)'
                }}
              >
                {renderInline(block.text || '')}
              </h2>
            );
          case 'h3':
            return (
              <h3
                key={index}
                style={{
                  fontSize: '15px',
                  fontWeight: 650,
                  margin: '14px 0 6px',
                  color: 'var(--ink)'
                }}
              >
                {renderInline(block.text || '')}
              </h3>
            );
          case 'h4':
            return (
              <h4
                key={index}
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  margin: '12px 0 4px',
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                {renderInline(block.text || '')}
              </h4>
            );
          case 'p':
            return (
              <p key={index} style={{ margin: '0 0 10px', color: 'var(--ink)' }}>
                {renderInline(block.text || '')}
              </p>
            );
          case 'ul':
            return (
              <ul
                key={index}
                style={{
                  margin: '8px 0 14px 20px',
                  padding: 0,
                  listStyleType: 'disc'
                }}
              >
                {block.items?.map((item, itemIdx) => (
                  <li key={itemIdx} style={{ margin: '4px 0', paddingLeft: '4px' }}>
                    {renderInline(item)}
                  </li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol
                key={index}
                style={{
                  margin: '8px 0 14px 20px',
                  padding: 0,
                  listStyleType: 'decimal'
                }}
              >
                {block.items?.map((item, itemIdx) => (
                  <li key={itemIdx} style={{ margin: '4px 0', paddingLeft: '4px' }}>
                    {renderInline(item)}
                  </li>
                ))}
              </ol>
            );
          case 'quote':
            return (
              <blockquote
                key={index}
                style={{
                  margin: '12px 0',
                  padding: '8px 14px',
                  background: 'var(--surface-2)',
                  borderLeft: '4px solid var(--red)',
                  borderRadius: '0 6px 6px 0',
                  color: 'var(--ink-2)',
                  fontStyle: 'italic'
                }}
              >
                {block.lines?.map((line, qIdx) => (
                  <p key={qIdx} style={{ margin: '2px 0' }}>
                    {renderInline(line)}
                  </p>
                ))}
              </blockquote>
            );
          case 'hr':
            return (
              <hr
                key={index}
                style={{
                  border: 'none',
                  borderTop: '1px solid var(--line)',
                  margin: '20px 0'
                }}
              />
            );
          default:
            return null;
        }
      })}
    </div>
  );
};
