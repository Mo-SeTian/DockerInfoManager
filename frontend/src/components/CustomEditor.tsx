import { useState } from 'react';
import type { ContainerData } from '../hooks/useContainers';
import * as api from '../utils/api';

interface Props {
  container: ContainerData;
  onClose: () => void;
}

const ICONS = ['📦', '🐳', '🗄️', '🌐', '⚙️', '🔐', '📊', '🟢', '🐘', '🍃', '🦐', '🚀', '💾', '📧', '🔍'];

export default function CustomEditor({ container, onClose }: Props) {
  const [alias, setAlias] = useState(container.alias || '');
  const [icon, setIcon] = useState(container.icon || '');
  const [notes, setNotes] = useState(container.notes || '');
  const [groupName, setGroupName] = useState(container.group_name || '');
  const [jumpProtocol, setJumpProtocol] = useState(container.jump_protocol || 'http');
  const [jumpPort, setJumpPort] = useState(container.jump_port?.toString() || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await api.updateContainerCustom(container.id, {
        alias: alias || null,
        icon: icon || null,
        notes: notes || null,
        group_name: groupName || null,
        jump_protocol: jumpProtocol,
        jump_port: jumpPort ? parseInt(jumpPort) : null,
      });
      onClose();
    } catch (e: any) {
      setError(e.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-bg-card border border-border-subtle rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-text-primary mb-5">自定义设置</h3>

        {/* Alias */}
        <div className="mb-4">
          <label className="block text-xs text-text-secondary mb-1.5">自定义名称</label>
          <input
            type="text"
            value={alias}
            onChange={e => setAlias(e.target.value)}
            placeholder={container.name}
            className="w-full px-3 py-2 bg-bg-primary border border-border-subtle rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent"
          />
        </div>

        {/* Icon */}
        <div className="mb-4">
          <label className="block text-xs text-text-secondary mb-1.5">图标</label>
          <div className="flex flex-wrap gap-2">
            {ICONS.map(ico => (
              <button
                key={ico}
                onClick={() => setIcon(icon === ico ? '' : ico)}
                className={`w-9 h-9 flex items-center justify-center rounded-lg border text-lg transition-all ${
                  icon === ico
                    ? 'border-accent bg-accent/20'
                    : 'border-border-subtle hover:border-accent/50'
                }`}
              >
                {ico}
              </button>
            ))}
          </div>
        </div>

        {/* Group */}
        <div className="mb-4">
          <label className="block text-xs text-text-secondary mb-1.5">分组</label>
          <input
            type="text"
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            placeholder="如：生产环境、数据库"
            className="w-full px-3 py-2 bg-bg-primary border border-border-subtle rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent"
          />
        </div>

        {/* Jump settings */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-text-secondary mb-1.5">跳转协议</label>
            <select
              value={jumpProtocol}
              onChange={e => setJumpProtocol(e.target.value)}
              className="w-full px-3 py-2 bg-bg-primary border border-border-subtle rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent"
            >
              <option value="http">http://</option>
              <option value="https">https://</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1.5">跳转端口</label>
            <input
              type="number"
              value={jumpPort}
              onChange={e => setJumpPort(e.target.value)}
              placeholder="自动"
              className="w-full px-3 py-2 bg-bg-primary border border-border-subtle rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="mb-5">
          <label className="block text-xs text-text-secondary mb-1.5">备注</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="记录容器用途、负责人等..."
            className="w-full px-3 py-2 bg-bg-primary border border-border-subtle rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent resize-none"
          />
        </div>

        {error && (
          <div className="mb-4 p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-50 text-bg-primary font-medium rounded-lg transition-colors text-sm"
          >
            {saving ? '保存中...' : '保存'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-border-subtle hover:border-text-secondary text-text-secondary rounded-lg transition-colors text-sm"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
