import React, { useState } from 'react';
import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';
import BoostBanner from '../components/dashboard/BoostBanner';
import InterviewsList from '../components/dashboard/InterviewsList';
import ResumesGrid from '../components/dashboard/ResumesGrid';
import ActionCenter from '../components/dashboard/ActionCenter';
import AnalyticsChart from '../components/dashboard/AnalyticsChart';
import LibraryPage, { AppScreen } from '../components/LibraryPage';

export default function DashboardPage({ onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [resumes, setResumes] = useState([
    {
      id: '1', role: 'Software Engineer', target: 'Senior Software Engineer',
      score: 92, status: 'Verified', lastAppended: new Date(Date.now() - 2 * 86400000).toISOString(),
      summary: 'Software engineer with 5+ years of experience building scalable web applications and distributed systems. Passionate about clean code, system design, and solving real-world problems.',
      experience: [
        { company: 'Google', role: 'Senior Software Engineer', period: 'May 2021 – Present', bullets: ['Designed and built scalable microservices handling 10M+ requests/day', 'Improved system performance by 40% through caching and query optimization', 'Mentored 4 engineers and led code reviews'] },
        { company: 'Stripe', role: 'Software Engineer', period: 'Jun 2019 – Apr 2021', bullets: ['Built and maintained payment processing services used by millions of users', 'Implemented fraud detection system reducing false positives by 25%', 'Collaborated with cross-functional teams to ship reliable features'] }
      ],
      skills: ['System Design', 'Python', 'AWS', 'Redis', 'Kafka', 'Docker', 'PostgreSQL', 'REST APIs', 'Node.js', 'Kubernetes'],
      isActive: true,
    },
    {
      id: '2', role: 'Full Stack Developer', target: 'Full Stack Engineer',
      score: 87, status: 'Verified', lastAppended: new Date(Date.now() - 5 * 86400000).toISOString(),
      summary: 'Full-stack developer with deep expertise in React, Node.js, and cloud infrastructure. Passionate about performance, accessibility, and clean architecture.',
      experience: [
        { company: 'Microsoft', role: 'Software Engineer II', period: '2021–Present', bullets: ['Built real-time collaboration features for Teams', 'Reduced API latency by 40% through caching layer'] },
      ],
      skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS', 'Docker', 'GraphQL', 'CI/CD'],
      isActive: false,
    },
    {
      id: '3', role: 'Backend Developer', target: 'Senior Backend Engineer',
      score: 79, status: 'Draft - Pending Review', lastAppended: new Date(Date.now() - 10 * 86400000).toISOString(),
      summary: 'Backend developer specializing in high-throughput APIs, microservices, and database optimization.',
      experience: [
        { company: 'Amazon', role: 'Backend Engineer', period: '2020–Present', bullets: ['Architected order processing pipeline handling 50K TPS', 'Led migration from monolith to microservices'] },
      ],
      skills: ['Java', 'Spring Boot', 'Kafka', 'MySQL', 'Redis', 'Docker', 'Kubernetes'],
      isActive: false,
    },
    {
      id: '4', role: 'Data Analyst', target: 'Senior Data Analyst',
      score: 76, status: 'Tailored', lastAppended: new Date(Date.now() - 12 * 86400000).toISOString(),
      summary: 'Data analyst with expertise in SQL, Python, and business intelligence dashboards.',
      experience: [
        { company: 'Airbnb', role: 'Data Analyst', period: '2021–Present', bullets: ['Built dashboards tracking $2B in annual revenue', 'Reduced churn by 12% with predictive models'] },
      ],
      skills: ['SQL', 'Python', 'Tableau', 'Looker', 'BigQuery', 'dbt', 'Excel'],
      isActive: false,
    },
    {
      id: '5', role: 'Product Manager', target: 'Senior Product Manager',
      score: 84, status: 'Verified', lastAppended: new Date(Date.now() - 3 * 86400000).toISOString(),
      summary: 'Product manager with 6+ years driving growth for B2B SaaS products. Strong background in user research, roadmap strategy, and cross-functional leadership.',
      experience: [
        { company: 'Salesforce', role: 'Senior Product Manager', period: '2022–Present', bullets: ['Launched 3 features used by 100K+ enterprise customers', 'Grew NPS by 18 points in 12 months'] },
        { company: 'HubSpot', role: 'Product Manager', period: '2019–2022', bullets: ['Owned the CRM pipeline feature from 0 to GA', 'Partnered with design and engineering for bi-weekly releases'] },
      ],
      skills: ['Roadmapping', 'User Research', 'Jira', 'A/B Testing', 'SQL', 'Figma', 'OKRs'],
      isActive: false,
    },
    {
      id: '6', role: 'Growth Product Manager', target: 'Growth PM',
      score: 74, status: 'Draft - Pending Review', lastAppended: new Date(Date.now() - 15 * 86400000).toISOString(),
      summary: 'Growth-focused PM with experience in acquisition, activation, and retention experiments across consumer apps.',
      experience: [
        { company: 'Dropbox', role: 'Growth PM', period: '2021–Present', bullets: ['Ran 40+ growth experiments generating $3M ARR', 'Optimized onboarding flow, increasing activation by 22%'] },
      ],
      skills: ['Growth Hacking', 'Mixpanel', 'SQL', 'User Interviews', 'A/B Testing', 'Python'],
      isActive: false,
    },
    {
      id: '7', role: 'Marketing Manager', target: 'Head of Growth Marketing',
      score: 74, status: 'Draft - Pending Review', lastAppended: new Date(Date.now() - 14 * 86400000).toISOString(),
      summary: 'Data-driven marketing manager with experience scaling B2B SaaS growth through content, SEO, and paid acquisition.',
      experience: [
        { company: 'HubSpot', role: 'Senior Marketing Manager', period: '2020–Present', bullets: ['Grew organic traffic 3x through SEO content strategy', 'Managed $500K annual paid budget'] },
      ],
      skills: ['SEO', 'Content Strategy', 'Google Ads', 'Analytics', 'HubSpot', 'Email Marketing', 'Copywriting'],
      isActive: false,
    },
    {
      id: '8', role: 'Growth Marketing Manager', target: 'VP Marketing',
      score: 72, status: 'Tailored', lastAppended: new Date(Date.now() - 20 * 86400000).toISOString(),
      summary: 'Performance marketing specialist focused on paid social, influencer partnerships, and funnel optimization.',
      experience: [
        { company: 'Notion', role: 'Growth Marketing Manager', period: '2021–Present', bullets: ['Scaled paid social to $1M/mo spend with 3.2x ROAS', 'Launched influencer program with 50 creators'] },
      ],
      skills: ['Meta Ads', 'Google Ads', 'TikTok Ads', 'Analytics', 'Copywriting', 'CRO'],
      isActive: false,
    },
    {
      id: '9', role: 'Product Designer', target: 'Senior UX/UI Designer',
      score: 85, status: 'Verified', lastAppended: new Date(Date.now() - 4 * 86400000).toISOString(),
      summary: 'Creative product designer with 5+ years building user-centred digital products. Skilled in Figma, design systems, and cross-functional collaboration.',
      experience: [
        { company: 'Google', role: 'Product Designer', period: '2022–Present', bullets: ['Led redesign of core search UI, improving engagement by 18%', 'Collaborated with PMs to define product specs'] },
        { company: 'Stripe', role: 'UI Designer', period: '2020–2022', bullets: ['Built component library used by 12 product teams', 'Ran usability testing sessions'] }
      ],
      skills: ['Figma', 'Prototyping', 'User Research', 'Design Systems', 'Sketch', 'Accessibility', 'Wireframing', 'A/B Testing'],
      isActive: false,
    },
    {
      id: '10', role: 'UI/UX Designer', target: 'Lead UX Designer',
      score: 80, status: 'Tailored', lastAppended: new Date(Date.now() - 8 * 86400000).toISOString(),
      summary: 'UX designer passionate about research-driven design and creating inclusive digital experiences.',
      experience: [
        { company: 'Airbnb', role: 'UX Designer', period: '2021–Present', bullets: ['Redesigned host onboarding, increasing completion by 30%', 'Conducted 40+ user interviews to inform product strategy'] },
      ],
      skills: ['User Research', 'Wireframing', 'Figma', 'Prototyping', 'Usability Testing', 'Information Architecture'],
      isActive: false,
    },
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

  // Clone a resume by duplicating it
  const handleCloneResume = (id) => {
    const src = resumes.find(r => r.id === id);
    if (!src) return;
    const cloned = { ...src, id: String(Date.now()), role: src.role + ' (Copy)', status: 'Draft - Pending Review', lastAppended: new Date().toISOString(), isActive: false };
    setResumes(prev => [cloned, ...prev]);
  };

  // Delete a resume
  const handleDeleteResume = (id) => {
    if (window.confirm('Delete this resume? This cannot be undone.')) {
      setResumes(prev => prev.filter(r => r.id !== id));
    }
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
          onNavigate={(screen) => {
            if (screen === AppScreen.BUILD_RESUME) setActiveTab('build');
            else if (screen === AppScreen.TAILOR) setActiveTab('tailor');
          }}
          resumes={filteredResumes}
          onSelectResume={(id) => { /* selection managed inside LibraryPage */ }}
          onDeleteResume={handleDeleteResume}
          onCloneResume={handleCloneResume}
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

  const isLibrary = activeTab === 'library';

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main
        className="main-content"
        style={isLibrary
          ? { padding: 0, overflow: 'hidden', minHeight: '100vh', display: 'flex', flexDirection: 'column' }
          : {}}
      >
        {!isLibrary && (
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
