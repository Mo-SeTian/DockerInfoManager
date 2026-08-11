import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { error, doLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await doLogin(username, password);
    if (ok) {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🦐</div>
          <h1 className="text-2xl font-bold text-text-primary">DockerInfoManager</h1>
          <p className="text-text-secondary mt-2 text-sm">Docker 容器管理面板</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-bg-card rounded-xl p-6 border border-border-subtle">
          <div className="mb-4">
            <label className="block text-sm text-text-secondary mb-1.5">用户名</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="请输入用户名"
              className="w-full px-3 py-2.5 bg-bg-primary border border-border-subtle rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent transition-colors"
              autoFocus
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm text-text-secondary mb-1.5">密码</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="请输入密码"
              className="w-full px-3 py-2.5 bg-bg-primary border border-border-subtle rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {error && (
            <div className="mb-4 p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-accent hover:bg-accent-hover text-bg-primary font-semibold rounded-lg transition-colors"
          >
            登 录
          </button>
        </form>
      </div>
    </div>
  );
}
