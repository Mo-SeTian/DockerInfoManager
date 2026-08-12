import { useState } from 'react';
import type { GroupData, ContainerData } from '../hooks/useContainers';
import ContainerCard from './ContainerCard';

interface Props {
  group: GroupData | null;
  containers: ContainerData[];
  onUpdate: () => void;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onSelectToggle?: (id: string) => void;
  editMode?: boolean;
  onDropInGroup?: (dragId: string, targetGroup: string | null) => void;
  onDropBeforeCard?: (dragId: string, targetId: string, targetGroup: string | null) => void;
}

export default function GroupSection({
  group, containers, onUpdate, selectionMode, selectedIds, onSelectToggle, editMode, onDropInGroup, onDropBeforeCard,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [dropHighlight, setDropHighlight] = useState(false);

  if (containers.length === 0 && !editMode) return null;

  const runningCount = containers.filter(c => c.state === 'running').length;
  const hiddenCount = containers.filter(c => c.is_hidden).length;
  const name = group?.name || '未分组';
  const color = group?.color || '#6b7280';
  const groupName = group?.name ?? null;

  const handleDragOver = (e: React.DragEvent) => {
    if (!editMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropHighlight(true);
  };
  const handleDragLeave = () => setDropHighlight(false);
  const handleDrop = (e: React.DragEvent) => {
    if (!editMode) return;
    e.preventDefault();
    setDropHighlight(false);
    const dragId = e.dataTransfer.getData('text/plain');
    if (dragId) onDropInGroup?.(dragId, groupName); // append to this group
  };

  return (
    <div
      className={`mb-6 rounded-xl transition-colors ${dropHighlight ? 'ring-2 ring-accent/60 bg-accent/5' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-3 mb-3 cursor-pointer select-none px-2 py-1 rounded-lg"
      >
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <span className="text-base font-semibold text-text-primary">{name}</span>
        <span className="text-sm text-text-secondary">{containers.length} 个容器</span>
        <span className="text-xs text-text-secondary">{runningCount} 运行中</span>
        <span className="text-xs text-orange-400">{hiddenCount} 隐藏</span>
        <svg
          className={`w-4 h-4 text-text-secondary transition-transform ml-auto ${collapsed ? '' : 'rotate-180'}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {!collapsed && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {containers.map(c => (
            <ContainerCard
              key={c.id}
              container={c}
              onUpdate={onUpdate}
              selectionMode={selectionMode}
              selected={selectedIds?.has(c.id)}
              onSelectToggle={onSelectToggle}
              editMode={editMode}
              groupName={groupName}
              onDropCard={onDropBeforeCard}
            />
          ))}
          {editMode && containers.length === 0 && (
            <div className="text-xs text-text-secondary border border-dashed border-border-subtle rounded-xl p-6 text-center">
              拖拽容器到这里
            </div>
          )}
        </div>
      )}
    </div>
  );
}
