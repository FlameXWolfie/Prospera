import { useState } from 'react';
import { PanelLeftOpen } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';
import BoostBanner from '../components/dashboard/BoostBanner';
import InterviewsList from '../components/dashboard/InterviewsList';
import ResumesGrid from '../components/dashboard/ResumesGrid';
import ActionCenter from '../components/dashboard/ActionCenter';
import AnalyticsChart from '../components/dashboard/AnalyticsChart';
import LibraryPage from './LibraryPage';
import AtsScanPage from './AtsScanPage';
import EnhanceResumePage from './EnhanceResumePage';
import { initialResumes } from '../data/resumes';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [resumes, setResumes] = useState(initialResumes);
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

  // Duplicate a resume (inactive copy, pending review)
  const handleCloneResume = (id) => {
    const src = resumes.find(r => r.id === id);
    if (!src) return;
    const clone = {
      ...src,
      id: String(Date.now()),
      role: `${src.role} (Copy)`,
      status: 'Draft - Pending Review',
      lastAppended: new Date().toISOString(),
      isActive: false
    };
    setResumes(prev => [clone, ...prev]);
  };

  // Remove a resume
  const handleDeleteResume = (id) => {
    setResumes(prev => prev.filter(r => r.id !== id));
  };

  // Add a resume created from an uploaded file (ATS Scan empty state)
  const handleUploadResume = (resume) => {
    setResumes(prev => [resume, ...prev]);
  };

  // Enhance Resume: apply an arbitrary transform to one resume (single source of truth)
  const handleUpdateResume = (id, updater) => {
    setResumes(prev => prev.map(r => (r.id === id ? updater(r) : r)));
  };

  // Promote one resume to the single active version (BoostBanner targets the active one)
  const handleSetActive = (id) => {
    setResumes(prev => prev.map(r => ({ ...r, isActive: r.id === id })));
  };

  // Filter resumes based on search query in header
  const filteredResumes = resumes.filter(resume =>
    (resume.role || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderContent = () => {
    if (activeTab === 'dashboard') {
      return (
        <div className="dashboard-columns">
          {/* Left Column */}
          <div className="dashboard-col-left">
            <AnalyticsChart />
            <ResumesGrid 
              resumes={filteredResumes.map(r => ({ ...r, title: r.role, updatedAt: r.lastAppended ? `Updated ${Math.floor((Date.now() - new Date(r.lastAppended)) / 86400000)}d ago` : 'Recently' }))} 
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
        <LibraryPage
          resumes={resumes}
          onNewResumeClick={handleNewResume}
          onClone={handleCloneResume}
          onDelete={handleDeleteResume}
          onSetActive={handleSetActive}
        />
      );
    }

    if (activeTab === 'ats') {
      return (
        <AtsScanPage
          resumes={resumes}
          onNewResumeClick={handleNewResume}
          onUpload={handleUploadResume}
          onEnhance={() => setActiveTab('enhance')}
        />
      );
    }

    if (activeTab === 'enhance') {
      return (
        <EnhanceResumePage
          resumes={resumes}
          onUpdateResume={handleUpdateResume}
          onUpload={handleUploadResume}
          onOpenBuilder={handleNewResume}
        />
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
          id: String(Date.now()),
          role: buildForm.title,
          target: buildForm.role,
          lastAppended: new Date().toISOString(),
          score: Math.floor(Math.random() * 10) + 81,
          status: 'Draft - Pending Review',
          summary: buildForm.experience || '',
          experience: [],
          skills: buildForm.skills ? buildForm.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
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

  // The library and ATS Scan are self-contained screens with their own headers,
  // so the global dashboard Header (with its separate search) is hidden there.
  const hideGlobalHeader = activeTab === 'library' || activeTab === 'ats' || activeTab === 'enhance';

  return (
    <div className={`app-container${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
      />

      {sidebarCollapsed && (
        <button
          type="button"
          className="sidebar-reopen-btn"
          aria-label="Open sidebar"
          onClick={() => setSidebarCollapsed(false)}
        >
          <PanelLeftOpen size={20} />
        </button>
      )}

      <main className="main-content">
        {!hideGlobalHeader && (
          <Header
            onNewResumeClick={handleNewResume}
            onSearchChange={setSearchTerm}
          />
        )}
        {renderContent()}
      </main>
    </div>
  );
}
