import React from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'info' | 'danger';
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, variant = 'default' }) => {
  let iconBg = '#f1f5f9';
  let iconColor = '#334155';

  if (variant === 'success') {
    iconBg = '#dcfce7';
    iconColor = '#166534';
  } else if (variant === 'warning') {
    iconBg = '#ffedd5';
    iconColor = '#c2410c';
  } else if (variant === 'info') {
    iconBg = '#eff6ff';
    iconColor = '#1d4ed8';
  } else if (variant === 'danger') {
    iconBg = '#fee2e2';
    iconColor = '#b91c1c';
  }

  return (
    <div className="stat-card">
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
      </div>
      {icon && (
        <div className="stat-icon" style={{ backgroundColor: iconBg, color: iconColor }}>
          {icon}
        </div>
      )}
    </div>
  );
};
