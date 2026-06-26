import './css/InterviewsList.css';
import { Calendar, Clock } from 'lucide-react';

export default function InterviewsList() {
  const interviews = [
    {
      company: 'Google',
      role: 'Product Manager',
      date: 'May 20, 2024',
      time: '10:00 AM',
      badgeText: 'In 1 day',
      badgeClass: 'badge-purple-soft',
      logo: (
        <svg viewBox="0 0 24 24" width="22" height="22">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.81-2.6-2.58-4.53-6.19-4.53z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      )
    },
    {
      company: 'Microsoft',
      role: 'Program Manager',
      date: 'May 24, 2024',
      time: '02:00 PM',
      badgeText: 'In 5 days',
      badgeClass: 'badge-info-soft',
      logo: (
        <svg viewBox="0 0 23 23" width="22" height="22">
          <rect x="0" y="0" width="11" height="11" fill="#F25022"/>
          <rect x="12" y="0" width="11" height="11" fill="#7FBA00"/>
          <rect x="0" y="12" width="11" height="11" fill="#00A4EF"/>
          <rect x="12" y="12" width="11" height="11" fill="#FFB900"/>
        </svg>
      )
    },
    {
      company: 'Stripe',
      role: 'Product Designer',
      date: 'May 28, 2024',
      time: '11:30 AM',
      badgeText: 'In 9 days',
      badgeClass: 'badge-info-soft',
      logo: (
        <svg viewBox="0 0 24 24" width="22" height="22">
          <rect x="0" y="0" width="24" height="24" rx="5" fill="#635BFF"/>
          <path transform="translate(-0.85, -5.2)" fill="#FFFFFF" d="M11.9 14.8c0-.6.4-1 1.2-1 1.7 0 3.3.6 4.3 1.1v-2.9c-1-.5-2.4-.9-3.9-.9-2.9 0-4.9 1.5-4.9 4.3 0 4.2 5.7 3.5 5.7 5.3 0 .7-.5 1-1.4 1-1.9 0-3.7-.7-4.8-1.3v2.9c1.2.5 2.8.9 4.4.9 3 0 5.1-1.4 5.1-4.3.1-4.2-5.7-3.4-5.7-5.1z"/>
        </svg>
      )
    }
  ];

  return (
    <section className="card-widget interviews-card">
      <div className="card-header-row">
        <h2 className="card-title">Upcoming Interviews</h2>
        <a href="#interviews" className="card-link" onClick={(e) => { e.preventDefault(); alert('Redirecting to Interviews page...'); }}>
          View All
        </a>
      </div>

      <div className="interviews-list">
        {interviews.map((item, idx) => (
          <div key={idx} className="interview-item">
            <div className="interview-company-info">
              <div className="company-logo-box">
                {item.logo}
              </div>
              <div className="interview-details">
                <span className="company-name">{item.company}</span>
                <span className="role-title">{item.role}</span>
                <div className="interview-schedule-info">
                  <Calendar size={11} />
                  <span>{item.date}</span>
                  <span style={{ margin: '0 4px' }}>•</span>
                  <Clock size={11} />
                  <span>{item.time}</span>
                </div>
              </div>
            </div>

            <div className={`interview-time-badge ${item.badgeClass}`}>
              {item.badgeText}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
