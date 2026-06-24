import React from 'react';
import LandingPage from './pages/LandingPage';

export default function App() {
  return <LandingPage onEnterApp={() => alert('Dashboard coming soon!')} />;
}

