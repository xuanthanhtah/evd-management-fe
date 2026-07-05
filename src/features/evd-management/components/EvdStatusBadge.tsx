import { Tag } from 'antd';
import type { EvdStatus } from '../types/evd.types';

interface EvdStatusBadgeProps {
  status: EvdStatus;
}

const STATUS_CONFIG: Record<EvdStatus, { color: string; label: string }> = {
  ACTIVE: { color: 'success', label: 'Active' },
  INACTIVE: { color: 'default', label: 'Inactive' },
  DRAFT: { color: 'warning', label: 'Draft' },
};

export const EvdStatusBadge = ({ status }: EvdStatusBadgeProps) => {
  const config = STATUS_CONFIG[status] ?? { color: 'default', label: status };
  return (
    <Tag color={config.color} className="font-medium text-xs">
      {config.label}
    </Tag>
  );
};
