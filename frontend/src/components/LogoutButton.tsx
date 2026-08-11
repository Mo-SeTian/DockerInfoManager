import { getToken, removeToken } from '../utils/token';
import { useNavigate } from 'react-router-dom';

export default function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = () => {
    removeToken();
    navigate('/login', { replace: true });
  };

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-text-secondary hover:text-red-400 transition-colors flex items-center gap-1"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      登出
    </button>
  );
}
