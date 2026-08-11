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

  const reload = async () => {
    const data = await api.getGroups();
    setGroups(data);
    onRefresh();
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await api.createGroup(newName.trim(), newColor);
      setNewName('');
      await reload();
    } catch (e: any) { alert(e.message); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('删除分组后，容器将变为「未分组」。确定删除？')) return;
    await api.deleteGroup(id);
    await reload();
  };

  const handleRename = async (id: number) => {
    if (!editName.trim()) return;
    await api.updateGroup(id, { name: editName.trim() });
    setEditingId(null);
    await reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-bg-card border border-border-subtle rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-text-primary">管理分组</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-xl">✕</button>
        </div>

        {/* Create new */}
        <div className="mb-5">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="新分组名称"
            className="w-full px-3 py-2 mb-2 bg-bg-primary border border-border-subtle rounded-lg text-text-primary text-sm"
          />
          <div className="flex flex-wrap gap-2 mb-3">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                className={`w-7 h-7 rounded-full ${newColor === c ? 'ring-2 ring-offset-2 ring-offset-bg-card ring-white' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <button
            onClick={handleCreate}
            className="w-full py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium"
          >
            创建分组
          </button>
        </div>

        {/* Existing groups */}
        <div className="space-y-2">
          {groups.map(g => (
            <div key={g.id} className="flex items-center gap-2 p-2 bg-bg-primary rounded-lg">
              <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: g.color }} />
              {editingId === g.id ? (
                <>
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="flex-1 px-2 py-1 bg-bg-card border border-border-subtle rounded text-text-primary text-sm"
                    autoFocus
                  />
                  <button onClick={() => handleRename(g.id)} className="text-xs text-accent">保存</button>
                  <button onClick={() => setEditingId(null)} className="text-xs text-text-secondary">取消</button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-text-primary truncate">{g.name}</span>
                  <span className="text-xs text-text-secondary">{g.container_count}</span>
                  <button
                    onClick={() => { setEditingId(g.id); setEditName(g.name); }}
                    className="text-xs text-text-secondary hover:text-accent"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(g.id)}
                    className="text-xs text-text-secondary hover:text-red-400"
                  >
                    删除
                  </button>
                </>
              )}
            </div>
          ))}
          {groups.length === 0 && (
            <p className="text-center text-sm text-text-secondary py-4">还没有分组，创建一个吧</p>
          )}
        </div>
      </div>
    </div>
  );
}
