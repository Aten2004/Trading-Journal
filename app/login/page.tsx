'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success) {
        login(data.user);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    // ✅ เพิ่ม px-4 เพื่อกันขอบจอในมือถือ
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white px-4">
      {/* ✅ ปรับ p-6 (เล็กลงในมือถือ) และ max-w-sm (ไม่กว้างเกินไป) */}
      <div className="bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg w-full max-w-sm sm:max-w-md border border-gray-700">
        <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center text-blue-400">เข้าสู่ระบบ</h2>
        
        {error && (
          <div className="bg-red-500/20 text-red-300 p-3 rounded mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-gray-400">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none text-sm transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none text-sm transition-colors"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-sm transition-all disabled:opacity-50 mt-2"
          >
            {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs sm:text-sm text-gray-400">
          ยังไม่มีบัญชี?{' '}
          <Link href="/register" className="text-blue-400 hover:text-blue-300 hover:underline font-medium">
            สมัครสมาชิก
          </Link>
        </p>
      </div>
    </div>
  );
}