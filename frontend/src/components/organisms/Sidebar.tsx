import React from 'react';
import './Sidebar.css';

export interface SidebarItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  badge?: number;
}

export interface SidebarProps {
  items: SidebarItem[];
  isCollapsed?: boolean;
  isOpen?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  items,
  isCollapsed = false,
  isOpen = true,
  onToggleCollapse
}) => {
  return (
    <aside className={`sidebar ${isCollapsed ? 'sidebar--collapsed' : ''} ${isOpen ? 'sidebar--open' : ''}`}>
      <div className="sidebar__header">
        {!isCollapsed && (
          <h2 className="sidebar__title">JLPT N5</h2>
        )}
        {onToggleCollapse && (
          <button
            className="sidebar__toggle"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d={isCollapsed ? "M7 4L13 10L7 16" : "M13 4L7 10L13 16"}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>
      <nav className="sidebar__nav">
        <ul className="sidebar__list">
          {items.map((item) => (
            <li key={item.id} className="sidebar__item">
              <button
                className={`sidebar__link ${item.active ? 'sidebar__link--active' : ''}`}
                onClick={item.onClick}
                aria-label={item.label}
                title={isCollapsed ? item.label : undefined}
              >
                {item.icon && (
                  <span className="sidebar__icon">{item.icon}</span>
                )}
                {!isCollapsed && (
                  <>
                    <span className="sidebar__label">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="sidebar__badge">{item.badge}</span>
                    )}
                  </>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

