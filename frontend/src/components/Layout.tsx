'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Settings, Home, FolderOpen } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();

  if (!user) {
    return <div>{children}</div>;
  }

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-black text-white border-r border-white/10">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">CrudBox</h1>
              <p className="text-white/60 text-sm mt-1">{user.email}</p>
            </div>
          </div>
        </div>
        
        <nav className="mt-8 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center px-6 py-3 text-white/80 hover:bg-white/10 transition-colors"
          >
            <Home className="w-5 h-5 mr-3" strokeWidth={1.5} />
            Dashboard
          </Link>
          <Link
            href="/projects"
            className="flex items-center px-6 py-3 text-white/80 hover:bg-white/10 transition-colors"
          >
            <FolderOpen className="w-5 h-5 mr-3" strokeWidth={1.5} />
            Projects
          </Link>
          <Link
            href="/settings"
            className="flex items-center px-6 py-3 text-white/80 hover:bg-white/10 transition-colors"
          >
            <Settings className="w-5 h-5 mr-3" strokeWidth={1.5} />
            Settings
          </Link>
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/10">
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-2 text-white/80 hover:bg-white/10 rounded transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" strokeWidth={1.5} />
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="ml-64 bg-white min-h-screen">
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;