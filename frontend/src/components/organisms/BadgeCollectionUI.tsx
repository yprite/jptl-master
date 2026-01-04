import React, { useState, useEffect } from 'react';
import { Card } from '../atoms/Card';
import { Badge, getBadgeRarityColor } from '../types/badges';
import { badgeService } from '../../services/badgeService';
import './BadgeCollectionUI.css';

interface BadgeCollectionUIProps {
  onClose?: () => void;
}

const BadgeCollectionUI: React.FC<BadgeCollectionUIProps> = ({ onClose }) => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [selectedRarity, setSelectedRarity] = useState<'all' | Badge['rarity']>('all');

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = () => {
    const allBadges = badgeService.getAllBadges();
    setBadges(allBadges);
  };

  const filteredBadges = selectedRarity === 'all'
    ? badges
    : badges.filter(b => b.rarity === selectedRarity);

  const earnedCount = badges.filter(b => b.earnedAt).length;
  const totalCount = badges.length;

  return (
    <div className="badge-collection-ui">
      <div className="badge-collection-header">
        <h1 className="badge-collection-title">배지 컬렉션</h1>
        <div className="badge-collection-stats">
          {earnedCount} / {totalCount} 배지 획득
        </div>
      </div>

      {/* 필터 */}
      <div className="badge-collection-filters">
        <button
          className={`filter-button ${selectedRarity === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedRarity('all')}
        >
          전체
        </button>
        <button
          className={`filter-button ${selectedRarity === 'common' ? 'active' : ''}`}
          onClick={() => setSelectedRarity('common')}
        >
          일반
        </button>
        <button
          className={`filter-button ${selectedRarity === 'rare' ? 'active' : ''}`}
          onClick={() => setSelectedRarity('rare')}
        >
          희귀
        </button>
        <button
          className={`filter-button ${selectedRarity === 'epic' ? 'active' : ''}`}
          onClick={() => setSelectedRarity('epic')}
        >
          영웅
        </button>
        <button
          className={`filter-button ${selectedRarity === 'legendary' ? 'active' : ''}`}
          onClick={() => setSelectedRarity('legendary')}
        >
          전설
        </button>
      </div>

      {/* 배지 그리드 */}
      <div className="badge-collection-grid">
        {filteredBadges.map((badge) => {
          const rarityColor = getBadgeRarityColor(badge.rarity);
          const isEarned = !!badge.earnedAt;
          const progress = badge.progress || 0;

          return (
            <Card
              key={badge.id}
              className={`badge-card ${isEarned ? 'earned' : 'locked'}`}
              variant={isEarned ? 'elevated' : 'outlined'}
              padding="md"
            >
              <div className="badge-card-icon" style={{ color: isEarned ? rarityColor : '#9ca3af' }}>
                {badge.icon}
              </div>
              <div className="badge-card-content">
                <h3 className="badge-card-name">{badge.name}</h3>
                <p className="badge-card-description">{badge.description}</p>
                {!isEarned && badge.target && (
                  <div className="badge-card-progress">
                    <div className="badge-card-progress-bar">
                      <div
                        className="badge-card-progress-fill"
                        style={{
                          width: `${progress}%`,
                          backgroundColor: rarityColor
                        }}
                      />
                    </div>
                    <span className="badge-card-progress-text">
                      {badge.current || 0} / {badge.target}
                    </span>
                  </div>
                )}
                {isEarned && badge.earnedAt && (
                  <div className="badge-card-earned-date">
                    획득일: {new Date(badge.earnedAt).toLocaleDateString('ko-KR')}
                  </div>
                )}
              </div>
              {!isEarned && (
                <div className="badge-card-lock-overlay">
                  <span className="lock-icon">🔒</span>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default BadgeCollectionUI;

