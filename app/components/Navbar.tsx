'use client';

import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
              Trading Journal
            </h1>
          </div>

          {/* Navigation Buttons */}
          <div className="flex space-x-2">
            <a
              href="/"
              className={`px-3 sm:px-4 md:px-6 py-2 md:py-2.5 rounded-lg transition-all duration-200 font-medium flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base ${
                pathname === '/'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                  : 'bg-slate-700 hover:bg-slate-600 text-white'
              }`}
            >
              <span className="text-base sm:text-lg">➕</span>
              <span className="hidden sm:inline">บันทึกเทรด</span>
              <span className="sm:hidden">บันทึก</span>
            </a>
            <a
              href="/dashboard"
              className={`px-3 sm:px-4 md:px-6 py-2 md:py-2.5 rounded-lg transition-all duration-200 font-medium flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base ${
                pathname === '/dashboard'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                  : 'bg-slate-700 hover:bg-slate-600 text-white'
              }`}
            >
              <span className="text-base sm:text-lg">📊</span>
              <span>Dashboard</span>
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
