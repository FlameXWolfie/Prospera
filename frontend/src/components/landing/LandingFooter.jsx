import { ArrowUpRight } from 'lucide-react';
import BrandLogo from '../BrandLogo';
import './css/LandingFooter.css';

export default function LandingFooter({ onEnterApp }) {
  const scrollHome = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="landing-footer">
      <div className="footer-shell">
        <div className="footer-lead">
          <button type="button" className="footer-brand-button" onClick={scrollHome} aria-label="Back to the top">
            <BrandLogo />
          </button>
          <p>Build better applications. Keep the search moving.</p>
        </div>

        <div className="footer-navigation">
          <div className="footer-summary">
            <p>Create resumes, organize applications, and prepare for interviews in one workspace.</p>
          </div>

          <div className="footer-column">
            <h3>Explore</h3>
            <a href="#features">Product tour</a>
            <a href="#workflow">Workflow</a>
          </div>

          <div className="footer-column">
            <h3>Tools</h3>
            <button type="button" onClick={onEnterApp}>Resume builder</button>
            <button type="button" onClick={onEnterApp}>Application tracker</button>
            <button type="button" onClick={onEnterApp}>Interview practice</button>
          </div>

          <div className="footer-column">
            <h3>Contact</h3>
            <a href="mailto:hello@draftme.in" className="footer-email">
              hello@draftme.in
              <ArrowUpRight size={14} />
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} DraftMe</span>
          <span>Made for the next move.</span>
        </div>
      </div>
    </footer>
  );
}
