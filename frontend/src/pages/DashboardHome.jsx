import { useState } from 'react';
import Header from '../components/dashboard/Header';
import AnalyticsChart from '../components/dashboard/AnalyticsChart';
import ResumesGrid from '../components/dashboard/ResumesGrid';
import BoostBanner from '../components/dashboard/BoostBanner';
import InterviewsList from '../components/dashboard/InterviewsList';
import ActionCenter from '../components/dashboard/ActionCenter';

// Relative "Updated Nd ago" label. Module scope so the Date call never runs as an
// inline expression in render (keeps react-compiler happy).
const updatedLabel = (iso) => {
  if (!iso) return 'Recently';
  return `Updated ${Math.floor((Date.now() - new Date(iso)) / 86400000)}d ago`;
};

// The dashboard home screen (the `/dashboard` route). Owns its own search;
// `onNavigate(tab)` routes to other sections.
export default function DashboardHome({ resumes, applications, onNavigate }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredResumes = resumes.filter((r) =>
    (r.role || '').toLowerCase().includes(searchTerm.toLowerCase()),
  );
  // The active resume, else the most recently updated (resumes arrive sorted by
  // updatedAt desc). No score-based pick — scores aren't real until scanned.
  const boostResume = resumes.find((r) => r.isActive) || resumes[0] || null;

  return (
    <>
      <Header onNewResumeClick={() => onNavigate('studio')} onSearchChange={setSearchTerm} />
      <div className="dashboard-columns">
        <div className="dashboard-col-left">
          <AnalyticsChart applications={applications} />
          <ResumesGrid
            resumes={filteredResumes.map((r) => ({ ...r, title: r.role, updatedAt: updatedLabel(r.lastAppended) }))}
            onNewResumeClick={() => onNavigate('studio')}
            onViewAllClick={() => onNavigate('library')}
          />
          <BoostBanner
            resume={boostResume}
            onImprove={() => onNavigate('studio')}
            onCreate={() => onNavigate('studio')}
            onScan={() => onNavigate('ats')}
          />
        </div>
        <div className="dashboard-col-right">
          <InterviewsList applications={applications} onViewAll={() => onNavigate('applications')} />
          <ActionCenter resumes={resumes} applications={applications} onNavigate={onNavigate} />
        </div>
      </div>
    </>
  );
}
