import React from 'react';
import { Badge, BadgeVariant } from '../Badge/Badge';

export interface StatusIndicatorProps {
  status: 'connected' | 'disconnected' | 'connecting' | 'warning' | 'idle' | 'empty';
  label?: string;
  showDetails?: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  showDetails = true,
}) => {
  const getVariant = (): { variant: BadgeVariant; defaultLabel: string } => {
    switch (status) {
      case 'connected':
        return { variant: 'healthy', defaultLabel: 'Connected' };
      case 'disconnected':
        return { variant: 'disconnected', defaultLabel: 'Disconnected' };
      case 'connecting':
        return { variant: 'primary', defaultLabel: 'Connecting...' };
      case 'warning':
        return { variant: 'warning', defaultLabel: 'Attention Required' };
      case 'idle':
        return { variant: 'info', defaultLabel: 'Ready' };
      case 'empty':
      default:
        return { variant: 'empty', defaultLabel: 'Unconfigured' };
    }
  };

  const { variant, defaultLabel } = getVariant();

  return (
    <Badge
      label={label || defaultLabel}
      variant={variant}
      showDot={showDetails}
    />
  );
};

