import React from 'react';
import './Tabs.css';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: Tab[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTabId,
  onTabChange,
  variant = 'default',
  size = 'md',
  fullWidth = false
}) => {
  const baseClass = 'tabs';
  const variantClass = `tabs--${variant}`;
  const sizeClass = `tabs--${size}`;
  const fullWidthClass = fullWidth ? 'tabs--full-width' : '';
  
  const classes = [
    baseClass,
    variantClass,
    sizeClass,
    fullWidthClass
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const tabClass = [
          'tabs__tab',
          isActive ? 'tabs__tab--active' : '',
          tab.disabled ? 'tabs__tab--disabled' : ''
        ].filter(Boolean).join(' ');

        return (
          <button
            key={tab.id}
            className={tabClass}
            role="tab"
            aria-selected={isActive}
            aria-disabled={tab.disabled}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            disabled={tab.disabled}
          >
            {tab.icon && <span className="tabs__tab-icon">{tab.icon}</span>}
            <span className="tabs__tab-label">{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="tabs__tab-badge">{tab.badge}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

