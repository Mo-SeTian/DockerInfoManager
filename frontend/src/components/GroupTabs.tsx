import type { GroupData } from '../hooks/useContainers';

interface Props {
  groups: GroupData[];
  activeGroup: string | null;
  onSelect: (name: string | null) => void;
  onManage: () => void;
}

export default function GroupTabs({ groups, activeGroup, onSelect, onManage }: Props) {
  return (
    <div className="flex gap-2 flex-wrap items-center">
      <button
        onClick={() => onSelect(null)}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          activeGroup === null
            ? 'bg-accent text-bg-primary'
            : 'bg-bg-card border border-border-subtle text-text-secondary hover:text-text-primary'
        }`}
      >
        全部
      </button>
      {groups.map(g => (
        <button
          key={g.id}
          onClick={() => onSelect(g.name)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeGroup === g.name
              ? 'bg-accent text-bg-primary'
              : 'bg-bg-card border border-border-subtle text-text-secondary hover:text-text-primary'
          }`}
          style={activeGroup === g.name ? {} : { borderColor: g.color + '40' }}
        >
          <span className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle"
            style={{ backgroundColor: g.color }}
          />
          {g.name}
          <span className="ml-1.5 text-xs opacity-60">{g.container_count}</span>
        </button>
      ))}
      <button
        onClick={onManage}
        className="px-3 py-1.5 rounded-lg text-sm text-text-secondary border border-dashed border-border-subtle hover:border-accent hover:text-accent transition-colors"
      >
        ⚙️ 管理分组
      </button>
    </div>
  );
}
