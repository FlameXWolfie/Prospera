import './LandingPage.css';

import LandingHeader from '../components/landing/LandingHeader';
import LandingHero from '../components/landing/LandingHero';
import Partners from '../components/landing/Partners';
import LandingFeatures from '../components/landing/LandingFeatures';
import LandingInsights from '../components/landing/LandingInsights';
import Newsletter from '../components/landing/Newsletter';
import LandingFooter from '../components/landing/LandingFooter';

export default function LandingPage({ onEnterApp, onLogin, isAuthed = false }) {
  return (
    <div className="landing-container">
      <LandingHeader onEnterApp={onEnterApp} onLogin={onLogin} isAuthed={isAuthed} />
      <LandingHero onEnterApp={onEnterApp} isAuthed={isAuthed} />
      <Partners />
      <LandingFeatures />
      <LandingInsights onEnterApp={onEnterApp} isAuthed={isAuthed} />
      <Newsletter onEnterApp={onEnterApp} isAuthed={isAuthed} />
      <LandingFooter onEnterApp={onEnterApp} />
    </div>
  );
}

