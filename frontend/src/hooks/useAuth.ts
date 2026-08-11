import { useState, useCallback } from 'react';
import { getToken, setToken, removeToken } from '../utils/token';
import * as api from '../utils/api';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!getToken());
  const [error, setError] = useState('');

  const doLogin = useCallback(async (username: string, password: string) => {
    setError('');
    try {
      const res = await api.login(username, password);
      setToken(res.access_token);
      setIsAuthenticated(true);
      return true;
    } catch (e: any) {
      setError(e.message || '登录失败');
      return false;
    }
  }, []);

  const doLogout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // Ignore logout errors
    }
    removeToken();
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, error, doLogin, doLogout };
}
