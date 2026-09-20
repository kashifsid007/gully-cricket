import React from 'react';
import { LayoutDashboard, Users, Clock, History, Trophy } from 'lucide-react';

export default function Navbar({ activeTab, onTabChange, incompleteCount = 0 }) {
  const tabs = [
    { id: 'scorecard', label: 'Scorecard', icon: LayoutDashboard },
    { id: 'tournament', label: 'Tournament', icon: Trophy },
    { id: 'players', label: 'Players', icon: Users },
    { id: 'incomplete', label: 'Incomplete', icon: Clock, badge: incompleteCount },
    { id: 'history', label: 'History', icon: History },
  ];

  return (
    <nav className="bottom-navbar">
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            className={`nav-tab-btn ${isActive ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <div className="nav-icon-wrapper">
              <IconComponent size={20} />
              {tab.badge > 0 && (
                <span className="nav-badge">{tab.badge}</span>
              )}
            </div>
            <span className="nav-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
