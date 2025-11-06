import React from 'react';
import { Status } from '../types';

interface StatusBadgeProps {
  status: Status;
}

interface StatusConfig {
  bg: string;
  text: string;
  animate?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const statusConfig: Record<Status, StatusConfig> = {
    [Status.Open]: { bg: 'bg-status-gray', text: 'text-status-gray-text' },
    [Status.PendingApproval]: { bg: 'bg-status-yellow', text: 'text-status-yellow-text' },
    [Status.Approved]: { bg: 'bg-status-blue', text: 'text-status-blue-text' },
    [Status.InProgress]: { bg: 'bg-status-purple', text: 'text-status-purple-text', animate: 'animate-pulse' },
    [Status.AwaitingDOCompletion]: { bg: 'bg-status-purple', text: 'text-status-purple-text', animate: 'animate-pulse' },
    [Status.Completed]: { bg: 'bg-status-green', text: 'text-status-green-text' },
    [Status.Failed]: { bg: 'bg-status-red', text: 'text-status-red-text' },
  };

  const config = statusConfig[status];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-bold uppercase ${config.bg} ${config.text} ${config.animate || ''}`}>
      {status}
    </span>
  );
};