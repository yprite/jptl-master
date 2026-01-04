import React from 'react';
import { Modal } from '../atoms/Modal';
import { Badge, getBadgeRarityColor } from '../../types/badges';
import './BadgeEarnedModal.css';

interface BadgeEarnedModalProps {
  badge: Badge;
  isOpen: boolean;
  onClose: () => void;
}

const BadgeEarnedModal: React.FC<BadgeEarnedModalProps> = ({
  badge,
  isOpen,
  onClose
}) => {
  const rarityColor = getBadgeRarityColor(badge.rarity);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      closeOnOverlayClick={true}
    >
      <div className="badge-earned-modal">
        <div className="badge-earned-animation">
          <div className="badge-earned-icon" style={{ color: rarityColor }}>
            {badge.icon}
          </div>
          <div className="badge-earned-sparkles">
            <span className="sparkle sparkle-1">✨</span>
            <span className="sparkle sparkle-2">✨</span>
            <span className="sparkle sparkle-3">✨</span>
            <span className="sparkle sparkle-4">✨</span>
          </div>
        </div>

        <div className="badge-earned-content">
          <h2 className="badge-earned-title">배지를 획득했습니다!</h2>
          <div className="badge-earned-name" style={{ color: rarityColor }}>
            {badge.name}
          </div>
          <p className="badge-earned-description">{badge.description}</p>
          
          <div className="badge-earned-rarity">
            <span className="rarity-label">등급:</span>
            <span className="rarity-value" style={{ color: rarityColor }}>
              {badge.rarity === 'common' ? '일반' :
               badge.rarity === 'rare' ? '희귀' :
               badge.rarity === 'epic' ? '영웅' :
               '전설'}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default BadgeEarnedModal;

