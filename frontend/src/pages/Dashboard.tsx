import { useState, useMemo } from 'react';
import { useContainers } from '../hooks/useContainers';
import LogoutButton from '../components/LogoutButton';
import StatsBar from '../components/StatsBar';
import SearchBar from '../components/SearchBar';
import GroupTabs from '../components/GroupTabs';
import GroupSection from '../components/GroupSection';
import GroupManager from '../components/GroupManager';
import ContainerCard from '../components/ContainerCard';

export default function Dashboard() {
  const { containers, stats, groups, loading, refresh } = useContainers();
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [showGroupManager, setShowGroupManager] = useState(false);

  // Filter containers
  const filtered = useMemo(() => {
    let result = containers;

    // Group filter
    if (activeGroup !== null) {
      result = result.filter(c => c.group_name === activeGroup);
    }

    // Search filter
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

  // Group containers
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
  }, [filtered, groups]);

  // Get group info objects for each active group
  const groupOrder = useMemo(() => {
    const ordering = groups.filter(g => grouped.grouped[g.name]);
    return ordering;
  }, [groups, grouped]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-text-secondary text-lg animate-pulse">
          🦐 正在连接 Docker...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-bg-primary/95 backdrop-blur border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🦐</span>
            <h1 className="text-lg font-bold text-text-primary hidden sm:block">DockerInfoManager</h1>
          </div>
          <div className="flex items-center gap-4">
            <StatsBar stats={stats} />
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
        {/* Search + Group tabs */}
        <div className="mb-5 space-y-3">
          <SearchBar value={search} onChange={setSearch} />
          <GroupTabs
            groups={groups}
            activeGroup={activeGroup}
            onSelect={setActiveGroup}
            onManage={() => setShowGroupManager(true)}
          />
        </div>

        {/* Container grid by groups */}
        {filtered.length === 0 ? (
          <div className="text-center text-text-secondary py-20">
            <div className="text-5xl mb-4">🐳</div>
            <p className="text-lg">没有找到匹配的容器</p>
            <p className="text-sm mt-1">
              {containers.length === 0
                ? '当前宿主机上没有运行任何容器'
                : '请尝试调整搜索条件或分组筛选'}
            </p>
          </div>
        ) : (
          <>
            {/* Grouped containers */}
            {groupOrder.map(g => (
              <GroupSection
                key={g.id}
                group={g}
                containers={grouped.grouped[g.name]}
                onUpdate={refresh}
              />
            ))}

            {/* Ungrouped containers */}
            {grouped.ungrouped.length > 0 && (
              <GroupSection
                group={null}
                containers={grouped.ungrouped}
                onUpdate={refresh}
              />
            )}
          </>
        )}
      </main>

      {/* Group Manager Modal */}
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
