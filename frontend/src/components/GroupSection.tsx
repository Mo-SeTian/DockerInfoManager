import { useState } from 'react';
import type { ContainerData, GroupData } from '../hooks/useContainers';
import ContainerCard from './ContainerCard';

interface Props {
  group: GroupData | null; // null = ungrouped
  containers: ContainerData[];
  onUpdate: () => void;
}

export default function GroupSection({ group, containers, onUpdate }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  if (containers.length === 0) return null;

  const runningCount = containers.filter(c => c.state === 'running').length;
  const name = group?.name || '未分组';
  const color = group?.color || '#6b7280';

  return (
    <div className="mb-6">
      {/* Group header */}
      <div
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-3 mb-3 cursor-pointer select-none group"
      >
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <span className="text-base font-semibold text-text-primary">{name}</span>
        <span className="text-sm text-text-secondary">{containers.length} 个容器</span>
        <span className="text-xs text-text-secondary">({runningCount} 运行中)</span>
        <svg
          className={`w-4 h-4 text-text-secondary transition-transform ml-auto ${collapsed ? '' : 'rotate-180'}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Container cards */}
      {!collapsed && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {containers.map(c => (
            <ContainerCard key={c.id} container={c} onUpdate={onUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}
