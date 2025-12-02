"use client"

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react'; // Optional icon

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  const menuItems = [
    { id: 'customers', label: 'Pelanggan', href: '/auth/dashboard/customers' },
    { id: 'membership', label: 'Membership', href: '/auth/dashboard/membership' },
    { id: 'products', label: 'Produk', href: '/auth/dashboard/products' },
    { id: 'reports', label: 'Laporan', href: '/auth/dashboard/reports' },
    { id: 'notifications', label: 'Notifikasi', href: '/auth/dashboard/promotions' },
  ];

  const handleLogout = async () => {
    try {
      // 1. Call the logout API to clear the cookie on the server
      await fetch('/api/auth/logout', { method: 'POST' });
      
      // 2. Force a hard navigation to the login page.
      // This bypasses the client-side router cache and ensures the 
      // middleware sees the request as a fresh, unauthenticated visitor.
      window.location.href = '/auth/login'; 
      
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#4a9b88]">
      {/* Top Navigation Tabs - White background */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8">
          {/* Changed to justify-between to push logout to the right */}
          <div className="flex justify-between items-center">
            
            {/* Menu Items (Left side) */}
            <div className="flex gap-8">
              {menuItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`px-4 py-4 font-medium transition-all ${
                    pathname === item.href
                      ? 'text-gray-900 font-bold border-b-4 border-gray-900'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Logout Button (Right side) */}
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-600 hover:text-red-800 font-medium px-4 py-2 rounded-md hover:bg-red-50 transition-colors"
            >
              <LogOut size={18} />
              Logout
            </button>

          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-[#4a9b88] min-h-screen">
        {children}
      </div>
    </div>
  );
}