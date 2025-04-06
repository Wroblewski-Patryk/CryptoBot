'use client';
import { useEffect } from 'react';
import { useRouter, usePathname, redirect } from 'next/navigation';
import { login } from '../services/auth.service';
import { useAuthStore } from '../store/authStore';
import LoginForm from './auth/login/loginForm';

export default function Page() {
  const setToken = useAuthStore((state) => state.setToken);
  const token = useAuthStore((state) => state.token);
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    restoreSession();
  }, []);
  
  useEffect(() => {
    if (!token && pathname !== '/') {
      redirect ('/');
    } else if (token && pathname === '/') {
      redirect ('/dashboard');
    }
  }, [token, pathname, redirect ]);

  const handleLogin = async (form) => {
    try {
      const data = await login(form);
      const newToken = data.token;
      setToken(newToken);
    } catch (err) {
      alert('Błąd logowania: ' + err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-900 text-white">
      <img src="/logo.png" alt="Logo" className="w-32 mb-4" />
      <h1>Hello human!</h1>
      <p>Welcome to the SparrowX crypto bot!</p>
      <LoginForm onLogin={handleLogin} />
      <p>To get started, please log in.</p>
    </div>
  );
}