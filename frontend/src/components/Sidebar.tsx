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
  { id: 'dashboard',  label: '仪表盘', icon: '📊' },
  { id: 'groups',     label: '分组管理', icon: '📂' },
  { id: 'hidden',     label: '隐藏管理', icon: '👁️' },
  { id: 'images',     label: '镜像', icon: '📦' },
];

export default function Sidebar({ activeTab, onTabChange, groups, hiddenCount, imageCount }: Props) {
  return (
    <aside className="w-56 flex-shrink-0 h-screen sticky top-0 flex flex-col border-r border-border-subtle"
           style={{ background: 'var(--bg-primary)' }}>
      {/* Brand */}
      <div className="p-4 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🦐</span>
          <div>
            <div className="text-sm font-bold text-text-primary">DockerInfo</div>
            <div className="text-[10px] text-text-secondary">Manager</div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left
              ${activeTab === item.id
                ? 'bg-accent/15 text-accent font-semibold'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-card'
              }`}
          >
            <span className="text-base w-5 text-center">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.id === 'groups' && groups.length > 0 && (
              <span className="text-xs text-text-secondary bg-bg-card px-1.5 py-0.5 rounded">{groups.length}</span>
            )}
            {item.id === 'hidden' && hiddenCount > 0 && (
              <span className="text-xs text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded">{hiddenCount}</span>
            )}
            {item.id === 'images' && imageCount !== undefined && (
              <span className="text-xs text-text-secondary bg-bg-card px-1.5 py-0.5 rounded">{imageCount}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-border-subtle space-y-2">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs text-text-secondary">主题</span>
          <ThemeToggle />
        </div>
        <button
          onClick={() => { removeToken(); window.location.href = '/login'; }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-red-400 hover:bg-bg-card transition-colors"
        >
          <span>🚪</span><span>退出登录</span>
        </button>
      </div>
    </aside>
  );
}
