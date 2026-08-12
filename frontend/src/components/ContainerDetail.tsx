import { useState, useEffect } from 'react';
import * as api from '../utils/api';
import CustomEditor from './CustomEditor';

interface Props {
  containerId: string;
  onClose: () => void;
  onUpdate: () => void;
}

interface DetailData {
  id: string; name: string; image: string; image_id: string;
  state: string; status: string;
  created_at: string | null; started_at: string | null;
  ports: { host_ip: string; host_port: number | null; container_port: number; protocol: string }[];
  networks: { name: string; ip_address: string | null }[];
  mounts: { source: string; destination: string; mode: string }[];
  env_vars: Record<string, string>;
  custom?: Record<string, unknown>;
}

export default function ContainerDetail({ containerId, onClose, onUpdate }: Props) {
  const [detail, setDetail] = useState<DetailData | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState<string[]>([]);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    api.getContainerDetail(containerId).then(d => {
      setDetail(d);
      if (d.custom?.tags) {
        try { setTags(JSON.parse(String(d.custom.tags))); } catch { setTags([]); }
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [containerId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <div className="relative text-text-secondary">...</div>
      </div>
    );
  }

  if (!detail) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <div className="relative bg-bg-card border border-border-subtle rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl">
          {/* Header — fixed */}
          <div className="flex items-center justify-between p-5 pb-2 flex-shrink-0">
            <h2 className="text-lg font-bold text-text-primary truncate">{detail.name}</h2>
            <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-xl flex-shrink-0">✕</button>
          </div>
          {/* Body — scrollable */}
          <div className="px-5 overflow-y-auto flex-1 min-h-0" style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <InfoRow label="状态" value={`${detail.state} (${detail.status})`} />
              <InfoRow label="镜像" value={detail.image} mono />
              <InfoRow label="容器 ID" value={detail.id.slice(0, 12)} mono />
              {detail.created_at && <InfoRow label="创建时间" value={detail.created_at} />}
              {detail.started_at && <InfoRow label="启动时间" value={detail.started_at} />}
            </div>

            {detail.ports.length > 0 && (
              <Section title="端口映射">
                {detail.ports.map((p, i) => (
                  <div key={i} className="text-sm text-text-primary font-mono">{p.host_ip}:{p.host_port} - {p.container_port}/{p.protocol}</div>
                ))}
              </Section>
            )}

            {detail.networks.length > 0 && (
              <Section title="网络">
                {detail.networks.map((n, i) => (
                  <div key={i} className="text-sm text-text-primary">{n.name}: <span className="font-mono">{n.ip_address || '-'}</span></div>
                ))}
              </Section>
            )}

            {detail.mounts.length > 0 && (
              <Section title="挂载">
                {detail.mounts.map((m, i) => (
                  <div key={i} className="text-xs text-text-primary font-mono break-all">{m.source} - {m.destination} ({m.mode})</div>
                ))}
              </Section>
            )}

            {/* Tags display */}
            {tags.length > 0 && (
              <Section title="标签">
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t, i) => (
                    <span key={i} className="inline-block px-2 py-0.5 rounded text-xs bg-sky-500/10 text-sky-400 border border-sky-500/20">{t}</span>
                  ))}
                </div>
              </Section>
            )}

            {/* Custom metadata */}
            {detail.custom && (
              <Section title="自定义信息">
                {!!detail.custom.alias && <div className="text-sm">别名: {String(detail.custom.alias)}</div>}
                {!!detail.custom.notes && <div className="text-sm">备注: {String(detail.custom.notes)}</div>}
                {!!detail.custom.private_url && <div className="text-sm break-all">内网: {String(detail.custom.private_url)}</div>}
                {!!detail.custom.public_url && <div className="text-sm break-all">公网: {String(detail.custom.public_url)}</div>}
              </Section>
            )}

            {/* Spacer so content doesn't hide behind footer */}
            <div className="pb-4" />
          </div>
          {/* Footer — sticky */}
          <div className="flex-shrink-0 border-t border-border-subtle p-4 flex gap-3">
            <button onClick={() => setShowEditor(true)}
              className="flex-1 py-2 bg-accent hover:bg-accent-hover text-white font-medium rounded-lg transition-colors text-sm">
              编辑自定义信息
            </button>
            <button onClick={onClose}
              className="px-4 py-2 border border-border-subtle text-text-secondary hover:text-text-primary rounded-lg transition-colors text-sm">
              关闭
            </button>
          </div>
        </div>
      </div>

      {showEditor && (
        <CustomEditor
          containerId={containerId}
          existing={detail.custom || {}}
          onClose={() => setShowEditor(false)}
          onSaved={() => {
            setShowEditor(false);
            onUpdate();
            api.getContainerDetail(containerId).then(d => {
              setDetail(d);
              if (d.custom?.tags) {
                try { setTags(JSON.parse(String(d.custom.tags))); } catch { setTags([]); }
              }
            });
          }}
        />
      )}
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <p className="text-xs text-text-secondary mb-1">{title}</p>
      {children}
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span className="text-xs text-text-secondary">{label}</span>
      <p className={`mt-0.5 text-sm text-text-primary ${mono ? 'font-mono text-xs' : ''} break-all`}>{value}</p>
    </div>
  );
}
