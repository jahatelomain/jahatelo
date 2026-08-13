'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { UserPayload } from '@/lib/auth';
import { hasModuleAccess } from '@/lib/adminModules';
import { getMotelAnalyticsAccess } from '@/lib/domain/motels/planPresentation';
import { ToastProvider } from '@/contexts/ToastContext';
import { Toaster } from 'sonner';
import {
  BarChart3,
  Bell,
  Building2,
  ChevronDown,
  CreditCard,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  Megaphone,
  ScanLine,
  Settings2,
  Sparkles,
  Ticket,
  Users,
  type LucideIcon,
} from 'lucide-react';

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
        const adminModule = getModuleFromPath(pathname);
        if (adminModule && data.user && !hasModuleAccess(data.user, adminModule)) {
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
  }, [isLoginPage, pathname, router]);

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

  const exactActivePaths = new Set(['/admin/analytics']);

  const isActive = (path: string) => {
    if (path === '/admin') {
      return pathname === '/admin';
    }
    if (exactActivePaths.has(path)) {
      return pathname === path;
    }
    // Exact match primero, luego startsWith solo si el siguiente char es '/' o fin
    if (pathname === path) return true;
    return pathname.startsWith(path + '/');
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
    if (pathname.startsWith('/admin/roles')) return 'Perfiles de acceso';
    if (pathname.startsWith('/admin/prospects')) return 'Prospects';
    if (pathname.startsWith('/admin/financiero')) return 'Financiero';
    if (pathname.startsWith('/admin/analytics')) return 'Analytics';
    if (pathname.startsWith('/admin/canjear-codigo')) return 'Canjear código';
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

  const navStructure: Array<NavElement | null> = [
    { href: '/admin', label: 'Dashboard', roles: ['SUPERADMIN', 'MOTEL_ADMIN'] },
    user?.role === 'MOTEL_ADMIN' && user.motelId
      ? {
          href: `/admin/motels/${user.motelId}`,
          label: 'Gestión de motel',
          roles: ['MOTEL_ADMIN'],
        }
      : {
          section: 'Gestión de moteles',
          collapsible: true,
          items: [
            { href: '/admin/motels', label: 'Moteles', roles: ['SUPERADMIN', 'MOTEL_ADMIN'] },
            { href: '/admin/amenities', label: 'Amenities', roles: ['SUPERADMIN'] },
            { href: '/admin/promos', label: 'Promos', roles: ['SUPERADMIN'] },
          ],
        },
    user?.role === 'MOTEL_ADMIN' && getMotelAnalyticsAccess(user.motelPlan) !== 'NONE'
      ? { href: '/admin/analytics', label: 'Analytics', roles: ['MOTEL_ADMIN'] }
      : user?.role === 'MOTEL_ADMIN'
        ? null
      : {
          section: 'Comercial',
          collapsible: true,
          items: [
            { href: '/admin/prospects', label: 'Prospects', roles: ['SUPERADMIN'] },
            { href: '/admin/analytics', label: 'Analytics', roles: ['SUPERADMIN', 'MOTEL_ADMIN'] },
            { href: '/admin/analytics/visitors', label: 'Visitantes', roles: ['SUPERADMIN'] },
          ],
        },
    ...(user?.role === 'MOTEL_ADMIN'
      ? [{ href: '/admin/canjear-codigo', label: 'Canjear código', roles: ['MOTEL_ADMIN'] } as NavItem]
      : []),
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
    if (path.startsWith('/admin/roles')) return 'configuracion';
    if (path.startsWith('/admin/prospects')) return 'prospects';
    if (path.startsWith('/admin/financiero')) return 'financiero';
    // Para motel admin, Analytics se limita en API a su propio motel y usa el
    // permiso operativo de Moteles. Superadmin conserva acceso total.
    if (path.startsWith('/admin/analytics')) return 'motels';
    if (path.startsWith('/admin/canjear-codigo')) return 'motels';
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
    const adminModule = getModuleFromPath(item.href);
    return item.roles.includes(user.role as 'SUPERADMIN' | 'MOTEL_ADMIN') &&
           hasModuleAccess(user, adminModule || 'dashboard');
  };

  const filteredNavStructure: NavElement[] = navStructure
    .filter((element): element is NavElement => element !== null)
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

  const getNavIcon = (href: string): LucideIcon => {
    if (href === '/admin') return LayoutDashboard;
    if (href.startsWith('/admin/motels')) return Building2;
    if (href.startsWith('/admin/amenities')) return Sparkles;
    if (href.startsWith('/admin/promos')) return Ticket;
    if (href.startsWith('/admin/prospects')) return Users;
    if (href.startsWith('/admin/analytics')) return BarChart3;
    if (href.startsWith('/admin/canjear-codigo')) return ScanLine;
    if (href.startsWith('/admin/financiero')) return CreditCard;
    if (href.startsWith('/admin/notifications')) return Bell;
    if (href.startsWith('/admin/banners')) return ImageIcon;
    if (href.startsWith('/admin/inbox')) return Inbox;
    return Settings2;
  };

  const getSectionIcon = (section: string): LucideIcon => {
    if (section === 'Gestión de moteles') return Building2;
    if (section === 'Comercial') return BarChart3;
    if (section === 'Publicidad') return Megaphone;
    return Settings2;
  };

  const renderNavItem = (item: NavItem, onClick?: () => void) => {
    const active = isActive(item.href);
    const Icon = getNavIcon(item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClick}
        className={`group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
          active
            ? 'bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-[0_12px_28px_rgba(147,51,234,0.25)] ring-1 ring-white/70'
            : 'text-slate-600 hover:bg-white/90 hover:text-violet-700 hover:shadow-[0_8px_22px_rgba(112,72,173,0.10)]'
        }`}
      >
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors ${
          active
            ? 'bg-white/18 text-white'
            : 'bg-violet-100/80 text-violet-600 group-hover:bg-violet-200/80'
        }`}>
          <Icon className="h-4 w-4" strokeWidth={2.2} />
        </span>
        <span className={`font-semibold ${active ? 'text-white' : 'group-hover:text-slate-900'}`}>
          {item.label}
        </span>
      </Link>
    );
  };

  const renderSection = (section: NavSection, isMobile: boolean = false) => {
    const isExpanded = expandedSections[section.section];
    const isCollapsible = section.collapsible;
    const hasActiveItem = section.items.some((item) => isActive(item.href));
    const SectionIcon = getSectionIcon(section.section);

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
          className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 ${
            hasActiveItem
              ? 'bg-violet-100/75 text-violet-800 shadow-[0_8px_22px_rgba(112,72,173,0.08)]'
              : 'text-slate-700 hover:bg-white/90 hover:shadow-[0_8px_22px_rgba(112,72,173,0.08)]'
          }`}
        >
          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
            hasActiveItem ? 'bg-violet-200/80 text-violet-700' : 'bg-violet-100/80 text-violet-600'
          }`}>
            <SectionIcon className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <span className="font-semibold">{section.section}</span>
          <ChevronDown className={`ml-auto h-4 w-4 text-violet-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} strokeWidth={2.4} />
        </button>
        {isExpanded && (
          <ul className="ml-7 mt-1 space-y-1 border-l border-violet-200/80 pl-3">
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
      <div className="min-h-[100dvh] bg-slate-100 admin-theme text-slate-900">
        {/* Topbar Moderno */}
        <header className="sticky top-0 z-20 h-20 border-b border-violet-100/90 bg-white/90 shadow-[0_10px_30px_rgba(91,33,182,0.08)] backdrop-blur-xl">
          <div className="px-6 h-full flex items-center justify-between">
            {/* Left: Logo + breadcrumb */}
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
              <Image
                src="/logo-icon.png"
                alt="Jahatelo"
                width={56}
                height={56}
                className="h-14 w-auto object-contain shrink-0"
              />
              <div className="hidden sm:flex flex-col">
                <span className="text-sm font-bold text-slate-800 leading-tight">Jahatelo</span>
                <span className="text-sm text-purple-600 font-semibold leading-tight">Admin Panel</span>
              </div>
              <div className="hidden md:flex items-center gap-2 ml-4 pl-4 border-l border-slate-200">
                <span className="text-sm text-slate-400">/</span>
                <span className="text-sm font-semibold text-slate-700">{getBreadcrumb()}</span>
              </div>
            </div>

            {/* Right: User info + avatar */}
            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-semibold text-slate-900 leading-tight">
                  {user?.name || 'Administrador'}
                </span>
                <span className="text-xs font-medium text-purple-600 leading-tight">{user?.role}</span>
              </div>

              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((prev) => !prev)}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-500 text-sm font-bold text-white shadow-[0_10px_22px_rgba(147,51,234,0.28)] transition-all hover:scale-105 hover:shadow-[0_14px_28px_rgba(147,51,234,0.38)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-200"
                  title="Opciones de usuario"
                >
                  {profileInitials}
                </button>
                {menuOpen && (
                  <div className="absolute right-0 z-30 mt-2 w-40 overflow-hidden rounded-xl border border-violet-100 bg-white/95 shadow-[0_18px_40px_rgba(76,29,149,0.16)] backdrop-blur-xl">
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
        className={`fixed top-[88px] left-0 bottom-0 w-64 border-r border-violet-100 bg-gradient-to-b from-white via-violet-50/70 to-rose-50/60 shadow-[18px_0_48px_rgba(112,72,173,0.16)] z-40 transform transition-transform duration-300 md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="p-4">
          <div className="space-y-2">
            {filteredNavStructure.map((element) => {
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
        <aside className="w-64 min-h-[calc(100vh-88px)] sticky top-[88px] hidden border-r border-violet-100 bg-gradient-to-b from-white via-violet-50/70 to-rose-50/60 shadow-[14px_0_42px_rgba(112,72,173,0.08)] md:block">
          <nav className="p-4">
            <div className="space-y-2">
              {filteredNavStructure.map((element) => {
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
        <main className="admin-main-canvas flex-1 min-h-[calc(100dvh-5rem)] p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
    </ToastProvider>
  );
}
