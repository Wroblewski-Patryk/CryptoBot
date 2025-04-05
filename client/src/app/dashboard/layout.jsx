'use client';
import "../../styles/dashboard.css";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/src/store/authStore';

import Sidebar from "./sidebar";

export default function Layout({ children }) {
  const token = useAuthStore((state) => state.token);
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  useEffect(() => {
    restoreSession();
  }, []);

  useEffect(() => {
    if (!token) {
      router.replace('/'); 
    }
  }, [token, router]);

  if (!token) return null;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* 🔝 Header – full width */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-emerald-700 bg-emerald-900">
        <div className="flex items-center space-x-4">
          <a href="/" className="flex items-center space-x-2 text-white font-bold text-xl">
            <img src="/logo.png" alt="Logo" className="h-8 w-8" />
            <span>SparrowX</span>
          </a>
          
        </div>
        <div className="flex items-center space-x-4">
          <nav className="hidden md:flex space-x-4 ml-8">
              <a href="/dashboard" className="hover:underline">Dashboard</a>
              <a href="/backtester" className="hover:underline">Backtester</a>
          </nav>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative group">
            <div className="flex items-center space-x-2 bg-emerald-800 hover:bg-emerald-700 px-3 py-1 rounded cursor-pointer">
              <span>My Account</span>
              <img src="/avatar.png" className="h-8 w-8 rounded-full" alt="Profile avatar" />
            </div>

            {/* ▼ Dropdown menu */}
            <div className="absolute right-0 mt-0 w-40 bg-white text-black rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-200 z-50">
              <a href="/dashboard/profile" className="block px-4 py-2 hover:bg-gray-100">Profil</a>
              <a href="/dashboard/settings" className="block px-4 py-2 hover:bg-gray-100">Ustawienia</a>
              <button 
                onClick={() => {
                  logout();
                  router.push('/');
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
              >
                Wyloguj się
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 🔲 Main + Sidebar */}
      <div className="flex flex-1">
        {/* 🧱 Główna treść 3/4 */}
        <main className="w-full md:w-3/4 p-6 overflow-y-auto">
          <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
          <hr className="border-emerald-700 mb-6" />
          {children}
        </main>

        {/* 📋 Sidebar 1/4 */}
        <aside className="hidden md:block w-1/4 p-6 border-l border-emerald-700 overflow-y-auto">
          <Sidebar />
        </aside>
      </div>
    </div>
  );
}
