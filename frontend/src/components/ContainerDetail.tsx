import { useState, useEffect } from 'react';
import type { ContainerData } from '../hooks/useContainers';
import * as api from '../utils/api';
import CustomEditor from './CustomEditor';

interface Props {
  container: ContainerData;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ContainerDetail({ container, onClose, onUpdate }: Props) {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    api.getContainer(container.id)
      .then(d => { setDetail(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [container.id]);

  const icon = container.icon || '📦';
  const name = container.alias || container.name;
  const dotColor = container.state === 'running' ? 'bg-green-dot'
    : container.state === 'paused' ? 'bg-yellow-dot'
    : container.state === 'exited' ? 'bg-red-dot'
    : 'bg-gray-dot';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-bg-card border border-border-subtle rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-bg-card border-b border-border-subtle p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{icon}</span>
            <div>
              <h2 className="text-lg font-bold text-text-primary">{name}</h2>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                {container.state}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {loading ? (
            <div className="text-center text-text-secondary py-8">加载中...</div>
          ) : detail ? (
            <>
              {/* Image */}
              <InfoRow label="镜像" value={container.image} />
              <InfoRow label="镜像 ID" value={container.id} mono />

              {/* Ports */}
              {container.ports.length > 0 && (
                <div>
                  <span className="text-xs text-text-secondary">端口映射</span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {container.ports.map((p, i) => (
                      <span key={i} className="px-2 py-1 bg-bg-primary rounded-md text-xs text-text-primary border border-border-subtle">
                        {p.host_port ? `${p.host_port}→${p.container_port}/${p.protocol}` : `${p.container_port}/${p.protocol}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Networks */}
              {detail.networks?.length > 0 && (
                <div>
                  <span className="text-xs text-text-secondary">网络</span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {detail.networks.map((n: any, i: number) => (
                      <span key={i} className="px-2 py-1 bg-bg-primary rounded-md text-xs text-text-primary border border-border-subtle">
                        {n.name}{n.ip_address ? ` (${n.ip_address})` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Mounts */}
              {detail.mounts?.length > 0 && (
                <div>
                  <span className="text-xs text-text-secondary">挂载卷</span>
                  <div className="mt-1.5 space-y-1">
                    {detail.mounts.map((m: any, i: number) => (
                      <div key={i} className="px-2 py-1 bg-bg-primary rounded-md text-xs text-text-primary border border-border-subtle">
                        {m.source} → {m.destination} <span className="text-text-secondary">({m.mode})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resources */}
              {detail.cpu_usage !== null && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-bg-primary rounded-lg p-3 border border-border-subtle">
                    <span className="text-xs text-text-secondary">CPU</span>
                    <div className="text-lg font-bold text-accent">{detail.cpu_usage}%</div>
                  </div>
                  <div className="bg-bg-primary rounded-lg p-3 border border-border-subtle">
                    <span className="text-xs text-text-secondary">内存</span>
                    <div className="text-lg font-bold text-accent">
                      {detail.memory_usage != null ? `${(detail.memory_usage / 1024 / 1024).toFixed(0)} MB` : 'N/A'}
                    </div>
                  </div>
                </div>
              )}

              {/* Dates */}
              <InfoRow label="创建时间" value={container.created_at || 'N/A'} />
              <InfoRow label="启动时间" value={detail.started_at || 'N/A'} />

              {/* Notes */}
              {container.notes && (
                <div>
                  <span className="text-xs text-text-secondary">备注</span>
                  <p className="mt-1 text-sm text-text-primary bg-bg-primary rounded-lg p-3 border border-border-subtle">
                    {container.notes}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-text-secondary py-8">无法加载容器详情</div>
          )}
        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 bg-bg-card border-t border-border-subtle p-4 flex gap-3">
          <button
            onClick={() => setShowEditor(true)}
            className="flex-1 py-2 bg-accent hover:bg-accent-hover text-bg-primary font-medium rounded-lg transition-colors text-sm"
          >
            编辑自定义信息
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border-subtle hover:border-text-secondary text-text-secondary rounded-lg transition-colors text-sm"
          >
            关闭
          </button>
        </div>
      </div>

      {/* Custom Editor Modal */}
      {showEditor && (
        <CustomEditor
          container={container}
          onClose={() => { setShowEditor(false); onUpdate(); }}
        />
      )}
    </div>
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
