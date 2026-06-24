import React from 'react';
import './css/Header.css';
import { Search, Bell, Plus } from 'lucide-react';

export default function Header({ onNewResumeClick, onSearchChange }) {
  return (
    <header className="dashboard-header">
      <div className="welcome-title-container">
        <h1>Good morning, Alex 👋</h1>
        <p>Track your progress and take the next step toward your dream job.</p>
      </div>

      <div className="header-actions">
        <div className="search-container">
          <Search className="search-icon" />
          <input 
            type="text" 
            placeholder="Search anything..." 
            className="search-input"
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <span className="search-shortcut">⌘K</span>
        </div>

        <button className="notification-btn" onClick={() => alert('You have 3 new notifications: \n1. ATS Score scan finished\n2. Google Interview Scheduled\n3. Resume tip available')}>
          <Bell size={20} />
          <span className="notification-badge">3</span>
        </button>

        <button className="new-resume-btn" onClick={onNewResumeClick}>
          <Plus className="icon" />
          <span>New Resume</span>
        </button>
      </div>
    </header>
  );
}
