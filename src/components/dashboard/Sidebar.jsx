import './css/Sidebar.css';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Cpu,
  Sparkles,
  Library,
  Briefcase,
  GraduationCap,
  UserSquare2,
  User,
  Settings,
  BookOpen,
  Crown,
  LogOut,
  PanelLeftClose
} from 'lucide-react';
import { useAuth } from '../../lib/auth/AuthContext';
import ThemeToggle from '../ThemeToggle';

export default function Sidebar({ collapsed, onToggleCollapse, onLogout }) {
  const { user, logout } = useAuth();
  const initial = (user?.name || 'A').charAt(0).toUpperCase();
  const handleLogout = onLogout || logout;
  const resumeTools = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'ats', name: 'ATS Scan', icon: Cpu },
    { id: 'studio', name: 'Resume Studio', icon: Sparkles },
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
      return (
        <NavLink
          key={item.id}
          to={`/app/${item.id}`}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <Icon className="icon" />
          <span>{item.name}</span>
        </NavLink>
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

      <div className="user-card">
        {user?.avatar
          ? <img src={user.avatar} alt="" className="user-avatar" referrerPolicy="no-referrer" />
          : <span className="user-avatar user-avatar-mono">{initial}</span>}
        <div className="user-info">
          <div className="user-name">{user?.name || 'Account'}</div>
          <div className="user-email">{user?.email || ''}</div>
        </div>
        <ThemeToggle className="sidebar-theme-toggle" />
        <button type="button" className="user-logout" onClick={handleLogout} aria-label="Log out" title="Log out">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
