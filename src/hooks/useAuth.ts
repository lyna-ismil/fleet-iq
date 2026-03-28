import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<LoginResponse> => {
      const { data } = await api.post('/auth/admin/login', credentials);
      return data;
    },
    onSuccess: (data) => {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('adminRole', data.role);
      queryClient.invalidateQueries({ queryKey: ['adminUser'] });
      navigate('/dashboard');
    },
  });

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('adminRole');
    queryClient.removeQueries();
    navigate('/login');
  }, [navigate, queryClient]);

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

  const { data: user } = useQuery({
    queryKey: ['adminUser', adminId],
    queryFn: async () => {
      if (!adminId) return null;
      const { data } = await api.get(`/admins/${adminId}`);
      // Mapping name to fullName to match usage
      return { ...data, fullName: data.name };
    },
    enabled: !!adminId,
    staleTime: 1000 * 60 * 5,
  });

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
    user,
    setUser: (updatedFields: any) => {
      queryClient.setQueryData(['adminUser', adminId], (oldData: any) => ({
        ...oldData,
        ...updatedFields,
      }));
    }
  };
}
