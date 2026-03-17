import React from 'react';

interface PaymentStatusBadgeProps {
  status?: 'pending' | 'completed' | 'failed' | 'cancelled';
}

export const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({ status = 'pending' }) => {
  const statusConfig = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⏳' },
    completed: { bg: 'bg-green-100', text: 'text-green-800', icon: '✅' },
    failed: { bg: 'bg-red-100', text: 'text-red-800', icon: '❌' },
    cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', icon: '⚪' }
  };

  const config = statusConfig[status];

  return (
    <span className={`${config.bg} ${config.text} px-3 py-1 rounded-full text-sm font-semibold inline-flex items-center gap-2`}>
      <span>{config.icon}</span>
      <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
    </span>
  );
};

export default PaymentStatusBadge;
