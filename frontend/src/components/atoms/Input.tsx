import React from 'react';
import './Input.css';

export type InputSize = 'sm' | 'md' | 'lg';
export type InputVariant = 'default' | 'outlined' | 'filled';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: InputVariant;
  size?: InputSize;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = !!error;
  
  const baseClass = 'input';
  const variantClass = `input--${variant}`;
  const sizeClass = `input--${size}`;
  const errorClass = hasError ? 'input--error' : '';
  const fullWidthClass = fullWidth ? 'input--full-width' : '';
  const hasLeftIconClass = leftIcon ? 'input--has-left-icon' : '';
  const hasRightIconClass = rightIcon ? 'input--has-right-icon' : '';
  
  const inputClasses = [
    baseClass,
    variantClass,
    sizeClass,
    errorClass,
    fullWidthClass,
    hasLeftIconClass,
    hasRightIconClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={`input-wrapper ${fullWidth ? 'input-wrapper--full-width' : ''}`}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}
      <div className="input-container">
        {leftIcon && (
          <span className="input-icon input-icon--left">{leftIcon}</span>
        )}
        <input
          id={inputId}
          className={inputClasses}
          aria-invalid={hasError}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
        {rightIcon && (
          <span className="input-icon input-icon--right">{rightIcon}</span>
        )}
      </div>
      {error && (
        <span id={`${inputId}-error`} className="input-error" role="alert">
          {error}
        </span>
      )}
      {helperText && !error && (
        <span id={`${inputId}-helper`} className="input-helper">
          {helperText}
        </span>
      )}
    </div>
  );
};

