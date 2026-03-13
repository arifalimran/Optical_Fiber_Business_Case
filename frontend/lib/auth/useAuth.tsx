'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'ANALYST' | 'APPROVER' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Fetch current user on mount (skip if on login page)
  useEffect(() => {
    if (pathname !== '/login') {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [pathname]);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        // 401 is expected when not logged in - don't log as error
        setUser(null);
      }
    } catch (error) {
      // Only log unexpected errors
      if (error instanceof Error && !error.message.includes('401')) {
        console.error('Failed to fetch user:', error);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Pass full error data including hint and field
        throw new Error(JSON.stringify({
          error: data.error || 'Login failed',
          hint: data.hint || '',
          field: data.field || ''
        }));
      }

      setUser(data.user);
      
      // Show success message and redirect
      if (typeof window !== 'undefined') {
        const { toast } = await import('sonner');
        toast.success(`Welcome back, ${data.user.fullName}!`, {
          description: `Logged in as ${data.user.role}`,
          duration: 2000,
        });
      }
      
      // Immediate redirect with slight delay for toast
      await new Promise(resolve => setTimeout(resolve, 300));
      window.location.href = '/';
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
