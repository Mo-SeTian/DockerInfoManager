import { useState, useMemo } from 'react';
import { useContainers, ContainerData, GroupData } from '../hooks/useContainers';
import * as api from '../utils/api';
import Sidebar from '../components/Sidebar';
import StatsBar from '../components/StatsBar';
import SearchBar from '../components/SearchBar';
import GroupSection from '../components/GroupSection';
import GroupManager from '../components/GroupManager';
import ContainerCard from '../components/ContainerCard';

export default function Dashboard() {
  const { containers, stats, groups, loading, refresh } = useContainers();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [showHidden, setShowHidden] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchError, setBatchError] = useState('');

  // ---- Filter (containers always ordered by sort_order so manual order persists) ----
  const filtered = useMemo(() => {
    let result = [...containers].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    if (!showHidden) result = result.filter(c => !c.is_hidden);
    if (activeGroup !== null) result = result.filter(c => c.group_name === activeGroup);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(q) || (c.alias && c.alias.toLowerCase().includes(q)) || c.image.toLowerCase().includes(q));
    }
    return result;
  }, [containers, showHidden, activeGroup, search]);

  // ---- Grouped for grid ----
  const grouped = useMemo(() => {
    const map: Record<string, ContainerData[]> = {};
    const ug: ContainerData[] = [];
    for (const c of filtered) {
      if (c.group_name) { if (!map[c.group_name]) map[c.group_name] = []; map[c.group_name].push(c); }
      else ug.push(c);
    }
    return { grouped: map, ungrouped: ug };
  }, [filtered]);

  // Hidden containers (for hidden management tab)
  const hiddenContainers = useMemo(() => containers.filter(c => c.is_hidden), [containers]);

  // ---- Per-group full stats (always based on ALL containers, independent of showHidden/search) ----
  const groupStats = useMemo(() => {
    const map: Record<string, { total: number; running: number; hidden: number }> = {};
    for (const c of containers) {
      const key = c.group_name || '__ungrouped__';
      if (!map[key]) map[key] = { total: 0, running: 0, hidden: 0 };
      map[key].total++;
      if (c.state === 'running') map[key].running++;
      if (c.is_hidden) map[key].hidden++;
    }
    return map;
  }, [containers]);

  const toggleSelect = (id: string) => {
    setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const clearBatch = () => { setBatchMode(false); setSelected(new Set()); setBatchError(''); };
  const doBulkMove = async (name: string | null) => {
    try { await api.bulkMove([...selected], name); refresh(); clearBatch(); } catch (e: any) { setBatchError(e.message); }
  };
  const doBulkHide = async (hidden: boolean) => {
    try { await api.bulkHide([...selected], hidden); refresh(); clearBatch(); } catch (e: any) { setBatchError(e.message); }
  };
  const doUnhide = async (id: string) => {
    await api.bulkHide([id], false);
    refresh();
  };

  // Drag & drop: dropped on a card = insert before it; dropped on group empty area = append
  const handleDropBeforeCard = async (dragId: string, targetId: string, targetGroup: string | null) => {
    if (!dragId) return;
    await api.placeContainer(dragId, targetGroup, targetId);
    refresh();
  };
  const handleDropInGroup = async (dragId: string, targetGroup: string | null) => {
    if (!dragId) return;
    await api.placeContainer(dragId, targetGroup, null);
    refresh();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-text-secondary">加载中...</div>;

  const groupOrder = groups;

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar
        activeTab={activeTab}
        onTabChange={tab => { setActiveTab(tab); clearBatch(); setEditMode(false); }}
        groups={groups}
        hiddenCount={hiddenContainers.length}
        imageCount={stats?.total_images}
      />

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Top toolbar */}
        <header className="sticky top-0 z-30 border-b border-border-subtle" style={{ background: 'var(--bg-primary)' }}>
          <div className="px-4 py-2.5 space-y-2">
            {/* Row 1: Stats + actions */}
            <div className="flex items-center justify-between gap-2">
              <StatsBar stats={stats} />
              <div className="flex items-center gap-1.5">
                <button onClick={() => { setShowHidden(!showHidden); refresh(); }}
                  className={`min-w-[44px] min-h-[38px] px-2.5 rounded-lg text-xs font-medium border transition-colors touch-manipulation ${showHidden ? 'bg-accent text-white border-accent' : 'border-border-subtle text-text-secondary hover:text-text-primary'}`}>
                  {showHidden ? '隐藏中' : '隐藏'}
                </button>
                {activeTab === 'dashboard' && (
                  <button onClick={() => setEditMode(e => !e)}
                    className={`min-w-[44px] min-h-[38px] px-2.5 rounded-lg text-xs font-medium border transition-colors touch-manipulation ${editMode ? 'bg-accent text-white border-accent' : 'border-border-subtle text-text-secondary hover:text-text-primary'}`}>
                    {editMode ? '✓编辑' : '编辑'}
                  </button>
                )}
                {activeTab === 'dashboard' && (
                  <button onClick={() => batchMode ? clearBatch() : setBatchMode(true)}
                    className={`min-w-[44px] min-h-[38px] px-2.5 rounded-lg text-xs font-medium border transition-colors touch-manipulation ${batchMode ? 'bg-accent text-white border-accent' : 'border-border-subtle text-text-secondary hover:text-text-primary'}`}>
                    {batchMode ? `✓${selected.size}` : '批量'}
                  </button>
                )}
              </div>
            </div>

            {/* Edit-mode hint bar */}
            {editMode && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/30 text-xs text-accent">
                ✋ 拖拽容器卡片调整顺序；拖到分组区域可跨组移动
              </div>
            )}

            {/* Batch bar */}
            {batchMode && selected.size > 0 && (
              <div className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-bg-card border border-border-subtle">
                <span className="text-xs text-text-secondary">已选 {selected.size} 个:</span>
                <BatchGroupDropdown groups={groups} onMove={doBulkMove} />
                <button onClick={() => doBulkHide(true)} className="px-2 py-1 text-xs rounded bg-bg-primary border border-border-subtle text-text-primary hover:border-red-400">隐藏</button>
                <button onClick={() => doBulkHide(false)} className="px-2 py-1 text-xs rounded bg-bg-primary border border-border-subtle text-text-primary hover:border-green-400">取消隐藏</button>
                <button onClick={clearBatch} className="px-2 py-1 text-xs rounded text-text-secondary hover:text-text-primary ml-auto">取消</button>
                {batchError && <span className="text-xs text-red-400">{batchError}</span>}
              </div>
            )}

            {/* Row 2: Search */}
            <div className="flex gap-2">
              <SearchBar value={search} onChange={setSearch} />
            </div>

            {/* Row 3: Group tabs (only on dashboard) */}
            {activeTab === 'dashboard' && groups.length > 0 && (
              <div className="flex gap-2 flex-wrap items-center overflow-x-auto pb-1">
                <button onClick={() => setActiveGroup(null)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${activeGroup === null ? 'bg-accent text-white' : 'bg-bg-card border border-border-subtle text-text-secondary hover:text-text-primary'}`}>
                  全部
                </button>
                {groupOrder.map(g => {
                  const s = groupStats[g.name] || { total: 0, running: 0, hidden: 0 };
                  return (
                    <button key={g.id} onClick={() => setActiveGroup(g.name)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${activeGroup === g.name ? 'bg-accent text-white' : 'bg-bg-card border border-border-subtle text-text-secondary hover:text-text-primary'}`}>
                      <span className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle" style={{ backgroundColor: g.color }} />{g.name}
                      <span className="ml-1 opacity-60">{s.total}</span>
                      <span className="ml-1 text-green-500">●{s.running}</span>
                      <span className="ml-1 text-orange-400">▽{s.hidden}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </header>

        {/* Content area */}
        <main className="px-4 py-4">
          {/* ---- Dashboard tab: container grid ---- */}
          {activeTab === 'dashboard' && (
            <>
              {(!activeGroup || activeGroup in grouped.grouped) && groupOrder.map(g => (
                <GroupSection key={g.id} group={g} containers={grouped.grouped[g.name] || []} onUpdate={refresh}
                  stats={groupStats[g.name]}
                  selectionMode={batchMode} selectedIds={selected} onSelectToggle={toggleSelect}
                  editMode={editMode} onDropInGroup={handleDropInGroup} onDropBeforeCard={handleDropBeforeCard} />
              ))}
              {(!activeGroup || activeGroup === 'ungrouped') && (
                <GroupSection group={null} containers={grouped.ungrouped} onUpdate={refresh}
                  stats={groupStats['__ungrouped__']}
                  selectionMode={batchMode} selectedIds={selected} onSelectToggle={toggleSelect}
                  editMode={editMode} onDropInGroup={handleDropInGroup} onDropBeforeCard={handleDropBeforeCard} />
              )}
              {filtered.length === 0 && !editMode && (
                <div className="text-center py-12 text-text-secondary text-sm">没有找到匹配的容器</div>
              )}
              {editMode && filtered.length === 0 && groups.length === 0 && (
                <div className="text-center py-12 text-text-secondary text-sm">暂无可拖拽的容器</div>
              )}
            </>
          )}

          {/* ---- Groups tab: group manager ---- */}
          {activeTab === 'groups' && (
            <GroupManager onClose={() => setActiveTab('dashboard')} onRefresh={refresh} initialGroups={groups} />
          )}

          {/* ---- Hidden tab: hidden containers list ---- */}
          {activeTab === 'hidden' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-text-primary">隐藏的容器 ({hiddenContainers.length})</h2>
                {hiddenContainers.length > 0 && (
                  <button onClick={async () => { const ids = hiddenContainers.map(c => c.id); await api.bulkHide(ids, false); refresh(); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent text-white hover:bg-accent-hover transition-colors">
                    全部取消隐藏
                  </button>
                )}
              </div>
              {hiddenContainers.length === 0 ? (
                <div className="text-center py-12 text-text-secondary text-sm">没有隐藏的容器</div>
              ) : (
                <div className="space-y-2">
                  {hiddenContainers.map(c => (
                    <div key={c.id} className="flex items-center gap-3 bg-bg-card border border-border-subtle rounded-lg p-3 opacity-70 hover:opacity-100 transition-opacity">
                      <div className="text-lg">{c.icon || '📦'}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-text-primary truncate">{c.alias || c.name}</div>
                        <div className="text-xs text-text-secondary truncate">{c.image}</div>
                      </div>
                      <span className={`w-2 h-2 rounded-full ${c.state === 'running' ? 'bg-green-500' : c.state === 'exited' ? 'bg-red-500' : 'bg-gray-500'}`} />
                      <button onClick={() => doUnhide(c.id)}
                        className="px-3 py-1 rounded-lg text-xs font-medium border border-border-subtle text-text-secondary hover:text-green-400 hover:border-green-400 transition-colors">
                        取消隐藏
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ---- Images tab: placeholder ---- */}
          {activeTab === 'images' && (
            <div>
              <h2 className="text-base font-bold text-text-primary mb-4">镜像 ({stats?.total_images || 0})</h2>
              <div className="text-center py-12 text-text-secondary text-sm">镜像列表功能开发中</div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
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
