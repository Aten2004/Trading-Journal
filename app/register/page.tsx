'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return;
    }

    if (password.length < 4) {
      setError('รหัสผ่านควรมีความยาวอย่างน้อย 4 ตัวอักษร');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success) {
        alert('สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ');
        router.push('/login');
      } else {
        setError(data.error || 'การสมัครสมาชิกบัญชีล้มเหลว');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  return (
    // ✅ เพิ่ม px-4
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white px-4">
      {/* ✅ ปรับ p-6 และ max-w-sm */}
      <div className="bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg w-full max-w-sm sm:max-w-md border border-gray-700">
        <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center text-green-400">สมัครสมาชิก</h2>
        
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
              className="w-full p-2.5 rounded-lg bg-gray-700 border border-gray-600 focus:border-green-500 focus:outline-none text-sm transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-gray-700 border border-gray-600 focus:border-green-500 focus:outline-none text-sm transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-400">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-gray-700 border border-gray-600 focus:border-green-500 focus:outline-none text-sm transition-colors"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-sm transition-all disabled:opacity-50 mt-2"
          >
            {loading ? 'กำลังบันทึก...' : 'ยืนยันการสมัคร'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs sm:text-sm text-gray-400">
          มีบัญชีอยู่แล้ว?{' '}
          <Link href="/login" className="text-green-400 hover:text-green-300 hover:underline font-medium">
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </div>
  );
}