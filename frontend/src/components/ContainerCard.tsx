import { useState } from 'react';
import type { ContainerData } from '../hooks/useContainers';
import ContainerDetail from './ContainerDetail';

interface Props {
  container: ContainerData;
  onUpdate: () => void;
}

const STATE_COLORS: Record<string, string> = {
  running: 'bg-green-dot',
  paused: 'bg-yellow-dot',
  exited: 'bg-red-dot',
  restarting: 'bg-yellow-dot',
  removing: 'bg-gray-dot',
};

const DEFAULT_ICON = '📦';

export default function ContainerCard({ container, onUpdate }: Props) {
  const [showDetail, setShowDetail] = useState(false);

  const dotColor = STATE_COLORS[container.state] || 'bg-gray-dot';
  const displayName = container.alias || container.name;
  const displayIcon = container.icon || DEFAULT_ICON;

  const primaryPort = container.ports.find(
    p => p.host_port && p.protocol === 'tcp'
  );

  const handleJump = (e: React.MouseEvent, port: number | null) => {
    e.stopPropagation();
    if (!port) return;
    const protocol = container.jump_protocol || 'http';
    // Use the first port's host IP, default to localhost
    const host = 'localhost';
    window.open(`${protocol}://${host}:${port}`, '_blank');
  };

  return (
    <>
      <div
        onClick={() => setShowDetail(true)}
        className="bg-bg-card hover:bg-bg-card-hover border border-border-subtle rounded-xl p-4 cursor-pointer transition-all hover:border-accent/30 group"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-2xl">{displayIcon}</span>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-text-primary truncate">
                {displayName}
              </h3>
              {container.alias && (
                <p className="text-xs text-text-secondary truncate">{container.name}</p>
              )}
            </div>
          </div>
          <div className={`w-2.5 h-2.5 rounded-full ${dotColor} flex-shrink-0`} />
        </div>

        {/* Image */}
        <div className="flex items-center gap-1.5 mb-3 text-xs text-text-secondary">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <span className="truncate">{container.image}</span>
        </div>

        {/* Ports */}
        {container.ports.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {container.ports.map((p, i) => {
              if (p.host_port) {
                const protocol = container.jump_protocol || 'http';
                const host = 'localhost';
                return (
                  <a
                    key={i}
                    href={`${protocol}://${host}:${p.host_port}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/10 border border-accent/30 rounded-md text-xs text-accent hover:bg-accent/20 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    {p.host_port}:{p.container_port}
                  </a>
                );
              }
              return (
                <span key={i} className="px-2 py-0.5 bg-border-subtle rounded-md text-xs text-text-secondary">
                  {p.container_port}/{p.protocol}
                </span>
              );
            })}
          </div>
        )}

        {/* Footer: group tag */}
        {container.group_name && (
          <div className="mt-3">
            <span className="inline-block px-2 py-0.5 rounded text-xs bg-accent/10 text-accent">
              {container.group_name}
            </span>
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {showDetail && (
        <ContainerDetail
          container={container}
          onClose={() => setShowDetail(false)}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
}
