import { useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, Trash2, Plus, X } from 'lucide-react';
import { emptySocial } from '../../lib/portfolio/portfolioModel';
import './templates/css/inlineEdit.css';

// Click-to-edit text rendered INLINE inside a portfolio template. Uncontrolled
// contentEditable: the initial text is written to the DOM via a ref (only when the
// element isn't focused), and the value is committed to the draft on BLUR — so the
// whole template never re-renders on each keystroke and the caret never jumps.
// Placeholder shows (via CSS) when empty. Plaintext only (Enter blurs single-line;
// paste is sanitised).
export function EditableText({ value, onCommit, placeholder = '', multiline = false }) {
  const ref = useRef(null);
  const focused = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (el && !focused.current && el.textContent !== (value || '')) el.textContent = value || '';
  });
  return (
    <span
      ref={ref}
      className="pf-edit"
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      tabIndex={0}
      data-ph={placeholder}
      onFocus={() => { focused.current = true; }}
      onBlur={(e) => { focused.current = false; onCommit(e.currentTarget.textContent.replace(/\s+/g, ' ').trim() === '' ? '' : e.currentTarget.textContent); }}
      onKeyDown={(e) => { if (!multiline && e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }}
      onPaste={(e) => { e.preventDefault(); const t = (e.clipboardData || window.clipboardData).getData('text/plain'); document.execCommand('insertText', false, t); }}
    />
  );
}

// Hover toolbar pinned to a list item (reorder + delete). contentEditable=false so
// it isn't captured by a surrounding editable region.
export function ItemControls({ onUp, onDown, onRemove, canUp, canDown }) {
  return (
    <span className="pf-item-ctrl" contentEditable={false}>
      <button type="button" onClick={onUp} disabled={!canUp} aria-label="Move up"><ChevronUp size={14} /></button>
      <button type="button" onClick={onDown} disabled={!canDown} aria-label="Move down"><ChevronDown size={14} /></button>
      <button type="button" className="danger" onClick={onRemove} aria-label="Remove"><Trash2 size={14} /></button>
    </span>
  );
}

// Dashed "+ Add …" affordance shown at the end of an editable list.
export function AddButton({ onClick, label }) {
  return (
    <button type="button" className="pf-add-btn" contentEditable={false} onClick={onClick}>
      <Plus size={14} /> {label}
    </button>
  );
}

// Edit-mode contact block: email / phone / website + a label·URL list. Rendered in
// each template's contact zone so links are editable on the page (no separate form).
// `T(path, ph)` is the inline text renderer; `edit` carries add/removeAt.
export function ContactEditor({ data, T, edit }) {
  const socials = data.socials || [];
  return (
    <div className="pf-contact-editor" contentEditable={false}>
      <div className="pf-ce-grid">
        <label className="pf-ce-row"><span>Email</span>{T('email', 'you@email.com')}</label>
        <label className="pf-ce-row"><span>Phone</span>{T('phone', '(555) 000-0000')}</label>
        <label className="pf-ce-row"><span>Website</span>{T('website', 'yoursite.com')}</label>
      </div>
      <div className="pf-ce-links">
        {socials.map((s, i) => (
          <div className="pf-ce-link" key={s._id || i}>
            <span className="pf-ce-link-label">{T(`socials.${i}.label`, 'Label')}</span>
            <span className="pf-ce-link-url">{T(`socials.${i}.url`, 'https://…')}</span>
            <button type="button" className="pf-ce-x" onClick={() => edit.removeAt('socials', i)} aria-label="Remove link"><X size={13} /></button>
          </div>
        ))}
        <AddButton onClick={() => edit.add('socials', emptySocial())} label="Add link" />
      </div>
    </div>
  );
}
