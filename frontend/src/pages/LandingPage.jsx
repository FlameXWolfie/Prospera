import './LandingPage.css';

import LandingHeader from '../components/landing/LandingHeader';
import LandingHero from '../components/landing/LandingHero';
import Partners from '../components/landing/Partners';
import LandingFeatures from '../components/landing/LandingFeatures';
import LandingInsights from '../components/landing/LandingInsights';
import Testimonials from '../components/landing/Testimonials';
import Newsletter from '../components/landing/Newsletter';
import LandingFooter from '../components/landing/LandingFooter';

export default function LandingPage({ onEnterApp, onLogin }) {
  return (
    <div className="landing-container">
      <LandingHeader onEnterApp={onEnterApp} onLogin={onLogin} />
      <LandingHero onEnterApp={onEnterApp} />
      <Partners />
      <LandingFeatures />
      <LandingInsights onEnterApp={onEnterApp} />
      <Testimonials />
      <Newsletter />
      <LandingFooter onEnterApp={onEnterApp} />
    </div>
  );
}

