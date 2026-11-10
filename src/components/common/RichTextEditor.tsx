import React, { useState, useRef } from 'react';
import { RichTextRenderer, countWords } from './RichTextRenderer';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  FileText,
  Eye,
  Edit3,
  Columns,
  RotateCcw,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxWords?: number;
  label?: string;
  helperText?: string;
  minHeight?: string;
}

export const MAX_JOB_DESCRIPTION_WORDS = 10000;

export const JOB_DESCRIPTION_TEMPLATE = `## Role Overview & Purpose
We are seeking an exceptional professional to join our team at Cube Tech Consults. This role plays a mission-critical part in driving high-impact client deliverables, operational standards, and cross-functional team leadership.

### What You Will Achieve
- Lead end-to-end service delivery and measurable milestone outcomes
- Establish high operational benchmarks and standard operating procedures (SOPs)
- Partner directly with executive leadership, clients, and cross-functional teams
- Champion continuous improvement, quality assurance, and KPI accountability

### Key Responsibilities & Deliverables
- **Strategic Execution:** Execute core workflows in accordance with client service-level agreements (SLAs)
- **Stakeholder Engagement:** Communicate proactively with internal teams and external client partners
- **Performance Optimization:** Track weekly and monthly KPIs, identifying and resolving operational bottlenecks
- **Mentorship & Culture:** Provide coaching, feedback, and knowledge-sharing across team members

### Professional Qualifications & Scorecard
- Proven track record in a similar capacity within reputable corporate or fast-growth environments
- Exceptional communication, analytical problem-solving, and conflict-resolution abilities
- Comfort navigating modern CRM, ERP, project management, and collaborative digital platforms
- High ethical standards, diligence, and accountability

### What We Offer
- Competitive monthly compensation package with performance-linked incentives
- Comprehensive health, welfare, and professional development support
- Clear career trajectory and leadership acceleration pathways
- Dynamic, supportive, and merit-driven workplace culture

> **Equal Opportunity Commitment:** Cube Tech Consults is an equal opportunity employer. We celebrate diversity and are committed to creating an inclusive environment for all qualified candidates.`;

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write a comprehensive job description (up to 10,000 words) with rich formatting...',
  maxWords = MAX_JOB_DESCRIPTION_WORDS,
  label = 'Job Description & Role Specifications',
  helperText = 'Supports rich text formatting options (headings, bold, italics, bullet/numbered lists, blockquotes, and code badges). Max 10,000 words.',
  minHeight = '280px'
}) => {
  const [tab, setTab] = useState<'write' | 'preview' | 'split'>('write');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wordCount = countWords(value);
  const isOverLimit = wordCount > maxWords;
  const isNearLimit = wordCount >= maxWords * 0.9 && !isOverLimit;
  const percentUsed = Math.min(100, Math.round((wordCount / maxWords) * 100));

  // Helper to wrap or insert text around current selection
  const applyFormatting = (before: string, after: string = '', defaultText: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = textarea.value;
    const selectedText = currentVal.substring(start, end) || defaultText;

    const replacement = `${before}${selectedText}${after}`;
    const nextVal = currentVal.substring(0, start) + replacement + currentVal.substring(end);

    onChange(nextVal);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  const handleApplyPrefix = (prefix: string, defaultText: string = 'Item') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = textarea.value;
    const selected = currentVal.substring(start, end);

    if (!selected) {
      applyFormatting(`\n${prefix}`, '', defaultText);
      return;
    }

    const lines = selected.split('\n');
    const formatted = lines.map(line => `${prefix}${line}`).join('\n');
    const nextVal = currentVal.substring(0, start) + formatted + currentVal.substring(end);
    onChange(nextVal);
  };

  // Keyboard shortcuts (Ctrl+B, Ctrl+I)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        applyFormatting('**', '**', 'bold text');
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        applyFormatting('*', '*', 'italic text');
      }
    }
  };

  const handleInsertTemplate = () => {
    if (value.trim()) {
      const confirmReplace = window.confirm(
        'Append the comprehensive job description template to your current text? (Click Cancel to replace current text entirely).'
      );
      if (confirmReplace) {
        onChange(`${value.trim()}\n\n---\n\n${JOB_DESCRIPTION_TEMPLATE}`);
      } else {
        onChange(JOB_DESCRIPTION_TEMPLATE);
      }
    } else {
      onChange(JOB_DESCRIPTION_TEMPLATE);
    }
  };

  const handleClearFormatting = () => {
    // Strip common markdown symbols
    const stripped = value
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/^#{1,4}\s+/gm, '')
      .replace(/^>\s+/gm, '')
      .replace(/^[-*•]\s+/gm, '')
      .replace(/^\d+\.\s+/gm, '')
      .replace(/`([^`]+)`/g, '$1');
    onChange(stripped);
  };

  return (
    <div className="rich-text-editor-container" style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div>
          {label && <label style={{ display: 'block', fontWeight: 600, fontSize: '13px' }}>{label}</label>}
          {helperText && <p className="xs muted" style={{ margin: '2px 0 0' }}>{helperText}</p>}
        </div>

        {/* Word Counter Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 600,
              background: isOverLimit
                ? 'rgba(239, 68, 68, 0.15)'
                : isNearLimit
                ? 'rgba(245, 158, 11, 0.15)'
                : 'var(--surface-2)',
              color: isOverLimit
                ? 'var(--red)'
                : isNearLimit
                ? 'var(--yellow-text)'
                : 'var(--ink-2)',
              border: `1px solid ${
                isOverLimit
                  ? 'rgba(239, 68, 68, 0.4)'
                  : isNearLimit
                  ? 'rgba(245, 158, 11, 0.4)'
                  : 'var(--line)'
              }`
            }}
            title={`Job descriptions support up to ${maxWords.toLocaleString()} words.`}
          >
            {isOverLimit ? (
              <AlertCircle size={13} style={{ color: 'var(--red)' }} />
            ) : (
              <CheckCircle2 size={13} style={{ color: '#10B981' }} />
            )}
            <span>
              <b>{wordCount.toLocaleString()}</b> / {maxWords.toLocaleString()} words
            </span>
            <span className="muted xs">({percentUsed}%)</span>
          </div>
        </div>
      </div>

      {/* Editor Box */}
      <div
        style={{
          border: `1px solid ${isOverLimit ? 'var(--red)' : 'var(--line)'}`,
          borderRadius: '8px',
          overflow: 'hidden',
          background: 'var(--surface)'
        }}
      >
        {/* Formatting Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 10px',
            background: 'var(--surface-2)',
            borderBottom: '1px solid var(--line)',
            flexWrap: 'wrap',
            gap: '6px'
          }}
        >
          {/* Format Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="iconbtn"
              onClick={() => applyFormatting('**', '**', 'bold text')}
              title="Bold (Ctrl+B)"
              style={{ padding: '5px' }}
            >
              <Bold size={14} />
            </button>
            <button
              type="button"
              className="iconbtn"
              onClick={() => applyFormatting('*', '*', 'italic text')}
              title="Italic (Ctrl+I)"
              style={{ padding: '5px' }}
            >
              <Italic size={14} />
            </button>
            <div style={{ width: '1px', height: '16px', background: 'var(--line)', margin: '0 3px' }} />

            <button
              type="button"
              className="iconbtn"
              onClick={() => handleApplyPrefix('## ', 'Section Heading')}
              title="Heading 2 (##)"
              style={{ padding: '5px' }}
            >
              <Heading2 size={14} />
            </button>
            <button
              type="button"
              className="iconbtn"
              onClick={() => handleApplyPrefix('### ', 'Sub-section Heading')}
              title="Heading 3 (###)"
              style={{ padding: '5px' }}
            >
              <Heading3 size={14} />
            </button>
            <div style={{ width: '1px', height: '16px', background: 'var(--line)', margin: '0 3px' }} />

            <button
              type="button"
              className="iconbtn"
              onClick={() => handleApplyPrefix('- ', 'Key responsibility or qualification')}
              title="Bulleted List (-)"
              style={{ padding: '5px' }}
            >
              <List size={14} />
            </button>
            <button
              type="button"
              className="iconbtn"
              onClick={() => handleApplyPrefix('1. ', 'Step or requirement')}
              title="Numbered List (1.)"
              style={{ padding: '5px' }}
            >
              <ListOrdered size={14} />
            </button>
            <button
              type="button"
              className="iconbtn"
              onClick={() => handleApplyPrefix('> ', 'Important highlight or clause')}
              title="Quote / Callout (>)"
              style={{ padding: '5px' }}
            >
              <Quote size={14} />
            </button>
            <button
              type="button"
              className="iconbtn"
              onClick={() => applyFormatting('`', '`', 'tag')}
              title="Code / Key Tag (`)"
              style={{ padding: '5px' }}
            >
              <Code size={14} />
            </button>
            <button
              type="button"
              className="iconbtn"
              onClick={() => applyFormatting('\n\n---\n\n', '', '')}
              title="Horizontal Divider (---)"
              style={{ padding: '5px' }}
            >
              <Minus size={14} />
            </button>
            <div style={{ width: '1px', height: '16px', background: 'var(--line)', margin: '0 3px' }} />

            <button
              type="button"
              className="btn ghost sm"
              onClick={handleInsertTemplate}
              title="Insert a comprehensive 10,000-word ready job description template"
              style={{ fontSize: '11px', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <FileText size={12} style={{ color: 'var(--yellow)' }} /> Template
            </button>
            <button
              type="button"
              className="btn ghost sm"
              onClick={handleClearFormatting}
              title="Remove markdown syntax from description"
              style={{ fontSize: '11px', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <RotateCcw size={11} /> Clear syntax
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'var(--surface)', padding: '2px', borderRadius: '6px', border: '1px solid var(--line)' }}>
            <button
              type="button"
              className={`iconbtn ${tab === 'write' ? 'active' : ''}`}
              onClick={() => setTab('write')}
              title="Edit & Format Mode"
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                borderRadius: '4px',
                background: tab === 'write' ? 'var(--red)' : 'transparent',
                color: tab === 'write' ? '#fff' : 'var(--muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Edit3 size={12} /> Write
            </button>
            <button
              type="button"
              className={`iconbtn ${tab === 'preview' ? 'active' : ''}`}
              onClick={() => setTab('preview')}
              title="Formatted Live Preview Mode"
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                borderRadius: '4px',
                background: tab === 'preview' ? 'var(--red)' : 'transparent',
                color: tab === 'preview' ? '#fff' : 'var(--muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Eye size={12} /> Preview
            </button>
            <button
              type="button"
              className={`iconbtn ${tab === 'split' ? 'active' : ''}`}
              onClick={() => setTab('split')}
              title="Split Write & Preview"
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                borderRadius: '4px',
                background: tab === 'split' ? 'var(--red)' : 'transparent',
                color: tab === 'split' ? '#fff' : 'var(--muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Columns size={12} /> Split
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ display: 'grid', gridTemplateColumns: tab === 'split' ? '1fr 1fr' : '1fr', minHeight }}>
          {/* Write Textarea */}
          {(tab === 'write' || tab === 'split') && (
            <textarea
              ref={textareaRef}
              value={value}
              onChange={e => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              style={{
                width: '100%',
                minHeight,
                padding: '14px',
                border: 'none',
                outline: 'none',
                resize: 'vertical',
                background: 'transparent',
                color: 'var(--ink)',
                fontSize: '13.5px',
                lineHeight: 1.6,
                fontFamily: 'var(--mono)',
                boxSizing: 'border-box',
                borderRight: tab === 'split' ? '1px solid var(--line)' : 'none'
              }}
            />
          )}

          {/* Formatted Live Preview */}
          {(tab === 'preview' || tab === 'split') && (
            <div
              style={{
                padding: '16px 20px',
                overflowY: 'auto',
                maxHeight: '520px',
                minHeight,
                background: 'var(--surface)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px dashed var(--line)', paddingBottom: '6px' }}>
                <span className="xs caps muted" style={{ fontWeight: 600, letterSpacing: '.08em' }}>
                  Live Formatted Output
                </span>
                <span className="xs muted">{wordCount.toLocaleString()} words</span>
              </div>
              <RichTextRenderer content={value} />
            </div>
          )}
        </div>

        {/* Over-Limit Warning Footer */}
        {isOverLimit && (
          <div
            style={{
              padding: '8px 12px',
              background: 'rgba(239, 68, 68, 0.1)',
              borderTop: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              color: 'var(--red)'
            }}
          >
            <AlertCircle size={14} />
            <span>
              <b>Word limit exceeded:</b> The job description currently has {wordCount.toLocaleString()} words. Please trim down to under {maxWords.toLocaleString()} words to save.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
