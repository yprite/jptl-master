import React from 'react';
import './Skeleton.css';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  animation = 'pulse',
  className = '',
  style,
  ...props
}) => {
  const baseClass = 'skeleton';
  const variantClass = `skeleton--${variant}`;
  const animationClass = `skeleton--${animation}`;
  
  const classes = [
    baseClass,
    variantClass,
    animationClass,
    className
  ].filter(Boolean).join(' ');

  const customStyle: React.CSSProperties = {
    ...style,
    ...(width && { width: typeof width === 'number' ? `${width}px` : width }),
    ...(height && { height: typeof height === 'number' ? `${height}px` : height })
  };

  return (
    <div
      className={classes}
      style={customStyle}
      aria-busy="true"
      aria-live="polite"
      {...props}
    />
  );
};

