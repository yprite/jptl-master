import React, { useState } from 'react';
import { Sidebar, SidebarItem } from './Sidebar';
import { Header, HeaderProps } from './Header';
import './MainLayout.css';

export interface MainLayoutProps {
  sidebarItems: SidebarItem[];
  headerProps?: Omit<HeaderProps, 'onMenuClick'>;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  sidebarItems,
  headerProps,
  children
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  const handleMenuClick = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarItemClick = (item: SidebarItem) => {
    item.onClick();
    // Close mobile sidebar when item is clicked
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="main-layout">
      <Sidebar
        items={sidebarItems.map(item => ({
          ...item,
          onClick: () => handleSidebarItemClick(item)
        }))}
        isCollapsed={isSidebarCollapsed && window.innerWidth > 768}
        isOpen={window.innerWidth > 768 ? true : isSidebarOpen}
        onToggleCollapse={window.innerWidth > 768 ? handleToggleSidebar : undefined}
      />
      <div className={`main-content ${isSidebarOpen ? 'main-content--sidebar-open' : ''} ${isSidebarCollapsed && window.innerWidth > 768 ? 'main-content--sidebar-collapsed' : ''}`}>
        <Header
          {...headerProps}
          onMenuClick={handleMenuClick}
        />
        <main className="main-content__body">
          {children}
        </main>
      </div>
      {isSidebarOpen && (
        <div
          className="main-layout__overlay"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

