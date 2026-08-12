import { useState } from 'react';
import type { ContainerData } from '../hooks/useContainers';
import ContainerDetail from './ContainerDetail';

interface Props {
  container: ContainerData;
  onUpdate: () => void;
  selected?: boolean;
  onSelectToggle?: (id: string) => void;
  selectionMode?: boolean;
  editMode?: boolean;
  groupName?: string | null;
  onDropCard?: (dragId: string, targetId: string, targetGroup: string | null) => void;
}

const STATE_COLORS: Record<string, string> = {
  running: 'bg-green-500',
  paused: 'bg-yellow-500',
  exited: 'bg-red-500',
  restarting: 'bg-yellow-500',
  removing: 'bg-gray-500',
};

const DEFAULT_ICON = '📦';

export default function ContainerCard({
  container, onUpdate, selected, onSelectToggle, selectionMode, editMode, groupName, onDropCard,
}: Props) {
  const [showDetail, setShowDetail] = useState(false);

  const dotColor = STATE_COLORS[container.state] || 'bg-gray-500';
  const displayName = container.alias || container.name;
  const hasIconUrl = container.icon_url && container.icon_url.trim();

  const renderIcon = () => {
    if (hasIconUrl) {
      return (
        <img
          src={container.icon_url!}
          alt=""
          className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      );
    }
    return <span className="text-2xl flex-shrink-0">{container.icon || DEFAULT_ICON}</span>;
  };

  const getJumpUrl = (): string | null => {
    const pref = container.url_preference || 'auto';
    if (container.private_url && container.public_url) {
      if (pref === 'private') return container.private_url;
      if (pref === 'public') return container.public_url;
      return container.private_url;
    }
    if (container.private_url && pref !== 'public') return container.private_url;
    if (container.public_url && pref !== 'private') return container.public_url;

    const primaryPort = container.ports.find(p => p.host_port && p.protocol === 'tcp');
    if (!primaryPort?.host_port) return null;
    const protocol = container.jump_protocol || 'http';
    return `${protocol}://localhost:${primaryPort.host_port}`;
  };

  const handleJump = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getJumpUrl();
    if (url) window.open(url, '_blank');
  };

  const handleCardClick = () => {
    if (selectionMode && onSelectToggle) {
      onSelectToggle(container.id);
    } else if (!editMode) {
      setShowDetail(true);
    }
  };

  // Drag source
  const handleDragStart = (e: React.DragEvent) => {
    if (!editMode) { e.preventDefault(); return; }
    e.dataTransfer.setData('text/plain', container.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Drop target: insert BEFORE this card
  const handleDragOver = (e: React.DragEvent) => {
    if (editMode) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }
  };
  const handleDrop = (e: React.DragEvent) => {
    if (!editMode) return;
    e.preventDefault();
    e.stopPropagation();
    const dragId = e.dataTransfer.getData('text/plain');
    if (dragId && dragId !== container.id && onDropCard) {
      onDropCard(dragId, container.id, groupName ?? null);
    }
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        draggable={editMode}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`bg-bg-card hover:bg-bg-card-hover border rounded-xl p-4 transition-all group relative ${
          selected ? 'border-accent ring-1 ring-accent' : 'border-border-subtle hover:border-accent/30'
        } ${container.is_hidden ? 'opacity-60' : ''} ${editMode ? 'cursor-grab active:cursor-grabbing select-none' : 'cursor-pointer'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {selectionMode && (
              <input
                type="checkbox"
                checked={selected || false}
                onChange={() => onSelectToggle?.(container.id)}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 accent-sky-500 flex-shrink-0"
              />
            )}
            <div onClick={handleJump} className="cursor-pointer hover:opacity-80 transition-opacity">
              {renderIcon()}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-text-primary truncate">
                {displayName}
              </h3>
              {container.alias && (
                <p className="text-xs text-text-secondary truncate">{container.name}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className={`w-2 h-2 rounded-full ${dotColor}`} />
            {editMode && <span className="text-xs text-text-secondary">⠿</span>}
          </div>
        </div>

        {/* Image */}
        <p className="text-xs text-text-secondary truncate mb-2">{container.image}</p>

        {/* Compose service badge */}
        {container.compose_service && (
          <div className="mb-2 flex items-center gap-1">
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20">
              🐳 {container.compose_service}
            </span>
          </div>
        )}

        {/* Ports */}
        {container.ports.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {container.ports.slice(0, 4).map((p, i) => (
              <button
                key={i}
                onClick={handleJump}
                className="px-2 py-0.5 text-xs bg-accent/10 text-accent rounded hover:bg-accent/20 transition-colors"
              >
                {p.host_port}→{p.container_port}
              </button>
            ))}
          </div>
        )}

        {/* Hidden badge */}
        {container.is_hidden && (
          <span className="absolute top-2 right-2 text-xs text-yellow-500">隐藏</span>
        )}
      </div>

      {showDetail && (
        <ContainerDetail
          containerId={container.id}
          onClose={() => setShowDetail(false)}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
}
