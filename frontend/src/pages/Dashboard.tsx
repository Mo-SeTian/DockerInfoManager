import { useState, useMemo } from 'react';
import { useContainers } from '../hooks/useContainers';
import LogoutButton from '../components/LogoutButton';
import ThemeToggle from '../components/ThemeToggle';
import StatsBar from '../components/StatsBar';
import SearchBar from '../components/SearchBar';
import GroupTabs from '../components/GroupTabs';
import GroupSection from '../components/GroupSection';
import GroupManager from '../components/GroupManager';
import * as api from '../utils/api';

export default function Dashboard() {
  const { containers, stats, groups, loading, refresh } = useContainers();
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Re-fetch when showHidden toggles
  const { refresh: refetchHidden } = useContainers(showHidden);

  const filtered = useMemo(() => {
    let result = containers;
    if (activeGroup !== null) {
      result = result.filter(c => c.group_name === activeGroup);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.alias && c.alias.toLowerCase().includes(q)) ||
        c.image.toLowerCase().includes(q)
      );
    }
    return result;
  }, [containers, activeGroup, search]);

  const grouped = useMemo(() => {
    const map: Record<string, typeof filtered> = {};
    const ungrouped: typeof filtered = [];
    for (const c of filtered) {
      if (c.group_name) {
        if (!map[c.group_name]) map[c.group_name] = [];
        map[c.group_name].push(c);
      } else {
        ungrouped.push(c);
      }
    }
    return { grouped: map, ungrouped };
  }, [filtered]);

  const groupOrder = useMemo(() => {
    const names = [...new Set(filtered.map(c => c.group_name).filter(Boolean))];
    return groups.filter(g => names.includes(g.name));
  }, [filtered, groups]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkMove = async (groupName: string | null) => {
    if (selectedIds.size === 0) return;
    const name = groupName || prompt('输入目标分组名称（留空=移出分组）');
    if (name === null) return;
    await api.bulkMove([...selectedIds], name || null);
    setSelectedIds(new Set());
    setSelectionMode(false);
    refresh();
  };

  const handleBulkHide = async () => {
    if (selectedIds.size === 0) return;
    await api.bulkHide([...selectedIds], true);
    setSelectedIds(new Set());
    setSelectionMode(false);
    refresh();
  };

  const handleBulkUnhide = async () => {
    if (selectedIds.size === 0) return;
    await api.bulkHide([...selectedIds], false);
    setSelectedIds(new Set());
    setSelectionMode(false);
    refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-text-secondary">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 sm:p-6" style={{ background: 'var(--bg-primary)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <span>🦐</span>
          <span className="hidden sm:inline">DockerInfoManager</span>
        </h1>
        <div className="flex items-center gap-3">
          <StatsBar stats={stats} />
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>

      {/* Search + actions */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <SearchBar value={search} onChange={setSearch} />
        <button
          onClick={() => { setSelectionMode(!selectionMode); setSelectedIds(new Set()); }}
          className={`px-3 py-2 rounded-lg text-sm border transition-colors whitespace-nowrap ${
            selectionMode ? 'bg-accent text-white border-accent' : 'border-border-subtle text-text-secondary hover:text-text-primary'
          }`}
        >
          {selectionMode ? `已选 ${selectedIds.size}` : '批量选择'}
        </button>
        <button
          onClick={() => { setShowHidden(!showHidden); refetchHidden(); }}
          className={`px-3 py-2 rounded-lg text-sm border transition-colors whitespace-nowrap ${
            showHidden ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' : 'border-border-subtle text-text-secondary hover:text-text-primary'
          }`}
        >
          {showHidden ? '👁️ 显示隐藏' : '隐藏的'}
        </button>
      </div>

      {/* Selection action bar */}
      {selectionMode && selectedIds.size > 0 && (
        <div className="flex gap-2 mb-4 p-3 bg-bg-card border border-accent rounded-lg flex-wrap">
          <span className="text-sm text-accent">已选 {selectedIds.size} 个容器：</span>
          <button onClick={() => handleBulkMove(null)} className="px-3 py-1 text-xs bg-accent text-white rounded-lg hover:bg-accent-hover">
            移入分组
          </button>
          <button onClick={handleBulkHide} className="px-3 py-1 text-xs bg-yellow-500/20 text-yellow-500 rounded-lg">
            批量隐藏
          </button>
          <button onClick={handleBulkUnhide} className="px-3 py-1 text-xs bg-green-500/20 text-green-500 rounded-lg">
            取消隐藏
          </button>
        </div>
      )}

      {/* Group tabs */}
      <div className="mb-5 overflow-x-auto">
        <GroupTabs
          groups={groups}
          activeGroup={activeGroup}
          onSelect={setActiveGroup}
          onManage={() => setShowGroupManager(true)}
        />
      </div>

      {/* Container sections */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">
          {search ? '没有匹配的容器' : '没有容器'}
        </div>
      ) : (
        <>
          {groupOrder.map(g => (
            <GroupSection
              key={g.id}
              group={g}
              containers={grouped.grouped[g.name] || []}
              onUpdate={refresh}
              selectionMode={selectionMode}
              selectedIds={selectedIds}
              onSelectToggle={toggleSelect}
            />
          ))}
          {grouped.ungrouped.length > 0 && (
            <GroupSection
              group={null}
              containers={grouped.ungrouped}
              onUpdate={refresh}
              selectionMode={selectionMode}
              selectedIds={selectedIds}
              onSelectToggle={toggleSelect}
            />
          )}
        </>
      )}

      {/* Group manager modal */}
      {showGroupManager && (
        <GroupManager
          onClose={() => setShowGroupManager(false)}
          onRefresh={refresh}
          initialGroups={groups}
        />
      )}
    </div>
  );
}
