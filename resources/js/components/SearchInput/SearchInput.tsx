import React from 'react';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}) => {
  return (
    <div
      className={`bnx-search-wrap ${className}`}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        width: '100%',
        maxWidth: '320px',
      }}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bnx-input"
        style={{
          width: '100%',
          padding: '7px 28px 7px 10px',
          fontSize: '13px',
          border: '1px solid var(--bnx-color-border-subtle, #cbd5e1)',
          borderRadius: '6px',
          background: 'var(--bnx-color-surface, #ffffff)',
          outline: 'none',
        }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          style={{
            position: 'absolute',
            right: '8px',
            background: 'none',
            border: 'none',
            fontSize: '12px',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: 0,
            lineHeight: 1,
          }}
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
};

