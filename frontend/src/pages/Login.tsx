import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { doLogin, error } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await doLogin(username, password);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🦐</div>
          <h1 className="text-2xl font-bold text-text-primary">DockerInfoManager</h1>
        </div>
        <form onSubmit={handleSubmit} className="bg-bg-card border border-border-subtle rounded-2xl p-6 shadow-2xl">
          <div className="mb-4">
            <label className="block text-xs text-text-secondary mb-1.5">用户名</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-3 py-2.5 bg-bg-primary border border-border-subtle rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent"
              autoFocus
            />
          </div>
          <div className="mb-5">
            <label className="block text-xs text-text-secondary mb-1.5">密码</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 bg-bg-primary border border-border-subtle rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent"
            />
          </div>
          {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-accent hover:bg-accent-hover text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>
      </div>
    </div>
  );
}
