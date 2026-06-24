import React, { useState } from 'react';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';

export default function App() {
  const [view, setView] = useState('landing'); // 'landing' or 'dashboard'

  if (view === 'dashboard') {
    return <DashboardPage onLogout={() => setView('landing')} />;
  }

  return <LandingPage onEnterApp={() => setView('dashboard')} />;
}


