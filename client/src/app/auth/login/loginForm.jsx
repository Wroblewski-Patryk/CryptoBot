'use client';
import { useState } from 'react';

export default function AuthForm({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(form);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4 max-w-sm mx-auto">
      <input
        type="text"
        placeholder="Username"
        value={form.username}
        onChange={(e) => setForm({ ...form, username: e.target.value })}
        className="border rounded p-2"
      /> 
      <input
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        className="border rounded p-2"
      />
      <button type="submit" className="bg-black text-white p-2 rounded">Zaloguj się</button>
    </form>
  );
}