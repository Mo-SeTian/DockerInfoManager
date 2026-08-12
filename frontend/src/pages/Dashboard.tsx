import { useState, useMemo } from 'react';
import { useContainers, ContainerData, GroupData } from '../hooks/useContainers';
import * as api from '../utils/api';
import ThemeToggle from '../components/ThemeToggle';
import LogoutButton from '../components/LogoutButton';
import StatsBar from '../components/StatsBar';
import SearchBar from '../components/SearchBar';
import GroupTabs from '../components/GroupTabs';
import GroupSection from '../components/GroupSection';
import GroupManager from '../components/GroupManager';
import ContainerCard from '../components/ContainerCard';

type SortKey = 'default' | 'name-asc' | 'name-desc' | 'running-first' | 'newest-first';

export default function Dashboard() {
  const { containers, stats, groups, loading, refresh } = useContainers();
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('default');
  const [batchMode, setBatchMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchError, setBatchError] = useState('');

  // ---- Filter ----
  const filtered = useMemo(() => {
    let result = containers;
    if (!showHidden) result = result.filter(c => !c.is_hidden);
    if (activeGroup !== null) result = result.filter(c => c.group_name === activeGroup);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.alias && c.alias.toLowerCase().includes(q)) ||
        c.image.toLowerCase().includes(q)
      );
    }
    return sortContainers(result, sortKey);
  }, [containers, showHidden, activeGroup, search, sortKey]);

  // ---- Group grouping ----
  const grouped = useMemo(() => {
    const map: Record<string, ContainerData[]> = {};
    const ungrouped: ContainerData[] = [];
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

  const toggleSelect = (id: string) => {
    setSelected(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };
  const clearBatch = () => { setBatchMode(false); setSelected(new Set()); setBatchError(''); };
  const doBulkMove = async (groupName: string | null) => {
    try { await api.bulkMove(Array.from(selected), groupName); refresh(); clearBatch(); }
    catch (e: any) { setBatchError(e.message); }
  };
  const doBulkHide = async (hidden: boolean) => {
    try { await api.bulkHide(Array.from(selected), hidden); refresh(); clearBatch(); }
    catch (e: any) { setBatchError(e.message); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-text-secondary">...</div>;

  const groupOrder = groups.filter(g => g.name in grouped.grouped);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <header className="sticky top-0 z-40 border-b border-border-subtle" style={{ background: 'var(--bg-primary)' }}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold flex items-center gap-2 text-text-primary"><span>🦐</span> DockerInfoManager</h1>
            <div className="flex items-center gap-3"><ThemeToggle /><LogoutButton /></div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatsBar stats={stats} />
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <button onClick={() => setShowHidden(!showHidden)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${showHidden ? 'bg-accent text-white border-accent' : 'border-border-subtle text-text-secondary hover:text-text-primary'}`}>
                {showHidden ? '隐藏已隐藏' : '显示隐藏'}
              </button>
              <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)}
                className="px-2.5 py-1 rounded-lg text-xs bg-bg-card border border-border-subtle text-text-primary focus:outline-none focus:border-accent">
                <option value="default">默认排序</option>
                <option value="name-asc">A - Z</option>
                <option value="name-desc">Z - A</option>
                <option value="running-first">运行中优先</option>
                <option value="newest-first">最新创建</option>
              </select>
              <button onClick={() => { if (batchMode) clearBatch(); else setBatchMode(true); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${batchMode ? 'bg-accent text-white border-accent' : 'border-border-subtle text-text-secondary hover:text-text-primary'}`}>
                {batchMode ? `已选 ${selected.size}` : '批量选择'}
              </button>
            </div>
          </div>
          {batchMode && selected.size > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-2 p-2 rounded-lg bg-bg-card border border-border-subtle">
              <span className="text-xs text-text-secondary">已选 {selected.size} 个:</span>
              <BatchGroupDropdown groups={groups} onMove={doBulkMove} />
              <button onClick={() => doBulkHide(true)} className="px-2 py-1 text-xs rounded bg-bg-primary border border-border-subtle text-text-primary hover:border-red-400">隐藏</button>
              <button onClick={() => doBulkHide(false)} className="px-2 py-1 text-xs rounded bg-bg-primary border border-border-subtle text-text-primary hover:border-green-400">取消隐藏</button>
              <button onClick={clearBatch} className="px-2 py-1 text-xs rounded text-text-secondary hover:text-text-primary ml-auto">取消</button>
              {batchError && <span className="text-xs text-red-400">{batchError}</span>}
            </div>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <SearchBar value={search} onChange={setSearch} />
          </div>
          <div className="mt-2">
            <GroupTabs groups={groupOrder} activeGroup={activeGroup} onSelect={setActiveGroup} onManage={() => setShowGroupManager(true)} />
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-4">
        {(!activeGroup || activeGroup in grouped.grouped) &&
          groupOrder.map(g => (
            <GroupSection key={g.id} group={g} containers={grouped.grouped[g.name] || []} onUpdate={refresh} />
          ))
        }
        {(!activeGroup || activeGroup === 'ungrouped') && grouped.ungrouped.length > 0 && (
          <GroupSection group={null} containers={grouped.ungrouped} onUpdate={refresh} />
        )}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-text-secondary text-sm">没有找到匹配的容器</div>
        )}
      </main>
      {showGroupManager && (
        <GroupManager onClose={() => setShowGroupManager(false)} onRefresh={refresh} initialGroups={groups} />
      )}
    </div>
  );
}

function sortContainers(list: ContainerData[], key: SortKey): ContainerData[] {
  const arr = [...list];
  switch (key) {
    case 'name-asc': arr.sort((a, b) => (a.alias || a.name).localeCompare(b.alias || b.name)); break;
    case 'name-desc': arr.sort((a, b) => (b.alias || b.name).localeCompare(a.alias || a.name)); break;
    case 'running-first': arr.sort((a, b) => (a.state === 'running' ? -1 : 1) - (b.state === 'running' ? -1 : 1)); break;
    case 'newest-first': arr.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')); break;
    default: break;
  }
  return arr;
}

function BatchGroupDropdown({ groups, onMove }: { groups: GroupData[]; onMove: (name: string | null) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="px-2 py-1 text-xs rounded bg-accent text-white">移入分组 ▾</button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-bg-card border border-border-subtle rounded-lg shadow-xl py-1 min-w-[140px]">
          {groups.map(g => (
            <button key={g.id} onClick={() => { onMove(g.name); setOpen(false); }}
              className="block w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-bg-card-hover">
              <span className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle" style={{ backgroundColor: g.color }} />{g.name}
            </button>
          ))}
          <hr className="border-border-subtle my-1" />
          <button onClick={() => { onMove(null); setOpen(false); }}
            className="block w-full text-left px-3 py-1.5 text-xs text-text-secondary hover:bg-bg-card-hover">
            移除分组（未分组）
          </button>
        </div>
      )}
    </div>
  );
}
