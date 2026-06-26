import './css/Sidebar.css';
import {
  LayoutDashboard,
  Cpu,
  Sparkles,
  FilePlus,
  Library,
  Briefcase,
  GraduationCap,
  UserSquare2,
  User,
  Settings,
  BookOpen,
  Crown,
  ChevronDown,
  PanelLeftClose
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, collapsed, onToggleCollapse }) {
  const resumeTools = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'ats', name: 'ATS Scan', icon: Cpu },
    { id: 'enhance', name: 'Enhance Resume', icon: Sparkles },
    { id: 'build', name: 'Build Resume', icon: FilePlus },
    { id: 'library', name: 'Resume Library', icon: Library },
  ];

  const applications = [
    { id: 'applications', name: 'Applications', icon: Briefcase },
  ];

  const careerGrowth = [
    { id: 'interview', name: 'Interview Prep', icon: GraduationCap },
    { id: 'portfolio', name: 'Portfolio', icon: UserSquare2 },
  ];

  const account = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'settings', name: 'Settings', icon: Settings },
    { id: 'resources', name: 'Resources', icon: BookOpen },
  ];

  const renderNavItems = (items) => {
    return items.map((item) => {
      const Icon = item.icon;
      const isActive = activeTab === item.id;
      return (
        <div 
          key={item.id} 
          className={`nav-item ${isActive ? 'active' : ''}`}
          onClick={() => setActiveTab(item.id)}
        >
          <Icon className="icon" />
          <span>{item.name}</span>
        </div>
      );
    });
  };

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="logo-section">
        <div className="logo-icon">P</div>
        <span className="logo-text">Prospera</span>
        <button
          type="button"
          className="sidebar-collapse-btn"
          aria-label="Collapse sidebar"
          onClick={onToggleCollapse}
        >
          <PanelLeftClose size={18} />
        </button>
      </div>

      <nav className="nav-section">
        <div className="nav-group-title">Resume Tools</div>
        {renderNavItems(resumeTools)}

        <div className="nav-group-title">Applications</div>
        {renderNavItems(applications)}

        <div className="nav-group-title">Career Growth</div>
        {renderNavItems(careerGrowth)}

        <div className="nav-group-title">Account</div>
        {renderNavItems(account)}
      </nav>

      <div className="go-pro-card" onClick={() => alert('Upgrading to Pro Plan Mock!')}>
        <span className="go-pro-title">Go Pro</span>
        <Crown className="go-pro-badge" size={16} />
      </div>

      <div className="user-card" onClick={() => alert('User Menu Clicked')}>
        <img 
          src="/assets/alex_avatar.png" 
          alt="Alex Johnson avatar" 
          className="user-avatar" 
        />
        <div className="user-info">
          <div className="user-name">Alex Johnson</div>
          <div className="user-email">alex.johnson@mail.com</div>
        </div>
        <ChevronDown className="user-menu-arrow" />
      </div>
    </aside>
  );
}
