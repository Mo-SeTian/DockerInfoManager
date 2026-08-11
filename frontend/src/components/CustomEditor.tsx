import { useState } from 'react';
import * as api from '../utils/api';

interface Props {
  containerId: string;
  existing: Record<string, unknown>;
  onClose: () => void;
  onSaved: () => void;
}

const ICONS = ['📦', '🐳', '🗄️', '🌐', '⚙️', '🔐', '📊', '🟢', '🐘', '🍃', '🦐', '🚀', '💾', '📧', '🔍'];

export default function CustomEditor({ containerId, existing, onClose, onSaved }: Props) {
  const [alias, setAlias] = useState((existing.alias as string) || '');
  const [icon, setIcon] = useState((existing.icon as string) || '');
  const [iconUrl, setIconUrl] = useState((existing.icon_url as string) || '');
  const [notes, setNotes] = useState((existing.notes as string) || '');
  const [groupName, setGroupName] = useState((existing.group_name as string) || '');
  const [jumpProtocol, setJumpProtocol] = useState((existing.jump_protocol as string) || 'http');
  const [jumpPort, setJumpPort] = useState((existing.jump_port as number)?.toString() || '');
  const [privateUrl, setPrivateUrl] = useState((existing.private_url as string) || '');
  const [publicUrl, setPublicUrl] = useState((existing.public_url as string) || '');
  const [urlPref, setUrlPref] = useState((existing.url_preference as string) || 'auto');
  const [mergeUrl, setMergeUrl] = useState((existing.merge_url as string) || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [iconMode, setIconMode] = useState<'emoji' | 'url'>(iconUrl ? 'url' : 'emoji');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await api.updateContainerCustom(containerId, {
        alias: alias || null,
        icon: iconMode === 'emoji' ? (icon || null) : null,
        icon_url: iconMode === 'url' ? (iconUrl || null) : null,
        notes: notes || null,
        group_name: groupName || null,
        jump_protocol: jumpProtocol,
        jump_port: jumpPort ? parseInt(jumpPort) : null,
        private_url: privateUrl || null,
        public_url: publicUrl || null,
        url_preference: urlPref,
        merge_url: mergeUrl || null,
      });
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-bg-card border border-border-subtle rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-text-primary mb-5">自定义设置</h3>

        {/* Alias */}
        <Field label="自定义别名">
          <input value={alias} onChange={e => setAlias(e.target.value)}
            className="w-full px-3 py-2 bg-bg-primary border border-border-subtle rounded-lg text-text-primary text-sm" />
        </Field>

        {/* Icon mode toggle */}
        <Field label="图标">
          <div className="flex gap-2 mb-2">
            <button onClick={() => setIconMode('emoji')} className={`px-3 py-1 text-xs rounded-lg ${iconMode === 'emoji' ? 'bg-accent text-white' : 'border border-border-subtle text-text-secondary'}`}>Emoji</button>
            <button onClick={() => setIconMode('url')} className={`px-3 py-1 text-xs rounded-lg ${iconMode === 'url' ? 'bg-accent text-white' : 'border border-border-subtle text-text-secondary'}`}>图片 URL</button>
          </div>
          {iconMode === 'emoji' ? (
            <div className="grid grid-cols-8 gap-1.5">
              {ICONS.map(ic => (
                <button key={ic} onClick={() => setIcon(ic)}
                  className={`text-xl p-1.5 rounded-lg ${icon === ic ? 'bg-accent/20 ring-1 ring-accent' : 'hover:bg-bg-card-hover'}`}>
                  {ic}
                </button>
              ))}
            </div>
          ) : (
            <div>
              <input value={iconUrl} onChange={e => setIconUrl(e.target.value)} placeholder="https://example.com/icon.png"
                className="w-full px-3 py-2 bg-bg-primary border border-border-subtle rounded-lg text-text-primary text-sm" />
              {iconUrl && <img src={iconUrl} alt="preview" className="w-10 h-10 mt-2 rounded-lg object-cover"
                onError={(e) => (e.target as HTMLImageElement).style.opacity = '0.3'} />}
            </div>
          )}
        </Field>

        {/* Group */}
        <Field label="分组">
          <input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="留空=未分组"
            className="w-full px-3 py-2 bg-bg-primary border border-border-subtle rounded-lg text-text-primary text-sm" />
        </Field>

        {/* Notes */}
        <Field label="备注">
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            className="w-full px-3 py-2 bg-bg-primary border border-border-subtle rounded-lg text-text-primary text-sm resize-none" />
        </Field>

        {/* Jump URLs */}
        <Field label="跳转 URL">
          <div className="space-y-2">
            <div>
              <label className="text-xs text-text-secondary">内网 URL</label>
              <input value={privateUrl} onChange={e => setPrivateUrl(e.target.value)} placeholder="http://192.168.1.100:8080"
                className="w-full px-3 py-2 bg-bg-primary border border-border-subtle rounded-lg text-text-primary text-sm" />
            </div>
            <div>
              <label className="text-xs text-text-secondary">公网 URL</label>
              <input value={publicUrl} onChange={e => setPublicUrl(e.target.value)} placeholder="https://example.com"
                className="w-full px-3 py-2 bg-bg-primary border border-border-subtle rounded-lg text-text-primary text-sm" />
            </div>
            <div>
              <label className="text-xs text-text-secondary">URL 选择策略</label>
              <select value={urlPref} onChange={e => setUrlPref(e.target.value)}
                className="w-full px-3 py-2 bg-bg-primary border border-border-subtle rounded-lg text-text-primary text-sm">
                <option value="auto">自动（优先内网，不可用则公网）</option>
                <option value="private">始终用内网</option>
                <option value="public">始终用公网</option>
              </select>
            </div>
          </div>
        </Field>

        {/* Compose 合并跳转 */}
        <Field label="Compose 合并跳转 URL">
          <input value={mergeUrl} onChange={e => setMergeUrl(e.target.value)}
            placeholder="https://your-app.com"
            className="w-full px-3 py-2 bg-bg-primary border border-border-subtle rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent" />
          <p className="text-xs text-text-secondary mt-1">
            设置后，Compose 项目组的「跳转」按钮将使用此地址
          </p>
        </Field>

        {/* Legacy jump config */}
        <Field label="备用跳转（端口模式）">
          <div className="flex gap-2">
            <select value={jumpProtocol} onChange={e => setJumpProtocol(e.target.value)}
              className="px-2 py-2 bg-bg-primary border border-border-subtle rounded-lg text-text-primary text-sm">
              <option value="http">http</option>
              <option value="https">https</option>
            </select>
            <input value={jumpPort} onChange={e => setJumpPort(e.target.value)} placeholder="端口"
              className="w-20 px-3 py-2 bg-bg-primary border border-border-subtle rounded-lg text-text-primary text-sm" />
          </div>
        </Field>

        {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

        {/* Actions */}
        <div className="flex gap-3 mt-5">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2 bg-accent hover:bg-accent-hover text-white font-medium rounded-lg transition-colors text-sm disabled:opacity-50">
            {saving ? '保存中...' : '保存'}
          </button>
          <button onClick={onClose}
            className="px-4 py-2 border border-border-subtle text-text-secondary hover:text-text-primary rounded-lg transition-colors text-sm">
            取消
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-xs text-text-secondary mb-1.5">{label}</label>
      {children}
    </div>
  );
}
