import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useCallback, useMemo } from 'react';
import api from '@/lib/api';

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  role: string;
}

export function useAuth() {
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<LoginResponse> => {
      const { data } = await api.post('/auth/admin/login', credentials);
      return data;
    },
    onSuccess: (data) => {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('adminRole', data.role);
      navigate('/dashboard');
    },
  });

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('adminRole');
    navigate('/login');
  }, [navigate]);

  const isAuthenticated = useMemo(() => {
    return !!localStorage.getItem('accessToken');
  }, []);

  const role = useMemo(() => {
    return localStorage.getItem('adminRole') || '';
  }, []);

  const decodedToken = useMemo(() => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return null;
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded;
    } catch {
      return null;
    }
  }, []);

  const adminId = decodedToken?.id || decodedToken?.sub || '';
  const adminEmail = decodedToken?.email || '';

  return {
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    logout,
    isAuthenticated,
    role,
    adminId,
    adminEmail,
  };
}
