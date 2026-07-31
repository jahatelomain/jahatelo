'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
}

/**
 * Índice navegable de secciones continuas para el detalle público de un motel.
 * Las pestañas no intercambian contenido: posicionan el scroll en su sección.
 */
export default function Tabs({ tabs, defaultTab }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const scrollToTab = useCallback((tabId: string, behavior: ScrollBehavior = 'smooth') => {
    sectionRefs.current[tabId]?.scrollIntoView({ behavior, block: 'start' });
    setActiveTab(tabId);
    window.history.replaceState(null, '', `#${tabId}`);
  }, []);

  useEffect(() => {
    const scrollToHash = () => {
      const tabId = window.location.hash.slice(1);
      if (tabs.some((tab) => tab.id === tabId)) {
        window.requestAnimationFrame(() => scrollToTab(tabId, 'auto'));
      }
    };

    scrollToHash();
    window.addEventListener('hashchange', scrollToHash);
    return () => window.removeEventListener('hashchange', scrollToHash);
  }, [scrollToTab, tabs]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveTab(visible.target.id);
      },
      { rootMargin: '-22% 0px -62% 0px', threshold: [0.01, 0.25, 0.5] },
    );

    const sections = Object.values(sectionRefs.current).filter(Boolean) as HTMLElement[];
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [tabs]);

  const handleTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (!touchStart.current) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) < 55 || Math.abs(dx) <= Math.abs(dy) * 1.5) return;

    const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);
    const nextIndex = Math.max(0, Math.min(tabs.length - 1, activeIndex + (dx < 0 ? 1 : -1)));
    if (nextIndex !== activeIndex) scrollToTab(tabs[nextIndex].id);
  };

  return (
    <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="sticky top-0 z-30 -mx-4 border-b border-gray-200 bg-white/95 px-4 backdrop-blur-md md:top-20 md:-mx-6 md:px-6">
        <nav className="flex gap-8 overflow-x-auto" aria-label="Secciones del motel">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => scrollToTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="pt-2">
        {tabs.map((tab) => (
          <section
            key={tab.id}
            id={tab.id}
            ref={(element) => { sectionRefs.current[tab.id] = element; }}
            className="scroll-mt-24 border-b border-gray-100 py-6 last:border-b-0 md:scroll-mt-40 md:py-8"
          >
            <h2 className="mb-5 text-sm font-extrabold uppercase tracking-[0.12em] text-slate-900">
              {tab.label}
            </h2>
            {tab.content}
          </section>
        ))}
      </div>
    </div>
  );
}
