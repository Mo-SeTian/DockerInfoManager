import { useState, useEffect } from 'react';
import type { GroupData } from '../hooks/useContainers';
import * as api from '../utils/api';

interface Props {
  onClose: () => void;
  onRefresh: () => void;
  initialGroups: GroupData[];
}

const COLORS = ['#38bdf8', '#22c55e', '#eab308', '#ef4444', '#a855f7', '#ec4899', '#f97316', '#14b8a6'];

export default function GroupManager({ onClose, onRefresh, initialGroups }: Props) {
  const [groups, setGroups] = useState<GroupData[]>(initialGroups);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => { setGroups(initialGroups); }, [initialGroups]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await api.createGroup(newName.trim(), newColor);
      setNewName('');
      const data = await api.getGroups();
      setGroups(data);
      onRefresh();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('删除分组后，容器将变为「未分组」。确定删除？')) return;
    try {
      await api.deleteGroup(id);
      const data = await api.getGroups();
      setGroups(data);
      onRefresh();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRename = async (id: number) => {
    if (!editName.trim()) return;
    try {
      await api.updateGroup(id, { name: editName.trim() });
      setEditingId(null);
      const data = await api.getGroups();
      setGroups(data);
      onRefresh();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg-card border border-border-subtle rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-text-primary">管理分组</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Create new */}
        <div className="flex gap-2 mb-5">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="新分组名称"
            className="flex-1 px-3 py-2 bg-bg-primary border border-border-subtle rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent"
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />
          <div className="flex gap-1 items-center">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                className={`w-5 h-5 rounded-full border-2 transition-all ${newColor === c ? 'border-white scale-125' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <button
            onClick={handleCreate}
            className="px-3 py-2 bg-accent hover:bg-accent-hover text-bg-primary text-sm font-medium rounded-lg transition-colors"
          >
            创建
          </button>
        </div>

        {/* Group list */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {groups.map(g => (
            <div key={g.id} className="flex items-center gap-3 p-2.5 bg-bg-primary border border-border-subtle rounded-lg">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: g.color }} />
              {editingId === g.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="flex-1 px-2 py-1 bg-bg-card rounded text-sm text-text-primary focus:outline-none focus:border-accent border border-border-subtle"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleRename(g.id)}
                  onBlur={() => setEditingId(null)}
                />
              ) : (
                <span className="flex-1 text-sm text-text-primary">{g.name}</span>
              )}
              <span className="text-xs text-text-secondary">{g.container_count} 容器</span>
              <button
                onClick={() => { setEditingId(g.id); setEditName(g.name); }}
                className="text-xs text-text-secondary hover:text-accent transition-colors"
              >
                重命名
              </button>
              <button
                onClick={() => handleDelete(g.id)}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                删除
              </button>
            </div>
          ))}
          {groups.length === 0 && (
            <p className="text-center text-text-secondary text-sm py-6">暂无分组</p>
          )}
        </div>
      </div>
    </div>
  );
}
