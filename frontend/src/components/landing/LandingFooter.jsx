import './css/LandingFooter.css';

export default function LandingFooter({ onEnterApp }) {
  return (
    <footer className="landing-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="logo-group" onClick={onEnterApp}>
            <div className="logo-circle">P</div>
            <span className="logo-text-bold">Prospera</span>
          </div>
          <p className="footer-desc">
            AI-powered career platform to help you build, optimize and land your dream job faster.
          </p>
          <div className="social-links">
            <a href="#linkedin" className="social-icon" onClick={(e) => e.preventDefault()}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
            </a>
            <a href="#twitter" className="social-icon" onClick={(e) => e.preventDefault()}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            </a>
            <a href="#youtube" className="social-icon" onClick={(e) => e.preventDefault()}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.522 3.5 12 3.5 12 3.5s-7.522 0-9.388.555A3.002 3.002 0 0 0 .502 6.163C0 8.03 0 12 0 12s0 3.97-.502 5.837a3.003 3.003 0 0 0 2.11 2.108C4.478 20.5 12 20.5 12 20.5s7.522 0 9.388-.555a3.003 3.003 0 0 0 2.11-2.108C24 15.97 24 12 24 12s0-3.97-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
            </a>
            <a href="#instagram" className="social-icon" onClick={(e) => e.preventDefault()}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </a>
          </div>
        </div>

        <div>
          <h4 className="footer-col-title">Product</h4>
          <ul className="footer-links-list">
            <li className="footer-link-item"><a href="#features">Features</a></li>
            <li className="footer-link-item"><a href="#resume" onClick={(e) => { e.preventDefault(); onEnterApp(); }}>Resume Builder</a></li>
            <li className="footer-link-item"><a href="#ats" onClick={(e) => { e.preventDefault(); onEnterApp(); }}>ATS Scanner</a></li>
            <li className="footer-link-item"><a href="#tracker" onClick={(e) => { e.preventDefault(); onEnterApp(); }}>Job Tracker</a></li>
            <li className="footer-link-item"><a href="#pricing">Pricing</a></li>
          </ul>
        </div>

        <div>
          <h4 className="footer-col-title">Resources</h4>
          <ul className="footer-links-list">
            <li className="footer-link-item"><a href="#blog" onClick={(e) => e.preventDefault()}>Blog</a></li>
            <li className="footer-link-item"><a href="#examples" onClick={(e) => e.preventDefault()}>Resume Examples</a></li>
            <li className="footer-link-item"><a href="#questions" onClick={(e) => e.preventDefault()}>Interview Questions</a></li>
            <li className="footer-link-item"><a href="#advice" onClick={(e) => e.preventDefault()}>Career Advice</a></li>
            <li className="footer-link-item"><a href="#help" onClick={(e) => e.preventDefault()}>Help Center</a></li>
          </ul>
        </div>

        <div>
          <h4 className="footer-col-title">Company</h4>
          <ul className="footer-links-list">
            <li className="footer-link-item"><a href="#about" onClick={(e) => e.preventDefault()}>About Us</a></li>
            <li className="footer-link-item"><a href="#careers" onClick={(e) => e.preventDefault()}>Careers</a></li>
            <li className="footer-link-item"><a href="#contact" onClick={(e) => e.preventDefault()}>Contact Us</a></li>
            <li className="footer-link-item"><a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a></li>
          </ul>
        </div>

        <div>
          <h4 className="footer-col-title">Legal</h4>
          <ul className="footer-links-list">
            <li className="footer-link-item"><a href="#terms" onClick={(e) => e.preventDefault()}>Terms of Service</a></li>
            <li className="footer-link-item"><a href="#cookies" onClick={(e) => e.preventDefault()}>Cookie Policy</a></li>
            <li className="footer-link-item"><a href="#refund" onClick={(e) => e.preventDefault()}>Refund Policy</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <span className="copyright-text">© {new Date().getFullYear()} Prospera. All rights reserved.</span>
      </div>
    </footer>
  );
}
