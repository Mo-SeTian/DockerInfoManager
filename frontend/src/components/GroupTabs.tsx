import type { GroupData } from '../hooks/useContainers';

interface Props {
  groups: GroupData[];
  activeGroup: string | null;
  onSelect: (name: string | null) => void;
  onManage: () => void;
  /** group name -> {running, hidden} counts from live container data */
  counts?: Record<string, { running: number; hidden: number }>;
}

export default function GroupTabs({ groups, activeGroup, onSelect, onManage, counts }: Props) {
  return (
    <div className="flex gap-2 flex-wrap items-center overflow-x-auto">
      <button
        onClick={() => onSelect(null)}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
          activeGroup === null
            ? 'bg-accent text-white'
            : 'bg-bg-card border border-border-subtle text-text-secondary hover:text-text-primary'
        }`}
      >
        全部
      </button>
      {groups.map(g => {
        const c = counts?.[g.name];
        return (
          <button
            key={g.id}
            onClick={() => onSelect(g.name)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeGroup === g.name
                ? 'bg-accent text-white'
                : 'bg-bg-card border border-border-subtle text-text-secondary hover:text-text-primary'
            }`}
            style={activeGroup === g.name ? {} : { borderColor: g.color + '40' }}
          >
            <span className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle"
              style={{ backgroundColor: g.color }}
            />
            {g.name}
            <span className="ml-1.5 text-xs opacity-70">{g.container_count}</span>
            {c && c.running > 0 && <span className="ml-1 text-[10px] text-green-500">●{c.running}</span>}
            {c && c.hidden > 0 && <span className="ml-1 text-[10px] text-orange-400">▽{c.hidden}</span>}
          </button>
        );
      })}
      <button
        onClick={onManage}
        className="px-3 py-1.5 rounded-lg text-sm text-text-secondary border border-dashed border-border-subtle hover:border-accent hover:text-accent transition-colors whitespace-nowrap"
      >
        ⚙️ 管理分组
      </button>
    </div>
  );
}
