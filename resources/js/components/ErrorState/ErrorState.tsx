import React from 'react';
import { Button } from '../Button/Button';

export interface ErrorStateProps {
  title?: string;
  message: string;
  errorCode?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'An error occurred',
  message,
  errorCode,
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`bnx-error-state ${className}`}
      style={{
        padding: '24px',
        borderRadius: '8px',
        background: '#fef2f2',
        border: '1px solid #fecaca',
        color: '#991b1b',
        marginBottom: '20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ fontSize: '20px', lineHeight: 1 }}>⚠️</div>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 600 }}>{title}</h4>
          <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.4, color: '#b91c1c' }}>{message}</p>
          {errorCode && (
            <p style={{ margin: '6px 0 0', fontSize: '11px', fontFamily: 'monospace', color: '#7f1d1d' }}>
              Error Code: {errorCode}
            </p>
          )}
          {onRetry && (
            <div style={{ marginTop: '12px' }}>
              <Button variant="danger" size="sm" onClick={onRetry}>
                Retry Operation
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
