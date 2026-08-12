import { useState, useEffect } from 'react';
import type { GroupData } from '../hooks/useContainers';
import ThemeToggle from './ThemeToggle';
import { removeToken } from '../utils/token';

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
  groups: GroupData[];
  hiddenCount: number;
  imageCount?: number;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: '仪表盘',   icon: '📊' },
  { id: 'groups',    label: '分组管理', icon: '📂' },
  { id: 'hidden',    label: '隐藏管理', icon: '👁️' },
  { id: 'images',    label: '镜像',     icon: '📦' },
];

type PanelState = 'expanded' | 'icons' | 'hidden';

export default function Sidebar({ activeTab, onTabChange, groups, hiddenCount, imageCount }: Props) {
  const [panelState, setPanelState] = useState<PanelState>(() => {
    const v = localStorage.getItem('sidebar_state');
    return (v === 'icons' || v === 'hidden') ? v : 'expanded';
  });

  useEffect(() => {
    localStorage.setItem('sidebar_state', panelState);
  }, [panelState]);

  const cycle = () => {
    setPanelState(prev => {
      if (prev === 'expanded') return 'icons';
      if (prev === 'icons') return 'hidden';
      return 'expanded';
    });
  };

  if (panelState === 'hidden') {
    return (
      <button
        onClick={() => setPanelState('icons')}
        className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-12 flex items-center justify-center rounded-r-md bg-bg-card border border-border-subtle border-l-0 text-text-secondary hover:text-accent hover:bg-bg-card-hover z-40 shadow-sm"
        title="显示侧边栏"
        style={{ background: 'var(--bg-card)' }}
      >
        ▸
      </button>
    );
  }

  const isIcons = panelState === 'icons';

  return (
    <aside
      className={`flex-shrink-0 h-screen sticky top-0 flex flex-col border-r border-border-subtle transition-[width] duration-200 relative ${
        isIcons ? 'w-14' : 'w-56'
      }`}
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Brand + toggle */}
      <div className={`border-b border-border-subtle flex items-center ${isIcons ? 'justify-center p-3' : 'justify-between p-4'}`}>
        {!isIcons && (
          <div className="flex items-center gap-2">
            <span className="text-2xl">🦐</span>
            <div>
              <div className="text-sm font-bold text-text-primary">DockerInfo</div>
              <div className="text-[10px] text-text-secondary">Manager</div>
            </div>
          </div>
        )}
        {isIcons && <span className="text-xl">🦐</span>}
        <button
          onClick={cycle}
          className="text-text-secondary hover:text-text-primary transition-colors p-1 rounded hover:bg-bg-card"
          title={isIcons ? '展开' : '缩小'}
        >
          {isIcons ? '▶' : '◀'}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-2 space-y-1">
        {NAV_ITEMS.map(item => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              title={isIcons ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-colors relative
                ${active
                  ? 'bg-accent/15 text-accent font-semibold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-card'
                }
                ${isIcons ? 'justify-center' : 'text-left'}
              `}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              {!isIcons && <span className="flex-1">{item.label}</span>}
              {!isIcons && item.id === 'groups' && groups.length > 0 && (
                <span className="text-xs text-text-secondary bg-bg-card px-1.5 py-0.5 rounded">{groups.length}</span>
              )}
              {!isIcons && item.id === 'images' && imageCount !== undefined && (
                <span className="text-xs text-text-secondary bg-bg-card px-1.5 py-0.5 rounded">{imageCount}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className={`border-t border-border-subtle space-y-2 ${isIcons ? 'p-2' : 'p-3'}`}>
        {isIcons ? (
          <div className="flex justify-center"><ThemeToggle /></div>
        ) : (
          <div className="flex items-center justify-between px-2">
            <span className="text-xs text-text-secondary">主题</span>
            <ThemeToggle />
          </div>
        )}
        <button
          onClick={() => { removeToken(); window.location.href = '/login'; }}
          title={isIcons ? '退出登录' : undefined}
          className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-text-secondary hover:text-red-400 hover:bg-bg-card transition-colors ${isIcons ? 'justify-center' : ''}`}
        >
          <span>🚪</span>{!isIcons && <span>退出登录</span>}
        </button>
        {/* Extra hide button when in icons mode */}
        {isIcons && (
          <button
            onClick={() => setPanelState('hidden')}
            className="w-full flex justify-center py-1 text-text-secondary hover:text-accent transition-colors"
            title="完全隐藏"
          >
            ◀
          </button>
        )}
      </div>
    </aside>
  );
}
