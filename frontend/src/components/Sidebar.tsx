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
  { id: 'dashboard', label: '仪表盘',    icon: '📊' },
  { id: 'groups',    label: '分组管理',  icon: '📂' },
  { id: 'hidden',    label: '隐藏管理',  icon: '👁️' },
  { id: 'images',    label: '镜像',      icon: '📦' },
];

export default function Sidebar({ activeTab, onTabChange, groups, hiddenCount, imageCount }: Props) {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === '1';
  });

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  return (
    <aside
      className={`flex-shrink-0 h-screen sticky top-0 flex flex-col border-r border-border-subtle transition-[width] duration-200 ${
        collapsed ? 'w-14' : 'w-56'
      }`}
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Brand + collapse toggle */}
      <div className={`border-b border-border-subtle flex items-center ${collapsed ? 'justify-center p-3' : 'justify-between p-4'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className="text-2xl">🦐</span>
            <div>
              <div className="text-sm font-bold text-text-primary">DockerInfo</div>
              <div className="text-[10px] text-text-secondary">Manager</div>
            </div>
          </div>
        )}
        {collapsed && <span className="text-xl">🦐</span>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`text-text-secondary hover:text-text-primary transition-colors p-1 rounded hover:bg-bg-card ${collapsed ? 'mt-0' : ''}`}
          title={collapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          {collapsed ? '▶' : '◀'}
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
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-colors relative
                ${active
                  ? 'bg-accent/15 text-accent font-semibold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-card'
                }
                ${collapsed ? 'justify-center' : 'text-left'}
              `}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              {!collapsed && <span className="flex-1">{item.label}</span>}
              {/* Badge */}
              {!collapsed && item.id === 'groups' && groups.length > 0 && (
                <span className="text-xs text-text-secondary bg-bg-card px-1.5 py-0.5 rounded">{groups.length}</span>
              )}
              {!collapsed && item.id === 'hidden' && hiddenCount > 0 && (
                <span className="text-xs text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded">{hiddenCount}</span>
              )}
              {!collapsed && item.id === 'images' && imageCount !== undefined && (
                <span className="text-xs text-text-secondary bg-bg-card px-1.5 py-0.5 rounded">{imageCount}</span>
              )}
              {/* Collapsed: dot badge on active + hidden */}
              {collapsed && item.id === 'hidden' && hiddenCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[9px] flex items-center justify-center rounded-full bg-orange-500 text-white">{hiddenCount < 10 ? hiddenCount : '!'}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className={`border-t border-border-subtle space-y-2 ${collapsed ? 'p-2' : 'p-3'}`}>
        {collapsed ? (
          <div className="flex justify-center"><ThemeToggle /></div>
        ) : (
          <div className="flex items-center justify-between px-2">
            <span className="text-xs text-text-secondary">主题</span>
            <ThemeToggle />
          </div>
        )}
        <button
          onClick={() => { removeToken(); window.location.href = '/login'; }}
          title={collapsed ? '退出登录' : undefined}
          className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-text-secondary hover:text-red-400 hover:bg-bg-card transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          <span>🚪</span>{!collapsed && <span>退出登录</span>}
        </button>
      </div>
    </aside>
  );
}
