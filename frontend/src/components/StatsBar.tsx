import type { StatsData } from '../hooks/useContainers';

export default function StatsBar({ stats }: { stats: StatsData | null }) {
  if (!stats) return null;
  return (
    <div className="flex gap-4 flex-wrap">
      <StatBadge label="总数" value={stats.total_containers} />
      <StatBadge label="运行中" value={stats.running} color="text-green-500" />
      <StatBadge label="已停止" value={stats.stopped} color="text-red-500" />
    </div>
  );
}

function StatBadge({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className={`text-xl font-bold ${color || 'text-accent'}`}>{value}</span>
    </div>
  );
}
