'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { UserPayload } from '@/lib/auth';
import { hasModuleAccess } from '@/lib/adminModules';
import { ToastProvider } from '@/contexts/ToastContext';
import { Toaster } from 'sonner';

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
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'Publicidad': false,
    'Configuración': false,
  });
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
        const module = getModuleFromPath(pathname);
        if (module && data.user && !hasModuleAccess(data.user, module)) {
          setUser(data.user);
          setLoading(false);
          router.push('/admin');
          return;
        }
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

  // Auto-expand section if current path matches
  useEffect(() => {
    if (pathname.startsWith('/admin/notifications') || pathname.startsWith('/admin/banners')) {
      setExpandedSections(prev => ({ ...prev, 'Publicidad': true }));
    }
    if (pathname.startsWith('/admin/users') || pathname.startsWith('/admin/roles') || pathname.startsWith('/admin/audit') || pathname.startsWith('/admin/configuracion')) {
      setExpandedSections(prev => ({ ...prev, 'Configuración': true }));
    }
    if (pathname.startsWith('/admin/motels') || pathname.startsWith('/admin/amenities') || pathname.startsWith('/admin/promos')) {
      setExpandedSections(prev => ({ ...prev, 'Gestión de moteles': true }));
    }
    if (pathname.startsWith('/admin/prospects') || pathname.startsWith('/admin/analytics')) {
      setExpandedSections(prev => ({ ...prev, 'Comercial': true }));
    }
  }, [pathname]);

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

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  const getBreadcrumb = () => {
    if (pathname === '/admin') return 'Dashboard';
    if (pathname.startsWith('/admin/motels')) return 'Moteles';
    if (pathname.startsWith('/admin/amenities')) return 'Amenities';
    if (pathname.startsWith('/admin/users')) return 'Usuarios';
    if (pathname.startsWith('/admin/roles')) return 'Roles y Permisos';
    if (pathname.startsWith('/admin/prospects')) return 'Prospects';
    if (pathname.startsWith('/admin/financiero')) return 'Financiero';
    if (pathname.startsWith('/admin/analytics')) return 'Analytics';
    if (pathname.startsWith('/admin/notifications')) return 'Notificaciones Masivas';
    if (pathname.startsWith('/admin/banners')) return 'Banners Publicitarios';
    if (pathname.startsWith('/admin/audit')) return 'Auditoría';
    if (pathname.startsWith('/admin/inbox')) return 'Inbox';
    if (pathname.startsWith('/admin/configuracion')) return 'Ajustes Generales';
    return 'Admin';
  };

  type NavItem = {
    href: string;
    label: string;
    roles: ('SUPERADMIN' | 'MOTEL_ADMIN')[];
  };

  type NavSection = {
    section: string;
    items: NavItem[];
    collapsible?: boolean;
  };

  type NavElement = NavItem | NavSection;

  const navStructure: NavElement[] = [
    { href: '/admin', label: 'Dashboard', roles: ['SUPERADMIN', 'MOTEL_ADMIN'] },
    {
      section: 'Gestión de moteles',
      collapsible: true,
      items: [
        { href: '/admin/motels', label: 'Moteles', roles: ['SUPERADMIN', 'MOTEL_ADMIN'] },
        { href: '/admin/amenities', label: 'Amenities', roles: ['SUPERADMIN'] },
        { href: '/admin/promos', label: 'Promos', roles: ['SUPERADMIN'] },
      ],
    },
    {
      section: 'Comercial',
      collapsible: true,
      items: [
        { href: '/admin/prospects', label: 'Prospects', roles: ['SUPERADMIN'] },
        { href: '/admin/analytics', label: 'Analytics', roles: ['SUPERADMIN'] },
      ],
    },
    { href: '/admin/financiero', label: 'Financiero', roles: ['SUPERADMIN', 'MOTEL_ADMIN'] },
    {
      section: 'Publicidad',
      collapsible: true,
      items: [
        { href: '/admin/notifications', label: 'Notificaciones Masivas', roles: ['SUPERADMIN'] },
        { href: '/admin/banners', label: 'Banners Publicitarios', roles: ['SUPERADMIN'] },
      ],
    },
    { href: '/admin/inbox', label: 'Inbox', roles: ['SUPERADMIN'] },
    {
      section: 'Configuración',
      collapsible: true,
      items: [
        { href: '/admin/users', label: 'Usuarios', roles: ['SUPERADMIN'] },
        { href: '/admin/roles', label: 'Roles y Permisos', roles: ['SUPERADMIN'] },
        { href: '/admin/audit', label: 'Auditoría', roles: ['SUPERADMIN'] },
        { href: '/admin/configuracion', label: 'Ajustes Generales', roles: ['SUPERADMIN'] },
      ],
    },
  ];

  const isNavSection = (element: NavElement): element is NavSection => {
    return 'section' in element;
  };

  const getModuleFromPath = (path: string) => {
    if (path === '/admin') return 'dashboard';
    if (path.startsWith('/admin/motels')) return 'motels';
    if (path.startsWith('/admin/promos')) return 'promos';
    if (path.startsWith('/admin/amenities')) return 'amenities';
    if (path.startsWith('/admin/users')) return 'users';
    if (path.startsWith('/admin/roles')) return 'roles';
    if (path.startsWith('/admin/prospects')) return 'prospects';
    if (path.startsWith('/admin/financiero')) return 'financiero';
    if (path.startsWith('/admin/analytics')) return 'analytics';
    if (path.startsWith('/admin/notifications')) return 'notifications';
    if (path.startsWith('/admin/banners')) return 'banners';
    if (path.startsWith('/admin/audit')) return 'audit';
    if (path.startsWith('/admin/inbox')) return 'inbox';
    if (path.startsWith('/admin/configuracion')) return 'configuracion';
    return null;
  };

  // Filtrar navegación según el rol del usuario
  const filterNavItem = (item: NavItem) => {
    if (!user?.role) return false;
    const module = getModuleFromPath(item.href);
    return item.roles.includes(user.role as 'SUPERADMIN' | 'MOTEL_ADMIN') &&
           hasModuleAccess(user, module || 'dashboard');
  };

  const filteredNavStructure: NavElement[] = navStructure
    .map((element) => {
      if (isNavSection(element)) {
        const filteredItems = element.items.filter(filterNavItem);
        return filteredItems.length > 0 ? { ...element, items: filteredItems } : null;
      } else {
        return filterNavItem(element) ? element : null;
      }
    })
    .filter((element): element is NavElement => element !== null);

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

  const currentModule = getModuleFromPath(pathname);
  if (!loading && !isLoginPage && currentModule && !hasModuleAccess(user, currentModule)) {
    return null;
  }

  const profileInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'AD';

  const renderNavItem = (item: NavItem, onClick?: () => void) => (
    <Link
      key={item.href}
      href={item.href}
      onClick={onClick}
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
  );

  const renderSection = (section: NavSection, isMobile: boolean = false) => {
    const isExpanded = expandedSections[section.section];
    const isCollapsible = section.collapsible;

    if (!isCollapsible) {
      // Non-collapsible section (original behavior)
      return (
        <div key={section.section}>
          <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {section.section}
          </div>
          <ul className="space-y-1">
            {section.items.map((item) => (
              <li key={item.href}>
                {renderNavItem(item, isMobile ? () => setMobileMenuOpen(false) : undefined)}
              </li>
            ))}
          </ul>
        </div>
      );
    }

    // Collapsible section
    return (
      <div key={section.section}>
        <button
          onClick={() => toggleSection(section.section)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-slate-700 hover:bg-white hover:shadow-sm transition-all group"
        >
          <span className="font-medium">{section.section}</span>
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isExpanded && (
          <ul className="space-y-1 mt-1 ml-4">
            {section.items.map((item) => (
              <li key={item.href}>
                {renderNavItem(item, isMobile ? () => setMobileMenuOpen(false) : undefined)}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <ToastProvider>
      <Toaster position="top-right" richColors closeButton />
      <div className="min-h-screen bg-slate-100 admin-theme text-slate-900">
        {/* Topbar Moderno */}
        <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-20">
        <div className="px-6 py-2">
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
              <div className="flex items-center justify-center gap-3">
                <img
                  src="/logo-master.png"
                  alt="Jahatelo"
                  className="h-10 w-auto object-contain"
                />
                <span className="text-xs text-slate-500 hidden sm:block">Admin Panel</span>
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
        className={`fixed top-[88px] left-0 bottom-0 w-64 bg-white border-r border-slate-200 z-40 transform transition-transform duration-300 md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="p-4">
          <div className="space-y-2">
            {filteredNavStructure.map((element, index) => {
              if (isNavSection(element)) {
                return renderSection(element, true);
              } else {
                return (
                  <ul key={element.href} className="space-y-1">
                    <li>
                      {renderNavItem(element, () => setMobileMenuOpen(false))}
                    </li>
                  </ul>
                );
              }
            })}
          </div>
        </nav>
      </aside>

      <div className="flex">
        {/* Sidebar Moderno */}
        <aside className="w-64 bg-slate-50 border-r border-slate-200 min-h-[calc(100vh-88px)] sticky top-[88px] hidden md:block">
          <nav className="p-4">
            <div className="space-y-2">
              {filteredNavStructure.map((element, index) => {
                if (isNavSection(element)) {
                  return renderSection(element, false);
                } else {
                  return (
                    <ul key={element.href} className="space-y-1">
                      <li>
                        {renderNavItem(element)}
                      </li>
                    </ul>
                  );
                }
              })}
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 md:p-8 bg-slate-100 h-[calc(100vh-88px)] overflow-y-scroll">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
    </ToastProvider>
  );
}
