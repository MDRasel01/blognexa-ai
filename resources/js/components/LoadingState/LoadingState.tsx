import React from 'react';

export interface LoadingStateProps {
  message?: string;
  subMessage?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading BlogNexa AI Workspace...',
  subMessage,
}) => {
  return (
    <div
      style={{
        padding: '60px 24px',
        textAlign: 'center',
        background: 'var(--bnx-color-surface, #ffffff)',
        borderRadius: '8px',
      }}
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          border: '3px solid #e2e8f0',
          borderTopColor: 'var(--bnx-color-primary, #3b82f6)',
          borderRadius: '50%',
          margin: '0 auto 16px',
          animation: 'bnx-spin 0.75s linear infinite',
        }}
      />
      <h4
        style={{
          fontSize: '15px',
          fontWeight: 600,
          color: 'var(--bnx-color-text, #0f172a)',
          margin: '0 0 6px',
        }}
      >
        {message}
      </h4>
      {subMessage && (
        <p
          style={{
            fontSize: '12px',
            color: 'var(--bnx-color-text-muted, #64748b)',
            margin: 0,
          }}
        >
          {subMessage}
        </p>
      )}
      <style>{`
        @keyframes bnx-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

