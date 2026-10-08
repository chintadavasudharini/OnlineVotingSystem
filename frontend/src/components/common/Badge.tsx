import React from 'react';
import type { ElectionStatus, UserStatus } from '../../types';

interface BadgeProps {
  status: ElectionStatus | UserStatus | 'PUBLISHED' | 'NOT_PUBLISHED';
  label?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, label }) => {
  let badgeClass = 'badge-completed';
  let displayLabel = label;
  let showPulse = false;

  switch (status) {
    case 'UPCOMING':
      badgeClass = 'badge-upcoming';
      displayLabel = displayLabel || 'Upcoming';
      break;
    case 'REGISTRATION_OPEN':
      badgeClass = 'badge-reg-open';
      displayLabel = displayLabel || 'Registration Open';
      break;
    case 'VOTING_OPEN':
      badgeClass = 'badge-voting-open';
      displayLabel = displayLabel || 'Voting Open';
      showPulse = true;
      break;
    case 'COMPLETED':
      badgeClass = 'badge-completed';
      displayLabel = displayLabel || 'Completed';
      break;
    case 'ACTIVE':
      badgeClass = 'badge-active';
      displayLabel = displayLabel || 'ACTIVE';
      break;
    case 'PUBLISHED':
      badgeClass = 'badge-published';
      displayLabel = displayLabel || 'Results Published';
      break;
    case 'NOT_PUBLISHED':
      badgeClass = 'badge-not-published';
      displayLabel = displayLabel || 'Not Published';
      break;
  }

  return (
    <span className={`badge ${badgeClass}`}>
      {showPulse && <span className="pulse-dot" />}
      {displayLabel}
    </span>
  );
};
