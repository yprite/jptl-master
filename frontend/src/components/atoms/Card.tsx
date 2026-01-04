import React from 'react';
import './Card.css';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  clickable?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  clickable = false,
  className = '',
  children,
  ...props
}) => {
  const baseClass = 'card';
  const variantClass = `card--${variant}`;
  const paddingClass = `card--padding-${padding}`;
  const clickableClass = clickable ? 'card--clickable' : '';
  
  const classes = [
    baseClass,
    variantClass,
    paddingClass,
    clickableClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

