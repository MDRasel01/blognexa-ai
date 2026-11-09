import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  icon,
  children,
  disabled,
  className = '',
  style,
  ...props
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          background: 'var(--bnx-color-primary, #3b82f6)',
          color: '#ffffff',
          borderColor: 'transparent',
        };
      case 'danger':
        return {
          background: 'var(--bnx-color-danger, #b91c1c)',
          color: '#ffffff',
          borderColor: 'transparent',
        };
      case 'ghost':
        return {
          background: 'transparent',
          color: 'var(--bnx-color-text-secondary, #475569)',
          borderColor: 'transparent',
        };
      case 'secondary':
      default:
        return {
          background: 'var(--bnx-color-surface, #ffffff)',
          color: 'var(--bnx-color-text, #0f172a)',
          borderColor: 'var(--bnx-color-border-subtle, #cbd5e1)',
        };
    }
  };

  const getSizeStyles = (): React.CSSProperties => {
    switch (size) {
      case 'sm':
        return { padding: '5px 10px', fontSize: '12px' };
      case 'lg':
        return { padding: '10px 20px', fontSize: '14px' };
      case 'md':
      default:
        return { padding: '8px 16px', fontSize: '13px' };
    }
  };

  return (
    <button
      className={`bnx-btn bnx-btn-${variant} ${className}`}
      disabled={disabled || isLoading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        fontWeight: 600,
        borderRadius: '6px',
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        opacity: disabled || isLoading ? 0.6 : 1,
        transition: 'all 0.15s ease-in-out',
        borderWidth: '1px',
        borderStyle: 'solid',
        ...getVariantStyles(),
        ...getSizeStyles(),
        ...style,
      }}
      {...props}
    >
      {isLoading && (
        <span
          className="bnx-spinner"
          style={{
            width: '12px',
            height: '12px',
            border: '2px solid currentColor',
            borderRightColor: 'transparent',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'bnx-spin 0.75s linear infinite',
          }}
        />
      )}
      {!isLoading && icon && <span className="bnx-btn-icon">{icon}</span>}
      {children}
    </button>
  );
};

