'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { UserPayload } from '@/lib/auth';
import { ToastProvider } from '@/contexts/ToastContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/admin/login';
  const [user, setUser] = useState<UserPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      setUser(null);
      return;
    }

    let mounted = true;

    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' });
        const data = await response.json();
        if (!mounted) return;
        setUser(data.user || null);
      } catch (error) {
        console.error('Error fetching user:', error);
        if (!mounted) return;
        setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchUser();

    return () => {
      mounted = false;
    };
  }, [isLoginPage, pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuOpen && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const isActive = (path: string) => {
    if (path === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(path);
  };

  const getBreadcrumb = () => {
    if (pathname === '/admin') return 'Dashboard';
    if (pathname.startsWith('/admin/motels')) return 'Moteles';
    if (pathname.startsWith('/admin/amenities')) return 'Amenities';
    if (pathname.startsWith('/admin/users')) return 'Usuarios';
    return 'Admin';
  };

  const navItems = [
    { href: '/admin', label: 'Dashboard', roles: ['SUPERADMIN', 'MOTEL_ADMIN'] },
    { href: '/admin/motels', label: 'Moteles', roles: ['SUPERADMIN', 'MOTEL_ADMIN'] },
    { href: '/admin/promos', label: 'Promos', roles: ['SUPERADMIN'] },
    { href: '/admin/amenities', label: 'Amenities', roles: ['SUPERADMIN'] },
    { href: '/admin/users', label: 'Usuarios', roles: ['SUPERADMIN'] },
  ];

  // Filtrar items según el rol del usuario
  const filteredNavItems = navItems.filter(item =>
    !user?.role || item.roles.includes(user.role as 'SUPERADMIN' | 'MOTEL_ADMIN' | 'USER')
  );

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-slate-500">Cargando panel...</div>
      </div>
    );
  }

  const profileInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'AD';

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-100 admin-theme text-slate-900">
        {/* Topbar Moderno */}
        <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-20">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Brand + Mobile Menu Button */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-slate-600 hover:text-slate-900 p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Jahatelo Admin</h1>
                <p className="text-xs text-slate-500 hidden sm:block">Panel de administración</p>
              </div>
            </div>

            {/* Right: Actions & Avatar */}
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-sm font-medium text-slate-900">
                  {user?.name || 'Administrador'}
                </span>
                <span className="text-xs text-slate-500">{user?.role}</span>
              </div>

              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-500 flex items-center justify-center text-white text-sm font-semibold hover:shadow-lg transition-all cursor-pointer"
                  title="Opciones de usuario"
                >
                  {profileInitials}
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-40 rounded-lg bg-white shadow-xl border border-slate-200 overflow-hidden z-30">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Sidebar */}
      <aside
        className={`fixed top-[57px] left-0 bottom-0 w-64 bg-white border-r border-slate-200 z-40 transform transition-transform duration-300 md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="p-4">
          <ul className="space-y-1">
            {filteredNavItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`group flex items-center px-4 py-3 rounded-lg transition-all ${
                    isActive(item.href)
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className={`font-medium ${isActive(item.href) ? 'text-white' : 'group-hover:text-slate-900'}`}>
                    {item.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="flex">
        {/* Sidebar Moderno */}
        <aside className="w-64 bg-slate-50 border-r border-slate-200 min-h-[calc(100vh-57px)] sticky top-[57px] hidden md:block">
          <nav className="p-4">
            <ul className="space-y-1">
              {filteredNavItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`group flex items-center px-4 py-3 rounded-lg transition-all ${
                      isActive(item.href)
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                        : 'text-slate-600 hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    <span className={`font-medium ${isActive(item.href) ? 'text-white' : 'group-hover:text-slate-900'}`}>
                      {item.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 md:p-8 bg-slate-100 min-h-[calc(100vh-57px)]">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
    </ToastProvider>
  );
}
