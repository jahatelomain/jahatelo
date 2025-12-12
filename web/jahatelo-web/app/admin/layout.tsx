'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

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
    return 'Admin';
  };

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '🏠' },
    { href: '/admin/motels', label: 'Moteles', icon: '🏨' },
    { href: '/admin/amenities', label: 'Amenities', icon: '✨' },
  ];

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-100 admin-theme text-slate-900">
      {/* Topbar Moderno */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-20">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Brand */}
            <div>
              <h1 className="text-xl font-bold text-slate-900">Jahatelo Admin</h1>
              <p className="text-xs text-slate-500">Panel de administración</p>
            </div>

            {/* Center: Breadcrumb */}
            <div className="hidden md:flex items-center gap-2 text-sm">
              <span className="text-slate-400">Admin</span>
              <span className="text-slate-300">/</span>
              <span className="text-purple-600 font-medium">{getBreadcrumb()}</span>
            </div>

            {/* Right: Actions & Avatar */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full"></span>
              </button>

              {/* Avatar */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-white text-sm font-semibold">
                  N
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Moderno */}
        <aside className="w-64 bg-slate-50 border-r border-slate-200 min-h-[calc(100vh-57px)] sticky top-[57px] hidden md:block">
          <nav className="p-4">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`group flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive(item.href)
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                        : 'text-slate-600 hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className={`font-medium ${isActive(item.href) ? 'text-white' : 'group-hover:text-slate-900'}`}>
                      {item.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Divider */}
            <div className="my-6 border-t border-slate-200"></div>

            {/* Quick Stats en Sidebar */}
            <div className="px-4 py-3 bg-white rounded-lg shadow-sm border border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Acceso Rápido
              </p>
              <Link
                href="/admin/motels"
                className="block text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                → Ver Moteles
              </Link>
            </div>
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
  );
}
