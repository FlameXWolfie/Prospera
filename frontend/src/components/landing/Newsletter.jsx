import { ArrowRight } from 'lucide-react';
import './css/Newsletter.css';

export default function Newsletter({ onEnterApp, isAuthed = false }) {
  return (
    <section className="final-cta-section" id="start">
      <div className="final-cta-panel">
        <h2>Found a role worth applying to?</h2>
        <p>Bring the job description. DraftMe will help you tailor the resume.</p>
        <button type="button" className="final-cta-button" onClick={onEnterApp}>
          <span>{isAuthed ? 'Go to workspace' : 'Create your resume'}</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </section>
  );
}
