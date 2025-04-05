import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  token: null,
  role: null,
  setToken: (token) => {
    set({ token });
    localStorage.setItem('token', token); // <- zapisujemy
  },
  setRole: (role) => {
    set({ role });
    localStorage.setItem('role', role);   // <- też możesz trzymać
  },
  logout: () => {
    set({ token: null, role: null });
    localStorage.removeItem('token');
    localStorage.removeItem('role');
  },
  restoreSession: () => {
    const storedToken = localStorage.getItem('token');
    const storedRole = localStorage.getItem('role');
    if (storedToken) set({ token: storedToken });
    if (storedRole) set({ role: storedRole });
  },
  isAuthenticated: () => !!get().token
}));