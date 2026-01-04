import React, { useState } from 'react';
import './Header.css';

export interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
  onProfileClick?: () => void;
  user?: {
    username: string;
    avatar?: string;
  };
  notificationCount?: number;
  showSearch?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onMenuClick,
  onSearch,
  onNotificationClick,
  onProfileClick,
  user,
  notificationCount = 0,
  showSearch = true
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  return (
    <header className="header">
      <div className="header__left">
        {onMenuClick && (
          <button
            className="header__menu-button"
            onClick={onMenuClick}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 12H21M3 6H21M3 18H21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
        {title && <h1 className="header__title">{title}</h1>}
      </div>
      <div className="header__right">
        {showSearch && onSearch && (
          <div className="header__search">
            <svg
              className="header__search-icon"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input
              type="search"
              className="header__search-input"
              placeholder="단어/문법/문제 검색..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        )}
        {onNotificationClick && (
          <button
            className="header__notification-button"
            onClick={onNotificationClick}
            aria-label="Notifications"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13.73 21a2 2 0 0 1-3.46 0"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {notificationCount > 0 && (
              <span className="header__notification-badge">{notificationCount}</span>
            )}
          </button>
        )}
        {user && onProfileClick && (
          <button
            className="header__profile-button"
            onClick={onProfileClick}
            aria-label="Profile"
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="header__avatar"
              />
            ) : (
              <div className="header__avatar header__avatar--placeholder">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
          </button>
        )}
      </div>
    </header>
  );
};

