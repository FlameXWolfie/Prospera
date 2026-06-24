import React from 'react';
import './css/ActionCenter.css';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  TrendingUp, 
  ChevronRight,
  ArrowRight
} from 'lucide-react';

export default function ActionCenter() {
  const actions = [
    {
      title: 'ATS score below 80 on Marketing Manager Resume',
      desc: 'Add 6 missing keywords to improve your score.',
      icon: AlertTriangle,
      color: '#f59e0b',
      bgColor: '#fffbeb', // Amber
    },
    {
      title: 'Great! Your resume got 8 points better',
      desc: 'Keep it up! Consistency is the key.',
      icon: CheckCircle2,
      color: '#10b981',
      bgColor: '#ecfdf5', // Emerald
    },
    {
      title: 'Interview scheduled in 2 days',
      desc: 'UI/UX Designer at Trello – May 20, 2024.',
      icon: Calendar,
      color: '#8b5cf6',
      bgColor: '#f5f3ff', // Purple
    },
    {
      title: 'Product Designer Resume is your top performer',
      desc: '27% interview rate from 18 applications.',
      icon: TrendingUp,
      color: '#3b82f6',
      bgColor: '#eff6ff', // Blue
    }
  ];

  return (
    <section className="card-widget action-center-card">
      <div className="card-header-row" style={{ marginBottom: '8px' }}>
        <h2 className="card-title">✨ AI Action Center</h2>
      </div>
      <div className="action-center-subtitle">
        Personalized insights to move your career forward.
      </div>

      <div className="action-items-list">
        {actions.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="action-item" onClick={() => alert(`Action details: \n${item.title}`)}>
              <div 
                className="action-icon-wrapper" 
                style={{ backgroundColor: item.bgColor }}
              >
                <Icon size={18} color={item.color} />
              </div>
              
              <div className="action-info">
                <div className="action-title">{item.title}</div>
                <div className="action-desc">{item.desc}</div>
              </div>

              <ChevronRight size={14} className="action-arrow" />
            </div>
          );
        })}
      </div>

      <a 
        href="#insights" 
        className="card-link" 
        style={{ marginTop: '18px', display: 'flex', alignItems: 'center', gap: '6px' }}
        onClick={(e) => { e.preventDefault(); alert('Redirecting to Insights report...'); }}
      >
        <span>View All Insights</span>
        <ArrowRight size={14} />
      </a>
    </section>
  );
}
