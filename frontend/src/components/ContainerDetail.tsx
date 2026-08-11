import { useState, useEffect } from 'react';
import * as api from '../utils/api';
import CustomEditor from './CustomEditor';

interface Props {
  containerId: string;
  onClose: () => void;
  onUpdate: () => void;
}

interface DetailData {
  id: string;
  name: string;
  image: string;
  image_id: string;
  state: string;
  status: string;
  created_at: string | null;
  started_at: string | null;
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

  // 锁住 body 滚动，只让弹窗内容滚动
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    api.getContainerDetail(containerId).then(d => {
      setDetail(d);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [containerId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <div className="relative text-text-secondary">加载中...</div>
      </div>
    );
  }

  if (!detail) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <div className="relative bg-bg-card border border-border-subtle rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-text-primary truncate">{detail.name}</h2>
            <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-xl">✕</button>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <InfoRow label="状态" value={`${detail.state} (${detail.status})`} />
            <InfoRow label="镜像" value={detail.image} mono />
            <InfoRow label="容器 ID" value={detail.id.slice(0, 12)} mono />
            {detail.created_at && <InfoRow label="创建时间" value={detail.created_at} />}
            {detail.started_at && <InfoRow label="启动时间" value={detail.started_at} />}
          </div>

          {/* Ports */}
          {detail.ports.length > 0 && (
            <Section title="端口映射">
              {detail.ports.map((p, i) => (
                <div key={i} className="text-sm text-text-primary font-mono">
                  {p.host_ip}:{p.host_port} → :{p.container_port}/{p.protocol}
                </div>
              ))}
            </Section>
          )}

          {/* Networks */}
          {detail.networks.length > 0 && (
            <Section title="网络">
              {detail.networks.map((n, i) => (
                <div key={i} className="text-sm text-text-primary">
                  {n.name}: <span className="font-mono">{n.ip_address || '—'}</span>
                </div>
              ))}
            </Section>
          )}

          {/* Mounts */}
          {detail.mounts.length > 0 && (
            <Section title="挂载">
              {detail.mounts.map((m, i) => (
                <div key={i} className="text-xs text-text-primary font-mono break-all">
                  {m.source} → {m.destination} ({m.mode})
                </div>
              ))}
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

          {/* Footer */}
          <div className="sticky bottom-0 -mx-6 -mb-6 bg-bg-card border-t border-border-subtle p-4 flex gap-3">
            <button
              onClick={() => setShowEditor(true)}
              className="flex-1 py-2 bg-accent hover:bg-accent-hover text-white font-medium rounded-lg transition-colors text-sm"
            >
              编辑自定义信息
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-border-subtle text-text-secondary hover:text-text-primary rounded-lg transition-colors text-sm"
            >
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
            // refresh detail
            api.getContainerDetail(containerId).then(setDetail);
          }}
        />
      )}
    </>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span className="text-xs text-text-secondary">{label}</span>
      <p className={`mt-0.5 text-sm text-text-primary ${mono ? 'font-mono text-xs' : ''} break-all`}>
        {value}
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-xs font-semibold text-text-secondary uppercase mb-2">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
