import React from 'react';
import './Progress.css';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0-100
  max?: number;
  showLabel?: boolean;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  showLabel = false,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const baseClass = 'progress';
  const variantClass = `progress--${variant}`;
  const sizeClass = `progress--${size}`;
  
  const classes = [
    baseClass,
    variantClass,
    sizeClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      <div className="progress__bar" style={{ width: `${percentage}%` }}>
        {showLabel && (
          <span className="progress__label">{Math.round(percentage)}%</span>
        )}
      </div>
    </div>
  );
};

