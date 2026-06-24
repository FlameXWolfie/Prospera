import React, { useState } from 'react';
import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';
import BoostBanner from '../components/dashboard/BoostBanner';
import InterviewsList from '../components/dashboard/InterviewsList';
import ResumesGrid from '../components/dashboard/ResumesGrid';
import ActionCenter from '../components/dashboard/ActionCenter';
import AnalyticsChart from '../components/dashboard/AnalyticsChart';

export default function DashboardPage({ onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [resumes, setResumes] = useState([
    { id: 1, title: 'Product Designer Resume', updatedAt: 'Updated 2 days ago', score: 78, isActive: true },
    { id: 2, title: 'Software Engineer Resume', updatedAt: 'Updated 1 week ago', score: 82, isActive: false },
    { id: 3, title: 'Marketing Manager Resume', updatedAt: 'Updated 2 weeks ago', score: 74, isActive: false }
  ]);
  const [buildForm, setBuildForm] = useState({
    title: '',
    fullName: '',
    role: '',
    skills: '',
    experience: ''
  });

  // Handler for ATS score upgrade simulation
  const handleScoreUpgrade = (newScore) => {
    setResumes(prevResumes => 
      prevResumes.map(resume => 
        resume.isActive ? { ...resume, score: newScore } : resume
      )
    );
  };

  // Handler to redirect user to build resume tab
  const handleNewResume = () => {
    setActiveTab('build');
  };

  // Filter resumes based on search query in header
  const filteredResumes = resumes.filter(resume =>
    resume.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderContent = () => {
    if (activeTab === 'dashboard') {
      return (
        <div className="dashboard-columns">
          {/* Left Column */}
          <div className="dashboard-col-left">
            <AnalyticsChart />
            <ResumesGrid 
              resumes={filteredResumes} 
              onNewResumeClick={handleNewResume} 
              onViewAllClick={() => setActiveTab('library')} 
            />
            <BoostBanner initialScore={72} onScoreUpgrade={handleScoreUpgrade} />
          </div>

          {/* Right Column */}
          <div className="dashboard-col-right">
            <InterviewsList />
            <ActionCenter />
          </div>
        </div>
      );
    }

    if (activeTab === 'library') {
      return (
        <div style={{ padding: '16px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontFamily: 'Outfit', fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>📚 Resume Library</h2>
              <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>Manage, edit, and track the ATS score of all your resumes.</p>
            </div>
            <button className="new-resume-btn" onClick={handleNewResume}>
              + Create New Resume
            </button>
          </div>
          
          <div className="resumes-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {filteredResumes.map((resume) => {
              const radius = 12;
              const circumference = 2 * Math.PI * radius;
              const offset = circumference - (resume.score / 100) * circumference;
              
              const getScoreColor = (score) => {
                if (score >= 80) return '#10b981';
                if (score >= 75) return '#22c55e';
                return '#f97316';
              };
              
              return (
                <div key={resume.id} className="resume-card-item">
                  <div className="resume-preview-box">
                    {resume.isActive && <span className="preview-badge">Active</span>}
                    <div style={{ width: '40%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', marginBottom: '8px' }}></div>
                    <div className="skeleton-line" style={{ width: '80%' }}></div>
                    <div className="skeleton-line" style={{ width: '90%' }}></div>
                    <div className="skeleton-line" style={{ width: '60%' }}></div>
                    <div className="skeleton-line" style={{ width: '75%' }}></div>
                  </div>

                  <div className="resume-card-title">{resume.title}</div>
                  <div className="resume-card-date">{resume.updatedAt}</div>

                  <div className="resume-card-footer">
                    <div className="resume-score-gauge">
                      <svg className="resume-score-svg">
                        <circle cx="16" cy="16" r={radius} className="resume-score-bg" />
                        <circle 
                          cx="16" 
                          cy="16" 
                          r={radius} 
                          className="resume-score-fill" 
                          stroke={getScoreColor(resume.score)}
                          strokeDasharray={circumference}
                          strokeDashoffset={offset}
                        />
                      </svg>
                      <span className="resume-score-text">{resume.score}</span>
                    </div>
                    
                    <button 
                      className="resume-actions-btn" 
                      onClick={() => {
                        if (confirm(`Set ${resume.title} as your active resume?`)) {
                          setResumes(resumes.map(r => ({ ...r, isActive: r.id === resume.id })));
                        }
                      }}
                      title="Set as Active"
                    >
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--primary-accent)' }}>
                        {resume.isActive ? 'Active' : 'Set Active'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (activeTab === 'build') {
      const handleBuildSubmit = (e) => {
        e.preventDefault();
        if (!buildForm.title || !buildForm.fullName) {
          alert('Please enter a resume title and full name.');
          return;
        }
        const newResume = {
          id: resumes.length + 1,
          title: buildForm.title,
          updatedAt: 'Updated just now',
          score: Math.floor(Math.random() * 10) + 81, // fresh ATS resumes get 81-90
          isActive: false
        };
        setResumes([newResume, ...resumes]);
        alert('Success! Your ATS-optimized resume has been created.');
        setBuildForm({ title: '', fullName: '', role: '', skills: '', experience: '' });
        setActiveTab('library'); // redirect to library to view it
      };

      return (
        <div style={{ padding: '16px 0', maxWidth: '640px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontFamily: 'Outfit', fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>🛠️ Build Resume</h2>
            <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>Fill out the details below to generate a new, ATS-optimized resume.</p>
          </div>

          <form onSubmit={handleBuildSubmit} className="card-widget" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>Resume Title / File Name *</label>
              <input 
                type="text" 
                placeholder="e.g. Senior Product Designer Resume" 
                className="search-input" 
                style={{ paddingRight: '12px' }} 
                value={buildForm.title}
                onChange={(e) => setBuildForm({ ...buildForm, title: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>Full Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Alex Johnson" 
                  className="search-input" 
                  style={{ paddingRight: '12px' }}
                  value={buildForm.fullName}
                  onChange={(e) => setBuildForm({ ...buildForm, fullName: e.target.value })}
                  required
                />
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>Target Role</label>
                <input 
                  type="text" 
                  placeholder="e.g. UI/UX Designer" 
                  className="search-input" 
                  style={{ paddingRight: '12px' }}
                  value={buildForm.role}
                  onChange={(e) => setBuildForm({ ...buildForm, role: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>Key Skills (comma separated)</label>
              <input 
                type="text" 
                placeholder="e.g. React, Figma, Tailwind CSS, Project Management" 
                className="search-input" 
                style={{ paddingRight: '12px' }}
                value={buildForm.skills}
                onChange={(e) => setBuildForm({ ...buildForm, skills: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>Professional Experience / Summary</label>
              <textarea 
                placeholder="Describe your target job and brief experience..." 
                className="search-input" 
                style={{ minHeight: '100px', resize: 'vertical', padding: '12px', fontFamily: 'inherit' }}
                value={buildForm.experience}
                onChange={(e) => setBuildForm({ ...buildForm, experience: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button type="submit" className="new-resume-btn">
                Generate ATS Resume
              </button>
              <button 
                type="button" 
                className="new-resume-btn" 
                style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}
                onClick={() => {
                  setBuildForm({ title: '', fullName: '', role: '', skills: '', experience: '' });
                  setActiveTab('dashboard');
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      );
    }

    // Modern workspaces for other sidebar tabs
    return (
      <div 
        style={{ 
          padding: '48px', 
          textAlign: 'center', 
          backgroundColor: 'white', 
          borderRadius: '20px', 
          border: '1px solid #f1f5f9',
          boxShadow: '0 4px 20px -2px rgb(0 0 0 / 0.04)',
          marginTop: '20px'
        }}
      >
        <div 
          style={{ 
            fontSize: '48px', 
            marginBottom: '16px',
            animation: 'float 3s ease-in-out infinite' 
          }}
        >
          🚀
        </div>
        <h2 
          style={{ 
            fontFamily: 'Outfit', 
            fontSize: '24px', 
            fontWeight: 700, 
            color: '#0f172a',
            marginBottom: '10px' 
          }}
        >
          {activeTab.toUpperCase().replace('_', ' ')} Workspace
        </h2>
        <p 
          style={{ 
            color: '#64748b', 
            fontSize: '14px', 
            maxWidth: '480px', 
            margin: '0 auto 28px auto',
            lineHeight: 1.6
          }}
        >
          This section is fully active. Connect your live database or API to sync real-time applicant data, document uploads, or ATS configurations.
        </p>
        <button 
          className="new-resume-btn" 
          style={{ margin: '0 auto' }} 
          onClick={() => setActiveTab('dashboard')}
        >
          Return to Dashboard
        </button>
      </div>
    );
  };

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="main-content">
        <Header 
          onNewResumeClick={handleNewResume} 
          onSearchChange={setSearchTerm} 
        />
        {renderContent()}
      </main>
    </div>
  );
}
