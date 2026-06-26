import './css/ResumesGrid.css';
import { Plus, MoreVertical } from 'lucide-react';
import { scoreColor } from '../../lib/scoreColor';

export default function ResumesGrid({ resumes, onNewResumeClick, onViewAllClick }) {
  const renderScoreGauge = (score) => {
    const radius = 12;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const color = scoreColor(score);

    return (
      <div className="resume-score-gauge">
        <svg className="resume-score-svg">
          <circle cx="16" cy="16" r={radius} className="resume-score-bg" />
          <circle 
            cx="16" 
            cy="16" 
            r={radius} 
            className="resume-score-fill" 
            stroke={color}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <span className="resume-score-text">{score}</span>
      </div>
    );
  };

  return (
    <section className="card-widget resumes-card">
      <div className="card-header-row">
        <h2 className="card-title">My Resumes</h2>
        <a href="#resumes" className="card-link" onClick={(e) => { e.preventDefault(); onViewAllClick(); }}>
          View All
        </a>
      </div>

      <div className="resumes-grid">
        {resumes.slice(0, 3).map((resume) => (
          <div key={resume.id} className="resume-card-item">
            <div className="resume-preview-box">
              {resume.isActive && <span className="preview-badge">Active</span>}
              {/* Fake layout preview blocks */}
              <div style={{ width: '40%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', marginBottom: '8px' }}></div>
              <div className="skeleton-line" style={{ width: '80%' }}></div>
              <div className="skeleton-line" style={{ width: '90%' }}></div>
              <div className="skeleton-line" style={{ width: '60%' }}></div>
              <div className="skeleton-line" style={{ width: '75%' }}></div>
            </div>

            <div className="resume-card-title">{resume.title}</div>
            <div className="resume-card-date">{resume.updatedAt}</div>

            <div className="resume-card-footer">
              {renderScoreGauge(resume.score)}
              <button 
                className="resume-actions-btn" 
                onClick={() => alert(`Options for: ${resume.title}`)}
              >
                <MoreVertical size={16} />
              </button>
            </div>
          </div>
        ))}

        <div className="create-resume-card" onClick={onNewResumeClick}>
          <div className="create-icon-box">
            <Plus size={20} />
          </div>
          <span className="create-text">Create New<br />Resume</span>
        </div>
      </div>
    </section>
  );
}
